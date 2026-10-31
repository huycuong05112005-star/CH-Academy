# BÁO CÁO BẢO MẬT: 01. LỘ LỌT DỮ LIỆU NHẠY CẢM VÀ MẬT MÃ (SECRETS EXPOSURE)

**Dự án:** CH Academy  
**Phân loại rủi ro:** P0 - Critical (CVSS 9.8 / CWE-312 / CWE-200)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A02:2021 – Cryptographic Failures, Vibe Check Scanner Category 1

---

## 1. TỔNG QUAN VẤN ĐỀ
Trong quá trình audit chuyên sâu mã nguồn và cơ sở dữ liệu của dự án CH Academy, đội ngũ an ninh đã phát hiện lỗ hổng nghiêm trọng liên quan đến việc lưu trữ và để lộ mật khẩu người dùng dạng bản rõ (`raw_password`).

### Điểm nguy cơ phát hiện:
1. **Cơ sở dữ liệu:** Bảng `users` tồn tại cột `raw_password VARCHAR(255)` được thêm từ migration `V9__Add_Raw_Password_To_Users.sql`. Cột này lưu trực tiếp mật khẩu không mã hóa của học viên, giáo viên và nhân sự.
2. **Backend API DTOs:** Các lớp `StudentDto.java` và `TeacherDto.java` trả về trường `rawPassword` trực tiếp cho client qua các REST API (`/api/v1/students`, `/api/v1/teachers/admin/teachers`).
3. **Frontend Leakage:** Giao diện quản trị Admin (`StudentListPage.tsx`, `TeacherAssignmentsPage.tsx`) có tính năng xem mật khẩu bản rõ bằng biểu tượng con mắt và cho phép tải danh sách CSV chứa mật khẩu bản rõ của học viên/giáo viên.

---

## 2. NGUYÊN NHÂN GỐC VÀ HẬU QUẢ
- **Nguyên nhân gốc:** Tính năng "xem mật khẩu để hỗ trợ học viên" được bổ sung tiện lợi trong giai đoạn thử nghiệm ban đầu mà không tuân thủ nguyên tắc zero-knowledge mật khẩu.
- **Hậu quả:** Bất kỳ tài khoản quản trị viên nào bị chiếm quyền hoặc bất kỳ cuộc tấn công SQL Injection/man-in-the-middle nào cũng dẫn đến việc lộ toàn bộ mật khẩu gốc của học viên và giáo viên, gây vi phạm nghiêm trọng luật An toàn thông tin mạng và Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.

---

## 3. BIỆN PHÁP KHẮC PHỤC TRIỆT ĐỂ ĐÃ THỰC THI (REMEDIATION)

### 3.1. Loại bỏ hoàn toàn cột `raw_password` trong CSDL
- Tạo Flyway migration `V27__Drop_Raw_Password_And_Security_Hardening.sql`:
  ```sql
  -- Bước 1: Xóa sạch dữ liệu trong cột raw_password để bảo vệ người dùng
  UPDATE users SET raw_password = NULL WHERE raw_password IS NOT NULL;

  -- Bước 2: Xóa hoàn toàn cột raw_password khỏi bảng users
  ALTER TABLE users DROP COLUMN IF EXISTS raw_password;
  ```

### 3.2. Thanh trừng trường `rawPassword` khỏi Backend Entity và DTOs
- `User.java`: Xóa trường `rawPassword`, getter/setter; đánh dấu `@JsonIgnore` trên `passwordHash`.
- `StudentDto.java` & `TeacherDto.java`: Xóa bỏ trường `rawPassword`.
- `AuthService.java`, `AcademicService.java`, `StudentService.java`: Loại bỏ hoàn toàn mọi lệnh gọi `setRawPassword(...)`.

### 3.3. Gia cố Frontend và ngăn rò rỉ qua File CSV
- `StudentListPage.tsx` & `TeacherAssignmentsPage.tsx`:
  - Xóa biểu tượng hiển thị mật khẩu bản rõ. Thay thế bằng nhãn bảo mật "Mã hóa BCrypt an toàn".
  - Xuất CSV không chứa mật khẩu; thay thế bằng trạng thái tài khoản.
  - Các thao tác cấp lại mật khẩu chuyển sang cơ chế gửi email bảo mật hoặc cấp mật khẩu tạm thời một lần.

---

## 4. KẾT QUẢ KIỂM THỬ VÀ BẰNG CHỨNG
1. **Quét Vibe Check Scanner:**
   - `http://localhost:5173` và `http://localhost:8088`: `PASS` không phục vụ file nhạy cảm (.env, .git, dumps, logs).
2. **Kiểm tra biên dịch và Unit Test:**
   - Backend Maven compile thành công 279 source files không còn tham chiếu `rawPassword`.
   - Frontend TypeScript build thành công 0 lỗi `Property 'rawPassword' does not exist`.
