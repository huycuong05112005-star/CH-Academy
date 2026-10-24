import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
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

          {/* Admin Portal (Protected) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="courses" element={<CourseListPage />} />
            <Route path="classes" element={<ClassListPage />} />
            <Route path="students" element={<StudentListPage />} />
            <Route path="leads" element={<LeadListPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="finance" element={<FinancePage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
