# CH ACADEMY — HỆ SINH THÁI ĐA NĂM HỌC THỐNG NHẤT
## Tài liệu 06: An ninh và Cô lập Dữ liệu Đa Năm học (Security & Data Isolation)

---

## 1. NGUYÊN TẮC ZERO TRUST TRONG HỆ THỐNG ĐA NIÊN KHÓA

Hệ thống quản lý nhiều niên khóa đối mặt với các nguy cơ bảo mật đặc thù:
- **Nguy cơ IDOR / BOLA (Insecure Direct Object Reference)**: Học viên can thiệp vào `id` đơn đăng ký hoặc `student_id` để xem hoặc hủy đơn của học viên khác.
- **Rò rỉ dữ liệu xuyên niên khóa (Cross-Year Data Leakage)**: Giảng viên hoặc học viên xem được dữ liệu lớp học, tài liệu kiểm tra hoặc đề thi của niên khóa mà họ không tham gia.
- **Gian lận học phí**: Thao túng tham số `discount_amount` khi nộp đơn từ phía client.

---

## 2. CÁC BIỆN PHÁP BẢO MẬT ĐÃ TRIỂN KHAI

### 2.1. Kiểm soát Truy cập Đối tượng (Object-Level Authorization & Anti-IDOR)
- **Xác thực danh tính kép**: Mọi API học viên (`/api/v1/student/**`) không chấp nhận `studentId` truyền từ Query Param hay Request Body của Client. Thay vào đó, Backend trích xuất danh tính chính chủ trực tiếp từ JWT Claims:
  ```java
  Long userId = SecurityUtils.getCurrentUserId();
  Student student = studentRepository.findByUserId(userId)
      .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ học viên không tồn tại"));
  ```
- Khi học viên gọi API hủy đơn đăng ký:
  ```java
  if (!request.getStudent().getId().equals(currentStudent.getId())) {
      throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn đăng ký của học viên khác");
  }
  ```

### 2.2. Kiểm soát Quyền Hạn Động theo Năm học (Time-Bound ABAC)
- Khóa năm học (`status = 'CLOSED'` hoặc `'ARCHIVED'`):
  - Backend từ chối mọi yêu cầu ghi danh mới vào các lớp thuộc năm học đã đóng.
  - Chuyển toàn bộ dữ liệu điểm số, tài liệu và điểm danh của năm học cũ sang chế độ Chỉ đọc (Read-Only).

### 2.3. Field-Level Security & Chống Gian Lận Tài Chính
- Học viên gửi đơn đăng ký (`POST /api/v1/student/enrollment-requests`): Schema Request chỉ gồm `classId`, `academicYear`, `notes`.
- Tham số tài chính `discountAmount` hoàn toàn không có trong DTO của học viên.
- Chỉ có Quản trị viên (`ADMIN`) thông qua endpoint `POST /api/v1/admin/enrollment-requests/{id}/approve` mới có quyền chỉ định `discountAmount`.

### 2.4. Cô lập Nhóm Chat Lớp học (Class Chat Group Authorization)
- Chỉ khi bản ghi `enrollments` hoặc `teacher_assignments` tồn tại ở trạng thái hợp lệ, học viên/giảng viên mới được cấp bản ghi `chat_group_members`.
- Mọi bản tin WebSocket gửi vào nhóm chat đều qua kiểm tra ủy quyền theo thời gian thực: Nếu người dùng không nằm trong danh sách thành viên của lớp đó, tin nhắn sẽ bị chặn ngay tại tầng Security Interceptor.
