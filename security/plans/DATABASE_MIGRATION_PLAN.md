# KẾ HOẠCH MIGRATION CƠ SỞ DỮ LIỆU BẢO MẬT (DATABASE MIGRATION PLAN)

**Mã Migration:** `V27__Drop_Raw_Password_And_Security_Hardening.sql`  
**Công cụ quản lý:** Flyway Database Migrations  
**Cơ sở dữ liệu đích:** PostgreSQL 16  

---

## 1. MỤC TIÊU MIGRATION
- Loại bỏ hoàn toàn cột `raw_password` và các dữ liệu mật mã chưa mã hóa trong bảng `users`.
- Bảo đảm tính toàn vẹn dữ liệu cho các bảng liên kết `students`, `teachers`, `classes`, `enrollments`.

## 2. NỘI DUNG SCRIPT SQL
```sql
-- Flyway Migration V27
-- 1. Xóa sạch dữ liệu trong cột raw_password để bảo vệ người dùng
UPDATE users SET raw_password = NULL WHERE raw_password IS NOT NULL;

-- 2. Xóa hoàn toàn cột raw_password khỏi bảng users
ALTER TABLE users DROP COLUMN IF EXISTS raw_password;
```

## 3. QUY TRÌNH THỰC HIỆN VÀ KIỂM TRA
1. Chạy Flyway migrate tự động khi Spring Boot khởi động.
2. Kiểm tra log khởi động: `Migrating schema "public" to version "27 - Drop Raw Password And Security Hardening"`.
3. Kiểm tra bằng câu lệnh SQL: `\d users` xác nhận không còn tồn tại cột `raw_password`.
