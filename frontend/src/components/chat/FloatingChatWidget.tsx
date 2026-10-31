import React from 'react'
import { PortalChatLauncher } from './PortalChatLauncher'

export { PortalChatLauncher } from './PortalChatLauncher'
export { PublicAdmissionChatWidget } from './PublicAdmissionChatWidget'
export { StudentChatWidget } from './StudentChatWidget'
export { TeacherChatWidget } from './TeacherChatWidget'
export { AdminChatWidget } from './AdminChatWidget'
export { GroupChatPanel } from './GroupChatPanel'
export { AIConversationPanel } from './AIConversationPanel'
export { MessageBubble } from './MessageBubble'
export { MessageInput } from './MessageInput'
export { RichMarkdownRenderer } from './RichMarkdownRenderer'

/**
 * FloatingChatWidget:
 * Master router entrypoint for CH Academy chat ecosystem.
 * Dynamically mounts the dedicated portal widget:
 * - Public Website (/, /courses, /about...) -> PublicAdmissionChatWidget (Only Admissions AI, NO group chat)
 * - Student Portal (/student/*) -> StudentChatWidget (AI Gia sư / Trợ lý Học tập default + Enrolled group chat)
 * - Teacher Portal (/teacher/*) -> TeacherChatWidget (Trợ lý Giảng dạy default + Assigned group chat)
 * - Admin Portal (/admin/*) -> AdminChatWidget (Trợ lý Quản trị)
 */
export const FloatingChatWidget: React.FC = () => {
  return <PortalChatLauncher />
}
