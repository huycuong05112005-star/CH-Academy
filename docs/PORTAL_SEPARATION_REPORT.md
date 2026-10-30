# BÁO CÁO PHÂN TÁCH BA PHÂN HỆ VÀ KIỂM SOÁT PHÂN QUYỀN (PORTAL SEPARATION REPORT)
**Dự án:** Nền tảng Quản trị & Đào tạo Trực tuyến CH Academy  
**Phiên bản:** v2.4 Enterprise  
**Thời gian kiểm định:** 2026-10-29  
**Trạng thái:** HOÀN TẤT & ĐÃ KIỂM ĐỊNH TOÀN DIỆN (100% PASS)

---

## 1. TỔNG QUAN VẤN ĐỀ VÀ MỤC TIÊU CẢI TỔ

Trong các phiên bản trước, hệ thống CH Academy tồn tại một số thành phần hỗ trợ chuyển cổng kiểm thử nhanh trong quá trình phát triển (nút **"Chuyển cổng" kèm badge "3"** và menu trượt trên Header của `AdminLayout.tsx`, các lệnh tắt `port-teacher` và `port-student` trong `CommandPalette.tsx`, cùng nút **"Về Quản trị"** xuất hiện trên header của Cổng Giảng viên (`TeacherPortalPage.tsx`) và Cổng Học viên (`StudentPortalPage.tsx`)).

Mặc dù có mục đích hỗ trợ kiểm thử giao diện ban đầu, sự hiện diện của các thành phần này trong môi trường vận hành thực tế đã gây ra:
1. **Lẫn lộn trải nghiệm người dùng (UX Confusion):** Học viên và Giảng viên nhìn thấy liên kết hoặc nút bấm quay về trang quản trị trung tâm, gây hiểu nhầm về quyền hạn và làm mất đi tính độc lập chuyên biệt của từng cổng.
2. **Nguy cơ rò rỉ quyền hạn (Privilege Boundary Violation):** Người dùng có thể nhấn phím tắt hoặc nút chuyển mà không phải đăng nhập lại với đúng danh tính và vai trò được phân định nghiêm ngặt.
3. **Thiếu tính cô lập phân hệ:** Cần đảm bảo rằng Quản trị viên, Giảng viên và Học viên có ba không gian số hoàn toàn độc lập, với layout, header, thanh điều hướng và bộ API bảo mật tương ứng.

---

## 2. NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS)

| Thành phần | Vị trí mã nguồn | Nguyên nhân kỹ thuật |
| :--- | :--- | :--- |
| **Nút "Chuyển cổng" & Badge 3** | `frontend/src/layouts/AdminLayout.tsx` (dòng 334-395) | Khối `<div className="relative">...<button>Chuyển cổng 3</button>...</div>` chứa menu liên kết trực tiếp sang `/admin`, `/teacher`, `/student`, `/`. |
| **Phím tắt chuyển cổng Ctrl+K** | `frontend/src/components/ui/CommandPalette.tsx` (dòng 90-106) | Danh mục `Cổng hệ thống` chứa các mục lệnh `port-teacher` và `port-student` cho phép nhảy thẳng sang các portal khác. |
| **Nút "Về Quản trị" (Giáo viên)** | `frontend/src/pages/teacher/TeacherPortalPage.tsx` (dòng 576-585) | Nút quay về `/admin` gắn trên header chung của giảng viên. |
| **Nút "Về Quản trị" (Học viên)** | `frontend/src/pages/student/StudentPortalPage.tsx` (dòng 366-375) | Nút quay về `/admin` gắn trên thanh điều hướng học viên. |
| **Cấu hình Router cho phép Admin vào Portal học sinh/giáo viên** | `frontend/src/App.tsx` (dòng 75-107) | `ProtectedRoute` trên `/student` và `/teacher` cấu hình danh sách `requiredRoles` chứa cả `ADMIN`, `SUPER_ADMIN`. |

---

## 3. CÁC BIỆN PHÁP XỬ LÝ TRIỆT ĐỂ ĐÃ THỰC HIỆN

### 3.1. Xóa bỏ hoàn toàn nút "Chuyển cổng" và Badge "3" trên Header Quản trị
- **Tập tin:** `frontend/src/layouts/AdminLayout.tsx`
- **Hành động:**
  - Xóa bỏ state `portalMenuOpen` và effect đóng `portalMenuOpen`.
  - Loại bỏ hoàn toàn khối HTML/JSX render nút "Chuyển cổng", badge "3" và dropdown danh sách phân hệ.
  - Header của Cổng Quản trị hiện chỉ bao gồm:
    1. Thanh tìm kiếm nhanh toàn hệ thống (`CommandPalette` tìm kiếm lớp học, học viên, khóa học).
    2. Nút chuyển đổi Theme 4 chế độ (Sáng, Tối, Trong suốt, Theo hệ thống).
    3. Chuông thông báo hệ thống thời gian thực (Realtime notification bell).
    4. Thẻ định danh tài khoản Quản trị viên (Avatar, Tên đầy đủ, Vai trò, Nút Đăng xuất an toàn).

### 3.2. Thanh lọc Command Palette (Ctrl + K)
- **Tập tin:** `frontend/src/components/ui/CommandPalette.tsx`
- **Hành động:**
  - Xóa bỏ mục `port-teacher` và `port-student`.
  - Danh mục `Cổng hệ thống` được chuyển thành danh mục `Điều hành` chỉ giữ lại mục điều hướng nội bộ Cổng Quản trị (`/admin`).
  - Đảm bảo người dùng quản trị khi dùng Command Palette chỉ điều hướng trong phạm vi các chức năng Quản trị học vụ, Tài chính, Đề thi, và Khách hàng tiềm năng.

### 3.3. Xóa nút "Về Quản trị" và Thêm chức năng "Đổi mật khẩu" tại Cổng Giảng viên
- **Tập tin:** `frontend/src/pages/teacher/TeacherPortalPage.tsx`
- **Hành động:**
  - Loại bỏ hoàn toàn nút "Về Quản trị".
  - Bổ sung nút **"Đổi mật khẩu"** với modal bảo mật chuẩn: xác thực mật khẩu cũ, mật khẩu mới tối thiểu 8 ký tự kèm chữ hoa, chữ thường, số, kiểm tra độ trùng khớp và gọi API `/api/v1/auth/change-password`.
  - Header của Cổng Giảng viên độc lập hoàn toàn: Logo thương hiệu CH Academy Cổng Giáo viên, Bộ chọn lớp & Lọc học phần, Nút Đổi mật khẩu, Nút chuyển Theme, Nút Đăng xuất.

### 3.4. Xóa nút "Về Quản trị" tại Cổng Học viên
- **Tập tin:** `frontend/src/pages/student/StudentPortalPage.tsx`
- **Hành động:**
  - Loại bỏ hoàn toàn nút "Về Quản trị".
  - Giữ nguyên giao diện học viên tập trung cao độ: Thời khóa biểu, Khóa học của tôi, Thư viện tài liệu buổi học, Phòng thi trực tuyến, và Tra cứu học phí QR Napas.

### 3.5. Cô lập nghiêm ngặt Route Guarding trên Router
- **Tập tin:** `frontend/src/App.tsx`
- **Quy tắc mới áp dụng:**
  ```tsx
  {/* Cổng Học viên: Chỉ duy nhất vai trò STUDENT được phép truy cập */}
  <Route path="/student" element={
    <ProtectedRoute requiredRoles={['STUDENT']}>
      <StudentPortalPage />
    </ProtectedRoute>
  } />

  {/* Cổng Giảng viên: Chỉ duy nhất vai trò TEACHER được phép truy cập */}
  <Route path="/teacher" element={
    <ProtectedRoute requiredRoles={['TEACHER']}>
      <TeacherPortalPage />
    </ProtectedRoute>
  } />

  {/* Cổng Quản trị: Dành riêng cho nhóm nhân sự có thẩm quyền điều hành */}
  <Route path="/admin" element={
    <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMISSIONS_STAFF', 'ACCOUNTANT', 'ADMIN']}>
      <AdminLayout />
    </ProtectedRoute>
  } />
  ```

---

## 4. MA TRẬN PHÂN QUYỀN VÀ BẢO MẬT API (PORTAL ROLE MATRIX)

| Phân hệ / Cổng | Đường dẫn Frontend | Vai trò bắt buộc | Quyền hạn Frontend | API Backend tương ứng | Cơ chế bảo vệ Backend |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cổng Quản trị (Admin Portal)** | `/admin/*` | `SUPER_ADMIN`, `CENTER_ADMIN`, `ADMIN`, `ACADEMIC_STAFF`, `ACCOUNTANT` | Toàn quyền quản trị khóa học, lớp học, điểm danh, tài chính, đề thi, an ninh mật khẩu | `/api/v1/admin/**`, `/api/v1/courses/**`, `/api/v1/classes/**`, `/api/v1/finance/**` | `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', ...)")` |
| **Cổng Giảng viên (Teacher Portal)** | `/teacher/*` | `TEACHER` | Điểm danh lớp được phân công, tải tài liệu buổi học, soạn đề thi, chấm điểm, gửi thông báo | `/api/v1/teacher/portal/**`, `/api/v1/assessment/**` | `@PreAuthorize("hasRole('TEACHER')")` |
| **Cổng Học viên (Student Portal)** | `/student/*` | `STUDENT` | Xem lịch học cá nhân, tài liệu được duyệt, vào phòng thi trực tuyến, thanh toán học phí | `/api/v1/student/portal/**`, `/api/v1/assessment/student/**` | `@PreAuthorize("hasRole('STUDENT')")` |
| **Phòng thi trực tuyến (Exam Room)** | `/exam/:examId` | `STUDENT`, `TEACHER`, `ADMIN` | Học sinh làm bài thi; Giáo viên/Admin kiểm tra ma trận đề | `/api/v1/assessment/student/exams/{id}/**` | Phân quyền theo mã đăng ký thi hợp lệ |

---

## 5. KẾT QUẢ KIỂM THỬ XÁC MINH CÔ LẬP CỔNG

| Mã Test | Kịch bản kiểm thử | Hành vi kỳ vọng | Kết quả thực tế | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **TC-PORT-01** | Kiểm tra Header Admin không còn nút "Chuyển cổng" hay số 3 | Không còn bất kỳ element hay dropdown nào chuyển sang Teacher/Student | Không tìm thấy selector, Header chỉ còn Theme, Bell, Profile | **PASS** |
| **TC-PORT-02** | Mở Command Palette bằng tổ hợp Ctrl+K trên Admin | Không có gợi ý chuyển sang Cổng Giảng viên hoặc Cổng Học viên | Chỉ hiển thị các chức năng thuộc Quản trị | **PASS** |
| **TC-PORT-03** | Đăng nhập tài khoản Giảng viên (`gv.hoangnam`) | Truy cập vào `/teacher`, Header không có nút "Về Quản trị" | Header độc lập, có nút Đổi mật khẩu | **PASS** |
| **TC-PORT-04** | Giảng viên cố tình gõ URL `/admin` trên thanh địa chỉ trình duyệt | Router chặn lại và redirect về đúng cổng `/teacher` kèm thông báo 403 | `ProtectedRoute` tự động redirect về `/teacher` | **PASS** |
| **TC-PORT-05** | Học viên cố tình gõ URL `/admin` hoặc `/teacher` | Router chặn lại và redirect về đúng cổng `/student` | `ProtectedRoute` tự động redirect về `/student` | **PASS** |
| **TC-PORT-06** | Giảng viên gọi API `/api/v1/admin/security/users` bằng Bearer Token | Backend trả về mã lỗi HTTP 403 Forbidden | Backend từ chối với status 403 do `@PreAuthorize` | **PASS** |

---

## 6. KẾT LUẬN

Việc phân tách ba phân hệ Cổng Quản trị, Cổng Giảng viên và Cổng Học viên đã đạt trạng thái **hoàn toàn triệt để, đồng bộ từ tầng Router Frontend đến tầng Spring Security Backend**. Toàn bộ lối tắt chuyển cổng không hợp lệ đã được loại bỏ 100%, bảo đảm tính toàn vẹn dữ liệu và trải nghiệm SaaS chuyên nghiệp chuẩn mực.

