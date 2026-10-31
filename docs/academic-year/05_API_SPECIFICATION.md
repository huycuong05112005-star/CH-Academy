# CH ACADEMY — HỆ SINH THÁI ĐA NĂM HỌC THỐNG NHẤT
## Tài liệu 05: Đặc tả Kỹ thuật API (API Specification & Contracts)

---

## 1. NHÓM API QUẢN TRỊ NĂM HỌC (`/api/v1/academic-years`)

### 1.1. Lấy danh sách tất cả năm học
- **Endpoint**: `GET /api/v1/academic-years`
- **Quyền truy cập**: Public / All authenticated roles
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Thành công",
  "data": [
    {
      "id": 1,
      "code": "2026-2027",
      "name": "Năm học 2026 - 2027",
      "startDate": "2026-09-01",
      "endDate": "2027-05-31",
      "registrationStartDate": "2026-07-01",
      "registrationEndDate": "2026-09-15",
      "isCurrent": true,
      "status": "ACTIVE",
      "description": "Năm học trọng điểm chuyển đổi số & AI Studio"
    }
  ]
}
```

### 1.2. Tạo mới năm học
- **Endpoint**: `POST /api/v1/academic-years`
- **Quyền truy cập**: `ADMIN`
- **Request Body**:
```json
{
  "code": "2027-2028",
  "name": "Năm học 2027 - 2028",
  "startDate": "2027-09-01",
  "endDate": "2028-05-31",
  "registrationStartDate": "2027-07-01",
  "registrationEndDate": "2027-09-15",
  "isCurrent": false,
  "status": "PLANNING",
  "description": "Kế hoạch mở rộng chi nhánh mới"
}
```

### 1.3. Vòng đời năm học (Lifecycle Transitions)
- `PUT /api/v1/academic-years/{id}/set-current`: Đặt năm học này làm hiện tại (đồng thời hủy cờ các năm khác).
- `PUT /api/v1/academic-years/{id}/close`: Chuyển trạng thái sang `CLOSED` (kết thúc năm học).
- `PUT /api/v1/academic-years/{id}/archive`: Chuyển trạng thái sang `ARCHIVED` (lưu trữ lịch sử).
- `DELETE /api/v1/academic-years/{id}`: Xóa năm học (Chỉ cho phép xóa khi chưa có bất kỳ lớp học nào gắn với năm học này).

---

## 2. NHÓM API ĐĂNG KÝ KHÓA HỌC DÀNH CHO HỌC VIÊN (`/api/v1/student`)

### 2.1. Tra cứu lớp học khả dụng để đăng ký
- **Endpoint**: `GET /api/v1/student/available-classes?academicYear=2026-2027`
- **Quyền truy cập**: `STUDENT`
- **Response**: Trả về danh sách lớp thuộc năm học đang chọn, loại trừ các lớp học viên đã ghi danh hoặc đã nộp đơn chờ duyệt.

### 2.2. Nộp đơn đăng ký khóa học
- **Endpoint**: `POST /api/v1/student/enrollment-requests`
- **Quyền truy cập**: `STUDENT`
- **Request Body**:
```json
{
  "classId": 4,
  "academicYear": "2026-2027",
  "notes": "Em đăng ký học ca tối 3-5-7"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Gửi yêu cầu đăng ký khóa học thành công",
  "data": {
    "id": 12,
    "studentId": 1,
    "classId": 4,
    "className": "Lớp Frontend React Advanced",
    "academicYear": "2026-2027",
    "status": "PENDING",
    "notes": "Em đăng ký học ca tối 3-5-7",
    "createdAt": "2026-11-01T00:15:00Z"
  }
}
```

### 2.3. Hủy đơn đăng ký đang chờ duyệt
- **Endpoint**: `DELETE /api/v1/student/enrollment-requests/{id}`
- **Quyền truy cập**: `STUDENT` (chỉ hủy được đơn của chính mình ở trạng thái `PENDING`).

### 2.4. Tra cứu lịch sử học tập đa năm học
- **Endpoint**: `GET /api/v1/student/learning-history`
- **Quyền truy cập**: `STUDENT`
- **Response**: Danh sách toàn bộ các khóa học đã đăng ký, nhóm theo năm học kèm điểm số trung bình, tỷ lệ chuyên cần và chứng chỉ hoàn thành.

---

## 3. NHÓM API DUYỆT ĐĂNG KÝ DÀNH CHO QUẢN TRỊ VIÊN (`/api/v1/admin/enrollment-requests`)

### 3.1. Lấy danh sách đơn đăng ký
- **Endpoint**: `GET /api/v1/admin/enrollment-requests?status=PENDING&academicYear=2026-2027`
- **Quyền truy cập**: `ADMIN`

### 3.2. Phê duyệt đơn đăng ký
- **Endpoint**: `POST /api/v1/admin/enrollment-requests/{id}/approve`
- **Quyền truy cập**: `ADMIN`
- **Request Body**:
```json
{
  "discountAmount": 500000.0,
  "reviewNotes": "Áp dụng học bổng khuyến học 500.000đ"
}
```
- **Xử lý Backend**: Kích hoạt transaction ghi danh học viên vào lớp, thêm vào nhóm chat lớp học và tạo công nợ học phí.

### 3.3. Từ chối đơn đăng ký
- **Endpoint**: `POST /api/v1/admin/enrollment-requests/{id}/reject`
- **Quyền truy cập**: `ADMIN`
- **Request Body**:
```json
{
  "reviewNotes": "Lớp học đã đủ sĩ số 25 học viên, hẹn bạn kỳ sau."
}
```

---

## 4. NHÓM API LỊCH SỬ GIẢNG DẠY DÀNH CHO GIẢNG VIÊN (`/api/v1/teacher/portal`)

### 4.1. Lấy lớp học theo năm học
- **Endpoint**: `GET /api/v1/teacher/portal/classes?academicYear=2026-2027`
- **Quyền truy cập**: `TEACHER`

### 4.2. Tra cứu lịch sử giảng dạy đa năm học
- **Endpoint**: `GET /api/v1/teacher/portal/teaching-history`
- **Quyền truy cập**: `TEACHER`
- **Response `200 OK`**: Danh sách lịch sử phân công giảng dạy qua các năm học, sĩ số học viên, vai trò giảng dạy (`PRIMARY` / `ASSISTANT`).
