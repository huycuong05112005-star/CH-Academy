# BÁO CÁO TÍCH HỢP GEN AI CHAT BOX TỪ NỀN TẢNG NEXVA
**Dự án:** CH Academy  
**Cập nhật:** 31/10/2026

---

## 1. NGUYÊN LÝ KẾ THỪA TỪ DỰ ÁN NEXVA

Từ việc mổ xẻ mã nguồn `E:\CACMONTRENLOP\nexva`, CH Academy đã kế thừa và tinh gọn các tinh hoa công nghệ:
1. **Chat Engine & System Prompt Guardrails (`chat-engine.ts`):**
   - Thiết lập nguyên tắc: AI chỉ trả lời bằng tiếng Việt, súc tích, trung thực, **tuyệt đối không bịa đặt** dữ liệu không có trong cơ sở dữ liệu.
2. **Quản lý ngữ cảnh động theo danh tính thực (Role-Aware Context Injection):**
   - Không dựa vào vai trò từ trình duyệt gửi lên. Backend Spring Boot giải mã JWT token để lấy `User` hợp lệ và tự động truy vấn dữ liệu nghiệp vụ thời gian thực.
3. **Mô hình kết hợp (Hybrid Engine):**
   - **Chế độ LLM ngoài:** Hỗ trợ kết nối OpenRouter (`OPENROUTER_API_KEY`) với các model hiện đại: `google/gemini-2.5-flash`, `openai/gpt-4.1-mini`.
   - **Chế độ Dynamic Knowledge Engine nội bộ:** Tự động phản hồi chuẩn xác các câu hỏi về lớp học, học phí, lịch học, giảng viên phụ trách và quy chế trung tâm dựa trên live database nếu chưa cấu hình API key bên ngoài.
4. **Trích dẫn nguồn tri thức (Source Citations):**
   - Mỗi câu trả lời của trợ lý AI đều đính kèm danh mục nguồn tài liệu tham chiếu (Tên văn bản, Điều khoản, Trích đoạn).

---

## 2. NỘI DUNG TƯ VẤN CÁ NHÂN HÓA THEO VAI TRÒ

### 2.1. Học viên (Student)
- *Câu hỏi mẫu:* "Tôi đang học những lớp nào?", "Kiểm tra học phí của tôi", "Lịch học ca tiếp theo?", "Quy định chuyên cần".
- *Phản hồi thực tế:* Truy vấn trực tiếp từ `enrollments`, `classes`, `receivables`. Báo đúng mã lớp `CLS-ENG-PRO01`, giảng viên Lê Hoàng Nam, tỷ lệ học phí 100% hoàn tất và quy chế chuyên cần $\ge 80\%$.

### 2.2. Giảng viên (Teacher)
- *Nội dung:* Danh sách các lớp được phân công, lịch dạy sắp tới, danh sách học viên trong lớp, hướng dẫn nghiệp vụ chấm thi.

### 2.3. Quản trị viên (Admin)
- *Nội dung:* Thống kê học viên toàn trường, số lượng lớp học đang vận hành, tỷ lệ chuyên cần và số liệu khảo thí.

---

## 3. DANH MỤC API BACKEND GEN AI (`GenAiChatController.java`)

- `GET /api/v1/chat/ai/conversations`: Lấy danh sách lịch sử hội thoại với Trợ lý AI.
- `GET /api/v1/chat/ai/conversations/{id}/messages`: Lấy các lượt hỏi - đáp của cuộc hội thoại.
- `POST /api/v1/chat/ai/ask`: Gửi câu hỏi cho Trợ lý AI, nhận câu trả lời kèm danh sách nguồn trích dẫn.

---

## 4. BẢO MẬT VÀ AN TOÀN DỮ LIỆU
- API key AI chỉ lưu ở biến môi trường backend, không bao giờ lộ ra frontend.
- Không truyền mật khẩu, password hash hoặc access token vào prompt AI.
- Có cơ chế chặn prompt injection (Guardrails) để AI không thực thi các yêu cầu vượt thẩm quyền.

