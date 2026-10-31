# BÁO CÁO PHÂN TÍCH KIẾN TRÚC THAM CHIẾU TIÊU CHUẨN & THIẾT KẾ ĐỘC LẬP CH ACADEMY

**Tài liệu:** `AI_BENCHMARK_ANALYSIS.md`  
**Dự án:** CH Academy — Nền tảng Giáo dục & Hệ sinh thái AI Agent Toàn diện  
**Trạng thái:** Dự án độc lập (Independent Platform)  

---

## 1. TỔNG QUAN VỀ MÔ HÌNH THAM CHIẾU KIẾN TRÚC
Để xây dựng một hệ sinh thái AI Agent chuyên nghiệp, hiện đại và chuẩn mực cho CH Academy, đội ngũ kỹ thuật đã tiến hành phân tích các kiến trúc tham chiếu tiêu chuẩn trong ngành (Industry Benchmark Architecture) dành cho hệ thống AI Agent đa kênh:
- **Kiến trúc phân tách đa tầng:** Tách bạch hoàn toàn giữa Lớp trình diễn (Web/Widget UI), Lớp cổng nghiệp vụ (API Gateway & Backend Runtime), Lớp xử lý dữ liệu thông minh (RAG Engine & Vector Store) và Lớp truyền thông âm thanh thời gian thực (Real-time Audio Engine).
- **Nguyên tắc độc lập:** CH Academy kế thừa những tri thức tinh hoa về thiết kế luồng, đồng thời kiên định giữ vững nền tảng công nghệ doanh nghiệp cốt lõi: **Java 21, Spring Boot, PostgreSQL và React TypeScript**.

---

## 2. ĐỐI CHIẾU THIẾT KẾ GIỮA MÔ HÌNH THAM CHIẾU VÀ CH ACADEMY

| Phân hệ nghiệp vụ | Mô hình Tham chiếu Tiêu chuẩn | Kiến trúc Độc lập của CH Academy |
| :--- | :--- | :--- |
| **Công nghệ Backend** | Node.js Fastify xử lý I/O bất đồng bộ | **Java 21 + Spring Boot 3.5**, kiến trúc hướng dịch vụ (Service-Oriented Architecture), bảo mật cao cấp với Spring Security & JWT, dữ liệu quan hệ chặt chẽ với Hibernate JPA & Flyway. |
| **Phân vùng Không gian & Danh tính** | Mô hình chia sẻ session đơn giản | **Hệ thống phân tách 4 không gian độc lập tuyệt đối**: `PUBLIC`, `STUDENT`, `TEACHER`, `ADMIN`. Mỗi cổng có Agent chuyên biệt và bảo vệ dữ liệu chéo bằng phân quyền RBAC. |
| **Voice AI & Âm thanh** | Web Speech STT + SSE audio streaming | **Real-time Dual Engine Voice Pipeline**: Thu âm 48kHz, tính toán RMS & Decibels thật, VAD Debounce 900ms chống mất chữ, TTS phát âm theo hàng đợi phân đoạn câu tiếng Việt và tích hợp chế độ Debug Telemetry. |
| **Kho tri thức & RAG** | Băm theo trang và embedding | **Phân cấp tri thức 4 cấp độ truy cập** (`PUBLIC`, `INTERNAL`, `TEACHER_ONLY`, `ADMIN_ONLY`), phân đoạn chunks chuẩn xác, kiểm soát trích dẫn nguồn (Source Citations) minh bạch. |
| **Hội thoại Lớp học** | Hội thoại 1-1 đơn kênh giữa Khách và Bot | **Multi-Course Class Group Chat**: Hỗ trợ trao đổi nhiều thành viên theo lớp học, kiểm tra ghi danh (`enrollments`), phân công giảng dạy (`assignments`) và bộ chuyển nhóm lớp linh hoạt. |

---

## 3. CÁC NGUYÊN TẮC THIẾT KẾ ĐỘC LẬP CỦA CH ACADEMY
1. **Tính độc lập công nghệ:** Không phụ thuộc vào bất kỳ framework mã nguồn đóng hoặc hệ thống bên ngoài nào. Mọi nghiệp vụ giáo dục, tuyển sinh, đào tạo và quản trị đều được tối ưu chuyên biệt cho CH Academy.
2. **Bảo mật và toàn vẹn dữ liệu:** Toàn bộ lịch sử hội thoại, thông tin học viên, bảng điểm và học phí được lưu trữ an toàn trong cơ sở dữ liệu PostgreSQL của CH Academy, có kiểm toán và phân quyền nghiêm ngặt.
3. **Mở rộng bền vững:** Kiến trúc module hóa cho phép bổ sung thêm các kênh giao tiếp mới (như Zalo OA, Mobile App, Tổng đài VoIP) mà không ảnh hưởng đến các nghiệp vụ lõi đang vận hành.
