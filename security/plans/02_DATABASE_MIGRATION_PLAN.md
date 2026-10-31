# KẾ HOẠCH MIGRATION CƠ SỞ DỮ LIỆU AN TOÀN (DATABASE MIGRATION PLAN)

**Mã Migration:** `V27__Drop_Raw_Password_And_Security_Hardening.sql`  
**Cơ chế quản lý:** Flyway Database Migration Engine  
**Môi trường:** PostgreSQL 16 Alpine  

---

## 1. NGUYÊN TẮC BẮT BUỘC
- Không xóa database, không reset dữ liệu người dùng.
- Bảo toàn 100% dữ liệu tài khoản, phân quyền, điểm thi, đăng ký học hiện có.
- Xóa bỏ dữ liệu nhạy cảm dư thừa để tuân thủ quy chuẩn an toàn.

## 2. NỘI DUNG MIGRATION FILE
```sql
-- Flyway Migration V27
-- Tệp: backend/src/main/resources/db/migration/V27__Drop_Raw_Password_And_Security_Hardening.sql

-- 1. Xóa sạch dữ liệu trong cột raw_password để bảo vệ người dùng
UPDATE users SET raw_password = NULL WHERE raw_password IS NOT NULL;

-- 2. Xóa hoàn toàn cột raw_password khỏi bảng users
ALTER TABLE users DROP COLUMN IF EXISTS raw_password;
```

## 3. QUY TRÌNH THỰC THI VÀ GIÁM SÁT
1. Spring Boot tự động phát hiện migration mới khi khởi động và áp dụng trong transaction nguyên tử.
2. Kiểm tra log Flyway:
   `Successfully applied 1 migration to schema "public", now at version v27`.
3. Kiểm tra schema sau migration: Bảng `users` chỉ còn `password_hash` băm an toàn bằng BCrypt.
