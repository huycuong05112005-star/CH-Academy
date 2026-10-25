-- Khởi tạo schema ban đầu (chỉ chạy khi database được tạo lần đầu tiên)
-- Flyway sẽ quản lý các migration tiếp theo

-- Tạo schema mặc định nếu cần
CREATE SCHEMA IF NOT EXISTS public;

-- Ghi chú: Các bảng sẽ được tạo bởi Flyway migration scripts
-- trong thư mục backend/src/main/resources/db/migration/
