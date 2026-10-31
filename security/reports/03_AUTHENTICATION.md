# 03. AUTHENTICATION Security Report

## Status: PASS (ĐÃ CHỐNG ENUMERATION & KHÓA TÀI KHOẢN TỰ ĐỘNG)

## Findings
1. **Lỗ hổng Dò quét tài khoản (User Enumeration):**
   - Trước đây trong `AuthService.login()`: Khi `username` không tồn tại, phương thức ném ngoại lệ `ResourceNotFoundException("Không tìm thấy tài khoản")` trả về HTTP 404, trong khi mật khẩu sai ném `BadCredentialsException` trả về HTTP 401. Kẻ tấn công có thể dựa vào mã trạng thái HTTP và thông báo lỗi để lập danh sách các tài khoản tồn tại trong hệ thống.
2. **Thiếu cơ chế tự động khóa tài khoản (Account Lockout):**
   - Hệ thống trước đây chưa tự động khóa tài khoản khi có kẻ tấn công thực hiện brute-force đoán mật khẩu nhiều lần liên tiếp.

## What's at risk
- Dò quét thành công danh sách tài khoản quản trị viên và giáo viên, từ đó tập trung tấn công vét cạn hoặc tấn công phi kỹ thuật (phishing).

## What's already secure
- Sử dụng JWT (JSON Web Token) ký bằng thuật toán HMAC-SHA256 (`Keys.hmacShaKeyFor`) với thời hạn hết hạn xác định.
- Cơ chế giải mã và xác thực token tập trung tại `JwtAuthenticationFilter.java`.

## Recommendations
- Thống nhất phản hồi lỗi khi đăng nhập sai: Luôn trả về HTTP 401 Unauthorized cùng thông báo `"Tên đăng nhập hoặc mật khẩu không chính xác"`.
- Bổ sung cơ chế đếm số lần đăng nhập sai (`failed_login_attempts`) và tự động khóa tài khoản (`status = 'LOCKED'`) khi vượt quá 5 lần.

## Remediation Implemented
1. **Chống User Enumeration:**
   - Cập nhật `AuthService.login()`: Bất kể tài khoản không tồn tại hay sai mật khẩu, đều ném `BadCredentialsException("Tên đăng nhập hoặc mật khẩu không chính xác")`.
2. **Khóa tài khoản tự động:**
   ```java
   int attempts = (user.getFailedLoginAttempts() != null ? user.getFailedLoginAttempts() : 0) + 1;
   user.setFailedLoginAttempts(attempts);
   if (attempts >= 5) {
       user.setStatus("LOCKED");
       user.setLockedAt(Instant.now());
   }
   userRepository.save(user);
   ```
   Nếu tài khoản đã bị khóa, hệ thống từ chối đăng nhập ngay từ đầu: `"Tài khoản đã bị tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng liên hệ quản trị viên."`
3. Khi đăng nhập thành công, reset `failedLoginAttempts = 0`.

## Verification Results
- **Automated Test:** `AuthControllerTest.java`:
  - `login_Failure_NonExistentUser_ReturnsSame401()`: **PASS** (trả về đúng HTTP 401 với mã `BAD_CREDENTIALS`).
  - `getMe_WithoutToken_ReturnsUnauthorizedOrForbidden()`: **PASS** (trả về đúng HTTP 401 khi không gửi token).
