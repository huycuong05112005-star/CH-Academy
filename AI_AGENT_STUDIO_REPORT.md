# BÁO CÁO TRIỂN KHAI TRANG AI AGENT STUDIO — CH ACADEMY

**Dự án:** CH Academy  
**Đường dẫn truy cập:** `/admin/ai-studio` (Cổng Quản trị Admin)  
**Quyền truy cập:** `ROLE_ADMIN`, `ROLE_SUPER_ADMIN`

---

## 1. GIỚI THIỆU & MỤC TIÊU

Trang **AI Agent Studio** là trung tâm chỉ huy độc lập được tích hợp vào Cổng Quản trị của CH Academy. Trang này cho phép Ban Giám đốc và Quản trị viên:
* Tạo, chỉnh sửa, nhân bản và xuất bản các AI Agent phục vụ từng đối tượng người dùng.
* Quản lý Kho tri thức (Knowledge Bases), tải lên và phân đoạn tài liệu tự động (Document Chunking Pipeline).
* Trực quan hóa và xây dựng kịch bản hội thoại theo từng bước (Conversation Flow Builder).
* Quản lý trạng thái kết nối đa kênh (Website Widget, Zalo OA, Voice Call).
* Kiểm thử Agent trực tiếp trên môi trường Sandbox (Playground).
* Kiểm toán lịch sử hội thoại toàn hệ thống và tiếp quản chuyển giao tư vấn viên (Human Handoff).

---

## 2. KIẾN TRÚC 10 SUB-TABS CHỨC NĂNG

### Tab 1: Tổng quan AI (Overview)
* **KPI Cards:** Tổng số Agent đang hoạt động, Kho tri thức, Tài liệu đã lập chỉ mục, Số lượng Leads thu thập, Cuộc trò chuyện đang chờ nhân viên tiếp nhận.
* **Sơ đồ 4 Trụ cột Agent:** Trình bày trực quan nhiệm vụ của từng Agent theo 4 cổng phân quyền.

### Tab 2: Quản lý Agent (Agent Manager)
* Hiển thị danh sách Agent dạng thẻ card hiện đại với các chỉ số: Mã Agent, Phiên bản (`v1`, `v2`), Model LLM, Kho tri thức liên kết và trạng thái (`PUBLISHED`, `DRAFT`, `PAUSED`).
* **Modal Cấu hình Agent:** Cho phép đặt tên, mô tả, vai trò phục vụ (`PUBLIC`, `STUDENT`, `TEACHER`, `ADMIN`), chọn Model, viết System Prompt, chọn Kho tri thức và thiết lập Temperature/Max Tokens.
* **Tính năng Nhân bản (Clone):** Tạo bản sao Agent chỉ với một click để thử nghiệm prompt mà không ảnh hưởng Agent đang chạy.
* **Xóa & Chuyển trạng thái:** Kiểm soát toàn bộ vòng đời Agent an toàn.

### Tab 3 & 4: Kho tri thức & Tài liệu phân đoạn (KB & Document Pipeline)
* Quản lý 4 Kho tri thức chuẩn:
  1. `KB_ADMISSIONS`: Tuyển sinh & Khóa học (Cấp độ `PUBLIC`)
  2. `KB_ACADEMIC_RULES`: Nội quy & Quy chế đào tạo (Cấp độ `INTERNAL`)
  3. `KB_TEACHING_GUIDES`: Giáo án & Nghiệp vụ sư phạm (Cấp độ `TEACHER_ONLY`)
  4. `KB_ADMIN_PROCEDURES`: Quy trình vận hành & Tài chính (Cấp độ `ADMIN_ONLY`)
* **Upload tài liệu đa định dạng:** Hỗ trợ PDF, DOCX, XLSX, CSV, TXT.
* **Quy trình xử lý tự động (Chunking Pipeline):**
  $$\text{Tải lên} \longrightarrow \text{Kiểm tra tệp} \longrightarrow \text{Trích xuất UTF-8} \longrightarrow \text{Chia đoạn 500 ký tự} \longrightarrow \text{Ghi bảng } \mathtt{ai\_kb\_chunks} \longrightarrow \mathtt{INDEXED}$$
* Hiển thị trạng thái tài liệu, kích thước tệp, số lượng chunks và nút xóa tài liệu an toàn.

### Tab 5: Kịch bản hội thoại (Conversation Flow Builder)
* Thiết kế trực quan các bước hội thoại đánh số (`B1` đến `B7`) lấy cảm hứng từ cấu trúc của Nexva:
  * `B1 - Bắt đầu (start)`: Kích hoạt khi có tin nhắn mới.
  * `B2 - Lời chào (message)`: Lời chào tự động thân thiện.
  * `B3 - Khảo sát (question)`: Xác định nhu cầu khóa học của học viên/khách hàng.
  * `B4 - Tra cứu tri thức (kb_lookup)`: Truy xuất tài liệu biểu phí và ưu đãi.
  * `B5 - Thu thập thông tin (lead_capture)`: Ghi nhận số điện thoại vào bảng `ai_leads`.
  * `B6 - Chuyển tư vấn viên (handoff)`: Đổi trạng thái `WAITING_HUMAN` khi khách yêu cầu.
  * `B7 - Kết thúc (end)`: Đóng phiên trò chuyện.
* Bộ kiểm tra tính hợp lệ (Validation Engine): Đảm bảo kịch bản luôn bắt đầu bằng nút `start` và không có vòng lặp vô hạn.

### Tab 6: Kênh kết nối (Channels Management)
* Quản lý 3 nhóm kênh chính:
  * **Website Widget:** Đang hoạt động trên trang chủ và tất cả các trang công khai.
  * **Zalo Official Account:** Đã hoàn thiện cấu trúc API và Webhook Controller, sẵn sàng kết nối và được đánh dấu `BLOCKED - Cần cấu hình OA Secret`.
  * **AI Voice:** Đang hoạt động trên trình duyệt qua Web Speech API (STT & TTS tiếng Việt).

### Tab 7: Kiểm thử Sandbox (Agent Playground)
* Cửa sổ tương tác thử nghiệm cho phép Quản trị viên chat trực tiếp với bất kỳ Agent nào trong hệ thống.
* Trực quan hóa nguồn trích dẫn dữ liệu (Citations) và nội dung phản hồi theo thời gian thực.

### Tab 8: Lịch sử hội thoại & Human Handoff
* Danh sách toàn bộ các cuộc hội thoại trong hệ thống kèm phân loại cổng (`ADMIN`, `TEACHER`, `STUDENT`, `PUBLIC`).
* Đánh dấu huy hiệu màu đỏ nổi bật cho các cuộc hội thoại `WAITING_HUMAN` để nhân viên kịp thời tiếp nhận.

### Tab 9 & 10: Phân tích & Cấu hình Model
* Thống kê số lượng tokens ước tính tiêu thụ, độ trễ trung bình (380ms) và thiết lập cơ chế khóa chống ảo giác dữ liệu (Anti-Hallucination Lock).
