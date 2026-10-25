# CH Academy — Mô Hình Bảo Mật và Quyền Riêng Tư (Security & Privacy Model)

Tài liệu này quy định và mô tả các nguyên tắc bảo mật, kiến trúc xác thực, phân quyền và chính sách bảo vệ dữ liệu người dùng tại hệ thống quản lý trung tâm giáo dục **CH Academy**.

---

## 1. Kiến trúc Xác thực (Authentication Architecture)

Hệ thống sử dụng cơ chế xác thực không trạng thái (**Stateless Authentication**) dựa trên JWT (JSON Web Tokens) kết hợp bộ lọc bảo mật của **Spring Security 6**.

### 1.1 Chuẩn hóa Mật khẩu
- Mọi mật khẩu người dùng đều được mã hóa một chiều bằng thuật toán **BCrypt** (`PasswordEncoder` bean) với salt ngẫu nhiên chuẩn hóa (`BCrypt.hashpw`).
- Tuyệt đối không lưu trữ hoặc ghi log mật khẩu dạng văn bản thuần (plaintext) trong cơ sở dữ liệu hay nhật ký hệ thống.
- Khi người dùng đổi mật khẩu qua endpoint `/api/v1/auth/change-password`, hệ thống kiểm tra mật khẩu hiện tại trước khi mã hóa mật khẩu mới.

### 1.2 Quản lý Token & Session
- Token JWT được ký bằng thuật toán HMAC-SHA256 (`Keys.hmacShaKeyFor`) với Secret Key dài tối thiểu 256 bits lấy từ biến môi trường `JWT_SECRET`.
- Thời gian hết hạn của token được cấu hình linh hoạt qua `jwt.expiration` (mặc định 24 giờ cho môi trường phát triển).
- Token chứa thông tin định danh: `sub` (username / email), `userId`, `roles` và `permissions`.
- Tại phía client (React), token được quản lý qua `AuthContext` và đính kèm tự động trong header `Authorization: Bearer <token>` thông qua wrapper `apiClient` / `apiFetch`.

---

## 2. Kiểm soát Phân quyền (Role-Based Access Control - RBAC)

Phân quyền được thực thi chặt chẽ ở cả **Backend (Tầng thẩm quyền duy nhất)** và **Frontend (Tối ưu trải nghiệm)**:

### 2.1 Ma trận Vai trò (Role Hierarchy)

| Vai trò (Role) | Phạm vi Quyền hạn (Scope) |
|---|---|
| `SUPER_ADMIN` | Toàn quyền quản trị hệ thống, quản lý tài khoản, cấu hình toàn cục |
| `CENTER_ADMIN` | Quản lý vận hành trung tâm, nhân sự giáo viên, lớp học, tài chính |
| `ACADEMIC_STAFF` | Quản lý khóa học, danh mục, lớp học, lịch học, xếp lớp, điểm danh |
| `ADMISSIONS_STAFF` | Quản lý khách hàng tiềm năng (Leads), chuyển đổi học viên, tư vấn tuyển sinh |
| `ACCOUNTANT` | Quản lý biểu phí, lập khoản phải thu (Receivables), thu học phí (Payments), hoàn phí |
| `TEACHER` | Xem lớp phụ trách, lịch dạy cá nhân, thực hiện điểm danh học viên trong lớp |
| `STUDENT` | Xem lịch học cá nhân, tiến độ học tập, thông tin học phí của chính mình |
| `PARENT` | Xem thông tin học tập, điểm danh và công nợ của học viên được liên kết hợp lệ |

### 2.2 Thực thi Phân quyền tại Backend
- Kích hoạt `@EnableMethodSecurity(prePostEnabled = true)` trên tầng cấu hình bảo mật.
- Mọi Controller nhạy cảm đều được bảo vệ bởi `@PreAuthorize("hasAnyRole(...)")` hoặc `@PreAuthorize("hasAuthority(...)")`.
- Tuyệt đối không để frontend tự quyết định quyền truy cập dữ liệu; bất kỳ yêu cầu trái phép nào đều bị chặn ở tầng filter hoặc tầng service với mã lỗi HTTP `403 Forbidden`.

---

## 3. Bảo vệ Dữ liệu Nhạy cảm & Quyền Riêng tư Trẻ em

Hệ thống được thiết kế đặc thù phục vụ cả đối tượng **Trẻ em** và **Người trưởng thành**:

1. **Nguyên tắc Thu thập Tối thiểu (Data Minimization):**
   - Chỉ thu thập họ tên, ngày sinh, giới tính và liên hệ phục vụ trực tiếp công tác đào tạo.
   - Không thu thập số căn cước, thông tin tôn giáo hoặc dữ liệu sinh trắc học không phục vụ nghiệp vụ.
2. **Quan hệ Học viên — Người giám hộ (Parent-Child Guardianship):**
   - Học viên trẻ em (`targetType = 'KIDS'`) được liên kết với một hoặc nhiều người giám hộ (`guardians`) thông qua bảng trung gian `student_guardians`.
   - Mỗi quan hệ ghi nhận rõ vai trò (`FATHER`, `MOTHER`, `GUARDIAN`) và cờ chỉ định `is_primary_contact`.
   - Quyền truy cập hồ sơ học sinh vị thành niên chỉ được cấp cho người giám hộ đã được xác thực liên kết hợp lệ.
3. **Bảo mật Dữ liệu Tài chính:**
   - Dữ liệu tiền tệ lưu trữ bằng kiểu `NUMERIC(15,2)` chống sai số dấu phẩy động.
   - Giao dịch tài chính đã ghi nhận không thể bị xóa vật lý (`payments`, `payment_allocations`). Các nghiệp vụ điều chỉnh chỉ được thực hiện thông qua hoàn phí (`refunds`) có kiểm soát và ghi nhận người thao tác.

---

## 4. Phòng chống Tấn công Phổ biến

1. **SQL Injection:**
   - Sử dụng 100% Spring Data JPA và Hibernate với truy vấn tham số hóa (`@Param`, Criteria API).
   - Không nối chuỗi trực tiếp vào câu lệnh SQL.
2. **Cross-Origin Resource Sharing (CORS):**
   - Cấu hình chỉ cho phép các Origin tin cậy (mặc định `http://localhost:5173` và `http://127.0.0.1:5173` trong môi trường dev).
   - Giới hạn các HTTP Method được phép: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
3. **Anti-Spam & Honeypot:**
   - Form đăng ký tư vấn công khai (`POST /api/v1/public/leads`) trang bị trường ẩn `websiteUrl` (Honeypot). Bot tự động điền trường này sẽ bị hệ thống phát hiện và loại bỏ.
   - Kiểm tra định dạng số điện thoại Việt Nam chuẩn hóa (10 chữ số đầu 03, 05, 07, 08, 09).
4. **Validation & Exception Masking:**
   - Sử dụng Jakarta Bean Validation (`@Valid`, `@NotBlank`, `@Size`, `@Pattern`) trên toàn bộ Request DTOs.
   - `GlobalExceptionHandler` chặn bắt toàn bộ ngoại lệ chưa được xử lý, trả về mã lỗi chuẩn `ApiResponse` và không bao giờ để lộ stack trace hoặc cấu trúc máy chủ ra phía người dùng.
