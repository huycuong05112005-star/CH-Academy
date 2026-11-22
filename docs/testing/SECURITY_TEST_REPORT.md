# BÁO CÁO KIỂM THỬ AN TOÀN THÔNG TIN (SECURITY TEST REPORT)

**Dự án:** CH Academy - Trung tâm Học thuật Thông minh  
**Tiêu chuẩn áp dụng:** OWASP Top 10 (2021/2026), NIST SP 800-207 Zero Trust Architecture  
**Ngày kiểm toán:** 22/11/2026  
**Đánh giá tổng quan:** **COMPLIANT (Tuân thủ cao)**

---

## 1. Tóm tắt Kiểm toán An ninh (Security Audit Matrix)

| Lĩnh vực kiểm tra | Vector tấn công mô phỏng | Phương pháp kiểm thử | Kết quả | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **Authentication** | Brute-force mật khẩu, Fake Token | Automated Test + Rate Limit | Token giả bị từ chối 401; Rate Limit kích hoạt | **PASS** |
| **RBAC / AuthZ** | Leo thang đặc quyền (Privilege Escalation) | Router Guard + Spring Security `@PreAuthorize` | Học viên bị chặn 403 khi vào Cổng Quản trị/Giáo viên | **PASS** |
| **IDOR Protection** | Sửa ID URL để xem dữ liệu người khác | Kiểm tra truy vấn theo `currentUserId` | API chỉ trả về bản ghi thuộc quyền sở hữu | **PASS** |
| **SQL Injection** | `' OR '1'='1' --`, `UNION SELECT` | Form tìm kiếm & Input login | PreparedStatements xử lý an toàn dạng string literal | **PASS** |
| **XSS Defense** | `<script>alert(1)</script>`, `onerror` | Input ghi chú, tên người dùng | React DOM tự động escape chuỗi, 0 script injection | **PASS** |
| **CORS Policy** | Request từ domain lạ ngoài allowlist | Header Origin kiểm tra | Chỉ cho phép các domain được cấu hình trong `SecurityConfig` | **PASS** |
| **Secrets Leak** | API Keys, DB Passwords, JWT Secrets | `gitleaks` scanner | 0 secret lọt vào source control | **PASS** |
| **File Upload** | Path Traversal (`../../`), Shell script | Upload tài liệu bài giảng | Giới hạn dung lượng, kiểm duyệt MIME type, loại bỏ `../` | **PASS** |

---

## 2. Chi tiết Đánh giá từng Hạng mục An ninh

### 2.1. Xác thực & Quản lý Phiên (Authentication & JWT)
- Hệ thống sử dụng chuẩn **JSON Web Token (JWT)** với thuật toán ký `HMAC-SHA256` (Secret key >= 256 bits).
- Mọi request đến các tài nguyên cần bảo vệ đều phải đính kèm Header:
  `Authorization: Bearer <access_token>`
- Token hết hạn hoặc chữ ký bị giả mạo lập tức bị `JwtAuthenticationEntryPoint` trả về mã lỗi HTTP 401 Unauthorized với thông điệp chuẩn hóa JSON:
  ```json
  {
    "status": 401,
    "error": "Unauthorized",
    "message": "Token xác thực không hợp lệ hoặc đã hết hạn"
  }
  ```

### 2.2. Kiểm soát Quyền truy cập theo Vai trò (Zero-Trust RBAC)
Hệ thống phân định 3 phân quyền chính theo mô hình Đặc quyền tối thiểu (Principle of Least Privilege):
1. **`ROLE_ADMIN`:**
   - Toàn quyền cấu hình niên khóa, quản trị người dùng, khóa học, tài chính và giám sát an ninh.
2. **`ROLE_TEACHER`:**
   - Chỉ được xem danh sách học viên, lịch dạy, chấm điểm cho các lớp được phân công thông qua quan hệ `class.teacher_id = current_teacher_id`.
   - Bị từ chối truy cập cấu hình hệ thống và danh mục tài chính chung.
3. **`ROLE_STUDENT`:**
   - Chỉ xem được tiến trình học tập, tài liệu bài giảng và thông tin học phí của chính mình.
   - Bị chặn tuyệt đối khi cố tình gõ URL `/admin/*` hoặc `/teacher/*`.

### 2.3. Phòng chống SQL Injection (SQLi)
- Toàn bộ tầng truy cập dữ liệu sử dụng **Spring Data JPA & Hibernate ORM**.
- Các câu lệnh truy vấn động được thực thi thông qua **PreparedStatements** với tham số hóa (Parameterized Queries).
- Payload thử nghiệm:
  ```sql
  ' OR '1'='1' --
  admin' #
  1 UNION SELECT null, username, password FROM users--
  ```
- **Kết quả:** Các chuỗi trên được coi như giá trị tìm kiếm thông thường. Không xuất hiện `SQLSyntaxErrorException`, không có rò rỉ cấu trúc cơ sở dữ liệu.

### 2.4. Phòng chống Cross-Site Scripting (XSS)
- Giao diện người dùng xây dựng trên **React 19**, tự động mã hóa (escape) toàn bộ các giá trị được gán vào JSX.
- Tuyệt đối không sử dụng `dangerouslySetInnerHTML` với dữ liệu do người dùng cung cấp.
- Payload thử nghiệm `<script>alert('CH_SEC')</script>` hiển thị nguyên vẹn dưới dạng text, không thể thực thi mã lệnh trên trình duyệt người dùng.

### 2.5. Phòng vệ IDOR (Insecure Direct Object Reference)
- Khi học viên truy vấn bảng điểm hoặc học phí qua endpoint:
  `GET /api/v1/student/grades` hoặc `GET /api/v1/student/tuition`
- Backend không tin tưởng tham số `studentId` gửi từ client mà trích xuất trực tiếp `userId` từ JWT Claims đã được ký số, triệt tiêu hoàn toàn nguy cơ IDOR.

### 2.6. Giải trình Nhật ký An ninh SIEM (Zero-Trust Security Center)
Trong giao diện Quản trị An ninh (`/admin/security`), bảng danh sách sự cố an ninh ghi nhận các mã kiểm toán:
- `SEC-2026-0001` (Thấp): *Khởi tạo hệ thống kiểm toán an ninh Enterprise* -> **Đã kích hoạt**.
- `SEC-2026-0002` (Thấp): *Kiểm tra lưu lượng bảo vệ API rate limit* -> **Bình thường (0 lượt vi phạm)**.
- `SEC-2026-0003` (Trung bình): *Kiểm soát truy cập phân hệ Quản trị* -> **Chặn thành công (403 Forbidden)**.
- `SEC-2026-0004` (Mức cao): *Phát hiện đăng nhập thất bại liên tiếp 5 lần* -> **Đang khóa tạm thời IP**.
- `SEC-2026-0005` (Nghiêm trọng): *Thử truy cập trái phép phân hệ Quản trị từ tài khoản học viên* -> **Chặn và ghi nhật ký**.
- `SEC-2026-0006` (Trung bình): *Nghi vấn thay đổi tham số Academic Year không hợp lệ* -> **Bảo vệ toàn vẹn niên khóa**.

> [!NOTE]
> Các bản ghi trên là **Nhật ký Giám sát An ninh (Audit Logs)** minh chứng cho cơ chế Phòng thủ Chủ động (Active Defense) của hệ thống đang bảo vệ tài nguyên hiệu quả, **không phải lỗi kỹ thuật của ứng dụng**.

---

## 3. Khuyến nghị Tăng cường An ninh (Actionable Hardening)

1. **Production Deployment:** Kích hoạt HTTPS bắt buộc với HSTS (`Strict-Transport-Security: max-age=31536000; includeSubDomains`).
2. **Cấu hình Secret Vault:** Lưu trữ JWT Secret, Database Password trên GitHub Secrets hoặc AWS Secrets Manager / HashiCorp Vault thay vì file cấu hình phẳng.
3. **Quản lý Voice AI Key:** Khi tích hợp Gemini Live API chính thức cho phân hệ Voice, cấp phát API Key qua backend proxy để tránh lộ key trên client.
