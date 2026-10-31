-- =========================================================================
-- V28: TẠO BẢNG QUẢN LÝ NĂM HỌC (ACADEMIC YEARS) ĐỘNG TOÀN HỆ THỐNG
-- =========================================================================

CREATE TABLE IF NOT EXISTS academic_years (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_academic_years_code ON academic_years(code);
CREATE INDEX IF NOT EXISTS idx_academic_years_is_current ON academic_years(is_current);

-- Khởi tạo danh mục các năm học từ quá khứ đến tương lai dài hạn (vượt xa giới hạn 2028)
INSERT INTO academic_years (code, name, start_date, end_date, is_current, status)
VALUES
    ('2023-2024', 'Năm học 2023 - 2024', '2023-09-01', '2024-06-30', false, 'COMPLETED'),
    ('2024-2025', 'Năm học 2024 - 2025', '2024-09-01', '2025-06-30', false, 'COMPLETED'),
    ('2025-2026', 'Năm học 2025 - 2026', '2025-09-01', '2026-06-30', false, 'ACTIVE'),
    ('2026-2027', 'Năm học 2026 - 2027', '2026-09-01', '2027-06-30', true, 'ACTIVE'),
    ('2027-2028', 'Năm học 2027 - 2028', '2027-09-01', '2028-06-30', false, 'UPCOMING'),
    ('2028-2029', 'Năm học 2028 - 2029', '2028-09-01', '2029-06-30', false, 'UPCOMING'),
    ('2029-2030', 'Năm học 2029 - 2030', '2029-09-01', '2030-06-30', false, 'UPCOMING'),
    ('2030-2031', 'Năm học 2030 - 2031', '2030-09-01', '2031-06-30', false, 'UPCOMING'),
    ('2031-2032', 'Năm học 2031 - 2032', '2031-09-01', '2032-06-30', false, 'UPCOMING')
ON CONFLICT (code) DO NOTHING;

