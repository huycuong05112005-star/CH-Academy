-- ==============================================================================
-- Flyway Migration V5: Create Leads and Lead Activities
-- ==============================================================================

-- 1. Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id BIGSERIAL PRIMARY KEY,
    lead_code VARCHAR(30) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    source VARCHAR(50) NOT NULL DEFAULT 'WEBSITE',
    target_course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
    assigned_staff_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    notes TEXT,
    converted_student_id BIGINT UNIQUE REFERENCES students(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_lead_status CHECK (status IN ('NEW', 'CONTACTED', 'CONSULTING', 'APPOINTMENT', 'CONVERTED', 'LOST')),
    CONSTRAINT chk_lead_source CHECK (source IN ('WEBSITE', 'FACEBOOK', 'REFERRAL', 'WALK_IN', 'HOTLINE', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_staff_id);

-- 2. Lead Activities Table
CREATE TABLE IF NOT EXISTS lead_activities (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    staff_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    activity_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_activity_type CHECK (action_type IN ('CALL', 'MESSAGE', 'MEETING', 'NOTE', 'STATUS_CHANGE'))
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);

-- 3. Seed Initial Leads & Activities
INSERT INTO leads (lead_code, full_name, phone, email, source, target_course_id, status, notes)
SELECT
    'LEAD20240001',
    'Hoàng Minh Tuấn',
    '0909112233',
    'tuan.hoang@gmail.com',
    'WEBSITE',
    c.id,
    'NEW',
    'Khách quan tâm khóa giao tiếp công sở buổi tối'
FROM courses c WHERE c.code = 'ENG-COMM-PRO'
ON CONFLICT (lead_code) DO NOTHING;

INSERT INTO leads (lead_code, full_name, phone, email, source, target_course_id, status, notes)
SELECT
    'LEAD20240002',
    'Phạm Thu Hà',
    '0933445566',
    'ha.pham@gmail.com',
    'FACEBOOK',
    c.id,
    'CONSULTING',
    'Phụ huynh tìm hiểu cho con 7 tuổi học Starter Kids'
FROM courses c WHERE c.code = 'ENG-KID-01'
ON CONFLICT (lead_code) DO NOTHING;

INSERT INTO lead_activities (lead_id, action_type, content)
SELECT
    l.id,
    'CALL',
    'Đã gọi điện tư vấn lộ trình và giới thiệu ưu đãi học phí tháng này'
FROM leads l WHERE l.lead_code = 'LEAD20240002';
