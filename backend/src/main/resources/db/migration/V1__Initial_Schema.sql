-- ================================================
-- V1__Initial_Schema.sql
-- Migration đầu tiên: tạo bảng nền tảng
-- Flyway đặt tên theo quy tắc: V{version}__{description}.sql
-- ================================================

-- Bảng theo dõi trạng thái các bản ghi (soft delete)
-- Sẽ được dùng làm nền tảng cho tất cả entity chính

-- Ví dụ bảng đơn giản để kiểm tra Flyway hoạt động
CREATE TABLE IF NOT EXISTS system_info (
    id          BIGSERIAL PRIMARY KEY,
    key         VARCHAR(100) NOT NULL UNIQUE,
    value       TEXT,
    description VARCHAR(255),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Thêm dữ liệu khởi tạo
INSERT INTO system_info (key, value, description)
VALUES
    ('app.name', 'CH Academy', 'Tên ứng dụng'),
    ('app.version', '1.0.0', 'Phiên bản hiện tại'),
    ('db.schema.version', '1', 'Phiên bản schema database')
ON CONFLICT (key) DO NOTHING;
