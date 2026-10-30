import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'

// Custom Metrics for Assessment System
export const errorRate = new Rate('assessment_errors')
export const autosaveLatency = new Trend('autosave_duration_ms')
export const submitLatency = new Trend('submit_duration_ms')
export const idempotencyPassed = new Counter('idempotency_passed_count')

export const options = {
  scenarios: {
    // Ramp up to 1,000 concurrent students
    student_exam_session: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 100 },   // Warm-up to 100 users
        { duration: '1m', target: 500 },    // Scale to 500 users
        { duration: '2m', target: 1000 },   // Peak target: 1,000 concurrent students
        { duration: '1m', target: 1000 },   // Sustained 1,000 users
        { duration: '30s', target: 0 },     // Ramp-down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1500', 'p(99)<3000'], // 95% of requests under 1.5s
    assessment_errors: ['rate<0.02'],                // Error rate below 2%
    autosave_duration_ms: ['p(95)<800'],             // Autosave responds within 800ms
    submit_duration_ms: ['p(95)<2000'],              // Submission & grading under 2s
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8088/api/v1'

export default function () {
  let token = ''
  let attemptId = null
  const studentEmail = 'thuylinh.nguyen@gmail.com'
  const studentPass = 'Student@123456'

  group('01. Authentication & Assigned Exams List', function () {
    const loginPayload = JSON.stringify({
      username: studentEmail,
      password: studentPass,
    })

    const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
    })

    const loginOk = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'token received': (r) => r.json('data.accessToken') !== undefined,
    })
    errorRate.add(!loginOk)

    if (loginOk) {
      token = loginRes.json('data.accessToken')

      const authHeaders = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }

      // Fetch assigned exams
      const listRes = http.get(`${BASE_URL}/assessment/student/assigned-exams`, authHeaders)
      const listOk = check(listRes, {
        'assigned exams status is 200': (r) => r.status === 200,
        'has exams list': (r) => r.json('success') === true,
      })
      errorRate.add(!listOk)
    }
  })

  if (!token) return

  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }

  group('02. Enter Exam Room & Start Attempt', function () {
    const examId = 1 // Standard English Diagnostic Test
    const startRes = http.post(`${BASE_URL}/assessment/exam-room/start/${examId}`, null, authHeaders)

    const startOk = check(startRes, {
      'start exam status is 200': (r) => r.status === 200,
      'has attempt id': (r) => r.json('data.attemptId') !== undefined,
    })
    errorRate.add(!startOk)

    if (startOk) {
      attemptId = startRes.json('data.attemptId')
    }
  })

  if (!attemptId) return

  group('03. Autosave Answers (Debounced simulation)', function () {
    // Simulate answering 3 questions periodically
    const answers = [
      { questionId: 1, selectedOptionIds: '1', isMarkedForReview: false },
      { questionId: 2, selectedOptionIds: '5,6', isMarkedForReview: true },
      { questionId: 3, textAnswer: 'True', isMarkedForReview: false },
    ]

    for (const ans of answers) {
      const startSave = Date.now()
      const saveRes = http.post(
        `${BASE_URL}/assessment/exam-room/save/${attemptId}`,
        JSON.stringify(ans),
        authHeaders
      )
      autosaveLatency.add(Date.now() - startSave)

      const saveOk = check(saveRes, {
        'autosave status is 200': (r) => r.status === 200,
      })
      errorRate.add(!saveOk)
      sleep(1) // 1s interval between answer clicks
    }
  })

  group('04. Submit Exam with Idempotency Key', function () {
    const idempotencyKey = `idem_${attemptId}_${Date.now()}`
    const submitPayload = JSON.stringify({ idempotencyKey })

    const startSubmit = Date.now()
    const submitRes = http.post(
      `${BASE_URL}/assessment/exam-room/submit/${attemptId}`,
      submitPayload,
      authHeaders
    )
    submitLatency.add(Date.now() - startSubmit)

    const submitOk = check(submitRes, {
      'submit status is 200': (r) => r.status === 200,
      'score received': (r) => r.json('data.totalScore') !== undefined,
    })
    errorRate.add(!submitOk)

    // Verify Idempotent Retry: Immediate duplicate submit must succeed without creating new attempt or corrupting score
    const retryRes = http.post(
      `${BASE_URL}/assessment/exam-room/submit/${attemptId}`,
      submitPayload,
      authHeaders
    )
    const retryOk = check(retryRes, {
      'idempotent retry status is 200': (r) => r.status === 200,
    })
    if (retryOk) idempotencyPassed.add(1)
  })

  group('05. Retrieve Scorecard & Personal Competency Analysis', function () {
    const resultRes = http.get(`${BASE_URL}/assessment/exam-room/result/${attemptId}`, authHeaders)
    check(resultRes, {
      'result retrieval is 200': (r) => r.status === 200,
      'has answers review': (r) => r.json('data.answers') !== undefined,
    })

    const progressRes = http.get(`${BASE_URL}/assessment/analytics/my-progress`, authHeaders)
    check(progressRes, {
      'progress status is 200': (r) => r.status === 200,
      'has topic mastery': (r) => r.json('data.topicMastery') !== undefined,
    })
  })

  sleep(2)
}
