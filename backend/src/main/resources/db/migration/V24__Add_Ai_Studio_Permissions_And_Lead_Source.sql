-- ==============================================================================
-- Flyway Migration V24: Add AI Studio Permissions, Expand Lead Sources for AI Chat
-- ==============================================================================

-- 1. Thêm permissions cho phân hệ AI Agent Studio & GenAI Chat
INSERT INTO permissions (id, module, description) VALUES
    ('ai:manage', 'ai', 'Toàn quyền cấu hình, tạo, sửa, xóa, xuất bản AI Agent, Kho tri thức và Kênh'),
    ('ai:read', 'ai', 'Xem danh sách và cấu hình chi tiết AI Agents, Kho tri thức'),
    ('ai:use', 'ai', 'Sử dụng trợ lý AI theo phân quyền cổng người dùng')
ON CONFLICT (id) DO NOTHING;

-- 2. Gán quyền cho các vai trò
-- SUPER_ADMIN & CENTER_ADMIN có toàn quyền quản trị AI
INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('SUPER_ADMIN', 'ai:manage'),
    ('SUPER_ADMIN', 'ai:read'),
    ('SUPER_ADMIN', 'ai:use'),
    ('CENTER_ADMIN', 'ai:manage'),
    ('CENTER_ADMIN', 'ai:read'),
    ('CENTER_ADMIN', 'ai:use'),
    ('ACADEMIC_STAFF', 'ai:read'),
    ('ACADEMIC_STAFF', 'ai:use'),
    ('TEACHER', 'ai:use'),
    ('STUDENT', 'ai:use')
ON CONFLICT DO NOTHING;

-- 3. Mở rộng ràng buộc nguồn khách hàng tiềm năng cho AI Chatbot
ALTER TABLE leads DROP CONSTRAINT IF EXISTS chk_lead_source;
ALTER TABLE leads ADD CONSTRAINT chk_lead_source CHECK (source IN ('WEBSITE', 'FACEBOOK', 'REFERRAL', 'WALK_IN', 'HOTLINE', 'OTHER', 'AI_CHATBOT', 'AI_WEBSITE'));

-- 4. Bổ sung trường liên kết CRM lead_id trong bảng ai_leads nếu chưa có
ALTER TABLE ai_leads ADD COLUMN IF NOT EXISTS lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ai_leads_lead_id ON ai_leads(lead_id);
