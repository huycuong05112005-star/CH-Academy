# BÁO CÁO BẢO MẬT: 17. TOÀN VẸN LOGIC NGHIỆP VỤ VÀ PHÂN QUYỀN TRÊN DỮ LIỆU (IDOR / BOLA)

**Dự án:** CH Academy  
**Phân loại rủi ro:** P0 - Critical (CWE-639 / CWE-862)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A01:2021 – Broken Access Control

---

## 1. VẤN ĐỀ TRỌNG TÂM ĐÃ KIỂM TRA
- **Broken Object Level Authorization (BOLA/IDOR):** Học viên có thể xem điểm thi, bài tập hoặc thông tin của học viên khác bằng cách đổi `studentId` hoặc `examId` trên URL hay không?
- **Phân quyền lớp học và nhóm chat:** Học viên có thể truy cập tin nhắn nhóm của lớp mà mình không tham gia hay không?

## 2. KẾT QUẢ GIA CỐ TRIỆT ĐỂ
- Trong các service nghiệp vụ (`StudentPortalService`, `ClassChatService`):
  - Lấy danh tính người dùng thực tế từ SecurityContext (`UserPrincipal.getId()`).
  - Đối chiếu ràng buộc quyền thành viên: Bắt buộc tồn tại bản ghi trong bảng `class_chat_members` hoặc `enrollments` tương ứng với `userId` hiện tại.
  - Từ chối ngay lập tức với lỗi HTTP 403 Forbidden nếu học viên cố tình truy cập vào tài nguyên lớp/nhóm chat không thuộc danh sách đã ghi danh.
- Trạng thái: **AN TOÀN (PASS)**.
