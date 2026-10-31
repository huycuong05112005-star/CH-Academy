# 16. PASSWORD HASHING Security Report

## Status: PASS (CHUẨN MÃ HÓA BCRYPT AN TOÀN CAO)

## Findings
1. **Thuật toán băm mật khẩu:**
   - Hệ thống sử dụng `BCryptPasswordEncoder` của Spring Security với độ phức tạp (work factor) tiêu chuẩn là 10.
   - Mật khẩu luôn được băm kèm muối (salt) tự sinh ngẫu nhiên cho từng tài khoản, ngăn chặn hoàn toàn tấn công bằng Bảng Cầu Vồng (Rainbow Table).
2. **Loại bỏ hoàn toàn Plaintext Password:**
   - Như đã thực thi trong báo cáo 01, toàn bộ cơ chế lưu mật khẩu gốc `raw_password` đã bị xóa vĩnh viễn khỏi CSDL và mã nguồn backend/frontend.
   - Người dùng mới tạo hoặc đặt lại mật khẩu đều được mã hóa bằng `passwordEncoder.encode(...)`.

## What's at risk
- Mật khẩu lưu dạng plaintext hoặc hash yếu (MD5, SHA1) có thể bị giải mã trong vài giây nếu cơ sở dữ liệu bị rò rỉ.

## What's already secure
- Mọi thao tác kiểm tra mật khẩu khi đăng nhập đều sử dụng `passwordEncoder.matches(rawPassword, encodedPassword)` với thời gian thực thi chống timing attack.

## Recommendations
- Khuyến khích chính sách mật khẩu mạnh (tối thiểu 8 ký tự, có chữ hoa, chữ thường và số).

## Remediation Implemented
- Đã kiểm tra cấu hình `PasswordEncoder` trong `SecurityConfig.java`: Xác nhận sử dụng BCrypt chuẩn.

## Verification Results
- Kiểm tra dữ liệu trong bảng `users`: Toàn bộ cột `password_hash` đều bắt đầu bằng `$2a$10$...` đặc trưng của chuẩn BCrypt.
