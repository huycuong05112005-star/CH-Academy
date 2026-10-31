# BÁO CÁO KIỂM TOÁN TÍCH HỢP ZALO OFFICIAL ACCOUNT (OA) & WEBHOOK CONTROLLER
**Dự án:** CH Academy  
**Cơ chế:** Webhook 2 chiều (Inbound & Outbound Messaging)  
**Ngày thực hiện:** 31/10/2026  

---

## 1. THỰC TRẠNG VÀ PHÂN TÍCH LỖI
Trước khi khắc phục:
- Giao diện hiển thị card màu vàng *"Zalo Official Account (OA) - CHỜ THÔNG TIN OA (BLOCKED)"*.
- Người dùng không có nút bấm hay form để nhập thông tin OA ID, App ID hoặc Secret Key.
- Thiếu giải thuật kiểm tra chữ ký xác thực (`X-Zalo-Signature`), dẫn đến nguy cơ request giả mạo (Spoofing) nếu để public.

---

## 2. KIẾN TRÚC TÍCH HỢP ĐÃ HOÀN THIỆN

### 2.1. Backend Controller & Webhook Endpoint
- **URL Webhook:** `/api/v1/webhooks/zalo`
- **Xác thực Challenge:** Phương thức `GET /api/v1/webhooks/zalo?challenge=...` phản hồi ngay lập tức mã challenge để vượt qua bài kiểm tra xác thực của Zalo Developers.
- **Xác thực Chữ ký HMAC-SHA256:** Phương thức `POST /api/v1/webhooks/zalo` kiểm tra header `X-Zalo-Signature` và `X-Zalo-Timestamp` với `webhookSecret` bằng thuật toán SHA-256 mã hóa UTF-8.
- **Xử lý sự kiện tin nhắn:** Khi Zalo gửi sự kiện `user_send_text`:
  1. Trích xuất `senderId` và nội dung văn bản `text`.
  2. Tạo yêu cầu `AiChatRequest` với kênh `ZALO`, gán tự động cho `AGENT_ADMISSIONS` (Tư vấn tuyển sinh).
  3. LLM xử lý truy vấn kết hợp Kho tri thức tuyển sinh và lưu lịch sử vào hội thoại kênh ZALO.

### 2.2. Giao diện Cấu hình Quản trị (Admin UI)
- Bổ sung nút **"Cấu hình & Kết nối Zalo OA"** trên thẻ kênh kết nối.
- Modal cấu hình đầy đủ:
  - **Zalo OA ID & App ID.**
  - **Zalo Secret Key** (có nút bật/tắt hiển thị mật khẩu an toàn).
  - **Webhook URL** chuẩn với nút **Sao chép vào Clipboard**.
  - **Bộ chọn AI Agent** tiếp nhận tin nhắn từ Zalo.
  - **Công cụ Kiểm tra kết nối (Test Webhook Ping):** Cho phép Quản trị viên gửi request giả lập kiểm tra endpoint ngay lập tức mà không cần chờ Zalo.
  - Cảnh báo rõ ràng các trường thông tin còn thiếu kèm hướng dẫn cấu hình chi tiết tại `developers.zalo.me`.

