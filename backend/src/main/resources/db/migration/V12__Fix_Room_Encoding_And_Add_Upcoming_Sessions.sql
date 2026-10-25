-- V12: Chuẩn hóa tên phòng học UTF-8 và bổ sung các buổi học sắp diễn ra
UPDATE class_sessions
SET room = 'Phòng Executive 302'
WHERE room LIKE 'Ph%ng Executive 302' OR room LIKE 'Ph??ng%';

-- Bổ sung các buổi học trong 7-10 ngày tới cho Lớp 1 (Tiếng Anh Trẻ Em K01 - Tối 2-4-6)
INSERT INTO class_sessions (class_id, teacher_id, session_date, start_time, end_time, room, topic, status, created_at, updated_at)
VALUES
(1, 1, '2026-10-26', '18:00:00', '19:30:00', 'Phòng 201', 'Buổi 02: Từ vựng thế giới động vật & Thực hành phát âm chuẩn', 'SCHEDULED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 1, '2026-10-28', '18:00:00', '19:30:00', 'Phòng 201', 'Buổi 03: Giao tiếp qua trò chơi tương tác & Kể chuyện tiếng Anh', 'SCHEDULED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 1, '2026-10-30', '18:00:00', '19:30:00', 'Phòng 201', 'Buổi 04: Ôn tập nhóm & Thuyết trình tranh vẽ sáng tạo', 'SCHEDULED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 1, '2026-11-02', '18:00:00', '19:30:00', 'Phòng 201', 'Buổi 05: Chủ đề Gia đình & Bạn bè thân thiết', 'SCHEDULED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Bổ sung các buổi học tiếp theo cho Lớp 2 (Giao Tiếp Công Sở Chuyên Sâu C01 - Tối 3-5-CN)
INSERT INTO class_sessions (class_id, teacher_id, session_date, start_time, end_time, room, topic, status, created_at, updated_at)
VALUES
(2, 2, '2026-10-29', '19:30:00', '21:00:00', 'Phòng Executive 302', 'Buổi 04: Xử lý tình huống khủng hoảng truyền thông nội bộ', 'SCHEDULED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 2, '2026-11-01', '19:30:00', '21:00:00', 'Phòng Executive 302', 'Buổi 05: Kỹ năng Networking và thiết lập quan hệ đối tác chiến lược', 'SCHEDULED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
