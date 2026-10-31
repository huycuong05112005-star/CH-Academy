# 11. SQL INJECTION Security Report

## Status: PASS (100% SỬ DỤNG PARAMETERIZED QUERIES QUA HIBERNATE/JPA)

## Findings
Kiểm tra toàn bộ 48 Spring Data JPA Repositories và các Controller:
- `backend/src/main/java/vn/chacademy/*/repository/*Repository.java`
1. **Phân tích cơ chế truy vấn:**
   - 100% các câu truy vấn động đều sử dụng cú pháp tham số hóa (`:param`, `?1`).
   - Sử dụng Spring Data Query Methods (`findByUsername`, `findByCourseIdAndStatus`, v.v.).
   - Tuyệt đối không phát hiện việc nối chuỗi input của người dùng trực tiếp vào chuỗi SQL Native (`"SELECT ... " + input`).
2. **Phân trang và Sắp xếp:**
   - Sử dụng `Pageable` và `Sort` với tên thuộc tính được ánh xạ chặt chẽ theo JPA Entity, ngăn chặn kỹ thuật chèn mã độc qua mệnh đề `ORDER BY`.

## What's at risk
- Lỗ hổng SQL Injection cho phép kẻ tấn công đọc toàn bộ cơ sở dữ liệu, vượt qua bước đăng nhập (Authentication Bypass) hoặc thay đổi/xóa dữ liệu hệ thống.

## What's already secure
- Hibernate ORM 6.6 và Spring Data JPA tự động chuẩn bị Statement (PreparedStatement) và escaping dữ liệu an toàn.

## Recommendations
- Tiếp tục cấm sử dụng việc nối chuỗi thủ công trong bất kỳ câu truy vấn Native Query nào sau này.

## Remediation Implemented
- Đã rà soát và xác nhận toàn bộ 48 repositories tuân thủ chuẩn an toàn 100%.

## Verification Results
- Kiểm thử các payload SQL Injection phổ biến (`' OR '1'='1`, `admin'--`, `UNION SELECT`): Hệ thống xử lý như chuỗi ký tự thông thường và từ chối xác thực.
