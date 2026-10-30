# BÁO CÁO KIỂM THỬ TÍCH HỢP ĐẦU CUỐI (E2E) — CH ACADEMY
**Thời gian chạy:** 31/10/2026  
**Phương pháp:** Tự động hóa qua Vitest (52 tests), Node API Assertions & Manual Scenarios

---

## 1. TỔNG HỢP KIỂM THỬ THEO LUỒNG NGƯỜI DÙNG

### Luồng 1: Học viên (Student Portal Flow)
- **Tiền điều kiện:** Tài khoản `thuylinh.nguyen@gmail.com` (Mã HV: `HV20240002`).
- **Các bước:**
  1. Đăng nhập qua `/login` bằng email và mật khẩu `Student@123456`.
  2. Điều hướng tự động vào cổng `/student` (Student Portal).
  3. Gọi `GET /api/v1/student/portal/me`: hiển thị đúng họ tên Nguyễn Thùy Linh, lớp học đang tham gia `CLS-ENG-PRO01`, lịch học và học phí.
  4. Xem bài kiểm tra được giao: `GET /api/v1/assessment/online/assigned-exams`.
  5. Thử truy cập `/admin` hoặc API quản trị `/api/v1/admin/dashboard`: Bị chặn ngay lập tức với HTTP 403 Forbidden.
- **Kết quả:** **PASS**

### Luồng 2: Giảng viên (Teacher Portal Flow)
- **Tiền điều kiện:** Tài khoản giảng viên `gv.hoangnam` / `gv.hanh`.
- **Các bước:**
  1. Đăng nhập qua `/login`.
  2. Điều hướng chuẩn xác vào `/teacher`.
  3. Gọi `GET /api/v1/teacher/portal/profile`: xem hồ sơ, các lớp được phân công phụ trách.
  4. Thực hiện điểm danh học viên buổi học: `POST /api/v1/attendance/sessions/{sessionId}`.
  5. Xem kết quả thi của lớp và chấm bài tự luận: `POST /api/v1/assessment/grading/attempts/{id}/manual`.
- **Kết quả:** **PASS**

### Luồng 3: Quản trị viên (Admin Flow)
- **Tiền điều kiện:** Tài khoản `admin` (`SUPER_ADMIN`).
- **Các bước:**
  1. Đăng nhập tại `/login` bằng credentials `admin` / `Admin@123456`.
  2. Hệ thống kiểm tra vai trò và chuyển hướng trực tiếp vào `/admin` (Dashboard), không bị lạc sang cổng học viên.
  3. Lấy số liệu thống kê: `GET /api/v1/dashboard/stats` trả về HTTP 200.
  4. Quản lý phân quyền, đổi mật khẩu, xem audit logs: hoạt động chuẩn xác.
  5. Thử truy cập API sinh viên `/api/v1/student/portal/me`: Hệ thống trả về 403 Forbidden do tài khoản admin không có role STUDENT.
- **Kết quả:** **PASS**

### Luồng 4: Phục hồi và xử lý lỗi hệ thống (Error & Recovery Flow)
- **Trường hợp 1:** Gửi request đổi mật khẩu với mật khẩu cũ sai: Trả về lỗi 400 `Mật khẩu hiện tại không chính xác`, không nuốt lỗi.
- **Trường hợp 2:** Nộp bài chấm tự luận: Không còn gặp lỗi 500 LazyInitializationException, giao diện cập nhật điểm số tức thì.
- **Trường hợp 3:** Hết hạn phiên / Token không hợp lệ: Tự động xóa token, kích hoạt sự kiện `ch_academy_auth_unauthorized` và chuyển người dùng về `/login`.
- **Kết quả:** **PASS**

---

## 2. KẾT QUẢ SUITE VITEST (FRONTEND)

```
Test Files  13 passed (13)
Tests       52 passed (52)
Duration    25.54s
```
- `AttendancePage.test.tsx`: 2/2 PASS
- `HeaderSearchAndNotification.test.tsx`: 8/8 PASS
- `LeadListPage.test.tsx`: 3/3 PASS
- `CourseListPage.test.tsx`: 2/2 PASS
- `LoginPage.test.tsx`: 4/4 PASS
- `AccountMenu.test.tsx`: 8/8 PASS
- `App.test.tsx`: 6/6 PASS
- `SettingsContext.test.tsx`: 3/3 PASS
- `client.test.ts`: 4/4 PASS

