# KIẾN TRÚC HỆ THỐNG AI AGENT ĐA PHÂN HỆ — CH ACADEMY

**Tài liệu kỹ thuật:** AI Agent Ecosystem & Studio Architecture  
**Phiên bản:** 2.0  
**Ngày cập nhật:** 31/10/2026  

---

## I. MÔ THỨC QUẢN LÝ AGENT

Mỗi AI Agent trong hệ thống CH Academy là một thực thể độc lập được định nghĩa trong cơ sở dữ liệu (`ai_agents`), có chu kỳ phát triển và vận hành (Lifecycle):
`DRAFT` ➔ `TESTING` ➔ `PUBLISHED` ➔ `ARCHIVED`.

### Cấu trúc dữ liệu AI Agent:
- `id`: Định danh khóa chính.
- `code`: Mã định danh bất biến (`AGENT_ADMISSIONS`, `AGENT_STUDENT_TUTOR`, `AGENT_TEACHER_ASSISTANT`, `AGENT_ADMIN_ASSISTANT`).
- `name`: Tên hiển thị người dùng.
- `scope`: Phạm vi phục vụ (`PUBLIC_ADMISSION`, `STUDENT_TUTOR`, `TEACHER_ASSISTANT`, `ADMIN_ASSISTANT`).
- `systemPrompt`: Kịch bản điều hướng tư duy, nguyên tắc phản hồi và phong cách sư phạm.
- `model`: Mô hình nền tảng (Gemini 1.5 Pro / Flash, GPT-4o, Claude 3.5 Sonnet qua cấu hình runtime).
- `temperature`: Độ sáng tạo kiểm soát từ 0.0 đến 1.0 (mặc định 0.3 cho Gia sư và Tuyển sinh để chống ảo giác).
- `knowledgeBaseId`: Liên kết tới kho tri thức RAG riêng biệt.
- `quotaLimit`: Định mức sử dụng token/lượt hỏi mỗi ngày.

---

## II. BỐN ĐẠI DIỆN AGENT CỐT LÕI

### 1. `AGENT_ADMISSIONS` (Chuyên viên Tư vấn Tuyển sinh AI)
- **Khu vực hoạt động:** Trang chủ công khai (`PUBLIC`).
- **Nhiệm vụ:** Tư vấn khóa học, cung cấp thông tin học phí niêm yết, lịch khai giảng.
- **Tích hợp CRM:** Tự động phát hiện thông tin liên hệ của khách hàng (Họ tên, SĐT, Email, Nhu cầu) và đồng bộ trực tiếp vào bảng `ai_leads` để bộ phận tuyển sinh chăm sóc ngay.

### 2. `AGENT_STUDENT_TUTOR` (AI Gia sư - Trợ lý Học tập)
- **Khu vực hoạt động:** Cổng học viên (`STUDENT`).
- **Nhiệm vụ:**
  - Hướng dẫn giải bài tập theo **Quy trình 6 bước sư phạm Socratic** (Không đưa đáp án trực tiếp mà đặt câu hỏi gợi mở, phân tích dữ kiện, định hướng phương pháp, hỗ trợ tính toán, kiểm tra kết quả và tổng kết bài học).
  - Kết xuất công thức Toán/Lý/Hóa dưới dạng KaTeX/LaTeX chuẩn xác (`\frac{a}{b}`, `\sqrt{x}`, `\int f(x)dx`).
  - Hỗ trợ sửa lỗi phát âm và ngữ pháp tiếng Anh.

### 3. `AGENT_TEACHER_ASSISTANT` (Trợ lý Giảng dạy & Soạn bài)
- **Khu vực hoạt động:** Cổng giảng viên (`TEACHER`).
- **Nhiệm vụ:** Soạn giáo án, tạo ngân hàng câu hỏi trắc nghiệm/tự luận, tóm tắt tài liệu môn học và gợi ý bài tập nâng cao/bổ trợ.

### 4. `AGENT_ADMIN_ASSISTANT` (Trợ lý Quản trị & Vận hành)
- **Khu vực hoạt động:** Cổng quản trị (`ADMIN`).
- **Nhiệm vụ:** Báo cáo chỉ số tuyển sinh, tỷ lệ chuyên cần các lớp, tổng hợp học phí/công nợ và tình trạng hoạt động hệ thống.
