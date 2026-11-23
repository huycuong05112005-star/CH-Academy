-- ==============================================================================
-- Flyway Migration V31: Seed Standard Student Account & Link Permanent Student Identity
-- ==============================================================================

-- 1. Insert or update default student account for Nguyễn Thùy Linh (thuylinh.nguyen@gmail.com)
-- Password: Student@123456 (BCrypt)
INSERT INTO users (username, password_hash, full_name, email, phone, status)
VALUES (
    'thuylinh.nguyen@gmail.com',
    '$2a$10$Wv/Lg.WH./yes7A.vYj9xOGAMIW/dQ/ZcNVfyT2jJj5aH6R.zSOlK',
    'Nguyễn Thùy Linh',
    'thuylinh.nguyen@gmail.com',
    '0987654321',
    'ACTIVE'
)
ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, status = 'ACTIVE';

-- 2. Assign STUDENT role to user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, 'STUDENT'
FROM users u
WHERE u.username = 'thuylinh.nguyen@gmail.com'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- 3. Link permanent student record with user account
UPDATE students s
SET user_id = u.id
FROM users u
WHERE s.student_code = 'HV20240002' AND u.username = 'thuylinh.nguyen@gmail.com';
