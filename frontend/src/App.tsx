import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { ExperienceProvider } from './context/ExperienceContext'
import { DesktopTitleBar } from './components/desktop/DesktopTitleBar'
import { SettingsProvider } from './context/SettingsContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { PageLoadingFallback } from './components/ui/LoadingSkeleton'
import { GlassBackground } from './components/ui/GlassBackground'

function AdminPaymentsRedirect() {
  const [searchParams] = useSearchParams()
  const status = searchParams.get('status')?.toLowerCase()
  if (status === 'outstanding') {
    return <Navigate to="/admin/finance?tab=receivables&status=UNPAID" replace />
  }
  if (status === 'paid') {
    return <Navigate to="/admin/finance?tab=payments" replace />
  }
  const queryStr = searchParams.toString()
  return <Navigate to={`/admin/finance?tab=payments${queryStr ? '&' + queryStr : ''}`} replace />
}

// Public core pages (eager loaded for instant first paint)
import { LandingPage } from './pages/public/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { CoursesPublicPage } from './pages/public/CoursesPublicPage'
import { AboutPage } from './pages/public/AboutPage'
import { ContactPage } from './pages/public/ContactPage'
import { TermsPage } from './pages/public/TermsPage'
import { PrivacyPage } from './pages/public/PrivacyPage'
import { AdminLayout } from './layouts/AdminLayout'

// Lazy-loaded Admin and Assessment Portals
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage').then(m => ({ default: m.DashboardPage })))
const CourseListPage = lazy(() => import('./pages/admin/courses/CourseListPage').then(m => ({ default: m.CourseListPage })))
const StudentListPage = lazy(() => import('./pages/admin/students/StudentListPage').then(m => ({ default: m.StudentListPage })))
const LeadListPage = lazy(() => import('./pages/admin/leads/LeadListPage').then(m => ({ default: m.LeadListPage })))
const ClassListPage = lazy(() => import('./pages/admin/classes/ClassListPage').then(m => ({ default: m.ClassListPage })))
const AttendancePage = lazy(() => import('./pages/admin/attendance/AttendancePage').then(m => ({ default: m.AttendancePage })))
const FinancePage = lazy(() => import('./pages/admin/finance/FinancePage').then(m => ({ default: m.FinancePage })))
const SettingsPage = lazy(() => import('./pages/admin/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const AdminNotificationsPage = lazy(() => import('./pages/admin/notifications/AdminNotificationsPage').then(m => ({ default: m.AdminNotificationsPage })))
const TeacherAssignmentsPage = lazy(() => import('./pages/admin/teacher-assignments/TeacherAssignmentsPage').then(m => ({ default: m.TeacherAssignmentsPage })))
const AttendanceMonitoringPage = lazy(() => import('./pages/admin/attendance-monitoring/AttendanceMonitoringPage').then(m => ({ default: m.AttendanceMonitoringPage })))
const AuditLogsPage = lazy(() => import('./pages/admin/audit-logs/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })))

const StudentPortalPage = lazy(() => import('./pages/student/StudentPortalPage').then(m => ({ default: m.StudentPortalPage })))
const TeacherPortalPage = lazy(() => import('./pages/teacher/TeacherPortalPage').then(m => ({ default: m.TeacherPortalPage })))
const OnlineExamRoomPage = lazy(() => import('./pages/exam/OnlineExamRoomPage').then(m => ({ default: m.OnlineExamRoomPage })))
const QuestionBankPage = lazy(() => import('./pages/admin/assessment/QuestionBankPage').then(m => ({ default: m.QuestionBankPage })))
const ExamListPage = lazy(() => import('./pages/admin/assessment/ExamListPage').then(m => ({ default: m.ExamListPage })))
const AdminExamApprovalPage = lazy(() => import('./pages/admin/assessment/AdminExamApprovalPage').then(m => ({ default: m.AdminExamApprovalPage })))
const GradingListPage = lazy(() => import('./pages/admin/assessment/GradingListPage').then(m => ({ default: m.GradingListPage })))
const ExamAnalyticsPage = lazy(() => import('./pages/admin/assessment/ExamAnalyticsPage').then(m => ({ default: m.ExamAnalyticsPage })))
const ClassAnalyticsPage = lazy(() => import('./pages/admin/assessment/ClassAnalyticsPage').then(m => ({ default: m.ClassAnalyticsPage })))

export default function App() {
  return (
    <ThemeProvider>
      <ExperienceProvider>
        <DesktopTitleBar />
        <GlassBackground />
        <SettingsProvider>
          <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                {/* Public Website */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/courses" element={<CoursesPublicPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Student Portal (Strictly for Student role) */}
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute requiredRoles={['STUDENT']}>
                      <StudentPortalPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/*"
                  element={
                    <ProtectedRoute requiredRoles={['STUDENT']}>
                      <StudentPortalPage />
                    </ProtectedRoute>
                  }
                />

                {/* Teacher Portal (Strictly for Teacher role) */}
                <Route
                  path="/teacher"
                  element={
                    <ProtectedRoute requiredRoles={['TEACHER']}>
                      <TeacherPortalPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/*"
                  element={
                    <ProtectedRoute requiredRoles={['TEACHER']}>
                      <TeacherPortalPage />
                    </ProtectedRoute>
                  }
                />

                {/* Online Exam Room */}
                <Route
                  path="/exam/:examId"
                  element={
                    <ProtectedRoute requiredRoles={['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF']}>
                      <OnlineExamRoomPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Portal (Protected for Admin role) */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'ACCOUNTANT', 'ADMIN']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="courses" element={<CourseListPage />} />
                  <Route path="classes" element={<ClassListPage />} />
                  <Route path="students" element={<StudentListPage />} />
                  <Route path="leads" element={<LeadListPage />} />
                  <Route path="teacher-assignments" element={<TeacherAssignmentsPage />} />
                  <Route path="attendance" element={<AttendancePage />} />
                  <Route path="attendance-monitoring" element={<AttendanceMonitoringPage />} />
                  <Route path="finance" element={<FinancePage />} />
                  <Route path="payments" element={<AdminPaymentsRedirect />} />
                  <Route path="notifications" element={<AdminNotificationsPage />} />
                  <Route path="audit-logs" element={<AuditLogsPage />} />
                  <Route path="settings" element={<SettingsPage />} />

                  {/* Assessment Module Routes */}
                  <Route path="assessment/approval" element={<AdminExamApprovalPage />} />
                  <Route path="assessment/questions" element={<QuestionBankPage />} />
                  <Route path="assessment/exams" element={<ExamListPage />} />
                  <Route path="assessment/grading" element={<GradingListPage />} />
                  <Route path="assessment/analytics/:examId" element={<ExamAnalyticsPage />} />
                  <Route path="assessment/class-analytics" element={<ClassAnalyticsPage />} />
                  <Route path="assessment/session-quality" element={<Navigate to="/admin/assessment/class-analytics" replace />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </SettingsProvider>
    </ExperienceProvider>
  </ThemeProvider>
  )
}
