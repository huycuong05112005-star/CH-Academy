# BÁO CÁO KHẮC PHỤC TRIỆT ĐỂ LỖI NHẬN DIỆN VÀ PHÂN TÁCH LỊCH SỬ CHAT AI

**Dự án:** CH Academy  
**Mục tiêu:** Xử lý dứt điểm hiện tượng dùng chung hoặc rò rỉ lịch sử hội thoại khi chuyển đổi giữa các tài khoản hoặc chuyển đổi giữa các cổng (`TEACHER` $\longleftrightarrow$ `ADMIN` $\longleftrightarrow$ `STUDENT` $\longleftrightarrow$ `PUBLIC`).

---

## 1. PHÂN TÍCH HIỆN TƯỢNG VÀ NGUYÊN NHÂN GỐC

### 1.1. Hiện tượng người dùng phản ánh
Người dùng mở Chat AI ở cổng Giảng viên và đặt câu hỏi. Sau đó chuyển sang cổng Admin, widget Chat AI vẫn hiển thị cuộc trò chuyện cũ của Giảng viên.

### 1.2. Nguyên nhân gốc rễ (Root Causes)

| Thành phần | Lỗi kỹ thuật gốc | Hậu quả |
| :--- | :--- | :--- |
| **Frontend Component Lifecycle** | Component `FloatingChatWidget` được mount một lần duy nhất tại cấp cao nhất trong `App.tsx`. Khi người dùng điều hướng qua lại giữa các route (`/teacher/*` $\longleftrightarrow$ `/admin/*`), component này **không unmount**. | State cục bộ `aiTurns` và `aiConvId` không bao giờ bị xóa, lưu giữ nguyên vẹn nội dung chat của trang trước đó trên màn hình. |
| **Thiếu Cột Phân vùng CSDL** | Bảng `ai_conversations` trong phiên bản cũ chỉ có cột `user_id` và `role`, **không có cột `portal`**. | Mọi hội thoại của cùng một người dùng bị gộp chung vào một danh sách, không thể lọc riêng theo cổng truy cập. |
| **Truy vấn Backend không lọc theo Cổng** | Phương thức `getUserConversations(User user)` chỉ gọi `findByUserIdOrderByUpdatedAtDesc(user.getId())`. | Backend trả về tất cả các cuộc trò chuyện của tài khoản bất kể tài khoản đang mở trang nào. |
| **Thiếu Authorization Kiểm tra Cổng** | API `POST /api/v1/chat/ai/ask` chấp nhận `conversationId` nếu `conv.user.id == user.id`, không kiểm tra hội thoại đó được tạo ở cổng nào. | Người dùng tiếp tục gửi tin nhắn vào cuộc hội thoại của Giảng viên ngay cả khi đang đứng ở giao diện Admin. |

---

## 2. GIẢI PHÁP ĐÃ TRIỂN KHAI VÀ XÁC MINH

### 2.1. Cập nhật Cơ sở dữ liệu (`V23__Create_Ai_Agent_Ecosystem_Schema.sql`)
1. Bổ sung các cột phân vùng vào `ai_conversations`:
   * `portal VARCHAR(50) NOT NULL DEFAULT 'STUDENT'`
   * `channel VARCHAR(50) NOT NULL DEFAULT 'PORTAL'`
   * `agent_code VARCHAR(100) DEFAULT 'AGENT_STUDENT_TUTOR'`
   * `session_id VARCHAR(100)` (Dành cho khách vãng lai khi `user_id` là null)
2. Thiết lập Composite Indexes:
   * `CREATE INDEX idx_ai_conversations_user_portal ON ai_conversations(user_id, portal, updated_at DESC);`
   * `CREATE INDEX idx_ai_conversations_session_portal ON ai_conversations(session_id, portal, updated_at DESC);`

### 2.2. Kiểm soát Quyền truy cập chặt chẽ tại Backend (`GenAiChatService.java`)
* Khi nhận request từ client, backend thực hiện chuẩn hóa và kiểm tra quyền (`normalizeAndValidatePortal`):
  * Nếu client yêu cầu `portal = 'ADMIN'` nhưng tài khoản không có quyền `ROLE_ADMIN` hoặc `ROLE_SUPER_ADMIN` $\longrightarrow$ **Từ chối ngay lập tức với HTTP 403 Forbidden**.
  * Nếu client yêu cầu `portal = 'TEACHER'` nhưng tài khoản không có quyền `ROLE_TEACHER` hoặc `ROLE_ADMIN` $\longrightarrow$ **Từ chối với HTTP 403 Forbidden**.
* Mọi câu truy vấn danh sách hội thoại và chi tiết tin nhắn đều bắt buộc phải kèm theo tham số `portal`:
  * `findByIdAndUserIdAndPortal(conversationId, user.getId(), portal)`
  * Ngăn chặn tuyệt đối việc sử dụng `conversationId` của cổng này tại cổng khác.

### 2.3. Làm sạch State tức thì tại Frontend (`FloatingChatWidget.tsx`)
* Theo dõi biến động của cả `user?.id` và `currentPortal` (suy ra từ `useLocation().pathname`):
```tsx
useEffect(() => {
  // Xóa sạch lịch sử hiển thị và ID hội thoại cũ ngay khi đổi người dùng hoặc đổi cổng
  setAiTurns([])
  setAiConvId(undefined)
  setAiInput('')
  setHandoffStatus(null)
  loadAiConversations()
}, [user?.id, currentPortal])
```
* Hiển thị tiêu đề và huy hiệu nhận diện rõ ràng cho từng cổng:
  * Admin: *"Trợ lý Quản trị & Vận hành"* • Huy hiệu *Quản trị viên*
  * Giảng viên: *"Trợ lý Giảng dạy & Soạn bài"* • Huy hiệu *Giảng viên*
  * Học viên: *"Trợ giảng AI Đồng hành"* • Huy hiệu *Học viên*
  * Khách web: *"Chuyên viên Tư vấn Tuyển sinh AI"* • Huy hiệu *Tư vấn Tuyển sinh*

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ

1. **Kiểm thử đa tài khoản & đa cổng**:
   * Học viên `thuylinh.nguyen@gmail.com` đăng nhập cổng Học viên: Tạo hội thoại thành công với `AGENT_STUDENT_TUTOR`.
   * Thầy giáo `gv.hoangnam` đăng nhập cổng Giảng viên: Tạo hội thoại độc lập với `AGENT_TEACHER_ASSISTANT`.
   * Quản trị viên `admin` đăng nhập cổng Admin: Tạo hội thoại độc lập với `AGENT_ADMIN_ASSISTANT`.
2. **Kiểm thử bảo mật chéo cổng (Cross-Portal Breach)**:
   * Học viên gửi request giả lập `portal = 'ADMIN'`: Backend trả về `403 Forbidden - Tài khoản của bạn không có quyền truy cập không gian hội thoại Admin` (**SECURITY PASS**).
   * Học viên thử đọc trộm `conversationId` của Admin: Backend trả về `403 Forbidden / Access Denied` (**SECURITY PASS**).
3. **Kiểm thử tự động Vitest**: Suite `AiStudioAndIdentityIsolation.test.tsx` pass 100%.

