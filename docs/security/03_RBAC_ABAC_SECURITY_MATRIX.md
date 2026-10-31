# CH ACADEMY — HỆ THỐNG AN NINH THÔNG TIN TOÀN DIỆN
## Tài liệu 03: Ma trận Phân quyền RBAC và ABAC (Security Authorization Matrix)

---

## 1. MA TRẬN PHÂN QUYỀN THEO VAI TRÒ (RBAC MATRIX)

Hệ thống định nghĩa 4 vai trò chuẩn: `ADMIN` (Quản trị viên), `TEACHER` (Giảng viên), `STUDENT` (Học viên) và `GUEST` (Khách vãng lai).

| Nhóm Tài nguyên & Chức năng | GUEST | STUDENT | TEACHER | ADMIN |
| :--- | :---: | :---: | :---: | :---: |
| **Đăng nhập / Đổi mật khẩu cá nhân** | X | O | O | O |
| **Trang chủ & Tra cứu thông tin khóa học** | O | O | O | O |
| **Chat tư vấn tuyển sinh AI (Public KB)** | O | O | O | O |
| **Nộp đơn đăng ký khóa học** | X | O | X | X |
| **Duyệt / Từ chối đơn đăng ký khóa học** | X | X | X | O |
| **Truy cập Cổng Học viên (`/student`)** | X | O | X | X |
| **Truy cập Cổng Giảng viên (`/teacher`)** | X | X | O | X |
| **Truy cập Cổng Quản trị (`/admin`)** | X | X | X | O |
| **Điểm danh buổi học** | X | X | O (lớp phụ trách) | O (tất cả lớp) |
| **Soạn đề thi & Ngân hàng câu hỏi** | X | X | O | O |
| **Phê duyệt đề thi chính thức** | X | X | X | O |
| **Làm bài thi trực tuyến** | X | O (lớp đăng ký) | X | X |
| **Chấm thi & Nhập điểm** | X | X | O (lớp phụ trách) | O (tất cả lớp) |
| **Quản trị Năm học & Vòng đời** | X | X | X | O |
| **Quản trị Tài chính & Học phí** | X | X | X | O |
| **AI Studio (Quản lý Agent, Flow, KB)** | X | X | X | O |
| **Trung tâm An ninh (`/admin/security`)** | X | X | X | O |

---

## 2. KIỂM SOÁT DỰA TRÊN THUỘC TÍNH (ABAC - ATTRIBUTE-BASED ACCESS CONTROL)

Bên cạnh vai trò tĩnh (RBAC), hệ thống bắt buộc kiểm tra các điều kiện thuộc tính động (ABAC):

1. **Thuộc tính Chủ sở hữu (Ownership ABAC)**:
   - Học viên A không thể xem kết quả thi, lịch học, đơn đăng ký của Học viên B dù cả hai cùng có vai trò `STUDENT`.
   - Giảng viên X không thể tải danh sách điểm danh hoặc sửa điểm của Lớp do Giảng viên Y phụ trách.

2. **Thuộc tính Niên khóa (Temporal / Academic Year ABAC)**:
   - Khi một năm học chuyển trạng thái sang `CLOSED` hoặc `ARCHIVED`, thuộc tính `isEditable` của năm học đó chuyển thành `false`.
   - Mọi thao tác thêm học viên vào lớp, phân công giảng viên mới hoặc mở đề thi trên năm học đã đóng sẽ bị từ chối ở tầng dịch vụ.

3. **Thuộc tính Kho tri thức AI (Knowledge Base Visibility ABAC)**:
   - `PUBLIC`: Cho phép Guest, Student, Teacher và Admin hỏi đáp tuyển sinh.
   - `INTERNAL`: Chỉ cho phép tài khoản đã đăng nhập (Student, Teacher, Admin).
   - `TEACHER_ONLY`: Tài liệu giáo trình, hướng dẫn chấm bài chỉ mở cho Teacher và Admin.
   - `ADMIN_ONLY`: Quy chế tài chính, văn bản điều hành chỉ mở cho Admin.
