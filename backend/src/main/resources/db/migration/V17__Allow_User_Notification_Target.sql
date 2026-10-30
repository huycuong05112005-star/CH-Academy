-- Allow USER in notifications target_audience
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_target_audience;
ALTER TABLE notifications ADD CONSTRAINT chk_target_audience CHECK (target_audience IN ('ALL', 'TEACHERS', 'STUDENTS', 'CLASS', 'USER'));
