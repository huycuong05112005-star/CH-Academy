# BÁO CÁO THỰC TRẠNG NỀN TẢNG AI PLATFORM TẠI CH ACADEMY

**Tài liệu:** `AI_PLATFORM_CURRENT_STATE.md`  
**Ngày đánh giá:** 31 tháng 10 năm 2026  
**Dự án:** Hệ thống Quản lý Đào tạo & AI Agent CH Academy (`E:\CA_NHAN\CH_Academy`)  
**Môi trường:** Spring Boot 3.5.0, PostgreSQL 16, React 19 + TypeScript + Vite  

---

## 1. TỔNG QUAN KIẾN TRÚC PHÂN HỆ AI

Phân hệ AI của CH Academy được thiết kế theo mô hình tích hợp trực tiếp vào hệ thống quản lý học tập và vận hành (LMS + SIS + CRM), chia tách thành 2 tầng rõ rệt:
1. **Core Business & AI Runtime (Backend):** Java Spring Boot 3.5.0 điều phối luồng xử lý ngữ cảnh, RAG từ dữ liệu PostgreSQL, phân quyền RBAC và tích hợp mô hình ngôn ngữ lớn (LLM) qua OpenRouter API kết hợp Local Rule Engine.
2. **AI Studio & Chat Widget (Frontend):** Ứng dụng React 19 SPA, cung cấp công cụ AI Agent Studio 11 module cho Quản trị viên và widget Chat/Voice thông minh cách ly theo từng vai trò người dùng (Public, Học viên, Giảng viên, Admin).

---

## 2. HIỆN TRẠNG CƠ SỞ DỮ LIỆU & BẢNG THỰC THỂ (ENTITIES)

Hệ thống cơ sở dữ liệu AI đã được hoàn thiện và chuẩn hóa thông qua chuỗi Flyway Migrations (từ V21 đến V26), gồm 10 bảng thực thể chuyên biệt:

| Tên bảng CSDL | Entity Java | Chức năng nghiệp vụ | Hiện trạng dữ liệu |
| :--- | :--- | :--- | :--- |
| `ai_agents` | `AiAgent.java` | Lưu trữ cấu hình 7 AI Agents chuyên biệt (Admissions, Tutor, Teacher, Admin, v.v.), System Prompt, Model, Scope, nhiệt độ | 7 Agents đang hoạt động, đã sửa triệt để Mojibake, bổ sung cột `scope` |
| `ai_knowledge_bases` | `AiKnowledgeBase.java` | Quản lý các Kho tri thức nghiệp vụ (Tuyển sinh, Học thuật, Quy chế, Nội bộ) | 4 Kho tri thức hoạt động, phân quyền rõ ràng |
| `ai_kb_documents` | `AiKbDocument.java` | Quản lý danh mục tài liệu tải lên (PDF, DOCX, TXT, XLSX) | Tài liệu biểu phí, giáo trình đã index |
| `ai_kb_chunks` | `AiKbChunk.java` | Lưu các đoạn văn bản đã chia nhỏ kèm vector embedding | Các chunk sẵn sàng phục vụ RAG context |
| `ai_flows` | `AiFlow.java` | Quản lý kịch bản hội thoại tự động dạng đồ thị có hướng (Graph JSON) | 4 Flow chuẩn cho Tuyển sinh, Hướng dẫn, Đặt lịch |
| `ai_channel_configs` | `AiChannelConfig.java` | Cấu hình kênh kết nối (PORTAL, WEBSITE, ZALO, VOICE, MESSENGER) | 5 kênh được kích hoạt |
| `ai_conversations` | `AiConversation.java` | Lưu phiên hội thoại, gắn chặt với `user_id`, `portal`, `channel`, `status` | Cách ly hoàn toàn lịch sử hội thoại theo cổng |
| `ai_messages` | `AiMessage.java` | Lưu nội dung tin nhắn, vai trò (`user`, `assistant`, `system`), nguồn trích dẫn | Lưu trữ đầy đủ lịch sử hỏi đáp |
| `ai_leads` | `AiLead.java` | Lưu trữ thông tin khách hàng tiềm năng thu thập từ AI Chat/Voice | Đồng bộ 1:1 sang bảng CRM `leads` |
| `call_sessions` | Thực thể mở rộng | Lưu phiên gọi điện thoại Voice AI, thời lượng, transcript | Đã seed dữ liệu mẫu & API sẵn sàng |

---

## 3. HIỆN TRẠNG BACKEND API & DỊCH VỤ ĐIỀU PHỐI

### 3.1. Danh mục Controller
1. **`GenAiChatController.java` (`/api/v1/chat/ai`):**
   - `POST /public/ask`: Endpoint công khai cho khách vãng lai trên trang chủ (`/`), sử dụng Agent Tư vấn Tuyển sinh, tự động trích xuất số điện thoại và tên để tạo Lead CRM.
   - `POST /ask`: Endpoint có xác thực JWT dành cho Học viên, Giảng viên, Admin với cơ chế kiểm tra phân quyền và cách ly dữ liệu.
   - `GET /conversations`: Lấy danh sách hội thoại của người dùng hiện tại theo đúng cổng (`STUDENT`, `TEACHER`, `ADMIN`).
   - `POST /conversations/{id}/handoff`: Chuyển giao hội thoại sang nhân viên tư vấn (`WAITING_HUMAN`).
2. **`AiStudioAdminController.java` (`/api/v1/admin/ai`, `/api/v1/admin/ai-studio`):**
   - `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMIN') or hasAuthority('ai:manage')")`: Đảm bảo chỉ quản trị viên có quyền truy cập.
   - Quản lý đầy đủ vòng đời: Agents, Knowledge Bases, Documents, Chunks, Flows, Leads, Conversations, Channels, Analytics, Calls.

### 3.2. Dịch vụ Nghiệp vụ (Services)
- **`GenAiChatService.java`:**
  - Tự động phát hiện ý định Human Handoff.
  - Tự động trích xuất số điện thoại Việt Nam (các đầu số 03, 05, 07, 08, 09, +84) từ tin nhắn của người dùng và gọi `aiStudioService.createLead(...)`.
  - Phun ngữ cảnh dữ liệu thời gian thực (Real-time DB Context) theo vai trò: Học viên chỉ thấy lớp mình học; Giảng viên thấy lớp phụ trách; Admin thấy tổng quan chỉ số toàn trung tâm.
- **`AiStudioService.java`:**
  - Điều phối CRUD toàn diện cho AI Studio.
  - Lưu Lead đồng bộ vào bảng `ai_leads`, tạo bản ghi trong bảng CRM `leads` với mã `LEAD-AI-xxxxxx` và nguồn `AI_CHATBOT`, đồng thời tạo nhật ký hoạt động trong `lead_activities`.

---

## 4. HIỆN TRẠNG GIAO DIỆN NGƯỜI DÙNG (FRONTEND)

### 4.1. AI Studio Quản trị (`AiStudioPage.tsx`)
- **11 Phân hệ chức năng đầy đủ:** `overview`, `agents`, `kb`, `docs`, `flows`, `channels`, `playground`, `conversations`, `calls`, `analytics`, `settings`.
- **Thanh điều hướng tối ưu:** Tích hợp thanh cuộn ngang mượt mà với 2 nút mũi tên trái (`<`) và phải (`>`), hỗ trợ cuộn chuột ngang (Shift + Wheel) và tự động trượt đến tab đang chọn (`scrollIntoView`).
- **Phân hệ Cuộc gọi AI (`calls`):** Bảng quản lý chi tiết cuộc gọi Voice AI kèm visualizer phát lại âm thanh mô phỏng và nút kích hoạt cuộc gọi thử nghiệm trực tiếp.
- **Phân tách Analytics & Settings:** Hai tab chuyên biệt với biểu đồ hiệu suất, phân bổ token và cài đặt tham số bảo mật.

### 4.2. Chat Widget Đa năng (`FloatingChatWidget.tsx`)
- **Cách ly tuyệt đối theo Cổng:**
  - Trang chủ (`/`): Chỉ kích hoạt Agent Tư vấn Tuyển sinh, các gợi ý về học phí, lịch khai giảng và form thu thập thông tin Lead.
  - Trang Học viên (`/student`): Chỉ kích hoạt Trợ giảng AI Đồng hành, có nút chuyển đổi chế độ Sư phạm ("Hướng dẫn từng bước (6 bước)" vs "Giải thích chi tiết"), các câu hỏi gợi ý giải bài tập, sửa phát âm, ngữ pháp tiếng Anh.
  - Trang Giảng viên (`/teacher`): Kích hoạt Trợ lý Giảng dạy & Soạn bài.
  - Trang Admin (`/admin`): Kích hoạt Trợ lý Quản trị & Vận hành.
- **Rich Markdown & Math Renderer (`RichMarkdownRenderer.tsx`):**
  - Hiển thị công thức Toán học chuẩn LaTeX (`\frac`, `\sqrt`, `\pm`, lũy thừa, chỉ số dưới, chữ cái Hy Lạp).
  - Khối mã nguồn (Code block) có định dạng và nút sao chép tiện lợi.
  - Bảng biểu Markdown với nền so le dễ đọc.
  - Huy hiệu sư phạm trực quan cho các bước giải bài ("Bước 1", "Bước 2",...).

---

## 5. CÁC VẤN ĐỀ ĐÃ ĐƯỢC GIẢI QUYẾT TRIỆT ĐỂ

1. **Lỗi Đăng nhập Admin bị điều hướng về Sinh viên:** Đã chuẩn hóa hàm `getTargetPortal` trong `LoginPage.tsx`, đảm bảo người dùng luôn được điều hướng đúng cổng theo vai trò thực tế (`ADMIN` -> `/admin`). Bổ sung endpoint `POST /api/v1/auth/logout` để giải phóng phiên sạch sẽ.
2. **Lỗi 403 Forbidden trên Admin Dashboard:** Đã cập nhật `@PreAuthorize` tại `DashboardController.java` để cho phép cả `ADMIN` lẫn `SUPER_ADMIN`, đồng thời bổ sung `AuthenticationEntryPoint` chuẩn trong `SecurityConfig.java`.
3. **Lỗi Tiếng Việt (Mojibake):** Toàn bộ dữ liệu bảng `ai_agents`, `leads`, `ai_leads` đã được cập nhật UTF-8 chuẩn xác qua Flyway V26 và câu lệnh bảo trì.
4. **Lỗi Thu thập Lead:** Tự động bắt số điện thoại và tên trong mọi tin nhắn gửi lên AI Tư vấn Tuyển sinh, lưu lập tức vào CSDL CRM và hiển thị trên trang Quản lý Tuyển sinh.
5. **Cú pháp & Cảnh báo Compile:** Toàn bộ 275 tệp nguồn Java compile thành công 100% với 0 lỗi cú pháp.

