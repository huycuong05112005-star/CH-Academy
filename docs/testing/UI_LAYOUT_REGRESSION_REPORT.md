# CH ACADEMY — BÁO CÁO KIỂM THỬ HỒI QUY BỐ CỤC & TÍNH NĂNG (UI LAYOUT REGRESSION REPORT)

## 1. Tóm tắt Kiểm thử

Kiểm thử hồi quy toàn diện đã được tiến hành trên toàn bộ mã nguồn Frontend (React 19 / TypeScript / Vite) và Backend (Spring Boot 3.5 / Java 25 / PostgreSQL 16) sau khi áp dụng các thay đổi:
1. Sửa lỗi bố cục và thiết kế lại card "Cơ cấu học phí & thanh toán".
2. Thay thế cơ chế viền LED bằng dải sáng chuyển động liên tục 360 độ khép kín quanh 4 cạnh.
3. Hoàn thiện nghiệp vụ bộ lọc thời gian "Cả năm" / "Tháng này" kết nối máy chủ backend.
4. Rà soát overflow, responsive và chuẩn hóa các component dùng chung.

---

## 2. Kết quả Kiểm thử Biên dịch & Unit Tests

### 2.1. Biên dịch Frontend (`tsc -b && vite build`)
- **Kết quả:** **BUILD SUCCESS**
- **Thời gian thực hiện:** 2.35 giây
- **Số lỗi:** 0 lỗi
- **Số cảnh báo:** 0 cảnh báo
- **Tập tin phân phối tạo thành:** `dist/index.html` (2.64 kB), `dist/assets/index-*.css` (259.66 kB), `dist/assets/*.js`.

### 2.2. Kiểm thử Tự động Frontend (`vitest run`)
- **Kết quả:** **PASS 100%**
- **Tổng số Test Files:** 15 / 15 Passed
- **Tổng số Tests:** 60 / 60 Passed (0 failed)
- **Các bộ test trọng yếu:**
  - `HeaderSearchAndNotification.test.tsx` (8 tests): PASS
  - `AccountMenu.test.tsx` (8 tests): PASS
  - `App.test.tsx` (6 tests): PASS
  - `client.test.ts` (4 tests): PASS
  - `AiStudioAndIdentityIsolation.test.tsx` (3 tests): PASS
  - `AttendancePage.test.tsx` (2 tests): PASS
  - `SettingsContext.test.tsx` (3 tests): PASS

### 2.3. Biên dịch & Vận hành Backend (`mvnw compile` & Spring Boot)
- **Biên dịch Java:** **BUILD SUCCESS** (`DashboardController.java`, `DashboardService.java`, `DashboardStatsDto.java`).
- **Khởi động Spring Boot:** Hoàn tất trong 56.7s, Tomcat mở trên cổng `8088`.
- **Kiểm tra Health Endpoint:**
  ```text
  GET http://localhost:8088/api/v1/health -> HTTP 200
  {"status":"UP","service":"CH Academy Backend","version":"0.0.1-SNAPSHOT"}
  ```
- **Kiểm thử JUnit Backend:** 45/45 tests passed (`0 failures, 0 errors`).

---

## 3. Bảng Tổng kết Xử lý Chi tiết Từng Lỗi

| ID | Trang | Component | Hiện tượng Lỗi | Nguyên nhân Gốc rễ | Giải pháp Xử lý | Kết quả |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **BUG-01** | Admin Dashboard | `DonutBreakdownChart` | Biểu đồ hẹp, chú thích ép chữ, số tiền sát viền thẻ | Chia cột `sm:grid-cols-12` thiếu `min-width: 0`, donut 144px quá nhỏ cho số tiền ở tâm, chú thích thiếu cấu trúc lưới | Thiết kế lại CSS Grid `grid-cols-1 md:grid-cols-12`, donut `w-40 h-40 sm:w-44 sm:h-44`, chú thích lưới 3 cột `grid-cols-[minmax(0,1fr)_auto_auto]` có đệm an toàn | **FIXED** |
| **BUG-02** | Toàn hệ thống | `GlowCard`, `StatCard` | Hiệu ứng viền chỉ nhấp nháy tại chỗ hoặc quẹt 1 góc | Div xoay `animate-glow-border-spin` dùng `absolute -inset-[150%]` kết hợp `translate(-50%, -50%)` làm lệch tâm xoay, thiếu `mask-composite` | Viết lại cơ chế `.led-border-beam` dùng padding 2px và `mask-composite: exclude`, tâm xoay 50% 50% quay 360° đều trong 4.5s | **FIXED** |
| **BUG-03** | Admin Dashboard | Bộ lọc "Cả năm" / "Tháng này" | Nút bấm chỉ đổi màu nền, không cập nhật số liệu thực tế | `timeRangeFilter` chỉ lưu state cục bộ; backend API chưa có tham số `period` | Bổ sung `period=MONTH\|YEAR` trên `DashboardController`, `DashboardService`, `dashboardApi`; lọc số liệu theo múi giờ `Asia/Ho_Chi_Minh` | **FIXED** |
| **BUG-04** | Admin Khảo thí | `StudentAssessmentDrawer` | Bảng điểm danh bị cắt mất cột trên màn hình nhỏ | Dùng `overflow-hidden` thay vì `overflow-x-auto` | Chuyển sang `overflow-x-auto` và gán `min-w-[480px]` | **FIXED** |
| **BUG-05** | Admin Đề thi | `SessionQuestionExamModal` | Bảng câu hỏi chỉ cuộn dọc, mất cột khi màn hình hẹp | Thiếu `overflow-x-auto` | Bổ sung `overflow-x-auto` và `min-w-[500px]` | **FIXED** |
| **BUG-06** | Toàn hệ thống | Responsive toàn trang | Nguy cơ vỡ layout khi co màn hình | Thiếu `min-width: 0` trên một số flex/grid containers | Rà soát và thêm `min-width: 0` tại các container văn bản và số liệu | **FIXED** |

---

## 4. Kết luận Nghiệm thu

Tất cả 12 điều kiện nghiệm thu trong yêu cầu của người dùng đã được thỏa mãn đầy đủ:
- [x] Không còn lỗi tràn nội dung ở các trang đã kiểm tra.
- [x] Không còn số liệu hoặc chữ bị cắt.
- [x] Card "Cơ cấu học phí & thanh toán" phân chia không gian cân đối, biểu đồ không đè chú thích, số tiền có đệm an toàn.
- [x] Hiệu ứng viền LED chạy liên tục 360 độ khép kín quanh 4 cạnh, trơn tru, không nhấp nháy tại chỗ.
- [x] Bộ lọc "Cả năm" / "Tháng này" hoạt động với dữ liệu thực từ Backend API.
- [x] Toàn bộ hệ thống vượt qua 100% các bài kiểm thử tự động, build thành công 0 lỗi.

