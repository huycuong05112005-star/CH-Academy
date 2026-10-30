export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'FILL_IN_BLANK'
  | 'SHORT_ANSWER'
  | 'ESSAY'

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'

export type ExamStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'CLOSED'

export type AttemptStatus =
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'GRADING'
  | 'GRADED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'COMPLETED'

export interface QuestionOptionItem {
  id?: number
  optionCode: string
  content: string
  isCorrect?: boolean | null
  sortOrder?: number
  explanation?: string | null
}

export interface QuestionItem {
  id: number
  bankId?: number | null
  bankName?: string | null
  courseId?: number | null
  courseName?: string | null
  code: string
  type: QuestionType
  difficulty: QuestionDifficulty
  topic: string
  learningOutcome?: string | null
  content: string
  defaultPoints: number
  explanation?: string | null
  rubricJson?: string | null
  answerKey?: string | null
  sessionId?: number | null
  sessionTopic?: string | null
  classId?: number | null
  className?: string | null
  status: string
  createdByName?: string | null
  createdAt?: string
  updatedAt?: string
  options: QuestionOptionItem[]
}

export interface QuestionBankItem {
  id: number
  name: string
  code: string
  description?: string | null
  courseId?: number | null
  courseName?: string | null
  status: string
  questionCount: number
  createdByName?: string | null
  createdAt?: string
}

export interface ExamQuestionItem {
  questionId: number
  code?: string
  type?: QuestionType
  difficulty?: QuestionDifficulty
  topic?: string
  content: string
  points: number
  sortOrder: number
  options?: QuestionOptionItem[]
}

export interface ExamReviewItem {
  id: number
  examId: number
  version: number
  action: 'SUBMIT_FOR_REVIEW' | 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'PUBLISH' | 'CLOSE'
  actorId?: number
  actorName?: string
  actorRole?: string
  comment?: string
  createdAt: string
}

export interface ApprovalStats {
  pendingReviewCount: number
  approvedCount: number
  changesRequestedCount: number
  rejectedCount: number
  draftCount: number
  publishedCount: number
}

export interface ApprovalActionPayload {
  comment?: string
  reason?: string
  assignedClassIds?: number[]
}

export interface ExamItem {
  id: number
  title: string
  code: string
  description?: string | null
  courseId?: number | null
  courseName?: string | null
  teacherId?: number | null
  teacherName?: string | null
  sessionId?: number | null
  sessionTopic?: string | null
  classId?: number | null
  className?: string | null
  durationMinutes: number
  passPercentage: number
  maxAttempts: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  showResultMode: 'IMMEDIATELY' | 'AFTER_CLOSED' | 'MANUAL'
  startTime?: string | null
  endTime?: string | null
  status: ExamStatus
  version: number
  questionCount: number
  totalPoints: number
  createdByName?: string | null
  submittedAt?: string | null
  reviewedBy?: { id: number; fullName: string } | null
  reviewedAt?: string | null
  reviewFeedback?: string | null
  rejectionReason?: string | null
  publishedAt?: string | null
  createdAt?: string
  updatedAt?: string
  questions: ExamQuestionItem[]
  assignedClassIds: number[]
}

export interface ExistingAnswer {
  selectedOptionIds?: string | null
  textAnswer?: string | null
  isMarkedForReview?: boolean
}

export interface StartAttemptResponseData {
  attemptId: number
  examId: number
  examTitle: string
  examCode: string
  durationMinutes: number
  attemptNumber: number
  startedAt: string
  dueAt: string
  serverCurrentTime: string
  remainingSeconds: number
  maxScore: number
  questions: ExamQuestionItem[]
  existingAnswers: Record<number, ExistingAnswer>
}

export interface AnswerResultDetail {
  questionId: number
  code?: string
  type: QuestionType
  topic?: string
  difficulty?: QuestionDifficulty
  content: string
  points: number
  score: number
  isCorrect?: boolean | null
  studentSelectedOptions?: string | null
  studentTextAnswer?: string | null
  correctAnswer?: string | null
  explanation?: string | null
  teacherFeedback?: string | null
  rubricBreakdown?: string | null
  options?: QuestionOptionItem[]
}

export interface AttemptResultData {
  attemptId: number
  examId: number
  examTitle: string
  examCode: string
  studentId: number
  studentName: string
  studentCode: string
  attemptNumber: number
  status: AttemptStatus
  startedAt: string
  submittedAt?: string | null
  durationSeconds: number
  totalScore: number
  maxScore: number
  percentage: number
  isPassed: boolean
  correctCount: number
  incorrectCount: number
  unattemptedCount: number
  canReviewAnswers: boolean
  answers: AnswerResultDetail[]
}

export interface QuestionStatItem {
  questionId: number
  code: string
  content: string
  type: string
  topic: string
  maxPoints: number
  averageScore: number
  correctRate: number
  isAnomalous: boolean
}

export interface ExamAnalyticsData {
  examId: number
  examTitle: string
  examCode: string
  totalAttempts: number
  completedAttempts: number
  averageScore: number
  medianScore: number
  highestScore: number
  lowestScore: number
  passRate: number
  scoreDistribution: Record<string, number>
  questionStats: QuestionStatItem[]
}

export interface TopicMasteryDto {
  topic: string
  correctAnswers: number
  totalQuestions: number
  masteryPercentage: number
  status: string
}

export interface ScoreHistoryDto {
  examTitle: string
  score: number
  maxScore: number
  percentage: number
  submittedAt: string
  passed: boolean
}

export interface StudentAnalyticsDto {
  studentId: number
  studentName: string
  totalExamsTaken: number
  averageScore: number
  highestScore: number
  passRate: number
  topicMastery: TopicMasteryDto[]
  weakTopics: string[]
  recommendations: string[]
  scoreHistory: ScoreHistoryDto[]
}

export interface StudentAssignedExamDto {
  examId: number
  title: string
  code?: string
  description?: string | null
  courseName?: string | null
  teacherName?: string | null
  durationMinutes: number
  totalPoints?: number
  passPercentage?: number
  maxAttempts?: number
  currentAttemptsCount?: number
  attemptStatus?: string | null // null, 'IN_PROGRESS', 'GRADED', 'SUBMITTED'
  activeAttemptId?: number | null
  latestScore?: number | null
  maxScore?: number | null
  isPassed?: boolean | null
  startTime?: string | null
  endTime?: string | null
  dueDate?: string | null
  canTake?: boolean
  cannotTakeReason?: string | null

  // Backwards compatibility aliases
  assignedClassId?: number
  className?: string
  startsAt?: string | null
  endsAt?: string | null
  allowedAttempts?: number
  attemptsUsed?: number
  remainingAttempts?: number
  latestAttemptId?: number | null
  latestAttemptStatus?: AttemptStatus | null
  canAttempt?: boolean
}

export type StudentAssignedExam = StudentAssignedExamDto
export type StudentAnalyticsData = StudentAnalyticsDto
export type ExamAttempt = AttemptResultData

// Excel Import Types
export interface QuestionImportRow {
  rowNumber: number
  questionText: string
  questionType: QuestionType
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  optionE?: string
  optionF?: string
  correctAnswer: string
  points: number
  difficulty: QuestionDifficulty
  topic: string
  explanation?: string
  valid: boolean
  duplicate: boolean
  errorMessage?: string
}

export interface QuestionImportPreview {
  fileName: string
  totalRows: number
  validRowsCount: number
  invalidRowsCount: number
  duplicateRowsCount: number
  rows: QuestionImportRow[]
}

// Class Analytics Types
export interface ScoreBucket {
  range: string
  count: number
  percentage: number
}

export interface ScoreTrend {
  examTitle: string
  date: string
  averageScore: number
  passRate: number
  participantsCount: number
}

export interface TopicMastery {
  topic: string
  totalQuestions: number
  correctCount: number
  masteryRate: number
}

export interface ClassStudentScore {
  studentId: number
  studentCode: string
  fullName: string
  avatarUrl?: string
  attemptsCount: number
  totalAssigned: number
  totalCompleted: number
  totalUnattempted: number
  averageScore: number
  highestScore: number
  lowestScore: number
  passRate: number
  attendanceRate: number
  attendedSessions: number
  totalClassSessions: number
  needsSupport: boolean
  supportReason?: string
  progressTrend?: string
  lastAttemptDate?: string
  status: 'PASSED' | 'FAILED' | 'NOT_ATTEMPTED' | 'WAITING_GRADE'
}

export interface ClassAssessmentAnalytics {
  classId: number
  className: string
  classCode: string
  courseName?: string
  teacherName?: string
  totalEnrolled: number
  totalAssigned: number
  totalParticipated: number
  totalUnattempted: number
  totalSubmitted: number
  totalGraded: number
  totalPendingGrading: number
  averageScore: number
  medianScore: number
  highestScore: number
  lowestScore: number
  passCount: number
  failCount: number
  passRate: number
  avgCompletionTimeMinutes: number
  attendanceRate: number
  totalSessions: number
  totalExams: number
  selectedSessionQuality?: SessionQualityData | null
  scoreDistribution: ScoreBucket[]
  scoreTrend: ScoreTrend[]
  topicMastery: TopicMastery[]
  studentScores: ClassStudentScore[]
}

export interface StudentSessionAttendance {
  sessionId: number
  sessionDate: string
  timeRange: string
  topic: string
  room: string
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'UNRECORDED'
  remarks?: string
}

export interface StudentExamRecord {
  examId: number
  examTitle: string
  examCode: string
  sessionTopic?: string
  assignedDate?: string
  dueDate?: string
  attemptNumber: number
  score?: number
  maxScore: number
  percentage?: number
  isPassed: boolean
  status: string
  submittedAt?: string
  durationMinutes: number
}

export interface StudentReviewQuestion {
  questionId: number
  questionContent: string
  questionType: string
  topic: string
  studentAnswer?: string
  correctAnswer?: string
  isCorrect: boolean
  pointsEarned: number
  maxPoints: number
  explanation?: string
}

export interface StudentClassDetail {
  studentId: number
  studentCode: string
  fullName: string
  email?: string
  phone?: string
  classId: number
  className: string
  classCode: string
  averageScore: number
  highestScore: number
  lowestScore: number
  passRate: number
  attendanceRate: number
  completedExamsCount: number
  unattemptedExamsCount: number
  teacherNotes?: string
  sessionAttendances: StudentSessionAttendance[]
  examRecords: StudentExamRecord[]
  reviewQuestions: StudentReviewQuestion[]
}

// Session Quality Types
export interface StudentNeedingSupport {
  studentId: number
  studentCode: string
  fullName: string
  attendanceStatus: string
  quizScore?: number
  reasons: string[]
}

export interface SessionOverviewItem {
  sessionId: number
  sessionDate: string
  topic: string
  attendanceRate: number
  quizAverageScore: number
  qualityScore: number
  status: string
}

export interface SessionQualityData {
  sessionId: number
  classId: number
  className: string
  classCode: string
  courseName?: string
  teacherName?: string
  sessionDate: string
  startTime: string
  endTime: string
  room?: string
  topic?: string
  sessionStatus: string
  expectedStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  attendanceRate: number
  quizzesAssignedCount: number
  quizSubmissionsCount: number
  quizCompletionRate: number
  quizAverageScore: number
  quizPassRate: number
  preClassQuizScore?: number
  postClassQuizScore?: number
  scoreImprovement?: number
  qualityScore: number
  qualityRating: string
  formulaDescription: string
  dataWarnings: string[]
  studentsNeedingSupport: StudentNeedingSupport[]
  classSessionsOverview: SessionOverviewItem[]
}
