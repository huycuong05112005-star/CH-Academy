# BÁO CÁO NÂNG CẤP & TÁI CẤU TRÚC NỀN TẢNG AI AGENT (AI PLATFORM REFACTOR REPORT)

## 1. TỔNG QUAN

Đợt nâng cấp này chuẩn hóa phân hệ AI trong CH Academy thành một nền tảng Agent đa mục đích (Multi-Agent Ecosystem), cho phép trung tâm đào tạo cấu hình, kiểm thử, huấn luyện tri thức RAG và triển khai các Agent độc lập cho từng cổng dịch vụ.

---

## 2. CÁC HẠNG MỤC HOÀN THÀNH

### 2.1. Phân quyền Quản trị AI Studio (Khắc phục lỗi 403 Forbidden)
- **Vấn đề ban đầu:** Khi tạo hoặc lưu cấu hình Agent mới trong AI Agent Studio, trình duyệt báo "Bạn không có quyền thực hiện thao tác này".
- **Nguyên nhân:** Bảng phân quyền trong cơ sở dữ liệu chưa cấp quyền `ai:manage`, `ai:read`, `ai:use` cho vai trò `SUPER_ADMIN` và `CENTER_ADMIN`.
- **Giải pháp:** Flyway migration `V24` đã cập nhật đầy đủ các quyền này vào bảng `role_permissions` và `permissions`. Controller `AiStudioAdminController.java` đã cấu hình bảo vệ bằng `@PreAuthorize("hasAuthority('ai:manage') or hasRole('SUPER_ADMIN')")`.

### 2.2. Phân tách Danh tính & Lịch sử Hội thoại theo Cổng (Identity Isolation)
- **Vấn đề ban đầu:** Khi Giảng viên chat với AI rồi chuyển sang cổng Admin, cuộc trò chuyện cũ của Giảng viên vẫn hiển thị.
- **Giải pháp:**
  - `AiConversation` lưu kèm bộ 3 định danh: `user_id`, `portal`, `agent_code`.
  - API `GET /api/v1/chat/ai/conversations?portal=...` chỉ trả về hội thoại thuộc đúng user và cổng đang truy cập.
  - FloatingChatWidget tự động phát hiện chuyển đổi route (`/admin`, `/teacher`, `/student`, `/`) để reset lịch sử và tải Agent tương ứng.

### 2.3. Tự động Đồng bộ Khách hàng Tiềm năng (CRM Lead Ingestion)
- Khi khách vãng lai hoặc học viên trò chuyện với Tư vấn viên AI trên Website hoặc Cổng công khai và cung cấp số điện thoại/email, hệ thống tự động bóc tách thông tin và khởi tạo Lead mới trong bảng `leads` với `lead_source = 'AI_CHAT_BOX'`.
