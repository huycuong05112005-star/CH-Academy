# 01. SECRETS EXPOSURE Security Report

## Status: PASS (ĐÃ KHẮC PHỤC TRIỆT ĐỂ LỖ HỔNG P0 CRITICAL)

## Findings
Trong quá trình audit chuyên sâu mã nguồn backend, frontend và cơ sở dữ liệu:
1. **Lỗ hổng P0 - Plaintext Password Storage (`raw_password`):**
   - Cơ sở dữ liệu: Bảng `users` tồn tại cột `raw_password VARCHAR(255)` phát sinh từ migration `V9__Add_Raw_Password_To_Users.sql`.
   - Backend DTOs: `StudentDto.java` và `TeacherDto.java` chứa thuộc tính `private String rawPassword` trả về mật khẩu gốc không mã hóa trong các API:
     - `GET /api/v1/students`
     - `GET /api/v1/students/{id}`
     - `GET /api/v1/teachers/admin/teachers`
   - Services: `AcademicService.java` (dòng 93) và `StudentService.java` (dòng 353, 373) thực hiện gán mật khẩu gốc:
     ```java
     newUser.setRawPassword(defaultPassword);
     user.setRawPassword(plainPassword);
     ```
   - Frontend UI: `StudentListPage.tsx` và `TeacherAssignmentsPage.tsx` có nút bấm mở xem mật khẩu dạng bản rõ và chức năng xuất tệp CSV chứa cột mật khẩu chưa mã hóa của học viên và giáo viên.
2. **Kiểm tra các tệp nhạy cảm (.env, git history, credentials):**
   - `.gitignore` đã chặn các tệp `.env`, `.env.local`, `.env.*.local`, `target/`, `node_modules/`.
   - Mã nguồn không chứa AWS keys (`AKIA...`), Stripe live keys (`sk_live_...`), hay private keys SSH/RSA.
   - JWT Secret được cấu hình thông qua biến môi trường `JWT_SECRET` với giá trị mặc định chỉ dùng cho môi trường dev.

## What's at risk
- Kẻ tấn công nếu có được quyền đọc cơ sở dữ liệu (qua SQL Injection hoặc lộ backup) hoặc đọc trộm API response sẽ chiếm được toàn bộ mật khẩu gốc của học viên, giáo viên và nhân sự.
- Vi phạm nghiêm trọng tiêu chuẩn an toàn thông tin (ISO 27001, OWASP Top 10 A02:2021 Cryptographic Failures) và Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.

## What's already secure
- Mã nguồn không commit các file `.env` chứa credential thật lên GitHub.
- Frontend không nhúng bất kỳ Secret Key nào của Gemini/OpenRouter hay DB password vào biến `VITE_*`.
- Tất cả các lệnh gọi LLM đều được proxy bảo vệ qua backend.

## Recommendations
1. Xóa vĩnh viễn cột `raw_password` khỏi CSDL bằng migration Flyway.
2. Loại bỏ hoàn toàn trường `rawPassword` khỏi toàn bộ Entity, DTO, Service phía backend.
3. Loại bỏ hiển thị mật khẩu và xuất CSV mật khẩu trên frontend.
4. Đảm bảo toàn bộ mật khẩu người dùng chỉ tồn tại duy nhất dưới dạng băm BCrypt.

## Remediation Implemented
1. **Flyway Migration `V27__Drop_Raw_Password_And_Security_Hardening.sql`:**
   ```sql
   UPDATE users SET raw_password = NULL WHERE raw_password IS NOT NULL;
   ALTER TABLE users DROP COLUMN IF EXISTS raw_password;
   ```
2. **Backend Entity & DTO Hardening:**
   - Xóa `rawPassword` trong `User.java`, `StudentDto.java`, `TeacherDto.java`.
   - Đánh dấu `@JsonIgnore` trên `passwordHash` trong `User.java`.
   - Xóa bỏ mọi lệnh gán `setRawPassword` trong `AcademicService.java`, `StudentService.java`, `AuthService.java`.
3. **Frontend Hardening:**
   - Cập nhật `StudentListPage.tsx` và `TeacherAssignmentsPage.tsx`: Thay thế hiển thị mật khẩu bằng huy hiệu bảo mật "Mã hóa BCrypt an toàn"; xóa cột mật khẩu khỏi file CSV xuất ra.

## Verification Results
- **Vibe Check Live Scanner:** Quét 20 đường dẫn tệp nhạy cảm (.env, .git, dumps, keys, logs) trên cả 2 cổng 5173 và 8088: `PASS - No sensitive files served`.
- **Backend Build:** `mvn clean compile` thành công 279 source files không còn tham chiếu `rawPassword`.
- **Frontend Build:** `npm run build` hoàn thành trong 1.66s không còn lỗi TypeScript.
