# BÁO CÁO NÂNG CẤP TRẢI NGHIỆM NGƯỜI DÙNG AI AGENT STUDIO
**Tài liệu:** `AI_AGENT_STUDIO_UX_REPORT.md`  
**Ngày thực hiện:** 31/10/2026  
**Thực hiện:** Đội ngũ Kỹ thuật CH Academy  

---

## 1. MỤC TIÊU CẢI TIẾN TRẢI NGHIỆM (UX/UI)
Trước đợt nâng cấp, giao diện AI Agent Studio có các hạn chế:
- Form tạo Agent là một form đơn giản, chưa tách lớp tham số mô hình (LLM Engine, Temperature, Top-P, Max Tokens).
- Các thao tác thông báo sử dụng trình duyệt mặc định `alert()`, gây gián đoạn trải nghiệm người dùng.
- Chưa cho phép kiểm tra trực tiếp các phân đoạn văn bản (Chunks) được băm từ tài liệu RAG.
- Chưa có giao diện đọc lại chi tiết tin nhắn của từng phiên hội thoại.

---

## 2. CÁC TÍNH NĂNG MỚI ĐÃ ĐƯỢC TÍCH HỢP

### 2.1. Modal Cấu hình Agent Đa Tab Chuyên nghiệp (Multi-tab Agent Configurator)
Giao diện tạo và chỉnh sửa Agent được phân tách thành 4 tab trực quan:
1. **Tab 1 — Thông tin chung:**
   - Tên Agent (bắt buộc).
   - Mã Agent định danh (Code: tự động in hoa chuẩn format `AGENT_*`).
   - Cổng phục vụ chuyên trách (Portal: `PUBLIC`, `STUDENT`, `TEACHER`, `ADMIN`).
   - Mô tả chức năng và switch kích hoạt/xuất bản hệ thống (`isPublished`).
2. **Tab 2 — Model & Tham số chuyên sâu:**
   - LLM Engine selector (`google/gemini-2.5-flash`, `google/gemini-2.5-pro`, `anthropic/claude-3-5-sonnet`).
   - Thanh trượt điều chỉnh nhiệt độ (Temperature slider từ 0.0 đến 1.0, hiển thị giá trị số thực).
   - Số lượng Tokens tối đa (Max Output Tokens: 256 - 8192).
   - Top-P sampling slider (0.1 - 1.0).
   - Badge bảo chứng cơ chế **Chống ảo giác (Anti-Hallucination)** khóa theo CSDL trung tâm.
3. **Tab 3 — System Prompt & Hành vi ứng xử:**
   - System Prompt dạng multiline với font mono hiển thị rõ quy chế, cách xưng hô và giới hạn câu trả lời.
   - Lời chào khởi đầu tự động (Welcome Message).
   - Gợi ý câu hỏi nhanh (Quick Prompts) phân tách bằng dấu chấm phẩy.
4. **Tab 4 — Kho tri thức liên kết (Knowledge Bases):**
   - Danh sách checkbox các Kho tri thức hiện có kèm mã và cấp độ truy cập (`PUBLIC`, `INTERNAL`, `TEACHER_ONLY`, `ADMIN_ONLY`).

### 2.2. Modal Quản lý & Soi Chunks RAG (Chunk Inspection)
- Khi quản trị viên bấm nút **"Xem Chunks"** trên danh sách tài liệu:
  - Hệ thống mở modal phân cấp hiển thị số lượng chunks đã được tạo.
  - Từng chunk hiển thị rõ số thứ tự Chunk #N, độ dài ký tự và nội dung trích xuất.
  - Cung cấp khu vực xem văn bản thô trích xuất từ file (Raw Text) cho các tệp TXT, PDF, DOCX.
  - Nút **"Re-index"** cho phép kích hoạt quy trình phân đoạn lại ngay lập tức khi tài liệu được cập nhật.

### 2.3. Modal Xem chi tiết Tin nhắn Hội thoại (Conversation Messages Inspection)
- Bấm nút **"Xem tin nhắn"** tại Tab Hội thoại:
  - Tải toàn bộ danh sách hội thoại của phiên gồm tin nhắn Người dùng (User message) và phản hồi của Trợ lý AI (Assistant message).
  - Hiển thị mốc thời gian chi tiết (Timestamp), huy hiệu cổng và trạng thái điều phối (Handoff status).

### 2.4. Hệ thống Toast Notification Hiện đại
- Thay thế 100% lệnh `window.alert()` bằng Floating Toast banner tại góc dưới bên phải màn hình:
  - Màu xanh lục (`bg-emerald-600`) cho trạng thái thành công (tạo agent, upload tài liệu, re-index).
  - Màu đỏ (`bg-rose-600`) cho thông báo lỗi.
  - Tự động đóng sau 4 giây, không chặn tương tác người dùng.

### 2.5. Tích hợp AI Voice Call Modal ngay trong Agent Sandbox Playground
- Bổ sung nút **"Thử thoại với Agent"** kế bên nút làm mới hội thoại.
- Cho phép quản trị viên test trực tiếp khả năng nghe nói tiếng Việt hai chiều của Agent đã chọn.
