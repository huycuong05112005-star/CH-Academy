# PHÂN TÍCH TÁI SỬ DỤNG MÃ NGUỒN NEXVA CHO CH ACADEMY

**Dự án gốc:** Nexva Gen AI Chat Box (`E:\CACMONTRENLOP\nexva`)  
**Mục tiêu:** Phân tích, chọn lọc và tái sử dụng các module cốt lõi của Nexva để xây dựng Hệ sinh thái AI Agent cho CH Academy, đảm bảo không phá vỡ kiến trúc Spring Boot + React + PostgreSQL.

---

## 1. TỔNG QUAN KIẾN TRÚC MÃ NGUỒN NEXVA

Dự án Nexva được xây dựng dựa trên ngăn xếp:
* **API Backend:** Node.js (Fastify + TypeScript)
* **Web Console:** Next.js (App Router + Tailwind CSS)
* **Cơ sở dữ liệu:** PostgreSQL kết hợp extension pgvector
* **Kết nối LLM & Speech:** OpenRouter / Google AI Studio / Fastify SSE streaming

### Các module then chốt trong Nexva:
1. `chat-engine.ts`: Bộ điều phối hội thoại, quản lý công cụ (Tool calling) và cơ chế prompt assembling.
2. `flow-script.ts`: Trình biên dịch đồ thị kịch bản (Flow graph: nodes & edges) thành danh sách các bước có đánh số (B1, B2...) kết hợp tool calls.
3. `handoff.ts`: Cơ chế chuyển giao nhân viên (Human handoff), webhook ký HMAC-SHA256, chuyển trạng thái hội thoại `waiting_human`.
4. `rag.ts` & `kb-worker.ts`: Phân đoạn tài liệu (chunks), tìm kiếm tương đồng vector và quản lý tài liệu hướng dẫn (`guide`).
5. `zalo.ts` & `zalo-media.ts`: Tích hợp Zalo qua webhook `user_send_text` và gửi tin nhắn phản hồi.
6. `voice.ts` & `tts.ts`: Xử lý phân tách câu giọng nói và chuyển đổi Text-to-Speech.

---

## 2. MA TRẬN PHÂN LOẠI: TÁI SỬ DỤNG vs VIẾT LẠI TRÊN SPRING BOOT

| Thành phần Nexva | Cách thức ứng dụng vào CH Academy | Lý do kỹ thuật |
| :--- | :--- | :--- |
| **Flow Script Compiler (`flow-script.ts`)** | **Tái sử dụng mô hình logic**, chuyển đổi sang Spring Boot Service (`AiStudioService.validateFlowGraph`) và UI React Node Renderer. | Tránh máy trạng thái cứng (hard state machine) dễ bị vỡ khi người dùng gõ câu hỏi tự do. Mô hình dịch bước vào Prompt giúp AI hiểu ngữ cảnh mượt mà. |
| **Human Handoff (`handoff.ts`)** | **Tái sử dụng 100% nguyên lý nghiệp vụ**, chuyển đổi bảng `conversations.status = 'WAITING_HUMAN'`, tự động trích xuất số điện thoại vào bảng `ai_leads` và kích hoạt chuông thông báo. | Ngăn ngừa việc bot và nhân viên cùng trả lời đè lên nhau; phân tách rõ ràng khi nào AI xử lý và khi nào nhân viên tiếp quản. |
| **Quản lý Agent (`agents.ts`)** | **Native hóa thành Spring Data JPA Entity `AiAgent`**, quản lý phiên bản `version`, model, system prompt và liên kết n-n với Kho tri thức. | Cho phép Admin tự do tạo mới, nhân bản (clone), lưu bản nháp và xuất bản Agent mà không cần deploy lại code. |
| **RAG & Chunking (`rag.ts`)** | **Thiết kế Native Chunking Pipeline** trong `AiStudioService.processDocumentChunks`, lưu trữ `ai_kb_chunks` với liên kết khóa ngoại và chỉ mục tìm kiếm tối ưu. | Đảm bảo tính toàn vẹn dữ liệu trong transaction PostgreSQL của Spring Boot, không phụ thuộc vào background service Node.js ngoài. |
| **Zalo Webhook (`zalo.ts`)** | **Viết lại thành Spring Boot Controller `ZaloWebhookController`**, hỗ trợ xác thực URL challenge và nhận tin nhắn người dùng. | Bảo vệ secret key tại backend, tuân thủ tiêu chuẩn an toàn bảo mật và không dùng script tự động hóa tài khoản cá nhân trái phép. |
| **Voice / Speech (`voice.ts`)** | **Triển khai Web Speech API trên Browser (STT & TTS)**, hỗ trợ nhận diện và đọc phản hồi trực tiếp, sẵn sàng kết nối dịch vụ thời gian thực. | Giảm tải xử lý âm thanh nặng nề cho server, cho độ trễ thấp và trải nghiệm giọng nói tức thì cho người dùng. |

---

## 3. ĐIỂM CẢI TIẾN VƯỢT TRỘI CỦA CH ACADEMY SO VỚI NEXVA

1. **Khắc phục triệt để lỗi rò rỉ lịch sử hội thoại**: Nexva dùng một session workspace chung, trong khi CH Academy phân tách 4 không gian hoàn toàn độc lập: `PUBLIC`, `STUDENT`, `TEACHER`, `ADMIN`.
2. **Context Injection động từ Nghiệp vụ thật**: Thay vì chỉ tìm kiếm văn bản tĩnh, CH Academy tự động truy vấn điểm danh, lịch học, học phí, đề thi và sĩ số lớp từ database PostgreSQL thời gian thực để đưa vào câu trả lời của AI.
3. **Phân quyền tài liệu đa cấp (Access Control Levels)**: Tài liệu nội bộ hoặc quản trị không bao giờ bị rò rỉ sang Agent tư vấn công khai trên Website.
