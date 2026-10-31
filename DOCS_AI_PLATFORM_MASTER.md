# CH ACADEMY — TÀI LIỆU TOÀN DIỆN NỀN TẢNG AI PLATFORM & STUDIO (MASTER DOCUMENT)

> **Dự án**: CH Academy — Nền tảng Giáo dục & Đào tạo  
> **Trạng thái**: Hoạt động ổn định (Production Ready)  
> **Phiên bản tài liệu**: 2.5 (Hợp nhất toàn diện các báo cáo kỹ thuật AI Platform)

---

## 1. TỔNG QUAN KIẾN TRÚC AI PLATFORM

Trung tâm AI Studio của CH Academy là nền tảng quản trị và vận hành trí tuệ nhân tạo toàn diện, tích hợp trực tiếp vào hệ thống quản lý trung tâm đào tạo với 7 module độc lập:

1. **Tổng quan AI (Overview & Telemetry)**: Thống kê số lượng hội thoại, tỷ lệ phản hồi chính xác, thời gian phản hồi trung bình và lưu lượng theo kênh.
2. **Quản lý Agent (Agent Registry & Configuration)**: Cấu hình system prompt, model Gemini, nhiệt độ (temperature), tri thức liên kết và phân hệ mục tiêu.
3. **Kho tri thức (Knowledge Base Management)**: Quản lý danh mục tri thức trung tâm, chính sách truy cập (PUBLIC, INTERNAL, TEACHER_ONLY, ADMIN_ONLY).
4. **Tài liệu & Chunking (RAG Document Pipeline & Chunk Inspector)**: Tải lên tài liệu (PDF, DOCX, XLSX, CSV, TXT), tùy chọn tham số Chunking (Kích thước đoạn, Độ gối đầu) và kiểm tra các đoạn văn bản nhúng (Embeddings).
5. **Kịch bản hội thoại (Flows & Decision Tree)**: Điều hướng hội thoại theo luồng điều kiện, tự động thu thập nhu cầu học tập và đề xuất khóa học.
6. **Kênh kết nối đa nền tảng (Omnichannel & Zalo OA)**: Kết nối Website Widget, Webhook hai chiều Zalo Official Account với xác thực HMAC-SHA256.
7. **Hội thoại & Giám sát Chuyển giao (Conversations & Live Agent Handoff)**: Thanh tra tin nhắn lịch sử, cảnh báo và bàn giao hội thoại sang nhân viên tư vấn khi học viên yêu cầu hỗ trợ trực tiếp.

---

## 2. PHÂN BIỆT RẠCH RÒI: KHO TRI THỨC (TAB 3) VÀ TÀI LIỆU & CHUNKING (TAB 4)

Nhằm đảm bảo trải nghiệm người dùng trực quan và chuẩn hóa quy trình kỹ thuật RAG:

| Tiêu chí | Tab 3: Kho tri thức (Knowledge Base) | Tab 4: Tài liệu & Chunking (Pipeline & Inspector) |
| :--- | :--- | :--- |
| **Bản chất nghiệp vụ** | Quản lý logic danh mục tri thức và phân quyền truy cập | Xử lý kỹ thuật tài liệu, cắt đoạn (Chunking) và nạp Vector |
| **Đối tượng thao tác** | Tạo mới/Chỉnh sửa Kho tri thức, gán mã định danh, thiết lập phạm vi (`PUBLIC`, `INTERNAL`, `TEACHER_ONLY`, `ADMIN_ONLY`) | Tải lên file (`.pdf`, `.docx`, `.xlsx`, `.csv`), cấu hình Chunk Size (200-2000 ký tự) và Chunk Overlap |
| **Tính năng chuyên sâu** | Gắn kết tri thức vào từng Agent cụ thể | **Chunk Inspector Modal**: Xem chi tiết nội dung từng phân đoạn đã đánh chỉ mục, đếm số token và nút Tái lập chỉ mục (Reindex) |
| **API Backend** | `/api/v1/admin/ai/knowledge-bases` | `/api/v1/admin/ai/knowledge-bases/{id}/documents` và `/documents/{id}/chunks` |

---

## 3. TÍCH HỢP ZALO OFFICIAL ACCOUNT (ZALO OA) CHÍNH THỨC

CH Academy hỗ trợ đồng bộ hai chiều tin nhắn từ tài khoản Zalo OA của trung tâm về hệ thống AI:

```mermaid
sequenceDiagram
    participant User as Người dùng Zalo
    participant Zalo as Máy chủ Zalo OA
    participant Webhook as ZaloWebhookController
    participant AI as GenAiChatService
    participant DB as Postgres (Conversations)

    User->>Zalo: Gửi tin nhắn đến OA
    Zalo->>Webhook: POST /api/v1/webhooks/zalo (Kèm chữ ký X-Zalo-Signature)
    Webhook->>Webhook: Xác thực HMAC-SHA256 (Secret Key + Timestamp + Body)
    alt Chữ ký hợp lệ
        Webhook->>AI: Xử lý câu hỏi qua Agent Tuyển sinh
        AI->>DB: Lưu trữ hội thoại & Tin nhắn
        AI-->>Zalo: Gửi phản hồi lại người dùng Zalo
        Webhook-->>Zalo: 200 OK (error: 0)
    else Chữ ký không hợp lệ
        Webhook-->>Zalo: 401 Unauthorized (Từ chối xử lý)
    end
```

### Điểm kỹ thuật bảo mật Zalo OA:
- **Webhook Controller**: [`backend/src/main/java/vn/chacademy/chat/controller/ZaloWebhookController.java`](file:///backend/src/main/java/vn/chacademy/chat/controller/ZaloWebhookController.java)
- **Challenge Verification**: Hỗ trợ endpoint `GET /api/v1/webhooks/zalo` xác thực challenge token từ Zalo Developer Console.
- **Bảo mật chữ ký**: Thuật toán HMAC-SHA256 bảo vệ chống giả mạo tin nhắn bên ngoài.

---

## 4. BẢO MẬT PHÂN QUYỀN RBAC & QUYỀN GIÁM SÁT HỘI THOẠI ADMIN

### 4.1. Khắc phục lỗi 403 Forbidden khi xem tin nhắn công khai #23
- **Vấn đề trước đây**: Khi Admin bấm xem chi tiết một phiên chat từ khách vãng lai trên trang chủ (ví dụ Hội thoại #23), hệ thống gọi nhầm API người dùng thường `/api/v1/chat/ai/conversations/{id}/messages` yêu cầu sở hữu `sessionId`. Do Admin không sở hữu `sessionId` của khách, backend trả về mã `403 Forbidden: Bạn không có quyền thực hiện thao tác này`.
- **Giải pháp triệt để**:
  - Chuyển giao diện sang gọi đúng API thanh tra quản trị: `aiStudioApi.getConversationMessages(id)` trỏ đến `/api/v1/admin/ai/conversations/{id}/messages`.
  - Trong [`GenAiChatService.java`](file:///backend/src/main/java/vn/chacademy/chat/service/GenAiChatService.java), bổ sung cơ chế nhận diện vai trò Quản trị viên (`SUPER_ADMIN`, `CENTER_ADMIN`, `ACADEMIC_STAFF`), cho phép toàn quyền kiểm tra nội dung hội thoại phục vụ kiểm toán chất lượng phục vụ.

---

## 5. THU THẬP KHÁCH HÀNG TIỀM NĂNG (LEAD CAPTURE) & HANDOFF

1. **Lead Extraction tự động**:
   - Khi người dùng cung cấp Số điện thoại hoặc Email trong khung chat, AI tự động trích xuất thông tin, đối soát trùng lặp và ghi nhận vào bảng `leads` với nguồn `AI_CHAT`.
2. **Chuyển giao chuyên viên (Live Handoff)**:
   - Khi người dùng yêu cầu "gặp nhân viên tư vấn" hoặc có khiếu nại phức tạp, trạng thái hội thoại được chuyển thành `WAITING_HANDOFF`.
   - Hệ thống phát tín hiệu WebSocket thông báo đến phân hệ Tuyển sinh để tư vấn viên tiếp quản kịp thời.
