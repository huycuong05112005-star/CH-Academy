-- ==============================================================================
-- V26: Chuẩn hóa encoding Mojibake, bổ sung cột Scope cho Agent và bảng ai_flows
-- ==============================================================================

-- 1. Sửa lỗi mã hóa Mojibake trong bảng ai_agents
UPDATE ai_agents 
SET name = 'Trợ giảng Luyện thi IELTS Chuyên sâu',
    description = 'Agent hỗ trợ sửa bài viết, nâng cao từ vựng và luyện phát âm chuẩn bản ngữ'
WHERE code IN ('AGENT_IELTS_PRO_9422', 'AGENT_IELTS_PRO_4753')
   OR name LIKE '%Trá»£%'
   OR description LIKE '%há»— trá»£%';

-- 2. Thêm cột scope vào bảng ai_agents để phân loại chính xác phạm vi phục vụ
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_agents' AND column_name = 'scope'
    ) THEN
        ALTER TABLE ai_agents ADD COLUMN scope VARCHAR(50) NOT NULL DEFAULT 'STUDENT_TUTOR';
    END IF;
END $$;

-- 3. Phân định rõ scope cho các Agent hiện có
UPDATE ai_agents SET scope = 'PUBLIC_ADMISSION' WHERE code = 'AGENT_ADMISSIONS';
UPDATE ai_agents SET scope = 'STUDENT_TUTOR' WHERE code IN ('AGENT_STUDENT_TUTOR', 'AGENT_IELTS_PRO_9422', 'AGENT_IELTS_PRO_4753');
UPDATE ai_agents SET scope = 'TEACHER_ASSISTANT' WHERE code = 'AGENT_TEACHER_ASSISTANT';
UPDATE ai_agents SET scope = 'ADMIN_ASSISTANT' WHERE code IN ('AGENT_ADMIN_ASSISTANT', 'AGENT_TEST_01');

-- 4. Bảng lưu trữ Kịch bản và Quy trình (Visual Workflows)
CREATE TABLE IF NOT EXISTS ai_flows (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    agent_code VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    graph JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_flows_agent_code ON ai_flows(agent_code);

-- 5. Kịch bản mẫu: Quy trình Tư vấn Tuyển sinh & Thu thập Lead tự động
INSERT INTO ai_flows (name, description, agent_code, status, graph)
VALUES (
    'Quy trình Thu thập Lead & Tư vấn Tuyển sinh Tự động',
    'Kịch bản tiếp nhận khách vãng lai, chào mừng, tư vấn khóa học, thu thập SĐT và tự động đồng bộ vào CRM',
    'AGENT_ADMISSIONS',
    'ACTIVE',
    '{
        "nodes": [
            {"id": "node_1", "type": "start", "position": {"x": 100, "y": 150}, "data": {"label": "Bắt đầu cuộc gọi/chat"}},
            {"id": "node_2", "type": "ai_agent", "position": {"x": 350, "y": 150}, "data": {"label": "Chào mừng & Khảo sát nhu cầu", "agent": "AGENT_ADMISSIONS"}},
            {"id": "node_3", "type": "condition", "position": {"x": 650, "y": 150}, "data": {"label": "Khách để lại SĐT?", "field": "phone"}},
            {"id": "node_4", "type": "webhook", "position": {"x": 950, "y": 80}, "data": {"label": "Lưu Lead vào CRM Tuyển sinh", "endpoint": "/api/v1/leads"}},
            {"id": "node_5", "type": "handoff", "position": {"x": 950, "y": 240}, "data": {"label": "Chuyển tiếp Chuyên viên Tư vấn", "role": "ADMISSIONS_STAFF"}}
        ],
        "edges": [
            {"id": "e1-2", "source": "node_1", "target": "node_2"},
            {"id": "e2-3", "source": "node_2", "target": "node_3"},
            {"id": "e3-4", "source": "node_3", "target": "node_4", "label": "Có SĐT"},
            {"id": "e3-5", "source": "node_3", "target": "node_5", "label": "Yêu cầu gặp người thật"}
        ]
    }'::jsonb
) ON CONFLICT DO NOTHING;

