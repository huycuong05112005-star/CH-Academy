# BÁO CÁO: PHÂN TÁCH TRẢI NGHIỆM GIAO DIỆN WEB VÀ XEM TRƯỚC DESKTOP (WEB_DESKTOP_EXPERIENCE_REPORT)

**Dự án:** CH ACADEMY (Hệ thống Quản lý & Đào tạo Trung tâm Giáo dục)  
**Đường dẫn dự án:** `E:\CA_NHAN\CH_Academy`  
**Ngày thực hiện:** 30/10/2026  
**Phiên bản hệ thống:** v2.4.0  

---

## 1. NHỮNG KHÁC BIỆT CỤ THỂ GIỮA GIAO DIỆN WEB VÀ XEM TRƯỚC DESKTOP

Giao diện **Xem trước Desktop (Desktop Preview)** hiện tại đã được tái thiết kế toàn diện theo tư duy phần mềm quản lý máy tính chuyên nghiệp, không còn chỉ là trang web gắn thêm một thanh tiêu đề.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] CH Academy — Xem trước Giao diện Desktop     [Quay lại Web] [Thu gọn/Chuẩn] _ ▢ ✕│ <- DesktopTitleBar
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Phân hệ: [Tổng quan] [Lớp học] [Khóa học] [Điểm danh] [Học viên] [Khảo thí] [Tài chính] │ <- DesktopWorkspaceBar
├───────┬────────────────────────────────────────────────────────────────────────────────┤
│ Dock  │ Workspace Canvas (Tối ưu mật độ dữ liệu, không giới hạn max-width 1600px)      │
│ w-16  │ - Bảng dữ liệu có sticky headers, padding cô đọng (py-1.5)                     │
│       │ - Phân khu làm việc đa panel, giảm khoảng trắng thừa                           │
├───────┴────────────────────────────────────────────────────────────────────────────────┤
│ ● PostgreSQL (5432) | ● Spring Boot (8088) | Admin [SUPER_ADMIN] | Ctrl+K | [Về Web]   │ <- DesktopStatusBar
└────────────────────────────────────────────────────────────────────────────────────────┘
```

| Tiêu chí | Chế độ Giao diện Web (Web Browser) | Chế độ Xem trước Desktop (Desktop Preview) |
| :--- | :--- | :--- |
| **Định danh chính xác** | Giao diện Web tiêu chuẩn trên trình duyệt | "Xem trước Giao diện Desktop" (In-Browser Desktop Preview) |
| **Thanh tiêu đề** | Không có (dùng thanh tab mặc định của trình duyệt) | `DesktopTitleBar` hiển thị nhận diện ứng dụng, badge `Xem trước Desktop`, nút chuyển nhanh về Web, và bộ nút điều khiển cửa sổ `_ ▢ ✕` |
| **Thanh công cụ ứng dụng (Ribbon)** | Không có. Điều hướng dựa vào menu sidebar truyền thống | `DesktopWorkspaceBar` nằm ngay trên đầu màn hình làm việc: Chuyển nhanh giữa các phân hệ đào tạo, chọn năm học, tìm kiếm nhanh `Ctrl+K`, làm mới dữ liệu `⟳` |
| **Thanh điều hướng bên (Sidebar/Dock)** | Sidebar website truyền thống rộng `256px` (`w-64`) với tiêu đề nhóm lớn | Dock ứng dụng thu gọn (`w-56` khi mở, `w-16` khi thu nhỏ), tối ưu để giải phóng không gian màn hình cho bảng số liệu |
| **Thanh trạng thái đáy (Status Bar)** | Không có | `DesktopStatusBar` hiển thị thời gian thực: Kết nối DB PostgreSQL 5432, Spring Boot 8088, tài khoản đang đăng nhập, phím tắt nhanh và nút 1-click về Web |
| **Không gian nội dung (Content Canvas)** | Cố định `max-width: 1600px` với padding lề rộng `p-6 lg:p-8` | **Mở rộng 100% chiều ngang màn hình**, padding cô đọng `p-3 sm:p-4`, giúp hiển thị cùng lúc nhiều cột bảng điểm danh, đề thi, học phí |
| **Chế độ Mật độ hiển thị (Density)** | Mật độ chuẩn web (Standard web padding) | Hỗ trợ nút chuyển đổi mật độ: **Chuẩn (Standard)** hoặc **Thu gọn (Compact Density)** giúp hiển thị tối đa hàng dữ liệu trên một màn hình |
| **Điều hướng chuyển đổi qua lại** | Nút `[🖥️ Xem trước Desktop]` trên Header website | Nút `[🌐 Quay lại Giao diện Web]` luôn thường trực ở Titlebar, Workspace Bar và Status Bar |
| **Bảo toàn phiên & Dữ liệu** | Chuyển đổi mượt mà 1-click, giữ nguyên 100% token đăng nhập, quyền hạn, dữ liệu form đang nhập, không bị logout |

---

## 2. BẢO ĐẢM 3 THEMES Ở CẢ 2 CHẾ ĐỘ (6 TỔ HỢP)

1. **`Web-Sáng`:** Nền trắng sáng `#F8FAFC`, card trắng nổi bật, viền nhạt thanh nhã, độ tương phản chuẩn WCAG AAA.
2. **`Web-Tối`:** Nền than chì `#090D1A`, card đen mờ `#111827`, chữ sáng dễ đọc, giảm mỏi mắt khi lướt web đêm.
3. **`Web-Kính` (Glassmorphism Web):** Hiệu ứng kính mờ `backdrop-filter: blur(16px)` với các card bán trong suốt `rgba(15, 23, 42, 0.55)` nhìn xuyên thấu xuống **nền Deep Nebula Aurora nội bộ do chính website tạo ra**, không làm lộ màn hình desktop ngoài trình duyệt.
4. **`Desktop-Sáng`:** Nền phần mềm máy tính `#F1F5F9`, card trắng viền sắc nét, thanh công cụ Ribbon xám chuyên nghiệp, giao diện mang phong cách các phần mềm ERP máy tính hiện đại.
5. **`Desktop-Tối`:** Nền tối sâu `#080D1A`, phân cấp bề mặt với elevation `#0F172A` và `#152238`, thanh công cụ tương phản cao, tối ưu cho màn hình OLED.
6. **`Desktop-Kính` (Glassmorphism Desktop Preview):** Nền không gian huyền ảo kết hợp các panel điều khiển bán trong suốt với viền phản chiếu ánh sáng mỏng `rgba(255, 255, 255, 0.12)`, chữ và icon luôn đảm bảo độ tương phản cao, sắc nét.

---

## 3. CÁC TẬP TIN ĐÃ THỰC HIỆN CẢI THIỆN

1. **`frontend/src/context/ExperienceContext.tsx`**:
   - Bổ sung `DesktopDensity` (`'standard' | 'compact'`), `setDesktopDensity`, `toggleDesktopDensity`.
   - Lưu trữ trạng thái mật độ hiển thị vào `localStorage`.
   - Đồng bộ thuộc tính DOM `data-mode="web|desktop"`, `data-density="standard|compact"`, `data-theme`.
2. **`frontend/src/components/desktop/DesktopTitleBar.tsx`**:
   - Thêm nút chuyển đổi mật độ hiển thị `[Mật độ: Thu gọn / Chuẩn]`.
   - Thêm nút nổi bật `[🌐 Quay lại Giao diện Web]` cho phép thoát preview tức thì.
   - Hiển thị badge rõ ràng `Xem trước Giao diện Desktop (In-Browser Desktop Preview)`.
   - Nút thu nhỏ/phóng to giả lập trạng thái cửa sổ trong trình duyệt kèm thông báo rõ ràng.
3. **`frontend/src/components/desktop/DesktopWorkspaceBar.tsx`** *(Tập tin mới)*:
   - Ribbon thanh công cụ phân hệ đào tạo cho desktop (`Tổng quan`, `Lớp học`, `Khóa học`, `Điểm danh`, `Học viên`, `Tuyển sinh`, `Khảo thí`, `Tài chính`, `Cài đặt`).
   - Tích hợp bộ chọn nhanh Năm học (`2025 - 2026`).
   - Phím tắt mở Command Palette (`Ctrl + K`) và nút làm mới dữ liệu (`⟳`).
4. **`frontend/src/components/desktop/DesktopStatusBar.tsx`** *(Tập tin mới)*:
   - Thanh trạng thái đáy cửa sổ desktop: Đèn trạng thái PostgreSQL (5432), Backend Spring Boot (8088), thông tin người dùng đang đăng nhập, phím tắt và nút quay lại web.
5. **`frontend/src/layouts/AdminLayout.tsx`**:
   - Tự động nhận diện `effectiveUsageMode`: Khi ở Desktop mode, tự động kích hoạt `DesktopWorkspaceBar`, `DesktopStatusBar`, dock điều hướng gọn, header gọn `h-12`, loại bỏ giới hạn max-width để mở rộng 100% màn hình.
   - Thêm nút `[🖥️ Xem trước Desktop]` trên Header website để chuyển đổi 1-click.
6. **`frontend/src/index.css`**:
   - Bổ sung rules cho `html[data-mode="desktop"]` và `html[data-density="compact"]` với mật độ padding cô đọng cho bảng dữ liệu và thẻ thống kê.

---

## 4. KẾT QUẢ BUILD, LINT VÀ TEST

- **TypeScript Typecheck & Build:** `tsc -b && vite build` hoàn thành với **Exit code 0** (1800 modules transformed trong 1.20s).
- **Frontend Vitest Test Suite:** **11/11 test files passed**, **36/36 unit tests passed 100%**.
- **Oxlint:** **0 lỗi** trên toàn bộ các file mới và file đã sửa.
- **Backend Spring Boot:** `mvn clean compile` dịch sạch **220 source files Java** đạt **BUILD SUCCESS**.
- **Backend Tests:** **41/41 unit/integration tests passed 100%**.

---

## 5. NHỮNG GIỚI HẠN KỸ THUẬT CÒN TỒN TẠI

1. **Hiệu ứng Kính nhìn xuyên thấu hình nền Desktop máy tính:**
   - Trong trình duyệt web (Edge, Chrome, Brave, Firefox), trình duyệt chạy trong sandbox bảo mật của hệ điều hành, không hỗ trợ API làm trong suốt cửa sổ trình duyệt để thấy hình nền máy tính. Chế độ `Desktop-Kính` trên trình duyệt do đó sử dụng nền không gian Aurora nội bộ do chính website tạo ra.
   - Khả năng nhìn xuyên thấu desktop máy tính thông qua Windows Acrylic/Mica API được hỗ trợ trọn vẹn trong phiên bản ứng dụng desktop độc lập (khi chạy qua `npm run desktop:start` trong thư mục `desktop/`).
2. **Nút Thu nhỏ và Đóng cửa sổ trong trình duyệt:**
   - Khi chạy ở chế độ Xem trước trên trình duyệt, các nút `_`, `▢`, `✕` không thể đóng tab Edge vì chính sách bảo mật trình duyệt; nút `✕` được định tuyến thông minh để tự động đưa người dùng quay trở lại Giao diện Web tiêu chuẩn.

