# BÁO CÁO KIỂM TOÁN HỆ THỐNG THÔNG BÁO VÀ BỘ ĐẾM CHƯA ĐỌC (UNREAD NOTIFICATION AUDIT)

## 1. CÁC VẤN ĐỀ ĐÃ XÁC ĐỊNH

1. **Rò rỉ thông báo nghiệp vụ sang Học viên:**
   - Học viên khi đăng nhập nhận được hàng loạt thông báo "Đề thi mới chờ duyệt: ...".
   - Nguyên nhân: `ExamService.java` khi gửi thông báo duyệt đề đã gán `targetAudience("ALL")`. Do truy vấn lấy thông báo học viên bao gồm `targetAudience IN ('ALL', 'STUDENTS')`, học viên vô tình nhận được thông báo kiểm duyệt đề thi dành riêng cho Quản trị viên/Giảng viên.
2. **Bộ đếm thông báo không giảm khi click xem:**
   - Trong giao diện, khi click vào xem văn bản chi tiết qua `NotificationDetailModal`, số lượng thông báo chưa đọc trên quả chuông và trên thanh tab không tự động trừ đi, gây khó chịu cho người dùng.
3. **Cắt xén giao diện Modal khi mở (Layout Shift / Top Clipping):**
   - Modal hiển thị thông báo chi tiết và cài đặt thông báo bị đẩy lên sát mép trên màn hình, thanh tiêu đề và nút đóng bị cắt mất trên các màn hình có chiều cao hạn chế.

---

## 2. GIẢI PHÁP VÀ KẾT QUẢ ĐÃ THỰC HIỆN

### 2.1. Sửa đổi Target Audience & Dọn dẹp dữ liệu tồn đọng
- Trong `ExamService.java:300`: Đổi `targetAudience` từ `"ALL"` thành `"TEACHERS"`.
- Viết migration Flyway `V25__Fix_Exam_Notification_Audience_And_Chat_Sync.sql`:
  ```sql
  UPDATE notifications
  SET target_audience = 'TEACHERS'
  WHERE title LIKE 'Đề thi mới chờ duyệt%' AND target_audience = 'ALL';
  ```
- **Kết quả:** Kiểm tra thực tế trong Database xác nhận 11 thông báo duyệt đề thi đã được cập nhật sang `'TEACHERS'`. Cổng học viên không còn xuất hiện các thông báo này.

### 2.2. Đồng bộ Bộ đếm Unread Tức thì (Instant Badge Sync)
- Trong `NotificationBell.tsx`, `StudentPortalPage.tsx`, `TeacherPortalPage.tsx`, `AdminLayout.tsx`:
  - Khi xem chi tiết một thông báo:
    ```typescript
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    ```
  - Cập nhật số unread tức thời mà không cần chờ API phản hồi.
  - Khi bấm "Đọc hết" (`handleMarkAllAsRead`), toàn bộ danh sách local được gán `isRead: true` đồng thời gọi `notificationsApi.markAllAsRead(unreadIds)`.

### 2.3. Khắc phục Lỗi Cắt xén Giao diện Modal
- Thay thế toàn bộ cấu trúc Flexbox lỗi:
  - Cũ: `<div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">`
  - Mới: `<div className="flex min-h-full items-start justify-center p-3 sm:p-6 text-center">` kết hợp `my-auto max-h-[calc(100vh-3rem)]` trên hộp thoại.
- Giúp modal luôn nằm hoàn toàn bên trong viewport trình duyệt, không bao giờ bị tràn lên trên mép trên màn hình.
