# BÁO CÁO TÍCH HỢP KÊNH ZALO OFFICIAL ACCOUNT (OA) — CH ACADEMY

**Dự án:** CH Academy  
**Công nghệ:** Spring Boot REST Controller + Zalo Official Account Open API  
**Trạng thái tích hợp:** `HOÀN THÀNH KIẾN TRÚC & WEBHOOK CONTROLLER — SẴN SÀNG KẾT NỐI (BLOCKED: CHỜ CẤP THÔNG TIN OA SECRET)`

---

## 1. NGUYÊN TẮC TÍCH HỢP CHÍNH THỨC VÀ BẢO MẬT

CH Academy **tuyệt đối không sử dụng các giải pháp tự động hóa tài khoản cá nhân trái phép** (quét mã QR cá nhân hoặc giả lập giao thức không chính thống). Toàn bộ kiến trúc Zalo được thiết kế tuân thủ nghiêm ngặt chuẩn **Zalo for Developers / Zalo Official Account Open API**:

* **Xác thực Webhook:** Thông qua URL Verification Challenge và chữ ký điện tử `X-Zalo-Signature` (HMAC-SHA256).
* **Quản lý Token:** Access Token và Refresh Token được lưu trữ bảo mật trong cơ sở dữ liệu `ai_channel_configs`, không lưu trên client hay file cấu hình công khai.
* **Quyền riêng tư:** Chỉ nhận và xử lý các tin nhắn mà người dùng Zalo chủ động gửi tới OA của trung tâm (`user_send_text`).

---

## 2. KIẾN TRÚC WEBHOOK CONTROLLER ĐÃ TRIỂN KHAI

Hệ thống đã triển khai sẵn Controller tại:
[`ZaloWebhookController.java`](file:///e:/CA_NHAN/CH_Academy/backend/src/main/java/vn/chacademy/chat/controller/ZaloWebhookController.java)

### 2.1. Xác thực Webhook (GET `/api/v1/webhooks/zalo`)
* Tiếp nhận tham số `challenge` hoặc `hub.challenge` từ hệ thống Zalo Developer Portal khi đăng ký webhook.
* Phản hồi lại mã xác thực để kích hoạt kết nối URL hợp lệ.

### 2.2. Xử lý Sự kiện tin nhắn người dùng (POST `/api/v1/webhooks/zalo`)
* Tiếp nhận sự kiện `event_name = 'user_send_text'` từ Zalo.
* Trích xuất nội dung tin nhắn (`text`) và định danh người dùng Zalo (`sender_id`).
* Khởi tạo yêu cầu chuyển tiếp sang AI Runtime của CH Academy:
  * `portal = 'PUBLIC'`
  * `channel = 'ZALO'`
  * `agentCode = 'AGENT_ADMISSIONS'`
  * `sessionId = 'ZALO_' + senderId`
* AI Runtime thực hiện tra cứu tri thức trong `KB_ADMISSIONS` và phản hồi câu trả lời chuẩn xác.

---

## 3. CHECKLIST KẾT NỐI KHI CÓ THÔNG TIN XÁC THỰC THỰC TẾ

Hiện tại, do chưa có tài khoản Zalo OA doanh nghiệp chính thức của khách hàng, bước kết nối live được đánh dấu là **`BLOCKED (AWAITING CREDENTIALS)`**.

Khi người dùng cung cấp thông tin OA, các bước kích hoạt diễn ra như sau:
1. Đăng nhập trang Quản trị CH Academy $\longrightarrow$ Truy cập **AI Agent Studio** $\longrightarrow$ Chọn tab **Kênh kết nối**.
2. Tại thẻ **Zalo Official Account**, điền các thông tin:
   * **OA ID** (ID của Zalo Official Account được cấp).
   * **App ID & Secret Key** (Ứng dụng trên Zalo Developers).
   * **Webhook Verify Token**.
3. Bật công tắc kích hoạt kênh sang `ACTIVE`.
4. Trên Zalo Developer Portal, nhập Webhook URL: `https://chacademy.vn/api/v1/webhooks/zalo`.
5. Hệ thống hoàn tất kết nối và sẵn sàng tự động trả lời tin nhắn của phụ huynh, học viên trên Zalo 24/7.

