# CH ACADEMY — HỢP ĐỒNG GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (RESTFUL API SPECIFICATION)

> **Tiền tố chuẩn hóa:** `/api/v1`  
> **Cơ chế xác thực:** HTTP Header `Authorization: Bearer <jwt-token>`  
> **Định dạng dữ liệu:** `application/json` (Encoding: UTF-8)  
> **Múi giờ:** `Asia/Ho_Chi_Minh` (GMT+7)  
> **Chuẩn phong bì phản hồi:** `ApiResponse<T>`

---

## 1. PHONG BÌ PHẢN HỒI CHUẨN HÓA (STANDARD API ENVELOPE)

Tất cả các endpoint trong hệ thống đều tuân thủ cấu trúc phản hồi nhất quán:

### 1.1. Phản hồi thành công (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": { ... },
  "errorCode": null
}
```

### 1.2. Phản hồi thất bại / Lỗi nghiệp vụ (HTTP 400 / 401 / 403 / 404 / 500)
```json
{
  "success": false,
  "message": "Mô tả lỗi dễ hiểu bằng tiếng Việt",
  "data": null,
  "errorCode": "VALIDATION_FAILED | ACCESS_DENIED | ENTITY_NOT_FOUND"
}
```

---

## 2. DANH MỤC API THEO PHÂN HỆ

### 2.1. Phân hệ Xác thực & Định danh (`/api/v1/auth`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả nghiệp vụ |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập tài khoản, trả về JWT Token và danh sách Roles. |
| `GET` | `/api/v1/auth/me` | Authenticated | Trích xuất hồ sơ tài khoản và vai trò của phiên đăng nhập hiện tại. |

#### Body Request `POST /api/v1/auth/login`:
```json
{
  "username": "admin",
  "password": "Admin@123456"
}
```

#### Response Data `POST /api/v1/auth/login`:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Quản trị viên Hệ thống",
      "email": "admin@chacademy.vn",
      "roles": ["SUPER_ADMIN", "CENTER_ADMIN"]
    }
  }
}
```

---

### 2.2. Phân hệ Website Công khai (`/api/v1/public`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/public/courses` | Public | Lấy danh mục khóa học đang mở tuyển sinh kèm lọc theo category/đối tượng. |
| `GET` | `/api/v1/public/courses/{id}` | Public | Xem thông tin chi tiết một khóa học (mục tiêu, thời lượng, học phí niêm yết). |
| `POST` | `/api/v1/public/leads` | Public | Học viên/Phụ huynh gửi form đăng ký tư vấn trực tuyến (chống bot Honeypot). |

---

### 2.3. Phân hệ Cổng Giáo viên (`/api/v1/teacher/portal`)

> **Bảo vệ quyền riêng tư & Anti-IDOR:** Giáo viên chỉ truy cập được các lớp mà mình được phân công làm giáo viên chính (`primaryTeacherId`) hoặc trợ giảng (`teacher_assignments`). Tuyệt đối không trả về thông tin tài chính hay học phí.

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/teacher/portal/dashboard` | `ROLE_TEACHER` | Thống kê số lớp phụ trách, buổi dạy 7 ngày tới, tài liệu vừa đăng. |
| `GET` | `/api/v1/teacher/portal/classes/{classId}` | `ROLE_TEACHER` | Xem chi tiết lớp: danh sách học viên, lịch các buổi học, tài liệu bài học. |
| `GET` | `/api/v1/teacher/portal/sessions/{sessionId}/attendance` | `ROLE_TEACHER` | Tải danh sách điểm danh của buổi học. |
| `POST` | `/api/v1/teacher/portal/sessions/{sessionId}/attendance` | `ROLE_TEACHER` | Lưu bảng điểm danh cho buổi học (PRESENT, ABSENT, LATE, EXCUSED). |
| `POST` | `/api/v1/teacher/portal/materials` | `ROLE_TEACHER` | Tải lên tài liệu/slide/bài tập gắn vào buổi học cụ thể. |
| `POST` | `/api/v1/teacher/portal/classes/{classId}/notifications` | `ROLE_TEACHER` | Gửi thông báo đến học viên trong lớp được phân công. |

#### Body Request `POST /api/v1/teacher/portal/materials`:
```json
{
  "sessionId": 12,
  "title": "Slide bài giảng Buổi 2: React State & Props",
  "materialType": "SLIDE",
  "fileUrl": "https://storage.chacademy.vn/materials/react-buoi-2.pdf",
  "fileSize": "3.5 MB"
}
```

---

### 2.4. Phân hệ Cổng Học viên (`/api/v1/student/portal`)

> **Bảo vệ quyền riêng tư & Anti-IDOR:** Học viên chỉ xem được dữ liệu lớp học mà mình đã ghi danh (`enrollments.student_id = currentStudent.id`). Ngăn chặn đọc trộm dữ liệu bằng cách thay đổi ID trên URL.

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/student/portal/dashboard` | `ROLE_STUDENT`, `ROLE_PARENT` | Tổng hợp thông tin học tập: lớp đang học, lịch học sắp tới, số dư học phí, thông báo mới. |
| `GET` | `/api/v1/student/portal/classes/{classId}` | `ROLE_STUDENT`, `ROLE_PARENT` | Chi tiết khóa học: lộ trình buổi học, tài liệu tải về, trạng thái điểm danh cá nhân. |
| `GET` | `/api/v1/student/portal/attendance` | `ROLE_STUDENT`, `ROLE_PARENT` | Lịch sử chuyên cần toàn bộ các buổi học đã tham gia. |
| `GET` | `/api/v1/student/portal/tuition` | `ROLE_STUDENT`, `ROLE_PARENT` | Chi tiết các khoản phải nộp, số tiền đã đóng, công nợ còn lại và lịch sử giao dịch. |

---

### 2.5. Phân hệ Cổng Quản trị Admin (`/api/v1/admin`)

#### Dashboard & Thống kê
| Phương thức | Đường dẫn | Quyền truy cập | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/dashboard/stats` | Admin Roles | Thống kê số liệu thực tế: tổng học viên, lớp đang mở, doanh thu tháng, tỷ lệ chuyển đổi lead. |

#### Quản lý Học vụ & Lớp học
| Phương thức | Đường dẫn | Quyền truy cập | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/courses` | Admin Roles | Danh sách khóa học có phân trang, tìm kiếm và lọc danh mục. |
| `POST` | `/api/v1/admin/courses` | `SUPER_ADMIN`, `CENTER_ADMIN` | Tạo mới khóa học. |
| `GET` | `/api/v1/admin/classes` | Admin Roles | Danh sách lớp học và trạng thái vận hành. |
| `POST` | `/api/v1/admin/classes` | `ACADEMIC_STAFF`, Admin | Tạo mới lớp học kèm tự động sinh buổi học và kiểm tra xung đột giáo viên/phòng học. |
| `GET` | `/api/v1/admin/teacher-assignments` | Admin Roles | Danh sách phân công giáo viên chính và trợ giảng trên toàn hệ thống. |
| `POST` | `/api/v1/admin/teacher-assignments` | `ACADEMIC_STAFF`, Admin | Phân công giáo viên vào lớp học. |

#### Tuyển sinh & Học viên
| Phương thức | Đường dẫn | Quyền truy cập | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/leads` | Admissions, Accountant, Admin | Danh sách khách hàng tiềm năng kèm trạng thái chăm sóc. |
| `POST` | `/api/v1/admin/leads/{id}/convert` | `ADMISSIONS_STAFF`, Admin | Chuyển đổi Lead thành Student chính thức trong 1 transaction, sinh tài khoản học viên và gửi email. |
| `GET` | `/api/v1/admin/students` | Admin Roles | Danh sách học viên, phụ huynh liên kết và tài khoản đăng nhập được cấp. |
| `POST` | `/api/v1/admin/students` | `ADMISSIONS_STAFF`, Admin | Tạo mới học viên kèm thông tin người giám hộ. |

#### Giám sát Điểm danh & Chuyên cần
| Phương thức | Đường dẫn | Quyền truy cập | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/attendance-monitoring/unrecorded-sessions` | `ACADEMIC_STAFF`, Admin | Danh sách các buổi học đã diễn ra nhưng giáo viên chưa hoàn thành điểm danh. |
| `GET` | `/api/v1/admin/attendance-monitoring/class-stats` | `ACADEMIC_STAFF`, Admin | Thống kê tỷ lệ chuyên cần theo từng lớp học. |

#### Tài chính & Học phí
| Phương thức | Đường dẫn | Quyền truy cập | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/finance/receivables` | `ACCOUNTANT`, Admin | Danh sách các khoản phải thu học phí. |
| `POST` | `/api/v1/admin/finance/payments` | `ACCOUNTANT`, Admin | Ghi nhận phiếu thu học phí, tự động phân bổ giảm trừ nợ theo nguyên tắc FIFO. |
| `POST` | `/api/v1/admin/finance/refunds` | `ACCOUNTANT`, `SUPER_ADMIN` | Xử lý hoàn phí cho học viên có lưu vết kiểm toán. |

#### Thông báo & Nhật ký Kiểm toán
| Phương thức | Đường dẫn | Quyền truy cập | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/notifications` | Admin Roles | Danh sách thông báo nội bộ đã phát hành. |
| `POST` | `/api/v1/admin/notifications` | Admin Roles | Phát hành thông báo mới theo phạm vi (`ALL`, `CLASS`, `TEACHERS`, `STUDENTS`). |
| `GET` | `/api/v1/admin/audit-logs` | `SUPER_ADMIN` | Tra cứu toàn bộ nhật ký kiểm toán thao tác hệ thống. |
