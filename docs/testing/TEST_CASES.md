# DANH MỤC TEST CASES CHI TIẾT (CH ACADEMY TEST CATALOG)

## Quy ước trạng thái Test Case:
- **PASS**: Đã thực thi tự động hoặc thủ công và đạt 100% kết quả mong đợi.
- **FAIL**: Có sai khác giữa kết quả thực tế và kết quả mong đợi.
- **BLOCKED**: Bị chặn do thiếu tài nguyên ngoại vi (ví dụ: API Key dịch vụ ngoài) hoặc phụ thuộc bên thứ ba.
- **NOT TESTED**: Chưa đưa vào lịch trình thực thi của đợt kiểm thử hiện tại.

---

## 1. Public Homepage & Navigation

### TC-PUB-001: Hiển thị Trang chủ công khai và Logo nhận diện
- **Mục tiêu:** Xác minh người dùng chưa đăng nhập có thể truy cập trang chủ, thấy đầy đủ thương hiệu CH Academy, hiệu ứng LED và các liên kết điều hướng.
- **Dữ liệu đầu vào:** URL: `http://localhost:5173/`
- **Các bước thực hiện:**
  1. Mở trình duyệt đến địa chỉ trang chủ `/`.
  2. Kiểm tra phần tử nhận diện thương hiệu `CH Academy`.
  3. Kiểm tra sự xuất hiện của nút "Đăng nhập" hoặc "Bắt đầu ngay".
- **Kết quả mong đợi:** Trang chủ hiển thị đầy đủ, không xuất hiện màn hình trắng hoặc lỗi JavaScript Console.
- **Kết quả thực tế:** Trang chủ tải trong < 1 giây, thương hiệu hiển thị rõ ràng, banner hero section đầy đủ.
- **Trạng thái:** **PASS**

### TC-PUB-002: Điều hướng đến Trang Khóa học công khai
- **Mục tiêu:** Khách vãng lai xem được danh mục các khóa học đang tuyển sinh.
- **Dữ liệu đầu vào:** URL: `/courses`
- **Các bước thực hiện:**
  1. Từ trang chủ, bấm vào liên kết "Khóa học" trên Navigation bar.
  2. Xác minh URL chuyển hướng thành `/courses`.
  3. Kiểm tra danh sách thẻ khóa học được render.
- **Kết quả mong đợi:** Danh mục khóa học được hiển thị từ API hoặc dữ liệu mẫu công khai.
- **Kết quả thực tế:** Trang danh sách khóa học hiển thị thẻ học phần, chi tiết học phí và thời lượng.
- **Trạng thái:** **PASS**

### TC-PUB-003: Điều hướng đến Trang Giới thiệu (About)
- **Mục tiêu:** Người dùng xem thông tin giới thiệu về trung tâm học thuật.
- **Dữ liệu đầu vào:** URL: `/about`
- **Các bước thực hiện:**
  1. Bấm liên kết "Giới thiệu" trên thanh điều hướng.
  2. Xác minh trang giới thiệu và các giá trị cốt lõi.
- **Kết quả mong đợi:** Tải thông tin giới thiệu thành công.
- **Kết quả thực tế:** Trang giới thiệu hiển thị đầy đủ nội dung.
- **Trạng thái:** **PASS**

### TC-PUB-004: Xác thực Form Đăng ký tư vấn tuyển sinh
- **Mục tiêu:** Kiểm tra form đăng ký nhận tư vấn từ học viên tiềm năng (Leads).
- **Dữ liệu đầu vào:** Họ tên: "Nguyễn Văn Test", SĐT: "0987654321", Khóa học quan tâm.
- **Các bước thực hiện:**
  1. Tìm form đăng ký tư vấn tại trang chủ hoặc trang khóa học.
  2. Nhập các trường thông tin hợp lệ.
  3. Bấm "Gửi đăng ký".
- **Kết quả mong đợi:** Form hiển thị thông báo tiếp nhận thành công, dữ liệu được ghi nhận vào Lead Pipeline.
- **Kết quả thực tế:** Form hiển thị thông báo ghi nhận thành công.
- **Trạng thái:** **PASS**

---

## 2. Authentication & Authorization Flows

### TC-AUTH-001: Kiểm tra Giao diện Đăng nhập Hệ thống
- **Mục tiêu:** Form đăng nhập có đầy đủ trường Tên đăng nhập / Email, Mật khẩu, Nút ẩn/hiện mật khẩu và Nút Đăng nhập.
- **Dữ liệu đầu vào:** URL: `/login`
- **Các bước thực hiện:**
  1. Truy cập `/login`.
  2. Kiểm tra input `username`, `password`, submit button.
- **Kết quả mong đợi:** Form đăng nhập hiển thị đúng chuẩn UX/UI của trung tâm.
- **Kết quả thực tế:** Các trường input, nút bấm và icon hiển thị hoàn chỉnh.
- **Trạng thái:** **PASS**

### TC-AUTH-002: Báo lỗi khi Nhập sai Mật khẩu
- **Mục tiêu:** Hệ thống từ chối xác thực và hiển thị cảnh báo khi nhập sai mật khẩu.
- **Dữ liệu đầu vào:** Username: `admin`, Password: `WrongPassword999!`
- **Các bước thực hiện:**
  1. Nhập username `admin`.
  2. Nhập mật khẩu sai.
  3. Bấm "Đăng nhập hệ thống".
- **Kết quả mong đợi:** Hiển thị thông báo lỗi (Banner màu đỏ hoặc toast alert) cho biết thông tin đăng nhập không hợp lệ; không điều hướng vào trong.
- **Kết quả thực tế:** Alert hiển thị lỗi xác thực ngay lập tức, người dùng vẫn ở trang `/login`.
- **Trạng thái:** **PASS**

### TC-AUTH-003: Đăng nhập Thành công với Quyền Quản trị viên (Admin)
- **Mục tiêu:** Đăng nhập tài khoản Admin và chuyển hướng tự động đến Admin Dashboard.
- **Dữ liệu đầu vào:** Username: `admin`, Password: `Admin@123456`
- **Các bước thực hiện:**
  1. Nhập tài khoản và mật khẩu admin.
  2. Nhấn submit.
  3. Theo dõi chuyển hướng URL.
- **Kết quả mong đợi:** Nhận JWT Token hợp lệ, lưu vào LocalStorage/Cookie, chuyển hướng đến `/admin/dashboard`.
- **Kết quả thực tế:** Đăng nhập thành công, URL chuyển hướng đến `/admin/dashboard`, thanh điều hướng quản trị viên hiển thị.
- **Trạng thái:** **PASS**

### TC-AUTH-004: Đăng nhập Thành công với Quyền Giáo viên (Teacher)
- **Mục tiêu:** Đăng nhập tài khoản Giáo viên và chuyển hướng đến Cổng Giáo viên (Teacher Portal).
- **Dữ liệu đầu vào:** Username: `gv.minhhanh`, Password: `Teacher@123456`
- **Các bước thực hiện:**
  1. Đăng xuất hoặc dùng phiên ẩn danh.
  2. Nhập tài khoản giáo viên.
  3. Nhấn Đăng nhập.
- **Kết quả mong đợi:** Chuyển hướng đến `/teacher` hoặc `/teacher/classes`.
- **Kết quả thực tế:** Chuyển hướng chính xác đến `/teacher`, hiển thị giao diện dành riêng cho giảng viên.
- **Trạng thái:** **PASS**

### TC-AUTH-005: Đăng nhập Thành công với Quyền Học viên (Student)
- **Mục tiêu:** Đăng nhập tài khoản Học viên và chuyển hướng đến Cổng Học viên (Student Portal).
- **Dữ liệu đầu vào:** Username: `thuylinh.nguyen@gmail.com`, Password: `Student@123456`
- **Các bước thực hiện:**
  1. Nhập tài khoản học viên.
  2. Nhấn Đăng nhập.
- **Kết quả mong đợi:** Chuyển hướng đến `/student`, hiển thị tiến độ học tập và khóa học đã ghi danh.
- **Kết quả thực tế:** Chuyển hướng chính xác đến `/student`.
- **Trạng thái:** **PASS**

---

## 3. Admin Portal & Dashboard Metrics

### TC-ADM-001: Hiển thị Thẻ Thống kê Tổng quan (Metrics Cards)
- **Mục tiêu:** Admin Dashboard hiển thị đầy đủ các chỉ số: Tổng học viên, Lớp học đang hoạt động, Tỷ lệ điểm danh, Doanh thu và Công nợ.
- **Dữ liệu đầu vào:** Đăng nhập Admin, truy cập `/admin/dashboard`.
- **Các bước thực hiện:**
  1. Kiểm tra các thẻ thống kê tổng quan (Học viên, Lớp học, Giảng viên, Doanh thu).
  2. Kiểm tra bộ chọn Niên khóa (Academic Year Selector: 2025-2026, 2026-2027).
- **Kết quả mong đợi:** Số liệu render đúng từ API `/api/v1/dashboard/stats`, không có giá trị NaN hay null.
- **Kết quả thực tế:** Các thẻ KPI hiển thị số liệu chính xác, biểu đồ tài chính render mượt mà.
- **Trạng thái:** **PASS**

### TC-ADM-002: Điều hướng Quản lý Lớp học (Class Management)
- **Mục tiêu:** Quản trị viên truy cập trang quản lý lớp học, xem danh sách lớp và trạng thái.
- **Dữ liệu đầu vào:** Click menu "Lớp học" -> URL: `/admin/classes`
- **Các bước thực hiện:**
  1. Bấm vào mục Lớp học trên thanh bên.
  2. Xác minh bảng danh sách lớp học được tải.
- **Kết quả mong đợi:** Bảng hiển thị danh sách lớp, sĩ số, giáo viên phụ trách và phòng học.
- **Kết quả thực tế:** Tải danh sách lớp thành công, đầy đủ công cụ lọc và tìm kiếm.
- **Trạng thái:** **PASS**

### TC-ADM-003: Điều hướng Quản lý Khóa học (Course Management)
- **Mục tiêu:** Quản trị viên truy cập danh mục khóa học để xem học phần và mức học phí.
- **Dữ liệu đầu vào:** Click menu "Khóa học" -> URL: `/admin/courses`
- **Các bước thực hiện:**
  1. Bấm vào mục Khóa học.
  2. Xác minh danh sách khóa học.
- **Kết quả mong đợi:** Hiển thị mã khóa học, số buổi, học phí và mô tả.
- **Kết quả thực tế:** Danh mục khóa học hiển thị chính xác.
- **Trạng thái:** **PASS**

---

## 4. RBAC & Zero-Trust Role Isolation

### TC-RBAC-001: Học viên bị Chặn khi Cố tình Truy cập Admin Portal
- **Mục tiêu:** Ngăn chặn leo thang đặc quyền (Privilege Escalation), học viên không được xem thông tin quản trị.
- **Dữ liệu đầu vào:** Session đăng nhập: `thuylinh.nguyen@gmail.com` (ROLE_STUDENT). Cố truy cập URL: `http://localhost:5173/admin/dashboard`
- **Các bước thực hiện:**
  1. Đăng nhập với tài khoản học viên.
  2. Gõ trực tiếp địa chỉ `/admin/dashboard` trên thanh địa chỉ trình duyệt.
- **Kết quả mong đợi:** Router Guard chặn truy cập, chuyển hướng về `/student` hoặc trang lỗi 403 Forbidden.
- **Kết quả thực tế:** Hệ thống chặn ngay lập tức, chuyển hướng người dùng an toàn về `/student`.
- **Trạng thái:** **PASS**

### TC-RBAC-002: Giáo viên chỉ Truy cập các Lớp học được Phân công
- **Mục tiêu:** Giáo viên không được can thiệp vào lớp học của giáo viên khác.
- **Dữ liệu đầu vào:** Session: `gv.minhhanh` (ROLE_TEACHER).
- **Các bước thực hiện:**
  1. Đăng nhập tài khoản giáo viên.
  2. Vào cổng `/teacher/classes`.
  3. Kiểm tra danh sách lớp hiển thị.
- **Kết quả mong đợi:** Chỉ hiển thị các lớp có `teacherId` tương ứng với giáo viên đang đăng nhập.
- **Kết quả thực tế:** API `/api/v1/teacher/classes` lọc đúng phạm vi lớp học được phân công.
- **Trạng thái:** **PASS**

### TC-RBAC-003: Học viên chỉ Truy cập Khóa học đã Đăng ký
- **Mục tiêu:** Bảo vệ tài nguyên nội dung học tập, chỉ học viên đã đóng học phí và được duyệt mới xem được bài giảng.
- **Dữ liệu đầu vào:** Session học viên, kiểm tra endpoint `/api/v1/student/enrollments`.
- **Các bước thực hiện:**
  1. Đăng nhập học viên.
  2. Vào cổng cá nhân kiểm tra "Khóa học của tôi".
- **Kết quả mong đợi:** Chỉ xuất hiện khóa học đã ghi danh thành công.
- **Kết quả thực tế:** Danh sách khóa học được lọc chính xác theo `studentId`.
- **Trạng thái:** **PASS**

---

## 5. Security & Vulnerability Defense

### TC-SEC-001: Phòng chống SQL Injection trên Trường Tìm kiếm & Đăng nhập
- **Mục tiêu:** Xác minh hệ thống sử dụng Parameterized Queries (JPA / Hibernate PreparedStatements), miễn nhiễm với các payload injection kinh điển.
- **Dữ liệu đầu vào:** Payload: `' OR '1'='1' --`, `admin' #`, `1 UNION SELECT null, username, password FROM users--`
- **Các bước thực hiện:**
  1. Nhập payload SQLi vào trường tìm kiếm lớp/học viên và trường username form đăng nhập.
  2. Gửi request.
- **Kết quả mong đợi:** Backend xử lý an toàn dưới dạng chuỗi thuần túy (string literal), không phát sinh lỗi cú pháp SQL (SQLSyntaxErrorException), không rò rỉ dữ liệu ngoài ý muốn.
- **Kết quả thực tế:** Backend trả về thông báo không tìm thấy hoặc đăng nhập sai hợp lệ, không có lỗi 500 hay SQL dump.
- **Trạng thái:** **PASS**

### TC-SEC-002: Kiểm tra XSS Protection (Cross-Site Scripting)
- **Mục tiêu:** Đảm bảo React DOM tự động escape chuỗi nguy hiểm, không thực thi mã JavaScript độc hại.
- **Dữ liệu đầu vào:** Payload: `<script>alert('XSS')</script>`, `<img src=x onerror=alert(1)>`
- **Các bước thực hiện:**
  1. Thử nhập payload vào ô ghi chú hoặc họ tên học viên.
  2. Render lại phần tử trên giao diện.
- **Kết quả mong đợi:** Payload hiển thị dưới dạng văn bản plain text, không có popup alert hay script injection nào được kích hoạt.
- **Kết quả thực tế:** Mã HTML được escape an toàn, không có script execution.
- **Trạng thái:** **PASS**

### TC-SEC-003: Giám sát Trung tâm An ninh Zero-Trust (Security Center)
- **Mục tiêu:** Quản trị viên theo dõi được các nhật ký kiểm toán SIEM (các nỗ lực brute-force, truy cập trái quyền, vi phạm rate-limit).
- **Dữ liệu đầu vào:** URL: `/admin/security`
- **Các bước thực hiện:**
  1. Đăng nhập Admin, vào "Trung tâm An ninh".
  2. Kiểm tra bảng danh sách sự cố an ninh (Audit Logs).
- **Kết quả mong đợi:** Hiển thị các sự kiện an ninh được ghi nhận với mã sự cố, mức độ nghiêm trọng (Thấp, Trung bình, Nghiêm trọng) và trạng thái khắc phục.
- **Kết quả thực tế:** Bảng sự cố an ninh hiển thị đầy đủ các bản ghi kiểm toán bảo mật, trạng thái COMPLIANT.
- **Trạng thái:** **PASS**

---

## 6. AI Agent Studio & Voice Conversation

### TC-AI-001: AI Studio Tab Switching & Workflow Navigation
- **Mục tiêu:** Quản trị viên có thể chuyển đổi mượt mà giữa các tab chuyên môn trong AI Studio: Overview, Agents, Knowledge Base (KB), Documents, Flows, Channels, Playground, Conversations, Voice Calls, Analytics và Settings.
- **Dữ liệu đầu vào:** URL: `/admin/ai-studio`
- **Các bước thực hiện:**
  1. Mở AI Studio.
  2. Click chuyển tuần tự qua các tab: "Trợ lý AI", "Kho tri thức", "Quy trình Flows", "Playground".
- **Kết quả mong đợi:** Giao diện chuyển tab mượt mà, không gặp lỗi TypeScript Type Overlap hoặc crash component.
- **Kết quả thực tế:** Chuyển đổi tab lập tức, state giao diện được lưu trữ trọn vẹn.
- **Trạng thái:** **PASS**

### TC-AI-002: AI RAG Knowledge Base Retrieval
- **Mục tiêu:** AI trợ lý trả lời thông tin học thuật dựa trên tài liệu đã được nạp (Vector Embeddings), không bịa đặt khi thiếu tài liệu.
- **Dữ liệu đầu vào:** Câu hỏi: "Lịch thi giữa kỳ khóa IELTS Intensive diễn ra khi nào?"
- **Các bước thực hiện:**
  1. Đặt câu hỏi trong cửa sổ chat AI.
  2. Kiểm tra câu trả lời có trích dẫn nguồn tài liệu đã index.
- **Kết quả mong đợi:** AI trích xuất nội dung từ tài liệu trung tâm để phản hồi chính xác.
- **Kết quả thực tế:** Trợ lý AI trả lời dựa trên context đã nạp vào Knowledge Base.
- **Trạng thái:** **PASS**

### TC-AI-003: Phân định Trạng thái Dịch vụ Voice AI Thực tế (Live Diagnostics)
- **Mục tiêu:** Xác minh hệ thống xử lý trung thực trạng thái kết nối Voice AI ngoại vi. Nếu thiếu API Key (như Gemini Live API / OpenRouter), hệ thống phải phát hiện và ghi nhận trạng thái **BLOCKED** thay vì giả lập PASS.
- **Dữ liệu đầu vào:** Gọi endpoint kiểm tra chẩn đoán: `/api/v1/chat/ai/voice/diagnostics`
- **Các bước thực hiện:**
  1. Kiểm tra cấu hình môi trường hiện tại đối với biến môi trường API Key bên ngoài.
  2. Gọi API diagnostics hoặc mở giao diện Voice AI.
- **Kết quả mong đợi:** Khi thiếu API key thật, hệ thống phản hồi `configured: false` và hiển thị hướng dẫn cấu hình; kiểm thử ghi nhận `BLOCKED` minh bạch.
- **Kết quả thực tế:** Backend trả về `configured: false`, Playwright E2E xác nhận cơ chế chẩn đoán hoạt động chính xác và ghi nhận trạng thái kiểm thử là **BLOCKED (Requires external API Key)**.
- **Trạng thái:** **BLOCKED** *(Chờ cấp External API Key trong môi trường Production/Staging)*

---

## 7. Multi-Academic-Year, Finance & Examination

### TC-YEAR-001: Cô lập Dữ liệu Thống kê theo Niên khóa (Academic Year Scoping)
- **Mục tiêu:** Thay đổi niên khóa (ví dụ: `2025-2026` sang `2026-2027`) sẽ cập nhật số liệu học viên, lớp học và doanh thu tương ứng mà không làm xáo trộn dữ liệu niên khóa khác.
- **Dữ liệu đầu vào:** Dropdown niên khóa chọn `2025-2026` rồi chuyển sang `2026-2027`.
- **Các bước thực hiện:**
  1. Tại Dashboard, chuyển niên khóa.
  2. Quan sát request gửi lên `/api/v1/dashboard/stats?academicYear=2026-2027`.
- **Kết quả mong đợi:** Dữ liệu trả về đúng phạm vi năm học đã chọn.
- **Kết quả thực tế:** Bộ lọc niên khóa hoạt động hoàn hảo, tài khoản người dùng được lưu giữ xuyên năm học.
- **Trạng thái:** **PASS**

### TC-FIN-001: Quản lý Công nợ & Học phí Học viên
- **Mục tiêu:** Thống kê tổng phải thu, đã thu và công nợ tồn đọng của trung tâm.
- **Dữ liệu đầu vào:** Module Tài chính `/admin/finance`.
- **Các bước thực hiện:**
  1. Truy cập mục Tài chính.
  2. Kiểm tra danh sách biên lai thu học phí.
- **Kết quả mong đợi:** Số tiền hiển thị định dạng VND chính xác, trạng thái Đã thu / Chưa thu rõ ràng.
- **Kết quả thực tế:** Dữ liệu tài chính hiển thị chính xác.
- **Trạng thái:** **PASS**

### TC-EXAM-001: Quản lý Kỳ thi & Bảng điểm
- **Mục tiêu:** Giáo viên nhập điểm, học viên xem được kết quả thi của chính mình.
- **Dữ liệu đầu vào:** Module Kỳ thi `/teacher/exams` và `/student/grades`.
- **Các bước thực hiện:**
  1. Giáo viên nhập điểm cho lớp phụ trách.
  2. Học viên đăng nhập kiểm tra bảng điểm.
- **Kết quả mong đợi:** Điểm số được lưu trữ vào database và hiển thị tức thời cho học viên.
- **Kết quả thực tế:** Luồng quản lý điểm và kỳ thi hoạt động trơn tru.
- **Trạng thái:** **PASS**
