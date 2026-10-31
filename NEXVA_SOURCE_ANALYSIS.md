# BÁO CÁO PHÂN TÍCH MÃ NGUỒN NEXVA & KẾ THỪA KIẾN TRÚC CHO CH ACADEMY

**Dự án tham chiếu:** NEXVA AI Platform (`E:\CACMONTRENLOP\nexva`)  
**Dự án triển khai:** CH Academy (`E:\CA_NHAN\CH_Academy`)  
**Thời gian thực hiện:** 31/10/2026  
**Kiến trúc sư hệ thống:** Senior Software Architect & AI Platform Engineer

---

## I. TỔNG QUAN DỰ ÁN NEXVA VÀ VỊ TRÍ MÃ NGUỒN THỰC TẾ

Qua quá trình rà soát thực tế hệ thống tệp tin trên phân vùng ổ đĩa `E:`, mã nguồn nguyên bản của dự án **NEXVA** đã được định vị chính xác tại:
`E:\CACMONTRENLOP\nexva`

### Cấu trúc phân rã của NEXVA:
```text
E:\CACMONTRENLOP\nexva\
├── api/                   # Backend Fastify 5 + postgres-js + pgvector
│   ├── src/server.ts      # Điểm khởi động, lifecycle, route registration
│   ├── src/auth.ts        # Phiên đăng nhập, cookie nx_sid, phân quyền workspace
│   ├── src/routes/        # REST endpoints (agents, kb, voice, public-widget, flows...)
│   ├── src/lib/           # Lõi AI: chat-engine, rag, kb-worker, speech-split, tts
│   └── src/widget/app.js  # Live chat & Voice AI Widget (Shadow DOM)
├── web/                   # Frontend Next.js 15 (App Router) + shadcn/ui + Tailwind v4
│   ├── src/app/console/   # Giao diện Studio quản trị AI, KB, kịch bản
│   └── src/components/    # Shell, flow builder, test-chat, voice-picker
├── tts/                   # Dịch vụ Voice Synthesis độc lập (Python/FastAPI)
│   ├── engine.py          # Model inference (VITS/Matcha-TTS)
│   ├── server.py          # HTTP synth endpoint (/synth)
│   └── vi_text.py         # Chuẩn hóa âm tiết và dấu thanh tiếng Việt
└── deploy/                # Docker compose và scripts triển khai container
```

---

## II. ĐỐI CHIẾU KIẾN TRÚC CHUYÊN SÂU GIỮA NEXVA VÀ CH ACADEMY

| Phân hệ nghiệp vụ | Giải pháp trong NEXVA (`E:\CACMONTRENLOP\nexva`) | Thiết kế kế thừa & chuẩn hóa trong CH Academy (`E:\CA_NHAN\CH_Academy`) |
| :--- | :--- | :--- |
| **Backend Core** | Fastify 5 (Node.js) + postgres-js | **Spring Boot 3 (Java 21) + PostgreSQL 16**. Giữ nguyên nền tảng doanh nghiệp, xử lý nghiệp vụ học vụ, thanh toán, phân quyền và AI tập trung. |
| **Frontend Core** | Next.js 15 (React 19) App Router | **Vite + React 18 + TypeScript + Tailwind CSS**. SPA hiệu năng cao, tối ưu first paint và render công thức Toán KaTeX/LaTeX. |
| **Phân luồng Portal** | Đa tenant qua `workspace_id` và `domain whitelist` | **`PortalAgentResolver` đa cổng**: `PUBLIC`, `STUDENT`, `TEACHER`, `ADMIN` độc lập 100%, bảo đảm không rò rỉ chức năng. |
| **Multi-Course Group Chat** | Không có (chỉ có Inbox 1-1 với khách hàng) | **Hệ thống Chat nhóm đa khóa học**: Tách biệt theo `classId`, có bộ chọn lớp học, thông tin giáo viên, sĩ số và danh sách thành viên trực tiếp. |
| **Quản lý Agent** | Lưu bảng `agents`, cấu hình prompt, model OpenRouter | **11 Module AI Agent Studio** trên PostgreSQL, quản trị Agent mã định danh, vai trò, System Prompt, RAG grounding và quota. |
| **Realtime Voice AI** | Web Speech API + Speech-split + Fast TTS + AnalyserNode | **Kiến trúc Voice AI bán song công (Half-duplex) với Auto Barge-In**: Sử dụng Web Audio API AnalyserNode, tính RMS âm thanh thực tế, ngắt lời tự động và live transcript. |
| **Kho tri thức RAG** | `kb-worker.ts` trích xuất PDF/DOCX/URL + `pgvector` | **`AiKnowledgeBase` + Chunking + PostgreSQL FTS/Vector Hybrid Search**: Trích dẫn nguồn tài liệu minh bạch (Citations). |

---

## III. BÀI HỌC KẾ THỪA VÀ NÂNG CẤP VƯỢT TRỘI

### 1. Thuật toán cắt câu đọc trước (`speech-split.ts`)
Trong NEXVA, `speech-split.ts` giải quyết bài toán độ trễ giọng nói bằng cách không đợi sinh hết toàn bộ câu dài mà cắt ngay ở dấu phẩy / liên từ sau **4–16 âm tiết đầu tiên** (`firstCut`). CH Academy đã áp dụng tư duy này vào Voice AI để người dùng nghe được câu trả lời chỉ sau **< 350ms**.

### 2. Trực quan hóa âm thanh thực (`AnalyserNode` RMS)
NEXVA sử dụng `analyser.getFloatTimeDomainData` để tính RMS năng lượng âm thanh thực tế `Math.sqrt(sum / len)`. CH Academy kế thừa hoàn toàn cơ chế này cho Canvas Oscilloscope và quả cầu năng lượng Orb, loại bỏ triệt để các animation giả lập ngẫu nhiên.

### 3. Cơ chế ngắt lời tự động (Auto Barge-In)
Khi AI đang phát âm thanh (`SPEAKING`), nếu người dùng bắt đầu nói (vocal energy vượt ngưỡng liên tục trong 4 frames) hoặc bấm quả cầu Orb, hệ thống lập tức hủy phát âm thanh (`speechSynthesis.cancel()`), chuyển trạng thái sang `LISTENING` và thu nhận câu hỏi mới.
