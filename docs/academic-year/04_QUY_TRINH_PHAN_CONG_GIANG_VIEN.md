# CH ACADEMY — HỆ SINH THÁI ĐA NĂM HỌC THỐNG NHẤT
## Tài liệu 04: Quy trình Phân công Giảng viên và Lịch sử Giảng dạy (Teacher Assignment & Teaching History)

---

## 1. NGUYÊN TẮC QUẢN LÝ GIẢNG VIÊN ĐA NIÊN KHÓA

Giảng viên tại CH Academy là đối tượng có tính kế thừa nghiệp vụ cao:
1. **Một danh tính giảng viên duy nhất**: Giảng viên có mã định danh `teacher_code` (VD: `GV001`) và hồ sơ chuyên môn cố định trong bảng `teachers`.
2. **Phân công theo niên khóa**: Mỗi lớp học mở trong một niên khóa cụ thể (`academic_year`) sẽ được phân công cho một hoặc nhiều giảng viên thông qua bảng `teacher_assignments`.
3. **Phân quyền truy cập theo lớp dạy**: Giảng viên chỉ có quyền điểm danh, đăng tài liệu, soạn đề kiểm tra và vào nhóm chat đối với các lớp học mà mình được phân công phụ trách trong năm học đang chọn.

---

## 2. QUY TRÌNH PHÂN CÔNG GIẢNG DẠY (ADMIN PERSPECTIVE)

```
[Quản trị viên]
       |
       +---> Chọn Năm học (VD: 2026-2027)
       |
       +---> Quản lý Lớp học & Lịch dạy (/admin/classes)
       |
       +---> Chọn Lớp & Gán Giảng viên phụ trách
       |        |
       |        +---> Backend: Kiểm tra xung đột lịch dạy của Giảng viên
       |        +---> Backend: INSERT/UPDATE `teacher_assignments`
       |        +---> Backend: Thêm Giảng viên vào nhóm Chat lớp học (Role: 'TEACHER')
       v
[Giảng viên] nhận thông báo phân công và thấy lớp trong Cổng Giảng viên
```

### Tiêu chuẩn kiểm tra xung đột:
- Kiểm tra trùng thời khóa biểu giữa các buổi học (`sessions`) thuộc lớp mới với các lớp đang phụ trách khác của cùng giảng viên.
- Ràng buộc vai trò: Mỗi lớp học bắt buộc phải có ít nhất 1 Giảng viên chính (`PRIMARY`). Giảng viên trợ giảng (`ASSISTANT`) có thể được bổ sung tùy quy mô lớp.

---

## 3. CỔNG GIẢNG VIÊN VÀ LỊCH SỬ GIẢNG DẠY (TEACHER PORTAL)

### 3.1. Bộ chọn năm học hoạt động (Active Academic Year Selector)
- Tích hợp trực tiếp trên thanh công cụ trên cùng (Header) của Cổng Giảng viên.
- Khi giảng viên thay đổi năm học: Toàn bộ danh sách lớp dạy (`classes`), số lượng học sinh (`activeStudents`), lịch điểm danh và các buổi học chưa điểm danh sẽ lập tức được tải lại theo đúng năm học đó thông qua API:
  `GET /api/v1/teacher/portal/classes?academicYear=YYYY-YYYY`.

### 3.2. Lịch sử giảng dạy đa năm học (Teaching History Tab)
- Cung cấp cái nhìn toàn cảnh về hành trình cống hiến sư phạm của giảng viên tại CH Academy:
- Gọi API chuyên biệt: `GET /api/v1/teacher/portal/teaching-history`.
- Dữ liệu trả về được tự động gom nhóm theo từng Niên khóa (sắp xếp giảm dần từ năm mới nhất đến năm cũ nhất):
  - **Thông tin niên khóa**: Mã năm học, tình trạng năm học (`Đang diễn ra`, `Đã đóng`, `Lưu trữ`).
  - **Danh sách lớp đã phụ trách**: Tên lớp, mã môn học, vai trò giảng dạy, số học viên theo học, trạng thái kết thúc khóa.
  - **Thống kê chuyên cần & thành tích**: Tỷ lệ học viên hoàn thành khóa học, số buổi học đã hoàn thành điểm danh.

### 3.3. Quyền điều hành nhóm chat lớp học:
- Giảng viên được tự động cấp quyền điều hành trong nhóm chat của lớp (`chat_groups`).
- Có quyền gửi thông báo tức thời, chia sẻ tài liệu bài tập, ghim tin nhắn quan trọng cho học viên.
- Không thể tự ý truy cập hoặc can thiệp vào nhóm chat của lớp học mà mình không được phân công phụ trách.
