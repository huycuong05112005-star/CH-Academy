# CH ACADEMY — BÁO CÁO NGUYÊN NHÂN GỐC LỖI TRUY CẬP NHÓM CHAT (ROOT CAUSE)

**Dự án:** CH Academy — Hệ thống Quản trị Đào tạo & AI Platform  
**Mức ưu tiên:** CRITICAL  
**Ngày thực hiện:** 31/10/2026  
**Chuyên môn:** Senior Software Architect, Database Architect & Backend Engineer  

---

## 1. Bản chất phân biệt giữa các thực thể nghiệp vụ

Hệ thống quản lý đào tạo CH Academy có phân cấp dữ liệu đa tầng. Lỗi xuất hiện do sự nhầm lẫn giữa các khái niệm:

| Thực thể | Bản chất kỹ thuật | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- |
| **Khóa học (Course)** | Bảng `courses` | Chương trình đào tạo tổng quát (VD: *Tiếng Anh Giao Tiếp Cơ Bản*). Khóa học không có lịch học cụ thể và không phải là nhóm chat. |
| **Lớp học (Class)** | Bảng `classes` (tham chiếu `course_id`) | Một lớp học cụ thể diễn ra vào khung giờ nhất định, có giảng viên phụ trách và học viên tham gia. |
| **Đăng ký học (Enrollment)** | Bảng `enrollments` (liên kết `student_id` và `class_id`) | Thể hiện trạng thái theo học thực tế của học viên với lớp (`ENROLLED`, `DROPPED`, `TRANSFERRED`, `COMPLETED`). |
| **Nhóm chat lớp học (Class Chat Group)** | Bảng `chat_conversations` (`class_id`) | Kênh trao đổi trực tuyến gắn liền duy nhất với một `ClassEntity`. |
| **Thành viên nhóm chat (Chat Member)** | Bảng `chat_members` (`conversation_id`, `user_id`) | Bản ghi phân quyền truy cập, đọc và gửi tin nhắn vào nhóm chat. |

---

## 2. Nguyên nhân gốc rễ (Root Cause Analysis)

Qua điều tra chi tiết mã nguồn trước khi sửa đổi, phát hiện **3 nguyên nhân cốt lõi** dẫn đến việc học viên chỉ học 1 lớp nhưng giao diện lại hiển thị và cho phép truy cập 2 nhóm chat:

### 2.1. Phân quyền lỏng lẻo và phụ thuộc vai trò người dùng thay vì Enrollment thực tế
Trong phương thức `ClassChatService.getUserConversations()` ban đầu:
```java
// CODE CŨ TRƯỚC KHI FIX:
public List<ChatConversationDto> getUserConversations(User user) {
    if (user.getRoles().stream().anyMatch(r -> r.getId().equals("ADMIN") || r.getId().equals("SUPER_ADMIN"))) {
        return conversationRepository.findAll().stream().map(...).toList();
    }
    return conversationRepository.findConversationsByUserId(user.getId()).stream().map(...).toList();
}
```
- Khi tài khoản kiểm thử mang vai trò quản trị viên hoặc nhiều vai trò kiểm thử, hệ thống gọi `findAll()`, trả về **toàn bộ nhóm chat của mọi lớp học trong hệ thống**, dẫn đến việc tài khoản nhìn thấy cả những lớp mình không học.
- Khi truy vấn `findConversationsByUserId()`, hệ thống chỉ truy vấn bảng `chat_members` mà **hoàn toàn không kiểm tra chéo** sang bảng `enrollments` xem học viên có đang ở trạng thái `status = 'ENROLLED'` hay không.

### 2.2. Cơ chế đồng bộ thành viên một chiều (Append-only Sync)
Phương thức `syncClassGroup(Long classId)` cũ chỉ thực hiện tìm học viên và giảng viên rồi gọi `addMemberIfNotExists()`.
- Khi một học viên bị hủy ghi danh (`DROPPED`) hoặc chuyển sang lớp khác (`TRANSFERRED`), bản ghi của học viên trong bảng `chat_members` của lớp cũ **không hề bị xóa hoặc chuyển trạng thái `status = 'LEFT'`**.
- Hậu quả: Dữ liệu quyền chat tích lũy dần theo thời gian, khiến học viên cũ vẫn giữ vĩnh viễn quyền truy cập nhóm chat của lớp đã thôi học.

### 2.3. Frontend thiếu ngữ cảnh Cổng (Portal Context) và hiển thị Dropdown không điều kiện
- Frontend component `GroupChatPanel` cũ gọi API `/chat/classes/conversations` không truyền tham số `portal`, khiến Backend không áp dụng bộ lọc dành riêng cho học viên (`STUDENT`).
- Giao diện luôn render nút dropdown với icon `ChevronDown` và cho phép mở danh sách đổi lớp ngay cả khi học viên chỉ có 1 lớp duy nhất, tạo cảm giác hệ thống bị lỗi phân luồng.

---

## 3. Kết luận
Lỗi không nằm ở CSS hay hiển thị bề mặt mà là do **sự thiếu đồng bộ giữa trạng thái ghi danh (`Enrollment.status = 'ENROLLED'`) và quyền thành viên phòng chat (`ChatMember`)**, kết hợp với việc Backend tin cậy danh sách `chat_members` tĩnh thay vì kiểm tra thực tế theo JWT Security Principal.

