# CH ACADEMY — TÀI LIỆU TOÀN DIỆN HỆ THỐNG CHAT NHÓM LỚP HỌC (MASTER DOCUMENT)

> **Dự án**: CH Academy — Nền tảng Giáo dục & Đào tạo  
> **Trạng thái**: Hoạt động ổn định (Production Ready)  
> **Phiên bản tài liệu**: 2.5 (Hợp nhất toàn diện các báo cáo kỹ thuật Chat nhóm lớp học)

---

## 1. MÔ HÌNH PHÂN QUYỀN THAM GIA NHÓM CHAT (CHAT AUTHORIZATION)

Để khắc phục triệt để lỗi học viên tham gia 1 lớp nhưng nhìn thấy nhóm của lớp khác, CH Academy thiết lập mô hình quan hệ nghiệp vụ nghiêm ngặt:

```
Khóa học (Course: 1)
       │
       └── Lớp học (Class: N)
                │
                ├── Ghi danh học viên (Enrollment: N) ──> Chỉ xem & chat trong lớp có status = 'ENROLLED'
                ├── Phân công giảng viên (Assignment: N) ─> Chỉ xem & chat trong lớp có status = 'ACTIVE'
                └── Quản trị viên (Admin) ───────────────> Toàn quyền giám sát & điều hành tất cả nhóm lớp
```

### Quy tắc kiểm tra quyền tham gia (Enforcement Logic):
1. **Học viên (STUDENT)**:
   - Truy vấn bắt buộc thông qua bảng `enrollments`:
     ```sql
     SELECT c.* FROM chat_conversations c 
     JOIN enrollments e ON c.class_id = e.class_id 
     WHERE e.student_id = :studentId AND e.status = 'ENROLLED'
     ```
   - Nếu học viên bị đình chỉ hoặc kết thúc khóa học, quyền truy cập nhóm chat lập tức bị thu hồi tự động.
2. **Giáo viên (TEACHER)**:
   - Chỉ được truy cập những lớp mà giáo viên là Giảng viên chính (`classes.primary_teacher_id`) hoặc có quyết định phân công trợ giảng hợp lệ còn hiệu lực (`teacher_assignments.status = 'ACTIVE'`).
3. **Quản trị viên (ADMIN)**:
   - Được phân bổ vào tab **"Giám sát Nhóm lớp"** trong [`AdminChatWidget.tsx`](file:///frontend/src/components/chat/AdminChatWidget.tsx).
   - Hệ thống tự động đồng bộ và hiển thị toàn bộ các nhóm lớp đang vận hành để theo dõi tình hình giảng dạy và hỗ trợ xử lý sự cố.

---

## 2. GIAO DIỆN CHUYỂN NHÓM (CLASS SWITCHER) & ĐỒNG BỘ ĐA KHÓA HỌC

### 2.1. Bộ chọn chuyển nhóm chuyên dụng
- Khi học viên đăng ký nhiều môn học hoặc giảng viên phụ trách nhiều lớp, thanh tiêu đề của khung chat tích hợp **Bộ chuyển nhóm (Class Switcher Dropdown)**.
- Hiển thị đầy đủ: Mã lớp, Tên lớp, Giảng viên phụ trách và Badge số lượng tin nhắn chưa đọc của từng lớp.

### 2.2. Đồng bộ ngữ cảnh một chạm (One-click Context Sync)
- Khi người dùng bấm vào một lớp học hoặc khóa học từ trang danh sách ([`CourseListPage.tsx`](file:///frontend/src/pages/admin/CourseListPage.tsx) hoặc [`ClassListPage.tsx`](file:///frontend/src/pages/admin/ClassListPage.tsx)), hệ thống phát sự kiện `ch_academy_sync_chat_class`.
- Khung chat tự động mở và chuyển ngay đến nhóm trao đổi của lớp học tương ứng mà không cần tìm kiếm thủ công.

---

## 3. DANH SÁCH API BACKEND CHAT NHÓM LỚP HỌC

Tất cả các endpoint được bảo vệ bởi Spring Security và xác thực thông qua JWT:

| Phương thức | Endpoint | Phân quyền | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/chat/classes/conversations` | `isAuthenticated()` | Lấy danh sách nhóm chat lớp học hợp lệ theo vai trò người dùng |
| `GET` | `/api/v1/chat/classes/unread-count` | `isAuthenticated()` | Đếm tổng số tin nhắn chưa đọc của tất cả các lớp phụ trách/tham gia |
| `GET` | `/api/v1/chat/classes/conversations/{id}/messages` | Quyền thành viên lớp | Lấy lịch sử tin nhắn nhóm (kèm kiểm tra quyền truy cập) |
| `POST` | `/api/v1/chat/classes/conversations/{id}/messages` | Quyền thành viên lớp | Gửi tin nhắn mới vào nhóm lớp (broadcast WebSocket STOMP) |
| `POST` | `/api/v1/chat/classes/conversations/{id}/read` | Quyền thành viên lớp | Đánh dấu đã đọc toàn bộ tin nhắn trong nhóm lớp |
| `GET` | `/api/v1/chat/classes/conversations/{id}/members` | Quyền thành viên lớp | Xem danh sách thành viên (giáo viên, trợ giảng, học viên) |

---

## 4. BẢO MẬT & NGĂN CHẶN XUNG ĐỘT QUYỀN TRUY CẬP

1. **Phòng chống tấn công IDOR**:
   - Mọi thao tác gửi tin hoặc đọc tin nhắn (`/conversations/{id}/...`) đều thực hiện kiểm tra `validateUserInConversation(conversationId, user)` ở tầng Service trước khi thực thi truy vấn cơ sở dữ liệu.
2. **Không phụ thuộc vào kiểm tra giao diện**:
   - Giao diện người dùng chỉ hiển thị nhóm được phép, nhưng ngay cả khi kẻ xấu thay đổi tham số `conversationId` trong request, Backend vẫn lập tức chặn đứng với mã lỗi `403 AccessDeniedException`.
