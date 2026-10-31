# BÁO CÁO PHÂN TÍCH CHUYÊN SÂU MÃ NGUỒN NEXVA AI & ĐỐI CHIẾU KIẾN TRÚC CH ACADEMY

**Tài liệu:** `NEXVA_SOURCE_CODE_ANALYSIS.md`  
**Ngày lập:** 31 tháng 10 năm 2026  
**Dự án tham chiếu:** NEXVA AI (`E:\CACMONTRENLOP\nexva`)  
**Dự án triển khai:** CH Academy (`E:\CA_NHAN\CH_Academy`)  
**Tác giả:** Đội ngũ Kỹ thuật & Kiến trúc Hệ thống CH Academy  

---

## 1. TỔNG QUAN DỰ ÁN THAM CHIẾU NEXVA AI

NEXVA AI là một nền tảng AI Agent doanh nghiệp toàn diện phục vụ tiếp thị, bán hàng tự động, chăm sóc khách hàng đa kênh và tổng đài thoại thông minh. Nền tảng được thiết kế xoay quanh kiến trúc microservices và full-stack TypeScript/Python hiện đại:

- **Web Portal (`nexva/web`):** Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Radix UI. Cung cấp bảng điều khiển quản trị Agent, thiết kế kịch bản kéo thả, kho tri thức và CRM mini.
- **Backend API (`nexva/api`):** Node.js với Fastify 5, `postgres-js`, `pgvector`, RESTful APIs và Webhooks kết nối đa kênh.
- **Dịch vụ Giọng nói (`nexva/tts`):** Python FastAPI + mô hình TTS cục bộ, xử lý âm thanh tiếng Việt với độ trễ thấp (< 300ms).
- **Web Widget (`nexva/api/src/widget`):** Shadow DOM isolated JavaScript bundle (~45KB) nhúng vào bất kỳ trang web nào qua `<script src=".../widget.js">`.

---

## 2. BẢN ĐỒ CẤU TRÚC MÃ NGUỒN NEXVA AI

```text
nexva/
├── api/                                      # Fastify Backend API
│   ├── src/
│   │   ├── server.ts                         # Khởi động Fastify, CORS, routes & plugins
│   │   ├── auth.ts                           # Quản lý Cookie Session, RBAC, phân quyền workspace
│   │   ├── db.ts                             # PostgreSQL pool (postgres-js)
│   │   ├── env.ts                            # Xác thực biến môi trường (Zod)
│   │   ├── util.ts                           # ID NanoId, helpers, token metrics
│   │   ├── lib/
│   │   │   ├── chat-engine.ts                # Bộ điều phối trung tâm (LLM + RAG + Flows + Guardrails)
│   │   │   ├── flow-script.ts                # Bộ thực thi đồ thị kịch bản hội thoại
│   │   │   ├── handoff.ts                    # Chuyển giao hội thoại sang nhân viên tư vấn
│   │   │   ├── kb-worker.ts                  # Parser tài liệu PDF/DOCX/XLSX & phân đoạn chunk
│   │   │   ├── llm.ts                        # Gọi OpenRouter API, xử lý ngữ cảnh & nhiệt độ
│   │   │   ├── rag.ts                        # Vector search qua pgvector và cosine similarity
│   │   │   ├── speech-split.ts               # SentenceBuffer chia streaming text thành câu hoàn chỉnh
│   │   │   ├── tts.ts                        # Client giao tiếp service Python TTS
│   │   │   ├── voices.ts                     # Danh mục giọng đọc tiếng Việt (N1, N2, V1, V2)
│   │   │   ├── zalo.ts                       # Adapter Zalo Personal & Zalo OA webhook
│   │   │   └── messenger.ts                  # Adapter Facebook Messenger webhook
│   │   ├── migrations/                       # SQL migrations
│   │   ├── routes/
│   │   │   ├── agents.ts                     # CRUD AI Agents, Clone, Publish, Voice Config
│   │   │   ├── inbox.ts                      # Hộp thư tin nhắn hội thoại, đếm chưa đọc
│   │   │   ├── kb.ts                         # Quản lý Kho tri thức & tài liệu tải lên
│   │   │   ├── public-widget.ts              # API công khai cho Chat Widget & Voice Stream
│   │   │   ├── voice.ts                      # Voice catalog & preview audio
│   │   │   └── flows.ts                      # CRUD kịch bản luồng hội thoại
│   │   └── widget/
│   │       ├── loader.js                     # Loader nhúng siêu nhẹ (~2KB)
│   │       └── app.js                        # Giao diện widget chat & voice (Shadow DOM)
│   └── package.json
├── web/                                      # Next.js 15 Frontend
│   ├── app/
│   │   ├── (auth)/                           # Trang Đăng nhập, Đăng ký
│   │   └── (dashboard)/                      # Toàn bộ AI Studio & CRM
│   │       ├── agents/                       # Quản lý danh sách & cấu hình Agents
│   │       ├── kb/                           # Kho tri thức RAG & Upload tài liệu
│   │       ├── flows/                        # Thiết kế kịch bản dạng Node Graph
│   │       ├── inbox/                        # Hộp thư hội thoại và tương tác trực tiếp
│   │       ├── channels/                     # Cấu hình Zalo, Facebook, Web Widget
│   │       └── settings/                     # Thiết lập API keys, Webhooks, Billing
└── tts/                                      # Dịch vụ Text-to-Speech
    ├── app.py                                # FastAPI app tiếp nhận yêu cầu tổng hợp tiếng Việt
    └── engine/                               # Pipeline âm thanh và mô hình nén
```

---

## 3. PHÂN TÍCH CHI TIẾT CÁC PHÂN HỆ CỐT LÕI CỦA NEXVA

### 3.1. Phân hệ Kịch bản Hội thoại (`flow-script.ts` & `flows.ts`)
- **Nguyên lý hoạt động:** Kịch bản được lưu trữ dưới dạng đồ thị có hướng (Directed Graph) dạng JSON với 2 mảng chính: `nodes` và `edges`.
- **Các loại Node:**
  - `start`: Điểm bắt đầu luồng hội thoại khi khách hàng gửi tin nhắn đầu tiên.
  - `message`: Gửi tin nhắn phản hồi văn bản hoặc hình ảnh kèm nút bấm gợi ý (Quick Replies).
  - `condition`: Đánh giá biểu thức logic hoặc từ khóa do khách hàng nhập để rẽ nhánh.
  - `collect_info`: Thu thập trường dữ liệu xác định (Họ tên, Số điện thoại, Email). Khi khách hàng nhập số điện thoại hợp lệ (Regex VN), node kích hoạt lưu Lead vào database.
  - `handoff`: Kích hoạt chuyển cuộc gọi/chat sang nhân viên tư vấn người thật (`WAITING_HUMAN`).
  - `ai_fallback`: Khi người dùng hỏi ngoài luồng kịch bản, chuyển quyền trả lời cho LLM RAG.

### 3.2. Phân hệ Kho tri thức RAG (`rag.ts` & `kb-worker.ts`)
- **Tách văn bản:** Hỗ trợ định dạng PDF, DOCX, TXT, XLSX. Cơ chế chunking cắt văn bản thành từng đoạn (300-500 từ) với overlap 50 từ để bảo toàn ngữ nghĩa biên.
- **Đánh chỉ mục:** Sử dụng `text-embedding-3-small` hoặc embedding cục bộ, lưu trữ vector 1536 chiều vào bảng `kb_chunks` có trường `embedding vector(1536)`.
- **Truy vấn:** Tính toán khoảng cách Cosine `1 - (embedding <=> query_vector)` để trích xuất Top-K đoạn tài liệu phù hợp nhất và chèn vào system prompt của Agent.

### 3.3. Phân hệ Voice AI & Streaming (`speech-split.ts`, `voice.ts`, `tts.py`)
- **Bộ đệm tách câu (`SentenceBuffer`):** Khi LLM sinh streaming token dạng SSE (Server-Sent Events), `SentenceBuffer` tích lũy token và ngắt câu ngay khi gặp dấu câu (`.`, `!`, `?`, `\n`). Nhờ đó, câu đầu tiên được gửi ngay sang dịch vụ TTS để sinh âm thanh trong khi LLM vẫn đang sinh các câu tiếp theo, giảm đáng kể độ trễ thoại.
- **Âm thanh Web Audio:** Phía Client sử dụng Web Audio API `AudioContext` và `AnalyserNode` để hiển thị visualizer dạng sóng âm trực quan (Waveform) tương ứng với biên độ âm thanh thực tế.

### 3.4. Phân hệ Đa kênh & Zalo Integration (`zalo.ts`, `channels.ts`)
- Tiếp nhận webhook sự kiện từ Zalo OA khi có người dùng quan tâm hoặc gửi tin nhắn.
- Tự động định tuyến tin nhắn đến đúng Agent phụ trách theo kênh.
- Phản hồi tin nhắn bằng OpenAPI Zalo và cập nhật trạng thái đã xem/đã gửi.

---

## 4. MA TRẬN SO SÁNH VÀ KẾ THỪA VÀO CH ACADEMY

| Tiêu chí | Dự án NEXVA AI (Tham chiếu) | Dự án CH Academy (Kế thừa & Tối ưu) | Trạng thái triển khai |
| :--- | :--- | :--- | :--- |
| **Công nghệ Backend** | Node.js (Fastify 5) + `postgres-js` | Java 21 + Spring Boot 3.5.0 + Hibernate + Flyway | Đã tích hợp trong Spring Boot |
| **Công nghệ Frontend** | Next.js 15 (App Router) + Tailwind v4 | React 19 + TypeScript + Vite + Tailwind CSS | Đã hoàn thiện toàn diện |
| **Phân vùng Cổng thông tin** | Chung 1 Tenant Workspace | Phân tách nghiêm ngặt: Public, Student, Teacher, Admin | Hoàn thiện cách ly danh tính |
| **Persona AI Agent** | 1 Agent cho toàn bộ trang | 4 Agent chuyên biệt theo từng cổng (Tư vấn, Trợ giảng, Soạn bài, Quản trị) | Hoàn thiện phân quyền & Scope |
| **Giao diện AI Studio** | 6 tab cơ bản | 11 tab chuyên sâu với thanh cuộn ngang mượt mà (`<` / `>`) | Đã hoàn thành 100% |
| **Thu thập Lead CRM** | Lưu vào bảng nội bộ `leads` | Trích xuất Regex số điện thoại VN và tự động ghi đồng bộ vào bảng CRM `leads` & `lead_activities` | Đã kiểm thử E2E thành công |
| **Chuyển giao người thật** | Cột cờ trạng thái `handoff` | Trạng thái `WAITING_HUMAN`, thông báo realtime cho bộ phận tuyển sinh | Đã cấu hình và xử lý |
| **Hiển thị Toán học & Mã nguồn** | Markdown cơ bản | `RichMarkdownRenderer` hỗ trợ công thức Toán LaTeX, bảng biểu, step badges sư phạm 6 bước | Đã tạo và tích hợp hoàn chỉnh |
| **Cuộc gọi Voice AI** | WebSocket TTS nội bộ | Web Audio API + AnalyserNode sóng âm thời gian thực + Ghi nhận lịch sử cuộc gọi | Đã tích hợp module `calls` và modal gọi |
| **Xử lý Font & Tiếng Việt** | UTF-8 mặc định Node.js | Chuẩn hóa UTF-8 toàn diện (Spring Boot, HikariCP, PostgreSQL migration V26 dứt điểm Mojibake) | Đã sửa sạch 100% dữ liệu |

---

## 5. KẾT LUẬN & ĐỊNH HƯỚNG BẢO TRÌ

Kiến trúc CH Academy đã kế thừa trọn vẹn những điểm mạnh nhất của NEXVA (thiết kế luồng, cơ chế RAG, thu thập Lead, đa kênh, Voice streaming) đồng thời bảo toàn và phát huy tối đa nền tảng cốt lõi của CH Academy (Spring Boot doanh nghiệp, cơ sở dữ liệu quan hệ chặt chẽ, phân quyền RBAC và hệ sinh thái nghiệp vụ giáo dục chuẩn mực). Hệ thống đảm bảo tính độc lập module, khả năng mở rộng không giới hạn và tính bảo mật tuyệt đối.

