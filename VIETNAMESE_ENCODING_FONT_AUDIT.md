# BÁO CÁO KIỂM TOÁN MÃ HÓA KÝ TỰ & FONT CHỮ TIẾNG VIỆT (VIETNAMESE ENCODING AUDIT)

**Tài liệu:** `VIETNAMESE_ENCODING_FONT_AUDIT.md`  
**Ngày thực hiện:** 31 tháng 10 năm 2026  
**Dự án:** Hệ thống CH Academy  
**Trạng thái kiểm toán:** Đạt chuẩn 100% UTF-8 không lỗi vỡ ký tự (Zero Mojibake)  

---

## 1. NGUYÊN NHÂN GỐC CỦA HIỆN TƯỢNG VỠ FONT (MOJIBAKE)

Trước đợt kiểm toán, hệ thống ghi nhận một số chuỗi ký tự tiếng Việt bị hiển thị sai dạng:
- Trong bảng `ai_agents`: `"Trá»£ giÃ£ng AI Äá»“ng hÃ nh"`, `"Trá»£ giÃ£ng Luyá»‡n giao tiáº¿p & Ngá»¯ phÃ¡p"`.
- Trong bảng `leads` & `ai_leads`: `"VÅ© HoÃ ng Minh"`, `"Tiáº¿ng Anh Giao Tiáº¿p Doanh Nghiá»‡p"`.

### Phân tích nguyên nhân kỹ thuật:
1. **Lỗi Double-Encoding (Mã hóa lặp):** Khi chèn dữ liệu ban đầu, chuỗi ký tự UTF-8 được gửi qua một Client connection sử dụng bảng mã mặc định Windows-1252 hoặc ISO-8859-1. Dẫn tới việc mỗi byte UTF-8 bị hiểu lầm thành một ký tự đơn của bảng mã Latin-1 và sau đó lại được lưu ngược vào PostgreSQL dạng UTF-8.
2. **Thiếu ràng buộc `CLIENT_ENCODING` trên Connection Pool HikariCP:** Driver JDBC mặc định không tự động gửi lệnh `SET CLIENT_ENCODING TO 'UTF8'`, dẫn đến việc kết nối phụ thuộc vào biến môi trường hệ điều hành máy chủ host.

---

## 2. GIẢI PHÁP KHẮC PHỤC TRIỆT ĐỂ TOÀN TẦNG (FULL-STACK UTF-8 FIX)

### 2.1. Tầng Cơ sở Dữ liệu & Flyway Migration (V26)
Hệ thống đã triển khai tập lệnh migration `V26__Fix_Mojibake_And_Ai_Platform_Schema.sql` để ghi đè toàn bộ dữ liệu lỗi bằng các chuỗi Unicode thuần túy:
```sql
-- Chuẩn hóa tên và mô tả cho toàn bộ 7 AI Agents
UPDATE ai_agents SET 
    name = 'Trợ giảng AI Đồng hành',
    description = 'Hỗ trợ học viên giải bài tập, luyện phản xạ và giải đáp kiến thức chuyên sâu.',
    scope = 'STUDENT_TUTOR'
WHERE code = 'AGENT_STUDENT_TUTOR';

UPDATE ai_agents SET 
    name = 'Trợ giảng Luyện giao tiếp & Ngữ pháp',
    description = 'Chuyên sâu luyện phát âm, sửa lỗi ngữ pháp tiếng Anh theo chuẩn quốc tế.',
    scope = 'STUDENT_TUTOR'
WHERE code = 'AGENT_STUDENT_ENGLISH';
```

Đồng thời, toàn bộ các bản ghi khách hàng trong bảng `leads` và `ai_leads` đã được cập nhật dứt điểm:
```sql
UPDATE leads SET 
    full_name = 'Vũ Hoàng Minh', 
    notes = 'Đăng ký tư vấn tự động qua Trợ lý Tuyển sinh AI CH Academy. Khóa học quan tâm: Tiếng Anh Giao Tiếp Doanh Nghiệp.' 
WHERE id IN (8, 9);

UPDATE ai_leads SET 
    full_name = 'Vũ Hoàng Minh', 
    course_interest = 'Tiếng Anh Giao Tiếp Doanh Nghiệp' 
WHERE id IN (3, 4);
```

### 2.2. Tầng Backend Spring Boot (`application.properties`)
Thiết lập cưỡng bức mã hóa UTF-8 trên mọi kết nối và giao thức HTTP:
```properties
# Ép buộc mã hóa UTF-8 cho kết nối PostgreSQL JDBC
spring.datasource.url=jdbc:postgresql://localhost:5432/ch_academy?characterEncoding=UTF-8
spring.datasource.hikari.connection-init-sql=SET CLIENT_ENCODING TO 'UTF8'

# Ép buộc Servlet Filter UTF-8 cho Request và Response
server.servlet.encoding.charset=UTF-8
server.servlet.encoding.force=true
server.servlet.encoding.force-request=true
server.servlet.encoding.force-response=true
```

Trong Java Service (`AiStudioService.java`), luồng đọc tệp tải lên cũng được chỉ định rõ ràng bộ giải mã UTF-8:
```java
try (java.io.InputStream is = file.getInputStream();
     BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
    content = reader.lines().collect(Collectors.joining("\n"));
}
```

### 2.3. Tầng Giao diện Frontend & Bộ Font
- Tệp `index.html` chứa thẻ `<meta charset="UTF-8" />`.
- Cấu hình font chữ sử dụng các họ font Google Fonts hỗ trợ đầy đủ bộ ký tự dấu tiếng Việt (`Vietnamese subset`):
  - `Inter`: Dành cho văn bản giao diện chung, bảng biểu và nút bấm.
  - `Plus Jakarta Sans`: Dành cho tiêu đề lớn (Headings) và bảng chỉ số Dashboard.
  - `JetBrains Mono`: Dành cho các khối mã nguồn và công thức toán học.

---

## 3. KẾT QUẢ KIỂM TRA ĐỐI SOÁT THỰC TẾ

1. **Kiểm tra Truy vấn Database trực tiếp:**
   - Đã thực hiện `SELECT id, name, scope FROM ai_agents;` -> 100% hiển thị tiếng Việt có dấu chuẩn xác: `"Chuyên viên Tư vấn Tuyển sinh AI"`, `"Trợ giảng AI Đồng hành"`, `"Trợ lý Giảng dạy & Soạn bài"`.
   - Đã thực hiện `SELECT id, full_name, phone FROM leads;` -> `"Vũ Hoàng Minh"`, `"Trần Hoàng Nam"`, `"Nguyễn Ngọc Thanh Trúc"` hiển thị hoàn hảo.
2. **Kiểm tra API JSON Response:**
   - Gọi `GET /api/v1/admin/ai/agents` trả về `Content-Type: application/json;charset=UTF-8`.
   - Gọi `POST /api/v1/chat/ai/public/ask` trả về câu trả lời với đầy đủ dấu tiếng Việt chuẩn mực, không còn bất kỳ ký tự dị biệt nào.

