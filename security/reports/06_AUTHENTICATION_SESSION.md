# BÁO CÁO BẢO MẬT: 06. XÁC THỰC, PHIÊN LÀM VIỆC VÀ KHÓA TÀI KHOẢN (AUTHENTICATION & LOCKOUT)

**Dự án:** CH Academy  
**Phân loại rủi ro:** P1 - High (CWE-307 / CWE-204)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A07:2021 – Identification and Authentication Failures

---

## 1. VẤN ĐỀ PHÁT HIỆN
1. **User Enumeration (Dò quét tài khoản):** Khi người dùng nhập sai username, hệ thống trước đây trả về lỗi `ResourceNotFoundException ("Không tìm thấy người dùng")`, cho phép kẻ tấn công phân biệt được tài khoản nào tồn tại trong hệ thống.
2. **Thiếu cơ chế khóa tài khoản tự động (Account Lockout):** Không tự động khóa tài khoản khi bị tấn công dò mật khẩu (Brute-force) liên tiếp.

## 2. BIỆN PHÁP KHẮC PHỤC ĐÃ THỰC THI
1. **Chống dò quét tài khoản:**
   - Trong `AuthService.login()`: Khi không tìm thấy user, ném `BadCredentialsException("Tên đăng nhập hoặc mật khẩu không chính xác")` đồng nhất với trường hợp sai mật khẩu.
   - Luôn trả về mã lỗi `BAD_CREDENTIALS` và HTTP 401.
2. **Khóa tài khoản sau 5 lần thất bại:**
   - Theo dõi số lần đăng nhập sai `failedLoginAttempts`.
   - Nếu `failedLoginAttempts >= 5`: Cập nhật `status = 'LOCKED'`, ghi nhận `lockedAt = Instant.now()`.
   - Ngăn chặn đăng nhập và trả thông báo: `"Tài khoản đã bị tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng liên hệ quản trị viên."`
   - Đăng nhập thành công sẽ reset `failedLoginAttempts = 0`.

## 3. KIỂM THỬ XÁC MINH
- Đã bổ sung Unit Test tự động trong `AuthControllerTest.java` xác nhận:
  - User không tồn tại trả về đúng HTTP 401 cùng `BAD_CREDENTIALS`.
  - Không tồn tại JWT trả về đúng HTTP 401.
