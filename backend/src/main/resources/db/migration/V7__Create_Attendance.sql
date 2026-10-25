-- ==============================================================================
-- Flyway Migration V7: Create Attendance Records
-- ==============================================================================

CREATE TABLE IF NOT EXISTS attendance_records (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    note TEXT,
    recorded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_attendance_status CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
    CONSTRAINT uq_session_student UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);

-- Seed a sample session for CLS-ENG-KID01 if not present
INSERT INTO class_sessions (class_id, teacher_id, session_date, start_time, end_time, room, topic, status)
SELECT
    cls.id,
    cls.primary_teacher_id,
    CURRENT_DATE,
    '18:00:00',
    '19:30:00',
    'Phòng 201',
    'Buổi 01: Giới thiệu khóa học & Kiểm tra phản xạ từ vựng',
    'SCHEDULED'
FROM classes cls WHERE cls.code = 'CLS-ENG-KID01'
LIMIT 1;

-- Seed attendance for student HV20240001
INSERT INTO attendance_records (session_id, student_id, status, note, recorded_by)
SELECT
    cs.id,
    s.id,
    'PRESENT',
    'Học viên đi đúng giờ, phát âm tốt',
    u.id
FROM class_sessions cs
JOIN classes c ON c.id = cs.class_id
JOIN students s ON s.student_code = 'HV20240001'
LEFT JOIN users u ON u.username = 'admin'
WHERE c.code = 'CLS-ENG-KID01'
LIMIT 1
ON CONFLICT (session_id, student_id) DO NOTHING;
