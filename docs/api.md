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
  "data": [ ... ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8
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
  "errors": [
    { "field": "phone", "message": "Số điện thoại không đúng định dạng" }
  ],
  "timestamp": "2026-10-24T10:15:30Z"
}
```

---

## 2. Danh Sách Endpoint Theo Module

### Module 1: Xác thực & Tài khoản (`/api/v1/auth`)
- `POST /api/v1/auth/login`: Đăng nhập với username & password, trả về JWT & user info.
- `GET /api/v1/auth/me`: Lấy thông tin tài khoản đang đăng nhập kèm roles và permissions.
- `POST /api/v1/auth/change-password`: Đổi mật khẩu.
- `POST /api/v1/auth/logout`: Đăng xuất (hủy token client).

### Module 2: Khóa học & Danh mục (`/api/v1/courses`, `/api/v1/course-categories`)
- `GET /api/v1/course-categories`: Danh sách danh mục khóa học (công khai).
- `POST /api/v1/course-categories`: Tạo danh mục mới (Admin).
- `GET /api/v1/courses`: Danh sách khóa học có phân trang, tìm kiếm, lọc theo category & audience (Công khai lọc `is_public=true`).
- `GET /api/v1/courses/{id}`: Chi tiết khóa học.
- `POST /api/v1/courses`: Thêm khóa học mới (Admin/Academic).
- `PUT /api/v1/courses/{id}`: Cập nhật khóa học.
- `PATCH /api/v1/courses/{id}/status`: Cập nhật trạng thái (`ACTIVE`, `SUSPENDED`, `ARCHIVED`).

### Module 3: Học viên & Người giám hộ (`/api/v1/students`, `/api/v1/guardians`)
- `GET /api/v1/students`: Danh sách học viên có phân trang, tìm kiếm theo tên, mã, SĐT, lọc theo trạng thái.
- `GET /api/v1/students/{id}`: Chi tiết hồ sơ học viên kèm người giám hộ và lịch sử ghi danh.
- `POST /api/v1/students`: Tạo hồ sơ học viên mới (kèm người giám hộ nếu là học viên trẻ em).
- `PUT /api/v1/students/{id}`: Cập nhật hồ sơ học viên.
- `GET /api/v1/students/{id}/guardians`: Danh sách người giám hộ của học viên.
- `POST /api/v1/students/{id}/guardians`: Liên kết người giám hộ mới với học viên.

### Module 4: Tuyển sinh & Khách hàng tiềm năng (`/api/v1/leads`)
- `POST /api/v1/public/leads`: Nhận đăng ký tư vấn từ form trang chủ/trang khóa học (có rate limit, chống spam).
- `GET /api/v1/leads`: Danh sách khách hàng tiềm năng có phân trang & lọc theo trạng thái.
- `GET /api/v1/leads/{id}`: Chi tiết lead và lịch sử chăm sóc.
- `POST /api/v1/leads/{id}/activities`: Ghi lại nhật ký gọi điện, tư vấn, hẹn gặp.
- `PATCH /api/v1/leads/{id}/status`: Cập nhật trạng thái (`CONTACTED`, `CONSULTING`, `APPOINTMENT`, `CONVERTED`, `LOST`).
- `POST /api/v1/leads/{id}/convert`: Chuyển đổi lead thành hồ sơ học viên chính thức.

### Module 5: Lớp học, Lịch học & Ghi danh (`/api/v1/classes`, `/api/v1/enrollments`)
- `GET /api/v1/classes`: Danh sách lớp học kèm giáo viên, số lượng học viên đã ghi danh / sĩ số tối đa.
- `GET /api/v1/classes/{id}`: Chi tiết lớp học kèm lịch học, danh sách học viên và buổi học.
- `POST /api/v1/classes`: Tạo lớp học mới và sinh lịch học lặp lại theo tuần.
- `PUT /api/v1/classes/{id}`: Cập nhật thông tin lớp học.
- `POST /api/v1/enrollments`: Ghi danh học viên vào lớp (kiểm tra sĩ số, trùng ghi danh, phát sinh khoản phải thu).
- `DELETE /api/v1/enrollments/{id}`: Hủy hoặc kết thúc ghi danh.

### Module 6: Điểm danh (`/api/v1/attendance`)
- `GET /api/v1/classes/{classId}/sessions`: Danh sách các buổi học của lớp.
- `GET /api/v1/sessions/{sessionId}/attendance`: Bảng điểm danh của buổi học (danh sách học viên trong lớp kèm trạng thái).
- `POST /api/v1/sessions/{sessionId}/attendance`: Lưu hoặc cập nhật kết quả điểm danh cho học viên (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`).

### Module 7: Học phí & Thanh toán (`/api/v1/finance`)
- `GET /api/v1/finance/receivables`: Danh sách khoản phải thu có phân trang, lọc theo học viên & trạng thái nợ.
- `GET /api/v1/finance/receivables/{id}`: Chi tiết khoản thu và các lần thanh toán đã phân bổ.
- `POST /api/v1/finance/payments`: Ghi nhận giao dịch thu tiền (tiền mặt, chuyển khoản, thẻ) và tự động phân bổ vào khoản phải thu.
- `GET /api/v1/finance/payments`: Lịch sử giao dịch thu tiền.
- `POST /api/v1/finance/refunds`: Tạo yêu cầu hoặc thực hiện hoàn tiền.

### Module 8: Dashboard & Báo cáo (`/api/v1/dashboard`)
- `GET /api/v1/dashboard/overview`: Thống kê tổng quan (tổng học viên, lớp đang học, doanh thu đã thu, công nợ, leads mới).
- `GET /api/v1/dashboard/revenue-chart`: Biểu đồ doanh thu theo tháng từ database thật.
- `GET /api/v1/dashboard/upcoming-sessions`: Danh sách ca học sắp diễn ra hôm nay / tuần này.
