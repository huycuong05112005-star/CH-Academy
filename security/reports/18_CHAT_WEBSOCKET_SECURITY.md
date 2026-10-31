# 18. CHAT & WEBSOCKET SECURITY Security Report

## Status: PASS (ĐÃ PHÂN LUỒNG TRIỆT ĐỂ & BẢO VỆ STOMP ENDPOINTS)

## Findings
Hệ thống tin nhắn hỗ trợ cả REST API và WebSocket STOMP:
1. **Kiểm soát kết nối WebSocket (`/ws`):**
   - Bắt buộc kiểm tra JWT Token khi bắt tay kết nối STOMP.
2. **Kiểm soát đăng ký kênh (Subscription Authorization):**
   - Kênh nhóm lớp: `/topic/class.{classId}`.
   - Học viên chỉ được phép subscribe vào kênh của lớp mà mình đã ghi danh.
   - Giảng viên chỉ được phép subscribe vào lớp được phân công.
   - Admin có quyền giám sát toàn bộ các phòng chat lớp học.
3. **Phân luồng 3 Cổng và Widget Chat:**
   - Trang chủ công khai (`PublicChatWidget.tsx`): Chỉ có AI Tư vấn Tuyển sinh và Form thu thập Lead. Tuyệt đối không xuất hiện chat nhóm lớp.
   - Cổng Học viên (`StudentChatWidget.tsx`): AI Gia sư và danh sách nhóm lớp đã học.
   - Cổng Giảng viên (`TeacherChatWidget.tsx`): AI Trợ giảng và danh sách nhóm lớp phụ trách.
   - Cổng Quản trị (`AdminChatWidget.tsx`): AI Vận hành và Giám sát toàn bộ nhóm chat.

## What's at risk
- Học viên nghe lén tin nhắn của các lớp khác hoặc người lạ chưa đăng nhập tham gia vào kênh trao đổi nội bộ của lớp học.

## What's already secure
- Cơ chế xác thực tại tầng kết nối và tầng phân quyền nghiệp vụ trong `ClassChatService.java`.

## Recommendations
- Duy trì việc kiểm tra quyền thành viên phòng chat ở cả 3 hành động: CONNECT, SUBSCRIBE và SEND MESSAGE.

## Remediation Implemented
- Tách biệt hoàn toàn 4 widget chat độc lập theo đúng nguyên tắc phân luồng cổng.

## Verification Results
- Kiểm thử thực tế xác nhận học viên chỉ nhìn thấy và truy cập được vào các nhóm lớp mà mình đã tham gia.
