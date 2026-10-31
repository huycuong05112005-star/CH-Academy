# BÁO CÁO CHỐNG ẢO GIÁC & TÍNH CHUẨN XÁC CỦA TRI THỨC AI (ANTI-HALLUCINATION & RAG)
**Tài liệu:** `AI_KNOWLEDGE_ACCURACY_REPORT.md`  
**Ngày thực hiện:** 31/10/2026  
**Dự án:** CH Academy  

---

## 1. NGUYÊN TẮC CHỐNG ẢO GIÁC (GROUNDING PRINCIPLES)
Để đảm bảo uy tín của trung tâm đào tạo, Trợ lý AI tuyệt đối không được phép tự nghĩ ra các thông tin không có thực:
- Không được bịa đặt học phí, chính sách giảm giá nếu không có trong cơ sở dữ liệu hoặc tài liệu tuyển sinh.
- Không được bịa đặt lịch học, ca thi nếu lớp học chưa được lên lịch.
- Khi người dùng hỏi về một khóa học hoặc chương trình đào tạo không có trong hệ thống: **AI phải lịch sự thông báo trung tâm hiện chưa cung cấp chương trình đó**, đồng thời gợi ý các khóa học có sẵn liên quan.

---

## 2. KỸ THUẬT RÀNG BUỘC THEO CƠ SỞ DỮ LIỆU THỰC TẾ (REAL-TIME DB GROUNDING)

### 2.1. Thay thế hoàn toàn dữ liệu tĩnh bằng truy vấn Spring Data JPA
Trong `GenAiChatService.java`:
- Đã loại bỏ hoàn toàn các chuỗi văn bản tĩnh.
- Tiêm phụ thuộc `CourseRepository` và `ClassRepository`.
- Khi khách hàng hoặc học viên đặt câu hỏi, phương thức `buildDynamicContext(role, portal, user)` tự động truy vấn:
  ```java
  List<Course> courses = courseRepository.findAll();
  List<ClassEntity> classes = classRepository.findAll();
  ```
- Định dạng danh mục khóa học chuẩn vào System Prompt:
  - Mã khóa học (`code`).
  - Tên khóa học (`name`).
  - Học phí chuẩn (`tuitionFee` định dạng VNĐ).
  - Cấp độ (`level`), thời lượng (`durationWeeks` tuần).
  - Số lớp đang mở và phòng học tương ứng.

### 2.2. Kịch bản phản hồi từ chối an toàn (Polite Rejection)
Nếu câu hỏi của người dùng đề cập đến môn học không có trong hệ thống (ví dụ: "Luyện thi tiếng Pháp DALF", "Khóa học nấu ăn"):
- Thuật toán kiểm tra từ khóa môn học đối chiếu với danh mục khóa học trong CSDL.
- Nếu không có bất kỳ khóa học nào khớp, AI phản hồi:
  > *"Hiện tại CH Academy chưa có khóa học đào tạo này trong hệ thống đào tạo chính thức. Các chương trình giảng dạy hiện hành của trung tâm bao gồm: Tiếng Anh Trẻ Em (ENG-KID-01), Tiếng Anh Giao Tiếp Doanh Nghiệp (ENG-COMM-PRO), Luyện thi IELTS Cấp tốc (IELTS-INTENSIVE), Phân tích Dữ liệu Python cơ bản (PY-DATA-BASICS). Thầy cô và các bạn có thể tham khảo hoặc để lại số điện thoại để chuyên viên tư vấn hỗ trợ lộ trình phù hợp!"*

---

## 3. CƠ CHẾ RAG (RETRIEVAL-AUGMENTED GENERATION) & PHÂN ĐOẠN TÀI LIỆU (CHUNKING)
1. **Trích xuất nội dung văn bản:**
   - Hỗ trợ các định dạng: `.txt`, `.csv`, `.docx`, `.pdf`.
   - Sử dụng `BufferedReader` với mã hóa chuẩn `StandardCharsets.UTF_8` để bảo toàn dấu tiếng Việt.
2. **Thuật toán Chunking thông minh:**
   - Kích thước đoạn (Chunk size): ~500 ký tự với độ gối đầu (Overlap): 50 ký tự để không bị mất ngữ cảnh giữa các đoạn.
   - Mỗi Chunk được đánh chỉ mục và lưu vào bảng `ai_kb_chunks`.
3. **Trích dẫn nguồn minh bạch (Source Citations):**
   - Khi câu trả lời được hình thành từ tài liệu RAG, AI gửi kèm danh sách trích dẫn nguồn gồm: tên tài liệu (`documentName`), phân đoạn liên quan (`section`) để người dùng có thể đối chiếu.
