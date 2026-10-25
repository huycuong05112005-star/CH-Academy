-- =============================================================================
-- Migration V11: Khôi phục chuỗi ký tự tiếng Việt chuẩn UTF-8
-- Sửa lỗi hiển thị '???' do locale mặc định hệ điều hành khi chạy seed dữ liệu V9
-- =============================================================================

-- 1. Sửa họ tên giáo viên trong bảng users
UPDATE users 
SET full_name = 'Nguyễn Thị Minh Hạnh' 
WHERE username = 'gv.minhhanh';

UPDATE users 
SET full_name = 'Lê Hoàng Nam' 
WHERE username = 'gv.hoangnam';

-- 2. Sửa chủ đề các buổi học trong bảng class_sessions
UPDATE class_sessions 
SET topic = 'Buổi 01: Giới thiệu khóa học & Kỹ thuật viết Business Email chuẩn quốc tế' 
WHERE id = 2;

UPDATE class_sessions 
SET topic = 'Buổi 02: Kỹ năng thuyết trình dự án & báo cáo số liệu trước ban giám đốc' 
WHERE id = 3;

UPDATE class_sessions 
SET topic = 'Buổi 03: Kỹ năng đàm phán hợp đồng & thương lượng với đối tác nước ngoài' 
WHERE id = 4;

-- 3. Sửa tiêu đề và mô tả tài liệu bài giảng trong bảng session_materials
UPDATE session_materials 
SET 
    title = 'Slide Bài Giảng: Kỹ thuật viết Business Email & 50 Cấu trúc kinh điển',
    description = 'Bộ slide định dạng PDF tổng hợp các mẫu thư gửi đối tác, xin ý kiến sếp và phản hồi khiếu nại.'
WHERE id = 1;

UPDATE session_materials 
SET 
    title = 'Bài tập về nhà Buổi 1: Soạn thảo Email mời thầu quốc tế',
    description = 'Học viên hoàn thành bài tập theo biểu mẫu đính kèm và nộp trước 20h buổi học tiếp theo.'
WHERE id = 2;

UPDATE session_materials 
SET 
    title = 'Tài liệu chuẩn bị Buổi 2: Bộ từ vựng Pitching & Cấu trúc bài thuyết trình đỉnh cao',
    description = 'Tài liệu đọc trước (Pre-reading) chuẩn bị cho buổi thực hành thuyết trình trực tiếp tại lớp.'
WHERE id = 3;

-- 4. Sửa tiêu đề và nội dung thông báo trong bảng notifications
UPDATE notifications 
SET 
    title = 'Lớp CLS-ENG-PRO01: Tài liệu bài học số 2 đã được cập nhật',
    content = 'Thầy Lê Hoàng Nam đã tải lên tài liệu đọc trước (Pre-reading) cho Buổi 2 về kỹ năng Pitching thuyết trình. Đề nghị các bạn học viên tải về chuẩn bị kỹ trước giờ học.'
WHERE id = 2;

UPDATE notifications 
SET 
    title = 'Lịch kiểm tra phản xạ giao tiếp giữa kỳ',
    content = 'Lớp CLS-ENG-PRO01 sẽ có buổi phỏng vấn 1-1 với giáo viên bản ngữ vào cuối tuần tới.'
WHERE id = 3;
