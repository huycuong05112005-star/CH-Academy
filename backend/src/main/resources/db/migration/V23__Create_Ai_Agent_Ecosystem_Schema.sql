-- ==============================================================================
-- V23: SCHEMA HỆ SINH THÁI AI AGENT, AGENT STUDIO, KHO TRI THỨC & ĐA KÊNH
-- ==============================================================================

-- 1. Nâng cấp bảng ai_conversations: Phân tách không gian hội thoại theo cổng & kênh
ALTER TABLE ai_conversations ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS portal VARCHAR(50) NOT NULL DEFAULT 'STUDENT';
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS channel VARCHAR(50) NOT NULL DEFAULT 'PORTAL';
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS agent_code VARCHAR(100) DEFAULT 'AGENT_STUDENT_TUTOR';
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS guest_name VARCHAR(150);
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(50);

-- Cập nhật dữ liệu hội thoại cũ để bảo toàn tính toàn vẹn
UPDATE ai_conversations SET portal = 'ADMIN', agent_code = 'AGENT_ADMIN_ASSISTANT' WHERE role = 'ADMIN';
UPDATE ai_conversations SET portal = 'TEACHER', agent_code = 'AGENT_TEACHER_ASSISTANT' WHERE role = 'TEACHER';
UPDATE ai_conversations SET portal = 'STUDENT', agent_code = 'AGENT_STUDENT_TUTOR' WHERE role = 'STUDENT';

-- Chỉ mục phân tách danh tính & không gian hội thoại
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_portal ON ai_conversations(user_id, portal, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_portal ON ai_conversations(session_id, portal, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_portal_status ON ai_conversations(portal, status);

-- 2. Bảng định nghĩa AI Agents
CREATE TABLE IF NOT EXISTS ai_agents (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    role_target VARCHAR(50) NOT NULL, -- 'PUBLIC', 'STUDENT', 'TEACHER', 'ADMIN'
    model VARCHAR(100) NOT NULL DEFAULT 'google/gemini-2.5-flash',
    system_prompt TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED', -- 'DRAFT', 'PUBLISHED', 'PAUSED'
    temperature NUMERIC(3,2) DEFAULT 0.3,
    max_tokens INT DEFAULT 1000,
    version INT DEFAULT 1,
    settings_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Kho tri thức (Knowledge Bases)
CREATE TABLE IF NOT EXISTS ai_knowledge_bases (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    access_level VARCHAR(50) NOT NULL DEFAULT 'INTERNAL', -- 'PUBLIC', 'INTERNAL', 'TEACHER_ONLY', 'ADMIN_ONLY'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng Tài liệu trong kho tri thức
CREATE TABLE IF NOT EXISTS ai_kb_documents (
    id BIGSERIAL PRIMARY KEY,
    kb_id BIGINT NOT NULL REFERENCES ai_knowledge_bases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(50) NOT NULL, -- 'PDF', 'DOCX', 'TXT', 'CSV', 'XLSX'
    file_size BIGINT DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING', -- 'UPLOADING', 'PROCESSING', 'INDEXED', 'FAILED', 'NEEDS_RETRY'
    chunk_count INT DEFAULT 0,
    raw_content TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Phân đoạn văn bản (Document Chunks)
CREATE TABLE IF NOT EXISTS ai_kb_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES ai_kb_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    metadata_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_kb_chunks_doc ON ai_kb_chunks(document_id, chunk_index);

-- 6. Bảng liên kết AI Agent với Kho tri thức
CREATE TABLE IF NOT EXISTS ai_agent_kb_links (
    agent_id BIGINT NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    kb_id BIGINT NOT NULL REFERENCES ai_knowledge_bases(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (agent_id, kb_id)
);

-- 7. Bảng Kịch bản hội thoại (Conversation Flows)
CREATE TABLE IF NOT EXISTS ai_flows (
    id BIGSERIAL PRIMARY KEY,
    agent_id BIGINT REFERENCES ai_agents(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    graph_json TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'PUBLISHED'
    trigger_type VARCHAR(50) DEFAULT 'NEW_CONVERSATION',
    version INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Bảng Khách hàng tiềm năng thu thập từ AI (Leads)
CREATE TABLE IF NOT EXISTS ai_leads (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT REFERENCES ai_conversations(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    course_interest VARCHAR(255),
    note TEXT,
    status VARCHAR(50) DEFAULT 'NEW', -- 'NEW', 'CONTACTED', 'CONVERTED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Bảng Cấu hình Kênh kết nối
CREATE TABLE IF NOT EXISTS ai_channel_configs (
    id BIGSERIAL PRIMARY KEY,
    channel_type VARCHAR(50) UNIQUE NOT NULL, -- 'WEBSITE', 'PORTAL_STUDENT', 'PORTAL_TEACHER', 'PORTAL_ADMIN', 'ZALO_OA', 'VOICE'
    agent_id BIGINT REFERENCES ai_agents(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    config_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. KHỞI TẠO DỮ LIỆU BAN ĐẦU (SEED DATA)

-- 10.1. Khởi tạo 4 AI Agent chuyên trách
INSERT INTO ai_agents (code, name, description, role_target, model, system_prompt, status, temperature, max_tokens, version)
VALUES 
(
    'AGENT_ADMISSIONS',
    'Chuyên viên Tư vấn Tuyển sinh',
    'Tư vấn khóa học, lịch khai giảng, học phí, ưu đãi và thu thập thông tin khách hàng tiềm năng cho website công khai.',
    'PUBLIC',
    'google/gemini-2.5-flash',
    'Bạn là Chuyên viên Tư vấn Tuyển sinh AI của CH Academy. Nhiệm vụ của bạn là tư vấn tận tâm, cung cấp thông tin chính xác về các khóa học, học phí, thời lượng và lịch khai giảng. Luôn lịch sự, niềm nở và khuyến khích khách hàng để lại số điện thoại để trung tâm tư vấn chi tiết hơn. Tuyệt đối không tiết lộ thông tin nội bộ của học viên hay giảng viên.',
    'PUBLISHED',
    0.3,
    800,
    1
),
(
    'AGENT_STUDENT_TUTOR',
    'Trợ giảng AI Đồng hành',
    'Hỗ trợ học viên giải đáp kiến thức, hướng dẫn bài tập từng bước, giải thích bài thi và nhắc lịch học cá nhân.',
    'STUDENT',
    'google/gemini-2.5-flash',
    'Bạn là Trợ giảng AI đồng hành cùng học viên CH Academy. Phương pháp sư phạm: Hướng dẫn học viên tư duy, gợi mở từng bước thay vì chỉ đưa ngay đáp án. Giải thích cặn kẽ các khái niệm khó hiểu. Bạn có quyền truy xuất lịch học, bài thi và học phí của chính học viên này để nhắc nhở khi học viên hỏi.',
    'PUBLISHED',
    0.2,
    1000,
    1
),
(
    'AGENT_TEACHER_ASSISTANT',
    'Trợ lý Giảng dạy & Soạn bài',
    'Hỗ trợ giảng viên biên soạn giáo án, tạo câu hỏi trắc nghiệm, tóm tắt tài liệu môn học và tra cứu lịch dạy lớp phân công.',
    'TEACHER',
    'google/gemini-2.5-flash',
    'Bạn là Trợ lý Giảng dạy học thuật dành cho Giảng viên CH Academy. Bạn hỗ trợ thầy cô gợi ý bài tập, soạn dàn ý giáo án bài học, xây dựng ngân hàng câu hỏi kiểm tra và tóm tắt tài liệu đào tạo. Các nội dung bạn gợi ý sẽ được giảng viên duyệt trước khi sử dụng.',
    'PUBLISHED',
    0.3,
    1200,
    1
),
(
    'AGENT_ADMIN_ASSISTANT',
    'Trợ lý Quản trị & Vận hành',
    'Hỗ trợ Ban Quản trị tra cứu số liệu học viên, doanh thu học phí, lớp học, nhân sự và báo cáo phân tích tổng quan.',
    'ADMIN',
    'google/gemini-2.5-flash',
    'Bạn là Trợ lý Phân tích và Quản trị của CH Academy. Bạn hỗ trợ Ban Quản lý tra cứu tổng hợp số liệu về học viên, lớp học, học phí, chuyên cần và tỷ lệ đạt của các kỳ thi dựa trên dữ liệu hệ thống thời gian thực.',
    'PUBLISHED',
    0.2,
    1200,
    1
)
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    system_prompt = EXCLUDED.system_prompt;

-- 10.2. Khởi tạo 4 Kho tri thức mẫu
INSERT INTO ai_knowledge_bases (code, name, description, access_level)
VALUES
(
    'KB_ADMISSIONS',
    'Kho Tri thức Tuyển sinh & Khóa học',
    'Thông tin giới thiệu các khóa học Tiếng Anh Giao tiếp, Tiếng Anh Thiếu nhi, Luyện thi IELTS, học phí chuẩn và lịch khai giảng.',
    'PUBLIC'
),
(
    'KB_ACADEMIC_RULES',
    'Quy chế Đào tạo & Nội quy Trung tâm',
    'Quy định chuyên cần (80%), thủ tục bảo lưu, chuyển lớp, quy chế thi kết thúc khóa học và cấp chứng chỉ.',
    'INTERNAL'
),
(
    'KB_TEACHING_GUIDES',
    'Tài liệu Nghiệp vụ & Phương pháp Giảng dạy',
    'Khung chương trình chuẩn, hướng dẫn soạn giáo án tương tác, tiêu chí chấm thi tự luận và phương pháp sư phạm.',
    'TEACHER_ONLY'
),
(
    'KB_ADMIN_PROCEDURES',
    'Quy trình Vận hành & Quản lý Trung tâm',
    'Quy trình thu chi tài chính, quản lý tài sản, an toàn thông tin và chính sách nhân sự.',
    'ADMIN_ONLY'
)
ON CONFLICT (code) DO NOTHING;

-- 10.3. Liên kết Agent với Kho tri thức
INSERT INTO ai_agent_kb_links (agent_id, kb_id)
SELECT a.id, kb.id FROM ai_agents a, ai_knowledge_bases kb
WHERE a.code = 'AGENT_ADMISSIONS' AND kb.code IN ('KB_ADMISSIONS')
ON CONFLICT DO NOTHING;

INSERT INTO ai_agent_kb_links (agent_id, kb_id)
SELECT a.id, kb.id FROM ai_agents a, ai_knowledge_bases kb
WHERE a.code = 'AGENT_STUDENT_TUTOR' AND kb.code IN ('KB_ADMISSIONS', 'KB_ACADEMIC_RULES')
ON CONFLICT DO NOTHING;

INSERT INTO ai_agent_kb_links (agent_id, kb_id)
SELECT a.id, kb.id FROM ai_agents a, ai_knowledge_bases kb
WHERE a.code = 'AGENT_TEACHER_ASSISTANT' AND kb.code IN ('KB_ACADEMIC_RULES', 'KB_TEACHING_GUIDES')
ON CONFLICT DO NOTHING;

INSERT INTO ai_agent_kb_links (agent_id, kb_id)
SELECT a.id, kb.id FROM ai_agents a, ai_knowledge_bases kb
WHERE a.code = 'AGENT_ADMIN_ASSISTANT' AND kb.code IN ('KB_ADMISSIONS', 'KB_ACADEMIC_RULES', 'KB_ADMIN_PROCEDURES')
ON CONFLICT DO NOTHING;

-- 10.4. Khởi tạo tài liệu và phân đoạn mẫu cho Kho tri thức Tuyển sinh & Quy chế
INSERT INTO ai_kb_documents (kb_id, name, file_path, file_type, file_size, status, chunk_count, raw_content)
SELECT kb.id, 'Bang_Gia_Va_Chuong_Trinh_Dao_Tao_2026.pdf', '/docs/Bang_Gia_Va_Chuong_Trinh_Dao_Tao_2026.pdf', 'PDF', 1048576, 'INDEXED', 3,
'BẢNG GIÁ VÀ CHƯƠNG TRÌNH ĐÀO TẠO CH ACADEMY NĂM HỌC 2026-2027:
1. Khóa Tiếng Anh Trẻ em Toàn diện (KID-ENG-01): Thời lượng 3 tháng (24 buổi), học phí 3.500.000 VNĐ. Đối tượng: Học sinh từ 6 đến 12 tuổi. Giảng viên bản ngữ và trợ giảng theo sát.
2. Khóa Tiếng Anh Giao tiếp Doanh nghiệp & Công sở (PRO-ENG-02): Thời lượng 4 tháng (32 buổi), học phí 4.800.000 VNĐ. Tập trung viết email, thuyết trình và đàm phán hợp đồng.
3. Luyện thi IELTS Cấp tốc mục tiêu 6.5+ (IELTS-INT): Thời lượng 5 tháng, học phí 6.500.000 VNĐ. Cam kết đầu ra bằng văn bản.
Ưu đãi: Giảm ngay 10% khi đăng ký nhóm 2 người trở lên.'
FROM ai_knowledge_bases kb WHERE kb.code = 'KB_ADMISSIONS'
ON CONFLICT DO NOTHING;

INSERT INTO ai_kb_chunks (document_id, chunk_index, content, metadata_json)
SELECT doc.id, 1, 
'CHƯƠNG TRÌNH ĐÀO TẠO & HỌC PHÍ CH ACADEMY:
- Khóa Tiếng Anh Trẻ em (KID-ENG-01): 3 tháng, 24 buổi, học phí 3.500.000 VNĐ (6-12 tuổi).
- Khóa Tiếng Anh Giao tiếp Công sở (PRO-ENG-02): 4 tháng, 32 buổi, học phí 4.800.000 VNĐ (Viết email, thuyết trình, đàm phán).
- Luyện thi IELTS Cấp tốc: 5 tháng, học phí 6.500.000 VNĐ, cam kết đầu ra 6.5+.',
'{"section": "Bảng học phí", "source": "Bang_Gia_Va_Chuong_Trinh_Dao_Tao_2026.pdf"}'
FROM ai_kb_documents doc WHERE doc.name = 'Bang_Gia_Va_Chuong_Trinh_Dao_Tao_2026.pdf'
LIMIT 1;

INSERT INTO ai_kb_documents (kb_id, name, file_path, file_type, file_size, status, chunk_count, raw_content)
SELECT kb.id, 'Quy_Che_Dao_Tao_Va_Noi_Quy_CH_Academy.pdf', '/docs/Quy_Che_Dao_Tao_Va_Noi_Quy_CH_Academy.pdf', 'PDF', 2097152, 'INDEXED', 2,
'QUY CHẾ ĐÀO TẠO VÀ NỘI QUY TRUNG TÂM CH ACADEMY:
Điều 1. Điều kiện tham dự thi kết thúc khóa: Học viên phải tham dự tối thiểu 80% số buổi học của lớp.
Điều 2. Chấm thi và thang điểm: Thang điểm 10. Điểm đạt từ 5.0 trở lên. Điểm giỏi từ 8.0 trở lên.
Điều 3. Chính sách bảo lưu và chuyển lớp: Học viên có thể bảo lưu tối đa 6 tháng với lý do chính đáng và báo trước 7 ngày.'
FROM ai_knowledge_bases kb WHERE kb.code = 'KB_ACADEMIC_RULES'
ON CONFLICT DO NOTHING;

INSERT INTO ai_kb_chunks (document_id, chunk_index, content, metadata_json)
SELECT doc.id, 1, 
'ĐIỀU KIỆN CHUYÊN CẦN VÀ THI CỬ CH ACADEMY:
- Học viên phải đạt chuyên cần tối thiểu 80% số buổi mới đủ điều kiện dự thi cuối kỳ.
- Thang điểm đánh giá là 10. Điểm đạt tối thiểu là 5.0.
- Được bảo lưu tối đa 6 tháng, thông báo trước 7 ngày.',
'{"section": "Điều kiện thi & Chuyên cần", "source": "Quy_Che_Dao_Tao_Va_Noi_Quy_CH_Academy.pdf"}'
FROM ai_kb_documents doc WHERE doc.name = 'Quy_Che_Dao_Tao_Va_Noi_Quy_CH_Academy.pdf'
LIMIT 1;

-- 10.5. Cấu hình Kênh kết nối mặc định
INSERT INTO ai_channel_configs (channel_type, agent_id, is_active, config_json)
SELECT 'WEBSITE', a.id, TRUE, '{"welcome_message": "Chào bạn! Tôi là Chuyên viên tư vấn tuyển sinh AI của CH Academy. Tôi có thể hỗ trợ bạn tìm hiểu khóa học phù hợp nhất hôm nay!", "primary_color": "#2563EB", "enable_lead_capture": true}'
FROM ai_agents a WHERE a.code = 'AGENT_ADMISSIONS'
ON CONFLICT (channel_type) DO NOTHING;

INSERT INTO ai_channel_configs (channel_type, agent_id, is_active, config_json)
SELECT 'PORTAL_STUDENT', a.id, TRUE, '{"welcome_message": "Chào bạn! Tôi là Trợ giảng AI. Bạn cần giải thích bài học, hướng dẫn giải bài tập hay xem lịch học?", "study_mode": "GUIDED"}'
FROM ai_agents a WHERE a.code = 'AGENT_STUDENT_TUTOR'
ON CONFLICT (channel_type) DO NOTHING;

INSERT INTO ai_channel_configs (channel_type, agent_id, is_active, config_json)
SELECT 'PORTAL_TEACHER', a.id, TRUE, '{"welcome_message": "Chào thầy cô! Tôi là Trợ lý Giảng dạy. Tôi có thể giúp soạn đề thi, dàn ý bài giảng hoặc xem lịch dạy.", "assistant_mode": "ACADEMIC"}'
FROM ai_agents a WHERE a.code = 'AGENT_TEACHER_ASSISTANT'
ON CONFLICT (channel_type) DO NOTHING;

INSERT INTO ai_channel_configs (channel_type, agent_id, is_active, config_json)
SELECT 'PORTAL_ADMIN', a.id, TRUE, '{"welcome_message": "Chào Quản trị viên! Tôi là Trợ lý Vận hành. Bạn cần tra cứu số liệu doanh thu, học viên hay báo cáo nào?", "report_scope": "FULL"}'
FROM ai_agents a WHERE a.code = 'AGENT_ADMIN_ASSISTANT'
ON CONFLICT (channel_type) DO NOTHING;

INSERT INTO ai_channel_configs (channel_type, agent_id, is_active, config_json)
SELECT 'ZALO_OA', a.id, FALSE, '{"oa_id": "", "app_id": "", "secret_key": "", "webhook_verify_token": "", "status": "BLOCKED_AWAITING_CREDENTIALS"}'
FROM ai_agents a WHERE a.code = 'AGENT_ADMISSIONS'
ON CONFLICT (channel_type) DO NOTHING;

INSERT INTO ai_channel_configs (channel_type, agent_id, is_active, config_json)
SELECT 'VOICE', a.id, TRUE, '{"stt_engine": "WEB_SPEECH_API", "tts_engine": "WEB_SPEECH_SYNTHESIS", "language": "vi-VN", "enable_avatar_preview": true}'
FROM ai_agents a WHERE a.code = 'AGENT_ADMISSIONS'
ON CONFLICT (channel_type) DO NOTHING;
