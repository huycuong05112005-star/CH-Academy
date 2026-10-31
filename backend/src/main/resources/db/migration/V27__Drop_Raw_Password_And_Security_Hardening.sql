-- ==============================================================================
-- Flyway Migration V27: Security Hardening - Eliminate Plaintext Passwords
-- ==============================================================================

-- 1. Xóa toàn bộ dữ liệu mật khẩu thô trong cột raw_password để bảo vệ tài khoản
UPDATE users SET raw_password = NULL WHERE raw_password IS NOT NULL;

-- 2. Xóa cột raw_password khỏi bảng users
ALTER TABLE users DROP COLUMN IF EXISTS raw_password;

