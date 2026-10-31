# CH ACADEMY — HỆ SINH THÁI ĐA NĂM HỌC THỐNG NHẤT
## Tài liệu 07: Hướng dẫn Vận hành Quản trị Năm học (Operations & Administration Guide)

---

## 1. QUY TRÌNH THIẾT LẬP NĂM HỌC MỚI

Khi chuẩn bị bước vào năm học mới (VD: năm học 2027-2028), Quản trị viên thực hiện theo các bước chuẩn:

1. **Bước 1: Khởi tạo năm học mới**
   - Vào Admin Portal -> Cài đặt hệ thống -> Quản lý Năm học (`/admin/settings`).
   - Nhấn "Thêm Năm học", điền thông tin:
     - Mã năm học: `2027-2028`
     - Tên năm học: `Năm học 2027 - 2028`
     - Thời gian bắt đầu: `01/09/2027` | Kết thúc: `31/05/2028`
     - Thời gian mở cổng đăng ký: `01/07/2027` đến `15/09/2027`
     - Trạng thái ban đầu: `PLANNING` (Lập kế hoạch).

2. **Bước 2: Thiết lập khung chương trình và mở lớp học**
   - Vào menu "Lớp học & Lịch" (`/admin/classes`).
   - Chọn năm học `2027-2028`.
   - Tạo các lớp học mới cho năm học này (VD: `REACT-2701`, `AI-2701`).
   - Phân công Giảng viên phụ trách cho từng lớp.

3. **Bước 3: Mở cổng đăng ký và kích hoạt năm học hiện hành**
   - Chuyển trạng thái năm học sang `ACTIVE`.
   - Nhấn "Đặt làm năm học hiện tại" (`Set as Current`). Hệ thống sẽ tự động cập nhật cờ `is_current = true` cho năm học 2027-2028.
   - Kể từ thời điểm này, học viên đăng nhập vào Student Portal sẽ thấy các lớp của năm 2027-2028 khả dụng để đăng ký.

---

## 2. QUY TRÌNH XÉT DUYỆT ĐƠN ĐĂNG KÝ HỌC

1. Quản trị viên truy cập menu **"Duyệt Đăng ký Khóa học"** (`/admin/enrollment-requests`).
2. Màn hình hiển thị danh sách đơn chờ duyệt kèm các thông tin:
   - Tên học viên, Mã học viên, Email.
   - Tên lớp học, Môn học, Niên khóa.
   - Ngày nộp đơn, Nguyện vọng ghi chú của học viên.
3. Thao tác duyệt:
   - Nhấn nút **"Phê duyệt"**: Nhập mức giảm học phí (nếu có) và ghi chú duyệt -> Nhấn "Xác nhận duyệt".
   - Hệ thống tự động kích hoạt ghi danh, nhóm chat và công nợ học phí.
4. Thao tác từ chối:
   - Nhấn nút **"Từ chối"**: Bắt buộc nhập lý do từ chối -> Nhấn "Xác nhận từ chối".

---

## 3. QUY TRÌNH KẾT THÚC VÀ ĐÓNG NĂM HỌC (YEAR-END CLOSING)

1. Khi năm học kết thúc (toàn bộ học phần đã hoàn thành):
   - Quản trị viên vào Cài đặt Năm học.
   - Chọn năm học cần đóng và nhấn **"Đóng năm học"** (`Close Academic Year`).
   - Trạng thái năm học chuyển sang `CLOSED`. Hệ thống tự động đóng quyền đăng ký mới, bảo toàn điểm số và kết quả thi.
2. Lưu trữ năm học (`Archive Academic Year`):
   - Sau thời gian kiểm toán tài chính và cấp chứng chỉ hoàn thành, năm học chuyển sang trạng thái `ARCHIVED` để bảo lưu dữ liệu vĩnh viễn.

---

## 4. XỬ LÝ NGOẠI LỆ THƯỜNG GẶP (TROUBLESHOOTING)

| Vấn đề | Nguyên nhân | Hướng xử lý |
| :--- | :--- | :--- |
| Học viên không thấy nút "Đăng ký" | Năm học chưa đến ngày `registration_start_date` hoặc đã qua `registration_end_date` | Kiểm tra thời gian đăng ký trong Cài đặt Năm học và điều chỉnh lại ngày mở cổng |
| Báo lỗi "Không thể xóa năm học" | Đã có lớp học hoặc đơn đăng ký liên kết với năm học này | Quy tắc an toàn dữ liệu không cho xóa năm học đã có dữ liệu. Nên chọn "Đóng" hoặc "Lưu trữ" |
| Học viên đã duyệt nhưng chưa thấy nhóm chat | Socket chưa nhận được event đồng bộ | Yêu cầu học viên tải lại trang hoặc mở lại khung chat để kích hoạt refresh membership |
