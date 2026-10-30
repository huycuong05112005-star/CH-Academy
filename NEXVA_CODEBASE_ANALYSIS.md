# BÁO CÁO PHÂN TÍCH TOÀN BỘ MÃ NGUỒN NEXVA (GEN AI CHAT PLATFORM)
**Dự án tham chiếu:** Nexva AI Agent  
**Đường dẫn mã nguồn:** `E:\CACMONTRENLOP\nexva`  
**Mục tiêu phân tích:** Bóc tách kiến trúc, quy trình xử lý hội thoại, RAG, LLM Engine và đánh giá phương án tích hợp vào nền tảng CH Academy.

---

## 1. BẢN ĐỒ CÔNG NGHỆ & CẤU TRÚC NEXVA

### 1.1. Cấu trúc tổng thể
```
nexva/
├── api/                  # Backend Fastify 5 + Node.js 22 + postgres-js + pgvector
│   ├── src/
│   │   ├── server.ts     # Khởi tạo server, nạp routes, tự động chạy migration
│   │   ├── auth.ts       # Quản lý phiên cookie nx_sid, RBAC workspace
│   │   ├── routes/       # public-widget.ts, kb.ts, inbox.ts, agents.ts, auth.ts...
│   │   ├── lib/          # chat-engine.ts, rag.ts, llm.ts, google-ai.ts, kb-worker.ts...
│   │   └── migrations/   # 10 file SQL migrations (schema, vector, voice, flows...)
├── web/                  # Frontend Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
│   ├── src/
│   │   ├── components/app/test-chat.tsx  # Giao diện Chat trực quan, SSE streaming
│   │   └── lib/api.ts                    # HTTP client giao tiếp với backend
└── deploy/               # Docker compose, kịch bản deployment
```

### 1.2. Cơ chế AI & Luồng một tin nhắn (Chat Message Flow)
1. **Tiếp nhận tin nhắn:** Client gửi tin nhắn qua SSE hoặc REST endpoint (`/api/agents/{id}/test` hoặc `/api/public/widget/chat`).
2. **Quản lý ngữ cảnh (Context Building - `chat-engine.ts`):**
   - Thu thập lịch sử trò chuyện gần nhất.
   - Trích xuất thông tin người dùng (`ContactInfo`).
   - Tìm kiếm tri thức liên quan (`rag.ts` $\rightarrow$ truy vấn các chunks tương đồng từ `kb_chunks`).
   - Xây dựng System Prompt với quy tắc ứng xử (Persona, Guardrails chống bịa đặt thông tin).
3. **Gọi mô hình ngôn ngữ lớn (LLM Engine - `llm.ts` / `google-ai.ts`):**
   - Hỗ trợ OpenRouter (GPT-4.1 mini, Gemini 2.5 Flash, Gemini 2.5 Flash Lite) và máy chủ AI nội bộ (Gemma, Qwen qua vLLM).
   - Truyền tải phản hồi dạng **Server-Sent Events (SSE)** theo thời gian thực (từng chunk chữ).
4. **Lưu trữ lịch sử:** Lưu tin nhắn của người dùng và phản hồi của trợ lý vào cơ sở dữ liệu.

---

## 2. ĐÁNH GIÁ 3 PHƯƠNG ÁN TÍCH HỢP VÀO CH ACADEMY

| Tiêu chí | Phương án A: Module hóa trực tiếp trong Spring Boot (ĐƯỢC CHỌN) | Phương án B: Chạy Microservice Node.js độc lập | Phương án C: Nhúng Widget iframe / Web Component |
|---|---|---|---|
| **Hiệu năng & Tài nguyên** | **Tối ưu nhất:** 1 JVM, 1 Database connection pool, không tốn thêm RAM/CPU | Tốn thêm 1 Node container, latency mạng nội bộ giữa 2 service | Nhẹ cho backend nhưng phân mảnh trải nghiệm UI |
| **Tính toàn vẹn dữ liệu** | **100% ACID:** Đồng bộ thành viên chat nhóm ngay trong Transaction ghi danh của Spring Boot | Cần cơ chế HTTP Webhook/gRPC dễ gặp race condition hoặc timeout | Khó kiểm soát quyền và đồng bộ lớp |
| **Bảo mật & Phân quyền** | Dùng trực tiếp JWT & SecurityContextHolder hiện có của CH Academy | Phải duy trì xác thực liên dịch vụ (Service-to-Service Secret) | Rủi ro lộ endpoint hoặc token |
| **Dữ liệu nghiệp vụ động** | Truy vấn trực tiếp các Repository (Lịch học, điểm số, học phí) ngay trong backend | Phải gọi vòng ngược lại API Spring Boot | Không thể truy xuất dữ liệu cá nhân hóa |
| **Độ phức tạp bảo trì** | Đơn giản, 1 bộ mã nguồn thống nhất, 1 CI/CD | Phải bảo trì 2 backend khác nhau (Java + Node) | UI không đồng bộ phong cách với 3 theme |

> **Quyết định kiến trúc:**  
> **LỰA CHỌN PHƯƠNG ÁN A.** CH Academy tiếp tục duy trì Java Spring Boot làm backend duy nhất và React Vite làm frontend duy nhất. Logic Chat Engine, RAG và tương tác LLM được kế thừa nguyên lý từ Nexva nhưng chuyển ngữ thành Spring Boot Service chuẩn mực, an toàn và đồng bộ tối đa với nghiệp vụ đào tạo.

