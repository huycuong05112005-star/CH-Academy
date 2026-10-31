# CH ACADEMY — BÁO CÁO GIẢI PHÁP SỬA TOÀN DIỆN PHÂN QUYỀN NHÓM CHAT LỚP HỌC

**Dự án:** CH Academy  
**Tập tin tài liệu:** `CHAT_GROUP_AUTHORIZATION_FIX.md`  
**Ngày hoàn thiện:** 31/10/2026  

---

## 1. Thiết lập Single Source of Truth trên Backend

Nguyên tắc bắt buộc: **Chỉ dựa vào JWT / Security Principal của người dùng đã xác thực, kiểm tra trực tiếp quan hệ nghiệp vụ từ cơ sở dữ liệu Postgres, không tin cậy bất kỳ tham số quyền nào từ Client.**

### 1.1. Bộ lọc nghiêm ngặt theo Cổng tại `ClassChatService.java`
Khi người dùng truy vấn danh sách nhóm chat (`/api/v1/chat/classes/conversations?portal=...`):
- **Cổng Học viên (`portal = 'STUDENT'`):**
  1. Tìm thực thể `Student` tương ứng với `user.id`.
  2. Truy vấn trực tiếp `enrollmentRepository.findByStudentUserIdAndStatus(user.getId(), "ENROLLED")`.
  3. Lọc danh sách `chat_conversations` có `class_id` nằm trong tập hợp các lớp đang `ENROLLED`.
  4. Nếu học viên có 1 lớp -> Trả về đúng 1 nhóm chat. Nếu 0 lớp -> Trả về mảng rỗng.
- **Cổng Giảng viên (`portal = 'TEACHER'`):**
  1. Truy vấn `classRepository.findByPrimaryTeacherUserId(user.getId())` và `teacherAssignmentRepository.findByTeacherUserIdAndStatus(user.getId(), "ACTIVE")`.
  2. Chỉ trả về các nhóm chat của lớp mà giảng viên đang phụ trách giảng dạy.
- **Cổng Quản trị viên (`portal = 'ADMIN'`):**
  1. Chỉ tài khoản có `ROLE_ADMIN` hoặc `ROLE_SUPER_ADMIN` mới được xem toàn bộ danh sách lớp phục vụ công tác thanh tra và hỗ trợ đào tạo.

### 1.2. Xác thực thời gian thực trước khi xem tin nhắn hoặc gửi tin (`verifyMembership`)
Phương thức `verifyMembership(Long conversationId, User user)` được nâng cấp để kiểm tra trực tiếp:
```java
// Kiểm tra trực tiếp bảng Enrollments nếu là học viên
if (user.getRoles().stream().anyMatch(r -> r.getId().equals("STUDENT"))) {
    boolean isEnrolled = enrollmentRepository.existsByClassEntityIdAndStudentUserIdAndStatus(
            conv.getClassId(), user.getId(), "ENROLLED"
    );
    if (!isEnrolled) {
        throw new AppException("BẠN KHÔNG CÓ QUYỀN TRUY CẬP NHÓM CHAT NÀY: Trạng thái ghi danh không hợp lệ hoặc đã kết thúc");
    }
}
```

---

## 2. Cơ chế Đồng bộ Tự làm sạch (Self-Cleaning Sync Engine)

Đã cải tiến toàn diện hàm `syncClassGroup(Long classId)`:
1. **Thu thập danh sách hợp lệ hiện tại (Active Members):**
   - Giảng viên chính (`primaryTeacher`).
   - Các trợ giảng / giảng viên phụ được phân công `ACTIVE`.
   - Tất cả học viên có `Enrollment.status = 'ENROLLED'`.
2. **Loại bỏ thành viên không còn hợp lệ (Prune Obsolete Members):**
   - So sánh danh sách hiện có trong `chat_members` với tập hợp hợp lệ.
   - Bất kỳ thành viên nào trước đó đã bị Drop hoặc chuyển lớp sẽ bị **xóa bỏ hoặc chuyển trạng thái `LEFT` ngay lập tức**.
3. **Kích hoạt tự động khi có biến động đào tạo:**
   - Đã tích hợp gọi `classChatService.syncClassGroup(...)` vào các luồng nghiệp vụ trong `AcademicService.java`:
     - `dropEnrollment(Long enrollmentId)`: Hủy ghi danh -> Tự động xóa quyền chat ngay.
     - `transferStudentClass(...)`: Chuyển lớp -> Xóa khỏi nhóm lớp cũ, tự động thêm vào nhóm lớp mới.

---

## 3. Cải tiến Giao diện Frontend (`GroupChatPanel.tsx`)

1. **Khi học viên chỉ học 1 lớp:**
   - Ẩn toàn bộ nút bấm dropdown có mũi tên `ChevronDown`.
   - Hiển thị thanh thông tin nhóm cố định, trang nhã: Tên lớp, mã lớp, tên khóa học và giáo viên.
   - Không cho phép click mở menu chuyển lớp.
2. **Khi học viên học nhiều lớp (Multi-Class):**
   - Hiển thị nút chọn nhóm có hiệu ứng hover mượt mà.
   - Hiển thị thanh phím tắt (Pills) chuyển đổi nhanh giữa các lớp.
   - Tích hợp bộ tìm kiếm lớp theo tên môn học, mã lớp hoặc giáo viên.
3. **Khi học viên chưa có lớp (Empty State):**
   - Hiển thị thông báo sạch: *"Chưa có nhóm lớp học — Bạn chưa được ghi danh vào lớp học nào đang hoạt động."*
4. **Đồng bộ sự kiện chọn khóa học / lớp học:**
   - Khi học viên click vào một lớp cụ thể từ trang *Lớp học của tôi*, sự kiện `ch_academy_select_class_chat` được phát ra và `GroupChatPanel` tự động chuyển đúng sang nhóm lớp tương ứng.
