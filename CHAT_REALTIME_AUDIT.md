# BÁO CÁO KIỂM TOÁN HỆ THỐNG TIN NHẮN THỜI GIAN THỰC (CHAT REALTIME AUDIT)

## 1. MỤC TIÊU & HIỆN TRẠNG TRƯỚC KIỂM TOÁN

Trước khi khắc phục:
1. Tin nhắn gửi đi đôi khi bị lặp lại khi mạng chập chờn do thiếu `client_msg_id`.
2. Tài khoản Quản trị khi đăng nhập thấy danh sách nhóm lớp nhưng số lượng tin nhắn chưa đọc hiển thị toàn bộ lịch sử (hàng trăm tin) do chưa có record trong `chat_members`.
3. Khi người dùng click vào một cuộc trò chuyện, số tin nhắn chưa đọc trên thanh tab và widget nổi không giảm ngay lập tức, người dùng phải F5 tải lại trang.

---

## 2. NGUYÊN NHÂN GỐC RỄ & BIỆN PHÁP KHẮC PHỤC

### 2.1. Idempotent Message Ingestion
- **Giải pháp:**
  - Bổ sung trường `client_msg_id VARCHAR(100)` và index `idx_chat_messages_client_id` vào bảng `chat_messages` (Flyway migration `V25`).
  - Trong `ClassChatService.java:sendMessage`: Kiểm tra nếu `client_msg_id` đã tồn tại trong cuộc trò chuyện, hệ thống trả về ngay bản ghi hiện có thay vì ghi đè hoặc nhân bản tin nhắn.

### 2.2. Xử lý Trạng thái Unread Count cho Quản trị viên
- **Phân tích:** Quản trị viên có đặc quyền giám sát tất cả nhóm lớp (`isAdmin = true`), nhưng không phải thành viên học vụ chính thức của từng lớp.
- **Giải pháp:**
  - Trong `getUserConversations`: Khi `myMember.isEmpty()`, đối với Admin hệ thống mặc định gán `unreadCount = 0` thay vì tính toàn bộ lịch sử.
  - Khi Admin chủ động click vào xem chi tiết cuộc hội thoại (`markAsRead`), backend tự động khởi tạo bản ghi `ChatMember` với `role = 'ADMIN'`, thiết lập `lastReadMessageId` bằng ID tin nhắn mới nhất và cập nhật `lastReadAt = CURRENT_TIMESTAMP`.

### 2.3. Optimistic UI & Local State Synchronization
- **Giải pháp Frontend:**
  - Khi click vào cuộc trò chuyện, `FloatingChatWidget` lập tức cập nhật state:
    ```typescript
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c))
    ```
  - Đồng thời phát sự kiện nội bộ `window.dispatchEvent(new CustomEvent('ch-chat-unread-updated', ...))` giúp các component xung quanh đồng bộ số lượng unread tức thì.

