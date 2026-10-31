import React from 'react'
import { useLocation } from 'react-router-dom'
import { PublicAdmissionChatWidget } from './PublicAdmissionChatWidget'
import { StudentChatWidget } from './StudentChatWidget'
import { TeacherChatWidget } from './TeacherChatWidget'
import { AdminChatWidget } from './AdminChatWidget'

/**
 * Master Chat Dispatcher:
 * Phân định rạch ròi 100% không gian và widget theo từng khu vực URL:
 * - /admin/*    -> AdminChatWidget (Trợ lý Quản trị)
 * - /teacher/*  -> TeacherChatWidget (Trợ lý Giảng dạy & Chat nhóm lớp phụ trách)
 * - /student/*  -> StudentChatWidget (AI Gia sư / Trợ lý Học tập & Chat nhóm lớp ghi danh)
 * - /exam/*     -> null (Tuyệt đối không làm phiền phòng thi trực tuyến)
 * - /login      -> null (Không hiện chat trên trang đăng nhập)
 * - Tất cả trang công khai (/, /courses, /about...) -> PublicAdmissionChatWidget (Chỉ duy nhất AI Tư vấn Tuyển sinh)
 */
export const PortalChatLauncher: React.FC = () => {
  const location = useLocation()
  const path = location.pathname

  if (path.startsWith('/exam') || path.startsWith('/login')) {
    return null
  }

  if (path.startsWith('/admin')) {
    return <AdminChatWidget />
  }

  if (path.startsWith('/teacher')) {
    return <TeacherChatWidget />
  }

  if (path.startsWith('/student') || path.startsWith('/portal')) {
    return <StudentChatWidget />
  }

  // Mặc định cho toàn bộ các trang công khai (LandingPage, CoursesPublicPage, AboutPage, ContactPage...)
  return <PublicAdmissionChatWidget />
}
