-- V32: Bổ sung lịch học chi tiết cho các lớp đang hoạt động trong năm học 2026-2027
-- Đảm bảo Cổng Quản trị (Dashboard) luôn có dữ liệu lịch học thực tế hiển thị đầy đủ

-- Lớp 1: Tiếng Anh Trẻ Em K01 (CLS-ENG-KID01) - Tối Thứ 2, Thứ 4, Thứ 6 (18:00 - 19:30)
INSERT INTO class_sessions (class_id, teacher_id, session_date, start_time, end_time, room, topic, status, created_at, updated_at)
SELECT 
    c.id, 
    c.primary_teacher_id, 
    v.s_date, 
    '18:00:00'::TIME, 
    '19:30:00'::TIME, 
    COALESCE(c.room, 'Phòng 201'), 
    v.topic, 
    'SCHEDULED', 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
FROM classes c
CROSS JOIN (
    VALUES 
        ('2026-11-23'::DATE, 'Buổi 06: Giao tiếp chủ đề Trường học & Dụng cụ học tập'),
        ('2026-11-25'::DATE, 'Buổi 07: Kỹ năng nghe hiểu qua bài hát thiếu nhi & Trò chơi vận động'),
        ('2026-11-27'::DATE, 'Buổi 08: Đóng kịch tương tác & Phát triển phản xạ đàm thoại'),
        ('2026-11-30'::DATE, 'Buổi 09: Khám phá thế giới tự nhiên & Động vật hoang dã qua tiếng Anh'),
        ('2026-12-02'::DATE, 'Buổi 10: Ôn tập giữa kỳ & Thử thách tranh tài nhóm'),
        ('2026-12-04'::DATE, 'Buổi 11: Đọc hiểu truyện tranh & Thuyết trình tranh vẽ ngắn'),
        ('2026-12-07'::DATE, 'Buổi 12: Kỹ năng làm việc nhóm & Dự án tranh vẽ sáng tạo'),
        ('2026-12-09'::DATE, 'Buổi 13: Giao tiếp chủ đề Thời tiết, Trang phục & Bốn mùa'),
        ('2026-12-11'::DATE, 'Buổi 14: Thực hành giao tiếp tiếng Anh với tình nguyện viên quốc tế'),
        ('2026-12-14'::DATE, 'Buổi 15: Kiểm tra định kỳ kỹ năng Nghe - Nói & Đánh giá năng lực')
) AS v(s_date, topic)
WHERE c.code = 'CLS-ENG-KID01'
  AND NOT EXISTS (
      SELECT 1 FROM class_sessions cs 
      WHERE cs.class_id = c.id AND cs.session_date = v.s_date
  );

-- Lớp 2: Giao Tiếp Công Sở Chuyên Sâu C01 (CLS-ENG-PRO01) - Tối Thứ 3, Thứ 5, Thứ 7 (19:30 - 21:00)
INSERT INTO class_sessions (class_id, teacher_id, session_date, start_time, end_time, room, topic, status, created_at, updated_at)
SELECT 
    c.id, 
    c.primary_teacher_id, 
    v.s_date, 
    '19:30:00'::TIME, 
    '21:00:00'::TIME, 
    COALESCE(c.room, 'Phòng Executive 302'), 
    v.topic, 
    'SCHEDULED', 
    CURRENT_TIMESTAMP, 
    CURRENT_TIMESTAMP
FROM classes c
CROSS JOIN (
    VALUES 
        ('2026-11-24'::DATE, 'Buổi 06: Kỹ năng điều phối cuộc họp trực tuyến quốc tế chuyên nghiệp'),
        ('2026-11-26'::DATE, 'Buổi 07: Soạn thảo văn bản, Biên bản họp & Báo cáo điều hành'),
        ('2026-11-28'::DATE, 'Buổi 08: Kỹ thuật đàm phán hợp đồng thương mại & Quản lý bất đồng'),
        ('2026-12-01'::DATE, 'Buổi 09: Quản trị xung đột đa văn hóa trong môi trường tập đoàn'),
        ('2026-12-03'::DATE, 'Buổi 10: Pitching ý tưởng kinh doanh & Thuyết phục khách hàng khó tính'),
        ('2026-12-05'::DATE, 'Buổi 11: Mô phỏng hội nghị bàn tròn cấp cao với đối tác chiến lược'),
        ('2026-12-08'::DATE, 'Buổi 12: Đánh giá năng lực giao tiếp kinh doanh & Phỏng vấn mô phỏng')
) AS v(s_date, topic)
WHERE c.code = 'CLS-ENG-PRO01'
  AND NOT EXISTS (
      SELECT 1 FROM class_sessions cs 
      WHERE cs.class_id = c.id AND cs.session_date = v.s_date
  );
