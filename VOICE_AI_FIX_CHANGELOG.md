# CH ACADEMY — NHẬT KÝ THAY ĐỔI CHI TIẾT (VOICE AI & CHAT GROUP FIX CHANGELOG)

**Dự án:** CH Academy  
**Tập tin tài liệu:** `VOICE_AI_FIX_CHANGELOG.md`  
**Ngày phát hành:** 31/10/2026  
**Phiên bản hệ thống:** v2.4-enterprise  

---

## 1. Tổng hợp Danh sách Tập tin Đã chỉnh sửa

| STT | Tập tin | Tầng kiến trúc | Tóm tắt các thay đổi |
| :--- | :--- | :--- | :--- |
| 1 | `backend/src/main/java/vn/chacademy/chat/service/ClassChatService.java` | Backend Service | Bổ sung tham số `portal` vào `getUserConversations`. Lọc học viên bằng `findByStudentUserIdAndStatus(user.getId(), "ENROLLED")`. Cải tiến `verifyMembership` kiểm tra trực tiếp bảng ghi danh. Nâng cấp `syncClassGroup` tự động gỡ bỏ thành viên đã thôi học / chuyển lớp. |
| 2 | `backend/src/main/java/vn/chacademy/chat/controller/ClassChatController.java` | Backend Controller | Nhận `@RequestParam(required = false) String portal` tại endpoint `/conversations` và `/unread-count`. |
| 3 | `backend/src/main/java/vn/chacademy/academic/repository/EnrollmentRepository.java` | Backend Repository | Bổ sung các query method: `findByStudentUserIdAndStatus` và `existsByClassEntityIdAndStudentUserIdAndStatus`. |
| 4 | `backend/src/main/java/vn/chacademy/academic/repository/TeacherAssignmentRepository.java` | Backend Repository | Bổ sung `findByTeacherUserIdAndStatus` và `existsByClassEntityIdAndTeacherUserIdAndStatus`. |
| 5 | `backend/src/main/java/vn/chacademy/academic/repository/ClassRepository.java` | Backend Repository | Bổ sung `findByPrimaryTeacherUserId`. |
| 6 | `backend/src/main/java/vn/chacademy/academic/service/AcademicService.java` | Backend Service | Thêm hàm `dropEnrollment` và `transferStudentClass`, tự động kích hoạt `syncClassGroup` cho lớp học liên quan. |
| 7 | `backend/src/main/java/vn/chacademy/academic/controller/ClassController.java` | Backend Controller | Mở thêm 2 endpoint: `POST /api/v1/classes/enrollments/{id}/drop` và `POST /api/v1/classes/enrollments/transfer`. |
| 8 | `backend/src/main/java/vn/chacademy/chat/service/GenAiChatService.java` | Backend Service | Tích hợp lịch sử 8 tin nhắn gần nhất vào ngữ cảnh LLM cho đàm thoại đa lượt. Bổ sung thuật toán `splitVietnameseSentences` gom cụm câu tự nhiên 60-140 ký tự cho Voice TTS. Loại bỏ các field không dùng. |
| 9 | `backend/src/main/java/vn/chacademy/chat/dto/PortalConfigDto.java` | Backend DTO | Dọn dẹp import không dùng để làm sạch IDE warnings. |
| 10 | `backend/src/test/java/vn/chacademy/chat/ClassChatAuthorizationAndVoiceAiTest.java` | Backend Tests | Tạo mới bộ kiểm thử tích hợp 3 kịch bản: TTS sentence splitting, Multi-turn context persistence, Strict enrollment authorization. |
| 11 | `frontend/src/api/chat.ts` | Frontend API | Cập nhật `classChatApi.getMyConversations(portal?: string)` và `getTotalUnreadCount(portal?: string)`. |
| 12 | `frontend/src/components/chat/GroupChatPanel.tsx` | Frontend Component | Nhận prop `portal`. Ẩn dropdown mũi tên khi chỉ có 1 lớp học. Hiển thị thanh phím tắt khi có nhiều lớp. Tối ưu Empty State khi chưa có lớp. |
| 13 | `frontend/src/components/chat/StudentChatWidget.tsx` | Frontend Component | Truyền `portal="STUDENT"` vào `GroupChatPanel`. |
| 14 | `frontend/src/components/chat/TeacherChatWidget.tsx` | Frontend Component | Truyền `portal="TEACHER"` vào `GroupChatPanel`. |
| 15 | `frontend/src/components/chat/AdminChatWidget.tsx` | Frontend Component | Truyền `portal="ADMIN"` vào `GroupChatPanel`. |
| 16 | `frontend/src/components/chat/AiVoiceCallModal.tsx` | Frontend Component | Lưu giữ `activeConversationIdRef` qua từng lượt hội thoại. Chỉnh silence endpointing lên 1600ms, bật `continuous = true`. Thêm Auto Barge-in (RMS > 0.055). Bổ sung Safety Watchdog Timer (8s) triệt tiêu lỗi treo cuộc gọi. |

---

## 2. Kiểm thử và Xác nhận Hoàn thành

- **Backend Maven Build & Test:** `BUILD SUCCESS` (3/3 tests passed, total time: 32.7s).
- **Frontend Vite Build:** `built in 1.79s` với 0 lỗi TypeScript hay cú pháp.
- **Dịch vụ Spring Boot Backend:** Đang hoạt động trên cổng `8088` (Tomcat started).
- **Dịch vụ Frontend Dev:** Đang hoạt động trên cổng `5173`.

