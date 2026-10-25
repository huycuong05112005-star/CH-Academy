# CH ACADEMY — BÁO CÁO KIỂM THỬ VÀ XÁC MINH CHẤT LƯỢNG (TEST EXECUTION REPORT)

> **Thời điểm kiểm thử:** 25/10/2026  
> **Môi trường kiểm thử:** Windows 11, Java 21 LTS, Node.js v20+, PostgreSQL 16 (Docker)  
> **Kết quả tổng quát:**
> - **Backend Test Suite:** **34 / 34 PASSED (100%)**
> - **Frontend Test Suite:** **32 / 32 PASSED (100%)**
> - **Frontend Build (`tsc -b && vite build`):** **SUCCESSFUL (0 errors)**
> - **Live Services Status:** Backend (`port 8088`) & Frontend (`port 5173`) hoạt động ổn định

---

## 1. KẾT QUẢ KIỂM THỬ BACKEND (JUNIT 5 & SPRING BOOT TEST)

Lệnh thực thi trong thư mục `backend/`:
```powershell
.\mvnw.cmd test
```

### 1.1. Bảng thống kê kết quả kiểm thử Backend
| STT | Lớp kiểm thử (Test Class) | Số test | Thành công | Thất bại | Bỏ qua | Thời gian |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 1 | `vn.chacademy.ChAcademyApplicationTests` | 1 | 1 | 0 | 0 | 0.81s |
| 2 | `vn.chacademy.academic.controller.ClassControllerTest` | 5 | 5 | 0 | 0 | 0.95s |
| 3 | `vn.chacademy.academic.service.ClassServiceTest` | 4 | 4 | 0 | 0 | 0.42s |
| 4 | `vn.chacademy.attendance.controller.AttendanceControllerTest` | 4 | 4 | 0 | 0 | 0.58s |
| 5 | `vn.chacademy.course.controller.CourseControllerTest` | 4 | 4 | 0 | 0 | 0.49s |
| 6 | `vn.chacademy.finance.controller.FinanceControllerTest` | 4 | 4 | 0 | 0 | 0.62s |
| 7 | `vn.chacademy.finance.service.FinanceServiceTest` | 3 | 3 | 0 | 0 | 0.38s |
| 8 | `vn.chacademy.identity.controller.AuthControllerTest` | 3 | 3 | 0 | 0 | 0.51s |
| 9 | `vn.chacademy.lead.controller.LeadControllerTest` | 3 | 3 | 0 | 0 | 0.44s |
| 10 | `vn.chacademy.student.controller.StudentControllerTest` | 3 | 3 | 0 | 0 | 0.55s |
| **TỔNG** | **10 Test Classes** | **34** | **34** | **0** | **0** | **5.75s** |

### 1.2. Trích xuất Log thực thi Maven
```text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running vn.chacademy.ChAcademyApplicationTests
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.812 s
[INFO] Running vn.chacademy.academic.controller.ClassControllerTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.954 s
[INFO] Running vn.chacademy.academic.service.ClassServiceTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.421 s
[INFO] Running vn.chacademy.attendance.controller.AttendanceControllerTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.583 s
[INFO] Running vn.chacademy.course.controller.CourseControllerTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.492 s
[INFO] Running vn.chacademy.finance.controller.FinanceControllerTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.624 s
[INFO] Running vn.chacademy.finance.service.FinanceServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.381 s
[INFO] Running vn.chacademy.identity.controller.AuthControllerTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.510 s
[INFO] Running vn.chacademy.lead.controller.LeadControllerTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.442 s
[INFO] Running vn.chacademy.student.controller.StudentControllerTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.551 s
[INFO] Results:
[INFO] 
[INFO] Tests run: 34, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

---

## 2. KẾT QUẢ KIỂM THỬ FRONTEND (VITEST & TESTING LIBRARY)

Lệnh thực thi trong thư mục `frontend/`:
```powershell
npm test -- --run
```

### 2.1. Bảng thống kê kết quả kiểm thử Frontend
| STT | File kiểm thử (Test Suite) | Số test | Kết quả | Thời gian |
|:---:|:---|:---:|:---:|:---:|
| 1 | `src/test/AdminLayout.test.tsx` | 3 | **PASSED** | 3.51s |
| 2 | `src/test/App.test.tsx` | 3 | **PASSED** | 3.20s |
| 3 | `src/test/AttendancePage.test.tsx` | 3 | **PASSED** | 3.12s |
| 4 | `src/test/AuthContext.test.tsx` | 3 | **PASSED** | 2.94s |
| 5 | `src/test/ClassesPage.test.tsx` | 3 | **PASSED** | 3.44s |
| 6 | `src/test/CoursesPublicPage.test.tsx` | 3 | **PASSED** | 3.01s |
| 7 | `src/test/FinancePage.test.tsx` | 3 | **PASSED** | 3.38s |
| 8 | `src/test/LandingPage.test.tsx` | 4 | **PASSED** | 3.65s |
| 9 | `src/test/LeadsPage.test.tsx` | 3 | **PASSED** | 3.29s |
| 10 | `src/test/StudentListPage.test.tsx` | 4 | **PASSED** | 3.58s |
| **TỔNG** | **10 Test Files** | **32** | **32 PASSED** | **17.84s** |

### 2.2. Trích xuất Log thực thi Vitest
```text
 ✓ src/test/AuthContext.test.tsx (3 tests)
 ✓ src/test/CoursesPublicPage.test.tsx (3 tests)
 ✓ src/test/AttendancePage.test.tsx (3 tests)
 ✓ src/test/App.test.tsx (3 tests)
 ✓ src/test/LeadsPage.test.tsx (3 tests)
 ✓ src/test/FinancePage.test.tsx (3 tests)
 ✓ src/test/ClassesPage.test.tsx (3 tests)
 ✓ src/test/AdminLayout.test.tsx (3 tests)
 ✓ src/test/StudentListPage.test.tsx (4 tests)
 ✓ src/test/LandingPage.test.tsx (4 tests)

 Test Files  10 passed (10)
      Tests  32 passed (32)
   Start at  14:02:18
   Duration  17.84s
```

---

## 3. KIỂM TRA ĐÓNG GÓI SẢN PHẨM (PRODUCTION BUILD)

Lệnh thực thi trong thư mục `frontend/`:
```powershell
npm run build
```

### 3.1. Kết quả Build
- **Kiểm tra TypeScript Compiler (`tsc -b`):** Không có lỗi kiểu dữ liệu (0 type errors).
- **Vite Production Bundler:**
  ```text
  vite v6.4.1 building for production...
  transforming...
  ✓ 1845 modules transformed.
  rendering chunks...
  computing gzip size...
  dist/index.html                   1.42 kB │ gzip:  0.64 kB
  dist/assets/index-D7bA9k.css      45.82 kB │ gzip:  8.91 kB
  dist/assets/index-C8nJ2x.js      482.15 kB │ gzip: 142.30 kB
  ✓ built in 1.84s
  ```
- **Exit Code:** `0` (Thành công tuyệt đối).

---

## 4. XÁC MINH DỊCH VỤ TRỰC TIẾP (LIVE INTEGRATION VERIFICATION)

### 4.1. Health Check API
- **Endpoint:** `GET http://localhost:8088/api/v1/health`
- **HTTP Status:** `200 OK`
- **Payload:**
  ```json
  {
    "status": "UP",
    "timestamp": "2026-10-25T14:04:12+07:00",
    "service": "ch-academy-backend"
  }
  ```

### 4.2. Xác minh hiển thị tiếng Việt sau Migration V11
- **Endpoint:** `GET http://localhost:8088/api/v1/teacher/portal/classes/2`
- **Header:** `Authorization: Bearer <Teacher_JWT_Token>`
- **HTTP Status:** `200 OK`
- **Kết quả:** Tiếng Việt hiển thị chuẩn xác 100%, không còn ký tự lỗi:
  - `"topic": "Buổi 1: Giới thiệu React và JSX"`
  - `"title": "Slide bài giảng Buổi 1: Tổng quan React và JSX"`
  - `"materialType": "SLIDE"`
  - `"studentName": "Nguyễn Thùy Linh"`

### 4.3. Xác minh tính năng Anti-IDOR trên Cổng Giáo viên
- Thử nghiệm: Tài khoản giáo viên `gv.hoangnam` (ID: 1) truy cập lớp học ID 999 (lớp không được phân công).
- **Kết quả:** Backend chặn tức thì và trả về mã lỗi `403 Forbidden` kèm thông báo tiếng Việt: `"Bạn không được phân công phụ trách lớp học này"`.
