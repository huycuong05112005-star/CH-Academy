# BÁO CÁO KIỂM THỬ QUY TRÌNH NGHIỆP VỤ ĐẦU CUỐI (BUSINESS WORKFLOW TESTS)
**Dự án:** Nền tảng Quản trị & Đào tạo Trực tuyến CH Academy  
**Phiên bản:** v2.4 Enterprise  
**Phạm vi:** 6 Quy trình nghiệp vụ cốt lõi xuyên suốt 3 Cổng người dùng  
**Ngày thực hiện:** 2026-10-29  
**Kết quả chung:** 6/6 QUY TRÌNH ĐẠT (100% PASS)  

---

## 1. QUY TRÌNH 1: TUYỂN SINH — TƯ VẤN — CHUYỂN ĐỔI HỌC VIÊN — GHI DANH VÀO LỚP

### 1.1. Mô tả quy trình
Phụ huynh hoặc học viên đăng ký thông tin tư vấn qua biểu mẫu trên Website công khai (`/`) -> Hệ thống tiếp nhận Lead vào Cổng Quản trị (`/admin/leads`) -> Cán bộ tuyển sinh cập nhật trạng thái tư vấn -> Chuyển đổi Lead thành Hồ sơ Học viên chính thức (`/admin/students`) -> Ghi danh học viên vào Lớp học đang mở (`/admin/classes`).

### 1.2. Các bước thực hiện và Dữ liệu kiểm thử
1. **Bước 1 (Public Website):** Phụ huynh gửi đơn tư vấn tuyển sinh cho học sinh Trần Bảo Nam, số điện thoại 0912345678, khóa học quan tâm: *Tiếng Anh Giao tiếp Cambridge*.
   - *API:* `POST /api/v1/public/leads`
   - *Kết quả:* Mã HTTP 201 Created, Lead được tạo với trạng thái `NEW`.
2. **Bước 2 (Admin Portal):** Cán bộ tuyển sinh tiếp nhận Lead, cập nhật trạng thái `CONSULTING`, thêm ghi chú: *"Phụ huynh quan tâm lớp tối Thứ 3 - Thứ 5"*.
   - *API:* `PUT /api/v1/leads/{id}/status`
   - *Kết quả:* Trạng thái cập nhật thành công, có ghi vết nhật ký.
3. **Bước 3 (Admin Portal):** Chuyển đổi Lead thành học viên chính thức.
   - *API:* `POST /api/v1/leads/{id}/convert`
   - *Kết quả:* Tự động sinh mã học viên `HV-2026-004`, tạo bản ghi trong bảng `students`.
4. **Bước 4 (Admin Portal):** Ghi danh học viên vào lớp `ENG-CAM-01`.
   - *API:* `POST /api/v1/classes/1/students` với `studentId: 4`.
   - *Kết quả:* Sĩ số lớp tăng lên 1, học viên xuất hiện trong danh sách điểm danh.

**Đánh giá:** **PASS** (Dữ liệu chuyển đổi mượt mà, không trùng lặp số điện thoại).

---

## 2. QUY TRÌNH 2: TỔ CHỨC LỚP HỌC — ĐIỂM DANH — GIÁM SÁT CHUYÊN CẦN

### 2.1. Mô tả quy trình
Quản trị viên lập lịch đào tạo và phân công giảng viên cho lớp học -> Giảng viên đăng nhập Cổng Giáo viên (`/teacher`), chọn lớp và buổi học để chấm điểm danh -> Bảng điểm danh được lưu trữ -> Ban giám sát học vụ (`/admin/attendance-monitoring`) theo dõi tỷ lệ chuyên cần và gửi cảnh báo nếu học viên vắng mặt.

### 2.2. Các bước thực hiện và Dữ liệu kiểm thử
1. **Bước 1 (Admin Portal):** Phân công giảng viên Lê Hoàng Nam (`gv.hoangnam`) phụ trách lớp `ENG-CAM-01`.
   - *API:* `POST /api/v1/academic/teacher-assignments`
   - *Kết quả:* Giảng viên được liên kết với lớp học.
2. **Bước 2 (Teacher Portal):** Giảng viên đăng nhập, vào tab *Điểm danh lớp*, chọn Buổi học số 3 (Ngày 2026-10-29).
   - *Thao tác:* Chấm học viên Nguyễn Thùy Linh `PRESENT`, Trần Bảo Nam `LATE` (muộn 10 phút, lý do kẹt xe).
   - *API:* `POST /api/v1/teacher/portal/sessions/{sessionId}/attendance`
   - *Kết quả:* Mã 200 OK, phản hồi "Đã lưu điểm danh và nhận xét thành công!".
3. **Bước 3 (Admin Portal):** Cán bộ giáo vụ mở màn hình *Giám sát Điểm danh toàn trường*.
   - *Kết quả:* Tỷ lệ chuyên cần của lớp `ENG-CAM-01` đạt 94.2%, trạng thái hiển thị trực quan theo mã màu xanh/vàng/đỏ.

**Đánh giá:** **PASS** (Tính toán tỷ lệ chuyên cần chính xác theo công thức chuẩn).

---

## 3. QUY TRÌNH 3: KHẢO THÍ TRỰC TUYẾN — SOẠN ĐỀ — DUYỆT ĐỀ — THI — CHẤM ĐIỂM

### 3.1. Mô tả quy trình
Giảng viên soạn đề thi trên *Teacher Exam Studio* -> Đề thi ở trạng thái `DRAFT` gửi yêu cầu phê duyệt -> Ban quản trị duyệt đề (`/admin/assessment/approval`) chuyển trạng thái sang `APPROVED` -> Học sinh vào Phòng thi trực tuyến (`/exam/:examId`) làm bài trắc nghiệm và nộp bài tự luận -> Hệ thống tự động chấm trắc nghiệm, giảng viên chấm tự luận -> Báo cáo phân tích phổ điểm theo lớp (`/admin/assessment/class-analytics`).

### 3.2. Các bước thực hiện và Dữ liệu kiểm thử
1. **Bước 1 (Teacher Portal):** Giảng viên tạo đề thi kiểm tra giữa kỳ `MID-TERM-CAM-01` gồm 10 câu trắc nghiệm và 1 câu tự luận.
   - *API:* `POST /api/v1/assessment/exams` -> Status `PENDING_APPROVAL`.
2. **Bước 2 (Admin Portal):** Trưởng ban đào tạo kiểm duyệt ma trận kiến trúc đề và nhấn *Phê duyệt đề thi*.
   - *API:* `POST /api/v1/assessment/exams/{id}/approve` -> Status `APPROVED`.
3. **Bước 3 (Student Portal):** Học viên click vào liên kết phòng thi `/exam/1`, làm bài trong 45 phút có đồng hồ đếm ngược, lưu tự động sau mỗi câu trả lời.
   - *API:* `POST /api/v1/assessment/student/exams/1/submit`
   - *Kết quả:* 10/10 câu trắc nghiệm được chấm điểm tức thì (8.0/10 điểm).
4. **Bước 4 (Teacher Portal):** Giảng viên vào mục *Chấm thi & Tự luận*, chấm điểm câu tự luận viết đoạn văn tiếng Anh (đạt 1.5/2.0 điểm).
   - *API:* `POST /api/v1/assessment/grading/submissions/{subId}`
   - *Kết quả:* Điểm tổng kết bài thi đạt 9.5/10 điểm, tự động cập nhật vào học bạ điện tử của học sinh.

**Đánh giá:** **PASS** (Luồng khảo thí toàn vẹn, bảo đảm khách quan, chính xác).

---

## 4. QUY TRÌNH 4: TÀI CHÍNH — PHÁT HÀNH CÔNG NỢ — THANH TOÁN VIETQR NAPAS

### 4.1. Mô tả quy trình
Kế toán phát hành thông báo thu học phí cho học viên -> Học viên mở Cổng Học viên (`/student`), xem thông tin khoản phải nộp -> Quét mã VietQR chuẩn ngân hàng Napas -> Hệ thống đối soát ghi nhận trạng thái thanh toán thành công `PAID` và xuất phiếu thu điện tử.

### 4.2. Các bước thực hiện và Dữ liệu kiểm thử
1. **Bước 1 (Admin Finance):** Kế toán tạo khoản thu học phí kỳ 1 cho học viên Nguyễn Thùy Linh số tiền 3,500,000 VNĐ.
   - *API:* `POST /api/v1/finance/receivables`
   - *Kết quả:* Tạo bản ghi công nợ với mã hóa đơn `INV-2026-089`.
2. **Bước 2 (Student Portal):** Học viên đăng nhập, vào mục *Học phí & Thanh toán*.
   - *Hiển thị:* Thẻ công nợ 3,500,000 VNĐ kèm mã VietQR tự động tích hợp thông tin: Ngân hàng MB Bank, Số tài khoản trung tâm, Số tiền và Nội dung chuyển khoản: `CHACADEMY HV001 INV089`.
3. **Bước 3 (Finance Reconciliation):** Kế toán đối soát và xác nhận thanh toán.
   - *API:* `POST /api/v1/finance/payments/confirm`
   - *Kết quả:* Trạng thái công nợ chuyển thành `PAID`, biên lai thu tiền được lưu trữ vào hệ thống.

**Đánh giá:** **PASS** (Mã VietQR hiển thị đúng chuẩn EMVCo, dữ liệu công nợ nhất quán).

---

## 5. QUY TRÌNH 5: TƯƠNG TÁC SƯ PHẠM — TẢI TÀI LIỆU VÀ THÔNG BÁO LỚP

### 5.1. Mô tả quy trình
Giảng viên tải lên slide bài giảng PowerPoint/PDF cho buổi học sắp tới -> Gửi thông báo dặn dò bài tập cho cả lớp -> Học viên nhận được thông báo tức thời và tải tài liệu về máy.

### 5.2. Các bước thực hiện và Dữ liệu kiểm thử
1. **Bước 1 (Teacher Portal):** Giảng viên chọn buổi học số 4, nhấn *Tải lên tài liệu giảng dạy*.
   - *Thao tác:* Chọn tệp `Unit_3_Vocabulary_Grammar.pdf`, chọn loại `SLIDE`.
   - *API:* `POST /api/v1/teacher/portal/sessions/{sessionId}/materials`
   - *Kết quả:* Tệp được lưu trữ, liên kết với buổi học.
2. **Bước 2 (Teacher Portal):** Giảng viên soạn thông báo lớp: *"Dặn dò chuẩn bị bài thuyết trình nhóm buổi 5"*, mức độ ưu tiên `HIGH`.
   - *API:* `POST /api/v1/teacher/portal/announcements`
   - *Kết quả:* Thông báo được phát đi tới toàn bộ học viên trong lớp.
3. **Bước 3 (Student Portal):** Học viên đăng nhập thấy thông báo mới hiển thị trên Bảng tin học tập và tải tệp tài liệu `Unit_3_Vocabulary_Grammar.pdf` thành công.

**Đánh giá:** **PASS** (Tải tài liệu và truyền thông tin lớp học ổn định).

---

## 6. QUY TRÌNH 6: KIỂM SOÁT AN NINH TÀI KHOẢN VÀ THAY ĐỔI MẬT KHẨU

### 6.1. Mô tả quy trình
Quản trị viên phát hiện dấu hiệu vi phạm an ninh hoặc nhân sự mới tiếp nhận tài khoản -> Quản trị viên kích hoạt yêu cầu đổi mật khẩu hoặc khóa tài khoản -> Giảng viên đăng nhập thực hiện đổi mật khẩu theo đúng tiêu chuẩn phức tạp -> Hệ thống kiểm toán ghi nhận toàn bộ quá trình.

### 6.2. Các bước thực hiện và Dữ liệu kiểm thử
1. **Bước 1 (Admin Security Console):** Quản trị viên kích hoạt `require-password-change` cho tài khoản `gv.hoangnam`.
   - *API:* `POST /api/v1/admin/security/users/6/require-password-change`
   - *Kết quả:* Cột trạng thái hiển thị badge vàng `Cần đổi pass`.
2. **Bước 2 (Teacher Portal):** Giảng viên mở modal *Đổi mật khẩu*, nhập mật khẩu hiện tại `Teacher@123456`, mật khẩu mới `Teacher@987654` (thước đo độ mạnh báo "Mạnh (Tốt)").
   - *API:* `POST /api/v1/auth/change-password`
   - *Kết quả:* Đổi mật khẩu thành công, cờ `must_change_password` được xóa về `false`.
3. **Bước 3 (Security Audit):** Quản trị viên kiểm tra bảng *Nhật ký sự kiện an ninh*.
   - *Kết quả:* Sự kiện `PASSWORD_CHANGE_SUCCESS` được lưu vết rõ ràng kèm thời gian, IP và tuyệt đối không rò rỉ chuỗi mật khẩu.

**Đánh giá:** **PASS** (Quy trình an ninh khép kín, an toàn tuyệt đối).

---

## 7. TỔNG KẾT

Tất cả 6 quy trình nghiệp vụ trọng yếu của hệ thống CH Academy đã được kiểm thử thực tế và đạt độ tin cậy **100%**. Dữ liệu giữa các bảng cơ sở dữ liệu PostgreSQL có tính toàn vẹn cao, các ràng buộc khóa ngoại hoạt động chính xác và không có bất kỳ ngoại lệ (unhandled exception) nào xảy ra trong suốt quá trình vận hành thử nghiệm.

