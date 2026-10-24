# Đặc Tả REST API - CH Academy

> **Base URL:** `/api/v1`  
> **Định dạng dữ liệu:** JSON (`application/json`)  
> **Xác thực:** Bearer Token (`Authorization: Bearer <JWT>`)

---

## 1. Chuẩn Phản Hồi API (Standard API Response)

### Thành công (Success Response)
```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": { ... },
  "timestamp": "2026-10-24T10:15:30Z"
}
```

### Danh sách có phân trang (Paged Response)
```json
{
  "success": true,
  "message": "Thành công",
  "data": {
    "content": [ ... ],
    "page": 0,
    "size": 10,
    "totalElements": 42,
    "totalPages": 5,
    "first": true,
    "last": false
  },
  "timestamp": "2026-10-24T10:15:30Z"
}
```

### Lỗi (Error Response)
```json
{
  "success": false,
  "message": "Thông tin đầu vào không hợp lệ",
  "errorCode": "VALIDATION_FAILED",
  "errors": {
    "phone": "Số điện thoại không hợp lệ (định dạng VN: 10 chữ số)"
  },
  "timestamp": "2026-10-24T10:15:30Z"
}
```

---

## 2. Danh Sách Endpoint Đã Triển Khai Thực Tế

### Module 1: Xác thực & Tài khoản (`/api/v1/auth`)
- `POST /api/v1/auth/login`: Đăng nhập với username & password, trả về JWT & user info.
- `GET /api/v1/auth/me`: Lấy thông tin tài khoản đang đăng nhập kèm roles và permissions.
- `POST /api/v1/auth/change-password`: Đổi mật khẩu tài khoản.
- `POST /api/v1/auth/logout`: Đăng xuất (xóa token phía client).

### Module 2: Khóa học & Danh mục (`/api/v1/courses`, `/api/v1/course-categories`, `/api/v1/public/courses`)
- `GET /api/v1/public/courses/featured`: Lấy danh sách khóa học nổi bật hiển thị trang chủ.
- `GET /api/v1/public/courses`: Tìm kiếm và lọc khóa học công khai (`keyword`, `categoryId`, `targetAudience`, `page`, `size`).
- `GET /api/v1/public/courses/{id}`: Xem chi tiết khóa học công khai.
- `GET /api/v1/public/courses/categories`: Danh sách danh mục khóa học đang hoạt động.
- `GET /api/v1/courses`: Danh sách quản trị khóa học có phân trang & tìm kiếm.
- `GET /api/v1/courses/{id}`: Chi tiết khóa học nội bộ.
- `POST /api/v1/courses`: Tạo khóa học mới (`SUPER_ADMIN`, `CENTER_ADMIN`, `ACADEMIC_STAFF`).
- `PUT /api/v1/courses/{id}`: Cập nhật thông tin khóa học.
- `PATCH /api/v1/courses/{id}/status`: Cập nhật trạng thái (`ACTIVE`, `SUSPENDED`, `ARCHIVED`).
- `DELETE /api/v1/courses/{id}`: Xóa khóa học khi chưa phát sinh lớp học.
- `GET /api/v1/course-categories`: Danh sách danh mục khóa học nội bộ.
- `POST /api/v1/course-categories`: Tạo danh mục khóa học mới.

### Module 3: Học viên & Người giám hộ (`/api/v1/students`, `/api/v1/guardians`)
- `GET /api/v1/students`: Danh sách học viên có phân trang, lọc theo từ khóa, trạng thái, đối tượng (`KIDS`/`ADULTS`).
- `GET /api/v1/students/{id}`: Chi tiết hồ sơ học viên kèm người giám hộ.
- `POST /api/v1/students`: Tạo hồ sơ học viên mới (hỗ trợ tạo kèm người giám hộ đối với trẻ em).
- `PUT /api/v1/students/{id}`: Cập nhật hồ sơ học viên.
- `GET /api/v1/guardians`: Danh sách người giám hộ.
- `POST /api/v1/guardians`: Thêm người giám hộ độc lập.
- `POST /api/v1/students/{id}/guardians`: Liên kết người giám hộ với học viên kèm vai trò (`FATHER`, `MOTHER`, `GUARDIAN`) và người liên hệ chính.

### Module 4: Tuyển sinh & Khách hàng tiềm năng (`/api/v1/leads`, `/api/v1/public/leads`)
- `POST /api/v1/public/leads`: Nhận yêu cầu tư vấn từ khách hàng trên website (chống spam Honeypot `websiteUrl`, kiểm tra SĐT VN).
- `GET /api/v1/leads`: Danh sách khách hàng tiềm năng có phân trang, lọc theo nguồn và trạng thái.
- `GET /api/v1/leads/{id}`: Chi tiết khách hàng tiềm năng kèm lịch sử tư vấn.
- `POST /api/v1/leads`: Tạo khách hàng tiềm năng nội bộ.
- `PUT /api/v1/leads/{id}`: Cập nhật thông tin khách hàng tiềm năng.
- `POST /api/v1/leads/{id}/activities`: Ghi lại nhật ký chăm sóc (gọi điện, tư vấn, hẹn gặp).
- `POST /api/v1/leads/{id}/convert`: Chuyển đổi khách hàng tiềm năng thành học viên chính thức trong một giao dịch nguyên tử.

### Module 5: Lớp học & Giáo viên (`/api/v1/classes`, `/api/v1/teachers`)
- `GET /api/v1/classes`: Danh sách lớp học kèm giáo viên, phòng học, lịch định kỳ và sĩ số.
- `GET /api/v1/classes/{id}`: Chi tiết lớp học kèm danh sách học viên và các buổi học đã sinh.
- `POST /api/v1/classes`: Tạo lớp học mới, tự động sinh các buổi học theo lịch lặp lại (kiểm tra xung đột phòng và giáo viên).
- `PUT /api/v1/classes/{id}`: Cập nhật lớp học.
- `POST /api/v1/classes/{classId}/enrollments`: Ghi danh học viên vào lớp (kiểm tra sĩ số tối đa, chống trùng ghi danh).
- `GET /api/v1/teachers`: Danh sách giảng viên phục vụ phân công giảng dạy.

### Module 6: Điểm danh (`/api/v1/attendance`)
- `GET /api/v1/attendance/classes/{classId}/sessions`: Lấy danh sách các buổi học của lớp.
- `GET /api/v1/attendance/sessions/{sessionId}`: Lấy danh sách điểm danh của học viên trong buổi học.
- `POST /api/v1/attendance/sessions/{sessionId}`: Lưu kết quả điểm danh hàng loạt (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`).

### Module 7: Học phí & Tài chính (`/api/v1/finance`)
- `GET /api/v1/finance/overview`: Lấy số liệu tổng quan tài chính (tổng phải thu, đã thu, còn nợ).
- `GET /api/v1/finance/receivables`: Danh sách khoản phải thu có phân trang và lọc theo trạng thái (`UNPAID`, `PARTIALLY_PAID`, `PAID`).
- `POST /api/v1/finance/receivables`: Tạo khoản phải thu mới cho học viên.
- `GET /api/v1/finance/payments`: Lịch sử giao dịch thanh toán học phí.
- `POST /api/v1/finance/payments`: Ghi nhận giao dịch thanh toán tiền mặt/chuyển khoản và tự động phân bổ giảm trừ công nợ theo FIFO.
- `POST /api/v1/finance/refunds`: Xử lý hoàn phí học viên có kiểm soát quyền và cập nhật lại công nợ.

### Module 8: Bảng điều khiển (`/api/v1/dashboard`)
- `GET /api/v1/dashboard/stats`: Thống kê toàn diện (tổng học viên, học viên đang học, số khóa học, số lớp, số lead, tỷ lệ chuyển đổi, tổng tài chính và danh sách các buổi học sắp diễn ra trong 7 ngày tới).
