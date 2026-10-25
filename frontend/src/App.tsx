import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { SettingsProvider } from './context/SettingsContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LandingPage } from './pages/public/LandingPage'
import { CoursesPublicPage } from './pages/public/CoursesPublicPage'
import { AboutPage } from './pages/public/AboutPage'
import { ContactPage } from './pages/public/ContactPage'
import { TermsPage } from './pages/public/TermsPage'
import { PrivacyPage } from './pages/public/PrivacyPage'
import { LoginPage } from './pages/auth/LoginPage'
import { AdminLayout } from './layouts/AdminLayout'
import { DashboardPage } from './pages/admin/DashboardPage'

import { CourseListPage } from './pages/admin/courses/CourseListPage'
import { StudentListPage } from './pages/admin/students/StudentListPage'
import { LeadListPage } from './pages/admin/leads/LeadListPage'
import { ClassListPage } from './pages/admin/classes/ClassListPage'
import { AttendancePage } from './pages/admin/attendance/AttendancePage'
import { FinancePage } from './pages/admin/finance/FinancePage'
import { SettingsPage } from './pages/admin/settings/SettingsPage'
import { AdminNotificationsPage } from './pages/admin/notifications/AdminNotificationsPage'
import { TeacherAssignmentsPage } from './pages/admin/teacher-assignments/TeacherAssignmentsPage'
import { AttendanceMonitoringPage } from './pages/admin/attendance-monitoring/AttendanceMonitoringPage'
import { AuditLogsPage } from './pages/admin/audit-logs/AuditLogsPage'

import { StudentPortalPage } from './pages/student/StudentPortalPage'
import { TeacherPortalPage } from './pages/teacher/TeacherPortalPage'

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Website */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/courses" element={<CoursesPublicPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Student Portal (Protected for Student role) */}
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

              {/* Teacher Portal (Protected for Teacher role) */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN', 'SUPER_ADMIN']}>
                    <TeacherPortalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/*"
                element={
                  <ProtectedRoute requiredRoles={['TEACHER', 'ADMIN', 'SUPER_ADMIN']}>
                    <TeacherPortalPage />
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
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </SettingsProvider>
    </ThemeProvider>
  )
}
