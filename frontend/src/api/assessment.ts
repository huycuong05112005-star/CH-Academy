import { apiClient, type ApiResponse } from './client'
import type {
  QuestionItem,
  QuestionBankItem,
  ExamItem,
  StudentAssignedExam,
  StartAttemptResponseData,
  AttemptResultData,
  ExamAnalyticsData,
  StudentAnalyticsData,
  QuestionImportPreview,
  QuestionImportRow,
  ClassAssessmentAnalytics,
  SessionQualityData,
  StudentClassDetail
} from '../types/assessment'

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  page?: number
}

export const assessmentApi = {
  // Questions
  searchQuestions: (params?: {
    courseId?: number
    bankId?: number
    sessionId?: number
    classId?: number
    type?: string
    difficulty?: string
    topic?: string
    search?: string
    page?: number
    size?: number
  }): Promise<ApiResponse<PageResponse<QuestionItem>>> => {
    const q = new URLSearchParams()
    if (params?.courseId) q.append('courseId', params.courseId.toString())
    if (params?.bankId) q.append('bankId', params.bankId.toString())
    if (params?.sessionId) q.append('sessionId', params.sessionId.toString())
    if (params?.classId) q.append('classId', params.classId.toString())
    if (params?.type) q.append('type', params.type)
    if (params?.difficulty) q.append('difficulty', params.difficulty)
    if (params?.topic) q.append('topic', params.topic)
    if (params?.search) q.append('search', params.search)
    if (params?.page !== undefined) q.append('page', params.page.toString())
    if (params?.size !== undefined) q.append('size', params.size.toString())
    return apiClient.get<PageResponse<QuestionItem>>(`/assessment/questions?${q.toString()}`)
  },

  getQuestion: (id: number): Promise<ApiResponse<QuestionItem>> => {
    return apiClient.get<QuestionItem>(`/assessment/questions/${id}`)
  },

  createQuestion: (data: Partial<QuestionItem>): Promise<ApiResponse<QuestionItem>> => {
    return apiClient.post<QuestionItem>('/assessment/questions', data)
  },

  updateQuestion: (id: number, data: Partial<QuestionItem>): Promise<ApiResponse<QuestionItem>> => {
    return apiClient.put<QuestionItem>(`/assessment/questions/${id}`, data)
  },

  deleteQuestion: (id: number): Promise<ApiResponse<void>> => {
    return apiClient.delete<void>(`/assessment/questions/${id}`)
  },

  getQuestionBanks: (): Promise<ApiResponse<QuestionBankItem[]>> => {
    return apiClient.get<QuestionBankItem[]>('/assessment/banks')
  },

  createQuestionBank: (data: Partial<QuestionBankItem>): Promise<ApiResponse<QuestionBankItem>> => {
    return apiClient.post<QuestionBankItem>('/assessment/banks', data)
  },

  // Exams
  searchExams: (params?: {
    courseId?: number
    teacherId?: number
    sessionId?: number
    classId?: number
    status?: string
    search?: string
    page?: number
    size?: number
  }): Promise<ApiResponse<PageResponse<ExamItem>>> => {
    const q = new URLSearchParams()
    if (params?.courseId) q.append('courseId', params.courseId.toString())
    if (params?.teacherId) q.append('teacherId', params.teacherId.toString())
    if (params?.sessionId) q.append('sessionId', params.sessionId.toString())
    if (params?.classId) q.append('classId', params.classId.toString())
    if (params?.status) q.append('status', params.status)
    if (params?.search) q.append('search', params.search)
    if (params?.page !== undefined) q.append('page', params.page.toString())
    if (params?.size !== undefined) q.append('size', params.size.toString())
    return apiClient.get<PageResponse<ExamItem>>(`/assessment/exams?${q.toString()}`)
  },

  getExam: (id: number): Promise<ApiResponse<ExamItem>> => {
    return apiClient.get<ExamItem>(`/assessment/exams/${id}`)
  },

  createExam: (data: Partial<ExamItem>): Promise<ApiResponse<ExamItem>> => {
    return apiClient.post<ExamItem>('/assessment/exams', data)
  },

  updateExam: (id: number, data: Partial<ExamItem>): Promise<ApiResponse<ExamItem>> => {
    return apiClient.put<ExamItem>(`/assessment/exams/${id}`, data)
  },

  duplicateExam: (id: number): Promise<ApiResponse<ExamItem>> => {
    return apiClient.post<ExamItem>(`/assessment/exams/${id}/duplicate`)
  },

  submitForReview: (id: number): Promise<ApiResponse<ExamItem>> => {
    return apiClient.post<ExamItem>(`/assessment/exams/${id}/submit-review`)
  },

  approveExam: (id: number, payload?: { comment?: string }): Promise<ApiResponse<ExamItem>> => {
    return apiClient.post<ExamItem>(`/assessment/exams/${id}/approve`, payload || {})
  },

  requestChanges: (id: number, payload: { comment: string }): Promise<ApiResponse<ExamItem>> => {
    return apiClient.post<ExamItem>(`/assessment/exams/${id}/request-changes`, payload)
  },

  rejectExam: (id: number, payload: { reason: string }): Promise<ApiResponse<ExamItem>> => {
    return apiClient.post<ExamItem>(`/assessment/exams/${id}/reject`, payload)
  },

  publishExam: (id: number, assignedClassIds?: number[]): Promise<ApiResponse<ExamItem>> => {
    return apiClient.post<ExamItem>(`/assessment/exams/${id}/publish`, { assignedClassIds })
  },

  getReviewHistory: (id: number): Promise<ApiResponse<import('../types/assessment').ExamReviewItem[]>> => {
    return apiClient.get<import('../types/assessment').ExamReviewItem[]>(`/assessment/exams/${id}/review-history`)
  },

  getApprovalStats: (): Promise<ApiResponse<import('../types/assessment').ApprovalStats>> => {
    return apiClient.get<import('../types/assessment').ApprovalStats>('/assessment/exams/approval-stats')
  },

  reGradeExam: (id: number): Promise<ApiResponse<string>> => {
    return apiClient.post<string>(`/assessment/exams/${id}/re-grade`)
  },

  // Student Online Exam Room
  getAssignedExams: (): Promise<ApiResponse<StudentAssignedExam[]>> => {
    return apiClient.get<StudentAssignedExam[]>('/assessment/student/assigned-exams')
  },

  startOrResumeAttempt: (examId: number): Promise<ApiResponse<StartAttemptResponseData>> => {
    return apiClient.post<StartAttemptResponseData>(`/assessment/exam-room/start/${examId}`)
  },

  saveAnswer: (
    attemptId: number,
    data: { questionId: number; selectedOptionIds?: string; textAnswer?: string; isMarkedForReview?: boolean }
  ): Promise<ApiResponse<void>> => {
    return apiClient.post<void>(`/assessment/exam-room/save/${attemptId}`, data)
  },

  submitAttempt: (attemptId: number, idempotencyKey?: string): Promise<ApiResponse<AttemptResultData>> => {
    return apiClient.post<AttemptResultData>(`/assessment/exam-room/submit/${attemptId}`, { idempotencyKey })
  },

  getAttemptResult: (attemptId: number): Promise<ApiResponse<AttemptResultData>> => {
    return apiClient.get<AttemptResultData>(`/assessment/exam-room/result/${attemptId}`)
  },

  // Grading
  submitManualGrade: (
    attemptId: number,
    items: Array<{ questionId: number; score: number; teacherFeedback?: string; rubricBreakdown?: string }>
  ): Promise<ApiResponse<AttemptResultData>> => {
    return apiClient.post<AttemptResultData>(`/assessment/grading/attempts/${attemptId}/manual`, { items })
  },

  // Analytics
  getExamAnalytics: (examId: number): Promise<ApiResponse<ExamAnalyticsData>> => {
    return apiClient.get<ExamAnalyticsData>(`/assessment/analytics/exam/${examId}`)
  },

  getStudentAnalytics: (studentId: number): Promise<ApiResponse<StudentAnalyticsData>> => {
    return apiClient.get<StudentAnalyticsData>(`/assessment/analytics/student/${studentId}`)
  },

  getMyProgress: (): Promise<ApiResponse<StudentAnalyticsData>> => {
    return apiClient.get<StudentAnalyticsData>('/assessment/analytics/my-progress')
  },

  // Excel Question Import
  downloadQuestionTemplate: (): Promise<Blob> => {
    return apiClient.getBlob('/assessment/questions/import/template')
  },

  previewQuestionImport: (file: File, bankId?: number, sessionId?: number): Promise<ApiResponse<QuestionImportPreview>> => {
    const formData = new FormData()
    formData.append('file', file)
    if (bankId) formData.append('bankId', bankId.toString())
    if (sessionId) formData.append('sessionId', sessionId.toString())
    return apiClient.post<QuestionImportPreview>('/assessment/questions/import/preview', formData)
  },

  confirmQuestionImport: (data: {
    bankId?: number
    courseId?: number
    sessionId?: number
    selectedRows: QuestionImportRow[]
  }): Promise<ApiResponse<number>> => {
    return apiClient.post<number>('/assessment/questions/import/confirm', data)
  },

  // Class & Session Analytics
  getClassAssessmentAnalytics: (
    classId: number,
    params?: { examId?: number; sessionId?: number; startDate?: string; endDate?: string; status?: string }
  ): Promise<ApiResponse<ClassAssessmentAnalytics>> => {
    const q = new URLSearchParams()
    if (params?.examId) q.append('examId', params.examId.toString())
    if (params?.sessionId) q.append('sessionId', params.sessionId.toString())
    if (params?.startDate) q.append('startDate', params.startDate)
    if (params?.endDate) q.append('endDate', params.endDate)
    if (params?.status) q.append('status', params.status)
    return apiClient.get<ClassAssessmentAnalytics>(`/assessment/analytics/class/${classId}?${q.toString()}`)
  },

  getStudentClassDetail: (studentId: number, classId: number): Promise<ApiResponse<StudentClassDetail>> => {
    return apiClient.get<StudentClassDetail>(`/assessment/analytics/student/${studentId}/class/${classId}`)
  },

  getSessionQuality: (sessionId: number): Promise<ApiResponse<SessionQualityData>> => {
    return apiClient.get<SessionQualityData>(`/assessment/analytics/session/${sessionId}`)
  }
}
