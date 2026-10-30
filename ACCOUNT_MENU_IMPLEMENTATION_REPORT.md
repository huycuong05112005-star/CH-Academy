# CH ACADEMY — BÁO CÁO TRIỂN KHAI MENU TÀI KHOẢN ĐỒNG NHẤT CHO CẢ 3 CỔNG
*(Unified Account Profile Menu Implementation Report)*

---

## 1. TỔNG QUAN HỆ THỐNG ĐÃ TRIỂN KHAI

Hệ thống quản lý tài khoản và hồ sơ người dùng trên thanh Header đã được chuẩn hóa và nâng cấp thành kiến trúc component dùng chung đồng nhất (**Unified Account Architecture**) cho cả ba cổng giao diện:

1. **Cổng Quản trị viên (Admin Portal)** — `AdminLayout.tsx`
2. **Cổng Giảng viên (Teacher Portal)** — `TeacherPortalPage.tsx`
3. **Cổng Học viên (Student Portal)** — `StudentPortalPage.tsx`

Toàn bộ thông tin tài khoản, đổi mật khẩu, chuyển đổi giao diện Theme (Sáng/Tối/Kính), tùy biến trải nghiệm Web/Desktop, cấu hình thông báo và kiểm soát an ninh phiên được điều khiển bởi cơ chế bảo mật xác thực thật với backend Spring Boot và giao diện Tailwind CSS + React 19.

---

## 2. DANH SÁCH COMPONENT DÙNG CHUNG

Tất cả các thành phần được đặt tại thư mục: `frontend/src/components/account/`

| Component | Vị trí file | Mục đích & Chức năng chính |
| :--- | :--- | :--- |
| **`AccountMenu`** | `frontend/src/components/account/AccountMenu.tsx` | Nút kích hoạt (Trigger pill) trên header + Dropdown Popover cao cấp hiển thị tổng quan tài khoản, bộ chuyển theme nhanh, các liên kết chức năng và nút Đăng xuất an toàn. |
| **`AccountProfileModal`** | `frontend/src/components/account/AccountProfileModal.tsx` | Modal cập nhật hồ sơ cá nhân: Họ tên, số điện thoại, ảnh đại diện (hỗ trợ tải file từ máy tính và URL), tiểu sử/chuyên môn cho giảng viên, mã định danh và thông tin bất biến (email, username, vai trò). |
| **`ChangePasswordModal`** | `frontend/src/components/account/ChangePasswordModal.tsx` | Modal đổi mật khẩu an toàn: mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu; nút ẩn/hiện mật khẩu; checklist thời gian thực 6 tiêu chí an ninh; mã hóa BCrypt backend. |
| **`AccountSettingsModal`** | `frontend/src/components/account/AccountSettingsModal.tsx` | Modal cài đặt trung tâm đa tab: **Giao diện** (3 theme xem trước trực quan), **Thông báo** (phân loại theo vai trò), **Bảo mật** (thông tin phiên & thiết bị), **Trợ giúp** (hotline, email, FAQ). |

---

## 3. CÁC TÍNH NĂNG VÀ CHỨC NĂNG CHI TIẾT

### A. Khu vực tài khoản trên thanh Header
- **Avatar động thông minh**: Tự động tải ảnh thật nếu người dùng đã có `avatarUrl`. Nếu ảnh lỗi hoặc chưa có, hiển thị chữ cái đầu viết hoa trên nền gradient nhận diện thương hiệu `[#0F243E] -> Indigo -> Sky`.
- **Họ và tên**: Không bị cắt cụt bất hợp lý, co giãn mượt mà theo kích thước màn hình (`truncate max-w-[120px] md:max-w-[170px] lg:max-w-[220px]`).
- **Vai trò & Mã định danh**: Hiển thị rõ danh xưng (`Quản trị viên`, `Giảng viên`, `Học viên`) kèm mã số chuyên trách (`AD-01`, `GV2026-001`, `HV2026-001`).
- **Nút mở menu toàn diện**: Toàn bộ thẻ pill là một nút nhấn (không yêu cầu nhấn chính xác vào icon mũi tên), có hiệu ứng hover mượt, focus ring, và xoay mũi tên `ChevronDown` 180°.
- **Tương thích Mobile**: Tự động ẩn bớt text dài trên màn hình siêu nhỏ, duy trì kích thước header chuẩn, có backdrop mờ đóng menu khi chạm ra ngoài.

### B. Menu tài khoản khi mở (Dropdown Popover)
- **Banner định danh cao cấp**: Avatar 48x48, chấm xanh hoạt động (Active Checkmark), tên đầy đủ, email/username, badge vai trò màu sắc chuẩn SaaS.
- **Phím tắt đóng/mở**: Nhấn avatar mở/đóng, nhấn click bên ngoài đóng, nhấn phím `Escape` đóng ngay lập tức, chuyển route tự động đóng.
- **Tùy chỉnh theo từng vai trò**:
  - **Admin**: Bổ sung liên kết nhanh đến `Cấu hình trung tâm (/admin/settings)` và `Nhật ký hệ thống & Bảo mật (/admin/audit-logs)`.
  - **Giảng viên**: Tuyệt đối không hiển thị các chức năng cấu hình hệ thống hay phân quyền toàn cục.
  - **Học viên**: Tuyệt đối không hiển thị dữ liệu quản trị hoặc cấu hình nhân sự.

### C. Hồ sơ tài khoản cá nhân (`AccountProfileModal`)
- Cho phép sửa: Họ và tên (tối thiểu 2 ký tự), Số điện thoại (kiểm tra định dạng di động Việt Nam), Ảnh đại diện (tải ảnh trực tiếp từ máy qua `filesApi.uploadFile` hoặc nhập URL), Chuyên môn và Tiểu sử (đối với Giảng viên).
- Cố định trường định danh: Email, Tên đăng nhập, Vai trò, Trạng thái tài khoản, Lần đăng nhập gần nhất — không thể bị can thiệp trái phép.
- Lưu trữ thật vào cơ sở dữ liệu qua `PUT /api/v1/auth/profile` và cập nhật tức thì `AuthContext`.

### D. Đổi mật khẩu tài khoản (`ChangePasswordModal`)
- Nhập mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu mới.
- Hỗ trợ nút ẩn/hiện mật khẩu cho cả 3 trường.
- Checklist tiêu chí thời gian thực: Tối thiểu 8 ký tự, có chữ hoa, có chữ thường, có chữ số, xác nhận trùng khớp, khác mật khẩu cũ.
- Nút submit chỉ kích hoạt khi thỏa mãn 100% tiêu chí.
- Gửi API `POST /api/v1/auth/change-password`, backend kiểm tra mật khẩu cũ qua BCrypt encoder, cập nhật mật khẩu mới và ghi nhận audit log an toàn không chứa mật khẩu thô.

### E. Tùy biến giao diện (Theme) & Trải nghiệm sử dụng
- **3 Theme chính thức**:
  1. **Sáng (Light)**: Thanh lịch, tương phản cao, tối ưu ban ngày.
  2. **Tối (Dark)**: Than chì `#0B1220` dịu mắt, tiết kiệm pin.
  3. **Kính trong suốt (Glassmorphism)**: True Glass với Deep Aurora gradient và backdrop blur cao cấp.
- Có mockup xem trước nhỏ (mini preview) bên trong từng thẻ chọn.
- Áp dụng ngay tức thì qua `ThemeContext` trên toàn bộ 3 cổng, lưu vào `localStorage` và khôi phục tự động khi đăng nhập lại.
- **Trải nghiệm sử dụng**:
  - Chuyển đổi giữa chế độ **Giao diện Web** và **Xem trước Desktop**.
  - Trung thực về trạng thái: Hiển thị rõ ràng "Xem trước Desktop (Web Preview)" và không giả vờ mở file `.exe` nếu chưa chạy trong môi trường Native Electron.

### F. Cài đặt thông báo & Bảo mật
- **Thông báo**:
  - Phân loại rõ ràng: Hệ thống, Lịch học/Lịch dạy, Học phí/Công nợ (cho Admin & Học viên), Khảo thí/Điểm số.
  - Ghi nhận trung thực: Trình bày rõ bộ lọc lưu trên trình duyệt hiện tại và không đưa ra nút lưu giả.
- **Bảo mật**:
  - Hiển thị thời điểm đăng nhập gần nhất, lần đổi mật khẩu cuối, môi trường thiết bị và trình duyệt thực tế (`getClientEnvironment()`).
  - Giải thích cơ chế bảo mật JWT Stateless và hướng dẫn bảo vệ tài khoản.
  - Admin có nút chuyển nhanh đến xem toàn bộ Audit Log hệ thống.

### G. Đăng xuất an toàn
- Nút đăng xuất đặt ở cuối menu, phân tách bằng đường viền với màu cảnh báo `rose-600`.
- Gọi `authApi.logout()`, xóa token phiên đăng nhập, dọn dẹp bộ nhớ và điều hướng an toàn về `/login`.

---

## 4. DANH SÁCH FILE ĐÃ SỬA VÀ TẠO MỚI

### A. Component tạo mới & hoàn thiện
1. `frontend/src/components/account/AccountMenu.tsx` (Component Menu tài khoản dùng chung)
2. `frontend/src/components/account/AccountProfileModal.tsx` (Modal Hồ sơ cá nhân + Tải ảnh avatar từ máy)
3. `frontend/src/components/account/ChangePasswordModal.tsx` (Modal Đổi mật khẩu an toàn)
4. `frontend/src/components/account/AccountSettingsModal.tsx` (Modal Cài đặt Theme, Desktop Mode, Thông báo, Bảo mật, Trợ giúp)

### B. Layout & Cổng giao diện được tích hợp
1. `frontend/src/layouts/AdminLayout.tsx` — Tích hợp `<AccountMenu portalRole="admin" />` trên top header của Cổng Quản trị.
2. `frontend/src/pages/teacher/TeacherPortalPage.tsx` — Tích hợp `<AccountMenu portalRole="teacher" ... />` với mã GV và chuyên môn.
3. `frontend/src/pages/student/StudentPortalPage.tsx` — Tích hợp `<AccountMenu portalRole="student" ... />` với mã HV và đối tượng đào tạo.

### C. Backend API & Client
1. `backend/src/main/java/vn/chacademy/identity/controller/AuthController.java` — API Profile, Change Password, Logout, Get Me.
2. `backend/src/main/java/vn/chacademy/identity/service/AuthService.java` — Xử lý logic mã hóa BCrypt, kiểm tra trùng số điện thoại, đồng bộ dữ liệu sang Teacher/Student entity, audit log an toàn.
3. `frontend/src/api/auth.ts` — API client cho xác thực và quản lý tài khoản.
4. `frontend/src/api/files.ts` — API tải file ảnh đại diện lên máy chủ backend.

### D. Kiểm thử tự động (Unit & Integration Tests)
1. `frontend/src/test/AccountMenu.test.tsx` — Suite kiểm thử toàn diện 8 ca kiểm thử chi tiết.

---

## 5. KẾT QUẢ KIỂM THỬ TRÊN CẢ BA CỔNG

Chạy toàn bộ kiểm thử frontend bằng **Vitest**:

```bash
npm --prefix frontend test -- --run
```

**Kết quả kiểm thử:**
- **12/12 Test Files Passed (100%)**
- **44/44 Tests Passed (100%)**

Chi tiết 8 bài kiểm thử của `AccountMenu.test.tsx`:
1. `Hiển thị đúng avatar chữ cái đầu, tên người dùng và vai trò trên trigger button` — **PASS**
2. `Mở dropdown menu khi click vào avatar trigger button` — **PASS**
3. `Đóng dropdown menu khi bấm Escape hoặc click ra ngoài` — **PASS**
4. `Mở modal Thông tin tài khoản và cập nhật họ tên, số điện thoại thành công` — **PASS**
5. `Mở modal Đổi mật khẩu, kiểm tra checklist và gọi authApi.changePassword` — **PASS**
6. `Mở modal Cài đặt và chuyển đổi qua lại giữa các tab (Giao diện, Thông báo, Bảo mật, Trợ giúp)` — **PASS**
7. `Phân quyền vai trò: Admin thấy liên kết Cấu hình & Audit Logs; Giảng viên & Học viên không thấy` — **PASS**
8. `Xử lý Đăng xuất: gọi logout() và chuyển hướng về /login` — **PASS**

Kiểm tra biên dịch Production:
```bash
npm --prefix frontend run build
```
- **TypeScript build (`tsc -b`): Thành công không có lỗi type.**
- **Vite build: 1804 modules transformed, bundles xuất sắc.**

Kiểm tra biên dịch Backend:
```bash
.\mvnw.cmd test-compile
```
- **BUILD SUCCESS: 0 lỗi biên dịch Java.**

---

## 6. GHI CHÚ BẢO MẬT VÀ TÍNH NĂNG BACKEND

1. **Bảo mật mật khẩu**:
   - Mật khẩu được băm bằng thuật toán **BCrypt** với Work Factor 12.
   - Audit log hệ thống ghi nhận sự kiện `PASSWORD_CHANGE_SUCCESS` mà tuyệt đối không chứa mật khẩu dạng thô (plaintext) hay mã băm.
2. **Cơ chế phiên (Session Management)**:
   - Hệ thống sử dụng token **Stateless JWT**. Khi người dùng đổi mật khẩu, token cũ sẽ bị vô hiệu hóa vì thông tin hash trong hệ thống thay đổi, đảm bảo đăng xuất các phiên lạ.
3. **Cài đặt thông báo**:
   - Bộ lọc thông báo cá nhân được lưu trữ trực tiếp trên thiết bị (LocalStorage) để điều khiển thông báo nổi. Hệ thống thông báo đẩy diện rộng được quản lý tập trung từ hệ thống thông báo trung tâm của CH Academy.

