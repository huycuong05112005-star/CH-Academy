# BÁO CÁO PHÂN TÍCH CHUYÊN SÂU MÃ NGUỒN NEXVA AI & ĐỐI CHIẾU KIẾN TRÚC CH ACADEMY

**Tài liệu:** `NEXVA_CODEBASE_ANALYSIS.md`  
**Ngày thực hiện:** 31 tháng 10 năm 2026  
**Dự án tham chiếu:** NEXVA AI (`E:\CACMONTRENLOP\nexva`)  
**Dự án triển khai:** CH Academy (`E:\CA_NHAN\CH_Academy`)  

---

## 1. TỔNG QUAN VỀ DỰ ÁN THAM CHIẾU NEXVA AI

NEXVA AI là nền tảng AI Agent đa kênh phục vụ chăm sóc khách hàng và bán hàng tự động:
- **Kênh hỗ trợ:** Website live chat widget (Shadow DOM nhúng đa trang), Zalo cá nhân, Zalo Official Account (OA), Facebook Messenger.
- **Tính năng chủ đạo:** Kéo thả kịch bản hội thoại (Flow Script Builder), Kho tri thức RAG (PDF/DOCX/XLSX/URL → pgvector), Hộp thư hợp nhất (Unified Inbox), Cuộc gọi giọng nói thời gian thực (Real-time Voice AI), Quản trị gói cước và thanh toán tự động qua SePay.
- **Kiến trúc tổng thể:**
  - `api/`: Backend Node.js (Fastify 5 + postgres-js + pgvector).
  - `web/`: Frontend Next.js 15 (App Router) + Tailwind v4 + shadcn/ui.
  - `tts/`: Dịch vụ tổng hợp giọng nói tiếng Việt chuyên biệt (Python FastAPI + mô hình TTS cục bộ).
  - `api/src/widget/`: Mã nhúng JavaScript widget siêu nhẹ (Shadow DOM) chèn vào bất kỳ website nào qua thẻ `<script>`.

---

## 2. SƠ ĐỒ CẤU TRÚC MÃ NGUỒN NEXVA AI

```text
E:\CACMONTRENLOP\nexva/
│
├── api/                                  # Fastify 5 REST API Backend
│   ├── src/
│   │   ├── server.ts                     # Entrypoint, route registration, migration runner
│   │   ├── auth.ts                       # Cookie session (nx_sid), CSRF, role & plan limits
│   │   ├── db.ts                         # PostgreSQL connection pool (postgres-js)
│   │   ├── env.ts                        # Environment configuration schema (Zod)
│   │   ├── util.ts                       # Helpers, ID generator, safe rate limiter
│   │   ├── lib/
│   │   │   ├── chat-engine.ts            # Core AI bot orchestration (LLM + RAG + Flow)
│   │   │   ├── flow-script.ts            # Visual conversation graph execution engine
│   │   │   ├── handoff.ts                # Human handover transition logic
│   │   │   ├── kb-worker.ts              # Document parser (PDF, DOCX, XLSX) & chunker
│   │   │   ├── llm.ts                    # LLM caller via OpenRouter API
│   │   │   ├── rag.ts                    # pgvector similarity search & prompt injection
│   │   │   ├── speech-split.ts           # SentenceBuffer: chia nhỏ streaming text thành câu
│   │   │   ├── tts.ts                    # Client gọi service Python TTS nội bộ
│   │   │   ├── voices.ts                 # Catalog các giọng đọc tiếng Việt (N1, N2, V1, V2)
│   │   │   └── zalo.ts / messenger.ts    # Webhook adapters cho các nền tảng mạng xã hội
│   │   ├── migrations/
│   │   │   ├── 001_init.sql              # Schema nền tảng (users, workspaces, agents, kb, convs)
│   │   │   └── 003_voice.sql             # Bổ sung cấu hình voice cho agents
│   │   ├── routes/
│   │   │   ├── agents.ts                 # Quản lý vòng đời AI Agents (CRUD, clone, publish)
│   │   │   ├── inbox.ts                  # Hộp thư hội thoại, tin nhắn, unread counter
│   │   │   ├── kb.ts                     # Quản lý kho tài liệu & phân đoạn
│   │   │   ├── public-widget.ts          # Public API cho Chat Widget & Voice Streaming
│   │   │   ├── voice.ts                  # Preview và catalog giọng đọc
│   │   │   └── flows.ts                  # Kịch bản kéo thả
│   │   └── widget/
│   │       ├── loader.js                 # Script nhúng cố định (~2KB)
│   │       └── app.js                    # Web Component / Shadow DOM chat & voice widget
│   └── package.json
│
├── web/                                  # Next.js 15 App Router Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── (marketing)/              # Trang giới thiệu, tính năng, bảng giá, blog
│   │   │   └── console/
│   │   │       ├── (shell)/
│   │   │       │   ├── agents/           # Màn hình cấu hình Agent Studio
│   │   │       │   ├── hop-thu/          # Màn hình Hộp thư hội thoại đa kênh
│   │   │       │   ├── kho-kien-thuc/    # Màn hình Quản lý tài liệu RAG
│   │   │       │   └── kich-ban/         # Màn hình Vẽ kịch bản Flow Builder
│   │   │       └── layout.tsx
│   │   └── components/
│   │       └── app/
│   │           ├── flow/                 # React Flow node builders
│   │           ├── voice-picker.tsx      # Bộ chọn giọng đọc & test âm thanh
│   │           └── test-chat.tsx         # Sandbox tương tác thử nghiệm
│   └── package.json
│
└── tts/                                  # Python TTS Service
    ├── server.py                         # FastAPI audio synthesis HTTP server
    ├── engine.py                         # Audio generation pipeline
    └── vi_text.py                        # Tiền xử lý & chuẩn hóa tiếng Việt (số, ngày, từ viết tắt)
```

---

## 3. PHÂN TÍCH CHI TIẾT CÁC LUỒNG XỬ LÝ CỐT LÕI CỦA NEXVA

### 3.1. Cơ chế Quản lý Hội thoại, Tin nhắn & Unread Counter (`inbox.ts` & `public-widget.ts`)
* **Bảng dữ liệu:**
  - `conversations`: Lưu `contact_id`, `agent_id`, `status` (`open`, `waiting_human`, `closed`), `handled_by` (`bot`, `human`), `unread` (số nguyên đếm tin chưa đọc), `last_message_at`, `last_preview`.
  - `messages`: Lưu `conversation_id`, `role` (`contact`, `bot`, `human`, `system`), `content`, `meta` (`jsonb`).
* **Luồng khi khách gửi tin nhắn (`POST /api/public/w/:key/messages`):**
  1. Xác thực `key` qua kênh `channels` và kiểm tra tên miền `allowed_domains` bằng header `Origin`.
  2. Tạo hoặc nạp liên hệ `contacts` theo `session` token của trình duyệt.
  3. Tạo hoặc lấy cuộc hội thoại mở gần nhất `conversations`.
  4. Ghi tin nhắn vào bảng `messages` với `role = 'contact'`.
  5. Cập nhật `conversations SET unread = unread + 1, last_message_at = now(), last_preview = text.slice(0, 140)`.
  6. Kích hoạt `botReply(conv.id)` sinh câu trả lời tự động và ghi tiếp vào `messages` với `role = 'bot'`.
* **Luồng khi nhân viên/người dùng đọc tin nhắn (`GET /api/inbox/conversations/:id`):**
  1. Trả về danh sách tin nhắn của cuộc hội thoại.
  2. Lập tức chạy lệnh: `UPDATE conversations SET unread = 0 WHERE id = :id`.
  3. Điểm đếm `unread` lập tức trở về 0, đồng thời phản ánh ngay vào API `GET /api/inbox/conversations` qua hàm tổng hợp:  
     `coalesce(sum(unread) FILTER (WHERE status <> 'closed'), 0)::int AS unread`.

### 3.2. Cơ chế Cuộc gọi Thoại Hai Chiều Thời Gian Thực (`public-widget.ts` & `speech-split.ts`)
Đây là một trong những điểm tinh hoa nhất trong kiến trúc của NEXVA:
1. **Khách hàng nói (Speech-to-Text — STT):**
   - Trình duyệt chạy Web Speech API chuyển giọng nói trực tiếp thành văn bản tiếng Việt mà không tốn tài nguyên máy chủ.
   - Nếu trình duyệt không hỗ trợ Web Speech (ví dụ Firefox), widget ghi âm audio/webm và gửi lên `POST /api/public/w/:key/stt` gọi Whisper (Groq) với bộ lọc Regex khử ảo giác `STT_JUNK`.
2. **AI suy luận & Truyền tải dòng âm thanh (Sentence-level Streaming TTS):**
   - Client gửi văn bản câu nói tới `POST /api/public/w/:key/voice`.
   - Kết nối thiết lập dạng **Server-Sent Events (SSE)** với `Content-Type: text/event-stream`.
   - AI Bot trả lời dạng streaming token qua `botReplyStream()`.
   - Lớp `SentenceBuffer` gom các token lẻ thành từng câu văn hoàn chỉnh dựa trên dấu chấm, dấu hỏi, dấu chấm than (`.`, `?`, `!`, `\n`).
   - Ngay khi một câu văn hoàn chỉnh hình thành, hệ thống lập tức gọi module TTS tổng hợp âm thanh câu đó song song trong lúc AI đang tiếp tục sinh câu tiếp theo (`chain = chain.then(...)`).
   - Server gửi gói tin SSE:  
     `data: {"type": "audio", "seq": 0, "sr": 24000, "text": "Câu 1", "pcm": "base64..."}`
   - Client Web Audio API nạp mảng PCM vào `AudioBufferSourceNode` và phát nối đuôi tuần tự, tạo độ trễ mở đầu (Time-to-First-Audio) cực ngắn (< 500ms).

### 3.3. Cơ chế Kho Tri Thức RAG & Chống Ảo Giác (`rag.ts` & `kb-worker.ts`)
- **Tách phân đoạn (Chunking):** Tự động băm nhỏ tài liệu theo cấu trúc đoạn văn, bảng biểu (`pdf-parse`, `mammoth` cho DOCX, `xlsx`).
- **Embedding:** Chuyển đổi văn bản thành vector 1536 chiều qua OpenAI / text-embedding-3-small và lưu vào cột `vector(1536)` của bảng `kb_chunks` trong PostgreSQL.
- **Truy vấn:** Sử dụng chỉ mục HNSW (`hnsw (embedding vector_cosine_ops)`) để tìm top K đoạn văn có độ tương đồng cosin cao nhất.
- **Ràng buộc:** Chỉ tiêm (inject) các đoạn trích có độ tương đồng vượt ngưỡng vào System Prompt, kèm quy định nghiêm ngặt: *"Chỉ trả lời dựa trên tài liệu cung cấp. Nếu không có thông tin, hãy báo chưa rõ và xin số điện thoại để nhân viên hỗ trợ"*.

### 3.4. Cơ chế Kịch Bản Kéo Thả (Flow Script Engine — `flow-script.ts`)
- Đồ thị kịch bản dạng Node-Edge JSON được biên dịch thành quy trình máy trạng thái (State Machine):
  - Node `start`: Bắt đầu hội thoại.
  - Node `message`: Lời chào hoặc hướng dẫn.
  - Node `question`: Thu thập trường dữ liệu (Tên, SĐT, Nhu cầu).
  - Node `condition`: Rẽ nhánh logic theo từ khóa của khách.
  - Node `handoff`: Kích hoạt chuyển sang nhân viên tư vấn (`status = 'waiting_human'`).
  - Node `end`: Đóng phiên.

---

## 4. BẢNG SO SÁNH ĐỐI CHIẾU NEXVA AI VÀ CH ACADEMY

| Tiêu chí | Cách NEXVA AI triển khai | Cách CH Academy đang làm | Vấn đề tại CH Academy | Giải pháp học hỏi & Áp dụng |
|:---|:---|:---|:---|:---|
| **Công nghệ Backend** | Node.js (Fastify 5) + `postgres-js` | Java 21 + Spring Boot 3.5 + Spring Data JPA | Backend Java có cấu trúc chặt chẽ nhưng trước đây xử lý hội thoại chưa linh hoạt | **Giữ nguyên Spring Boot**, áp dụng mô hình phân tách module dịch vụ độc lập như NEXVA. |
| **Công nghệ Frontend** | Next.js 15 (App Router) + shadcn/ui | React 19 + TypeScript + Vite | Các trang portal và AI Studio nằm chung 1 project, có nguy cơ phụ thuộc code | Tách rạch ròi các domain: Web đào tạo vs AI Platform Studio qua kiến trúc Modular. |
| **Phân định Chat** | Chỉ có 1 loại Chat: Khách vãng lai tương tác với AI Bot | Có 2 loại: **Chat nhóm lớp** (người với người) và **Chat AI** (học viên/khách với bot) | Giao diện và state trước đây có lúc bị nhầm lẫn giữa tin nhóm và tin AI | **Tách biệt 100%** hai hệ thống: `chat_conversations` (Lớp học) và `ai_conversations` (AI Trợ lý). |
| **Unread Message Counter** | Lưu trực tiếp `unread` trên bảng `conversations`, reset bằng 1 câu lệnh `UPDATE` khi đọc | Lưu `last_read_message_id` trên bảng `chat_members` | Khi Admin chưa có trong `chat_members`, unread bị tính bằng tổng toàn bộ tin nhắn lịch sử và không thể đánh dấu đọc | Chuẩn hóa `ClassChatService`: Tự động gán `chat_members` cho Admin hoặc tính unread dựa trên mốc tham gia; bổ sung `markAsRead` cập nhật state tức thì. |
| **Voice AI** | SSE streaming audio chunks + `SentenceBuffer` + Web Speech STT | Web Speech STT/TTS + Web Audio API Analyser canvas visualizer | Trước đây Voice Call chưa có state machine chuẩn và thiếu xử lý lỗi khi mic bị từ chối | Áp dụng State Machine 11 trạng thái của NEXVA, tích hợp visualizer sóng âm thật và tính năng ngắt lời (Interrupt). |
| **RAG & Chunking** | `kb-worker.ts` băm theo trang và lưu vector | `AiStudioService.java` băm theo đoạn 500 ký tự với overlap 50 ký tự | Chưa có giao diện xem trước nội dung trích xuất từng Chunk | Bổ sung Modal xem Chunks và Re-index tài liệu chuẩn theo mô hình NEXVA. |
| **Lead Capture** | Thu thập vào bảng `contacts` | Thu thập vào `ai_leads` và đồng bộ tự động vào bảng `leads` của CRM | Trước đây bị nghẽn ràng buộc check constraint `chk_lead_source` | Đã mở rộng constraint và đồng bộ 2 chiều vào CRM Tuyển sinh. |

---

## 5. CÁC ĐIỂM TỐT CỦA NEXVA NÊN KẾ THỪA CHO CH ACADEMY
1. **Mô hình Agent Đa Thuộc Tính (Multi-property Agent Spec):** Tách rạch ròi giữa Cấu hình Agent (System Prompt, Model, Temperature, MaxTokens, Knowledge Bases) và Runtime thực thi.
2. **Kỹ thuật Sentence-level Streaming:** Chia nhỏ đoạn trả lời của AI thành từng câu để tổng hợp giọng nói phát sớm, giảm độ trễ cho người nghe.
3. **Cơ chế Unread Reset Tức thì:** Cập nhật ngay lập tức trạng thái đọc về 0 khi người dùng mở hộp thoại hoặc fetch tin nhắn mới.
4. **Bảo mật Tên miền (Domain Whitelist):** Kiểm tra chặt chẽ `Origin` trên các endpoint công khai để tránh bị nhúng trộm widget.
5. **Khử ảo giác cấp độ Prompt & RAG:** Ràng buộc chặt chẽ dữ liệu phản hồi theo đúng tài liệu hoặc database API được cấp quyền.

## 6. CÁC ĐIỂM CỦA NEXVA KHÔNG PHÙ HỢP VỚI CH ACADEMY
1. **Không thay thế Spring Boot bằng Node.js / Fastify:** CH Academy là hệ thống quản trị đào tạo toàn diện (học vụ, điểm thi, tài chính, điểm danh, đề thi) đã được xây dựng hoàn chỉnh trên Spring Boot. Việc đập bỏ backend Java là sai lầm nghiêm trọng.
2. **Mô hình hội thoại đơn kênh của NEXVA:** NEXVA chủ yếu phục vụ chat giữa Khách hàng và Bot/Nhân viên bán hàng. CH Academy cần mô hình **Chat nhóm lớp học đa thành viên** (Giảng viên, Trợ giảng, Học viên trong lớp) có kiểm tra ghi danh (`enrollments`).
3. **Kiểm soát quyền truy cập giáo dục (Academic RBAC):** CH Academy có ma trận phân quyền phức tạp theo vai trò (`SUPER_ADMIN`, `CENTER_ADMIN`, `TEACHER`, `STUDENT`). AI Agent phải phục vụ riêng theo cổng và tuyệt đối không rò rỉ dữ liệu điểm số, đề thi giữa các học viên.
