# CH ACADEMY — BÁO CÁO PHÂN TÍCH & KHẮC PHỤC THÀNH PHẦN LỖI (LAYOUT BROKEN COMPONENTS)

## 1. Thành phần 1: Card "Cơ cấu học phí & thanh toán" (`DonutBreakdownChart`)

### 1.1. Phân tích Hiện trạng Lỗi (Root Cause)
- **Kích thước Donut không tương xứng:** Vòng tròn donut ban đầu chỉ có kích thước `w-36 h-36` (144px), đường kính vòng trong chỉ khoảng 100px. Khi render số tiền lớn (`100.000.000 ₫` hoặc `2.450.000.000 ₫`) kèm nhãn "Tổng dự thu" ở tâm, chữ bị ép sát vòng cung hoặc tràn ra ngoài.
- **Phân chia cột chưa hợp lý:** Chia cột cứng `sm:grid-cols-12` với biểu đồ 5 cột và chú thích 7 cột nhưng không có `min-width: 0` trên các phần tử con.
- **Hàng chú thích bị dồn toa:** Mỗi mục chú thích sử dụng `flex items-center justify-between`. Khi màn hình thu nhỏ xuống khoảng 1366px (laptop), phần nhãn dài ("Đã hoàn tất thanh toán") bị `truncate` cụt ngủn, trong khi phần số tiền bên phải dính sát mép thẻ mà không có khoảng đệm bảo vệ, dễ gây cảm giác đè chữ.

### 1.2. Giải pháp Tái cấu trúc Thiết kế
1. Mở rộng kích thước vòng Donut lên `w-40 h-40 sm:w-44 sm:h-44`, điều chỉnh font số ở tâm thành `text-xs sm:text-[13px] font-extrabold tabular-nums` kèm tiêu đề phụ rõ ràng.
2. Thiết kế lại khu vực chú thích bằng cấu trúc lưới 3 cột nội tại:
   ```css
   grid-template-columns: minmax(0, 1fr) auto auto;
   gap: 12px;
   ```
   - Cột 1: Chấm màu nhận diện + Tên hạng mục (hỗ trợ truncate mềm dẻo).
   - Cột 2: Phần trăm tỷ trọng (căn phải với chiều rộng cố định `w-11`, tạo thành một cột dọc thẳng tắp).
   - Cột 3: Số tiền định dạng VND (font mono in đậm, có đệm `px-3` và `pr-1` chống sát viền card).
3. Mỗi hàng chú thích được đặt trong một khối thẻ con với nền `bg-slate-50/70 dark:bg-slate-800/40`, bo góc `rounded-xl`, viền mờ `border-slate-100 dark:border-slate-800/70` và hiệu ứng hover nhẹ.
4. Trên màn hình dưới `768px`, component tự động chuyển đổi thành bố cục dọc (stacked layout), biểu đồ nằm trên và danh sách chú thích nằm dưới.

---

## 2. Thành phần 2: Hiệu ứng Viền LED Chạy Quanh 360 Độ (`GlowCard`)

### 2.1. Phân tích Hiện trạng Lỗi
- Trước đây, `GlowCard.tsx` sử dụng một thẻ div xoay với class `animate-glow-border-spin` bên dưới lớp nền card.
- Tuy nhiên, div xoay này vừa mang class `absolute -inset-[150%]` (chiều rộng 400%), vừa bị gán `transform: translate(-50%, -50%) rotate(...)` trong CSS. Kết quả là tâm xoay bị lệch hoàn toàn khỏi tâm card, làm cho vệt sáng chỉ quẹt qua một góc hoặc nhấp nháy tại chỗ như đèn chớp, không tạo được chuyển động chạy đều quanh chu vi.
- Thiếu kỹ thuật che mặt nạ (`mask-composite: exclude`), khiến ánh sáng bị khuếch tán không đều vào các góc bo.

### 2.2. Giải pháp Kỹ thuật Mới
Áp dụng công nghệ CSS Masking hiện đại chuẩn Enterprise:
```css
@keyframes led-border-spin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.led-border-beam {
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 2px; /* Độ dày dải LED 2px */
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 5;
}

.led-border-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 350%;
  padding-bottom: 350%;
  transform: translate(-50%, -50%);
  animation: led-border-spin 4.5s linear infinite;
  transform-origin: center center;
  will-change: transform;
}
```
- **Chu kỳ xoay:** Đúng **4.5 giây / vòng**, chuyển động đều đặn và khép kín 360 độ quanh toàn bộ 4 cạnh và góc bo.
- **Độ dày:** Đúng 2px viền, khớp chính xác từng pixel của `border-radius: inherit`.
- **Hiệu năng:** 100% xử lý bằng GPU Compositor Layer, không gây reflow hay layout shift.
- **Khả năng tương thích:** Tự động vô hiệu hóa khi người dùng kích hoạt chế độ giảm chuyển động (`prefers-reduced-motion`).

---

## 3. Thành phần 3: Bộ Lọc Thời Gian ("Cả năm" / "Tháng này")

### 3.1. Phân tích Hiện trạng
- Nút bấm "Cả năm" và "Tháng này" trên Dashboard chỉ là hai nút bấm thay đổi state `timeRangeFilter` trong nội bộ component mà không gọi lại API hoặc cập nhật các con số thực tế.
- Backend API `/api/v1/dashboard/stats` chỉ nhận tham số `academicYear`, chưa có tham số `period`.

### 3.2. Giải pháp Hoàn thiện Chức năng
1. **Mở rộng Backend DTO & Service:**
   - Cập nhật `DashboardStatsDto` bổ sung thuộc tính `period` ("YEAR" hoặc "MONTH").
   - Cập nhật `DashboardService.java`: Nhận thêm `String period`.
     - Khi `period=MONTH`: Xác định ngày bắt đầu tháng (`today.withDayOfMonth(1)`) và ngày kết thúc tháng (`today.withDayOfMonth(today.lengthOfMonth())`) theo múi giờ Việt Nam (`Asia/Ho_Chi_Minh`).
     - Lọc chính xác tổng học phí phải thu phát sinh trong tháng (`receivableRepository.sumReceivablesBetween`), số tiền thực thu ghi nhận qua các phiếu thanh toán trong tháng (`receivableRepository.sumPaidBetween`), công nợ của tháng và số lượng hồ sơ tuyển sinh mới trong tháng.
2. **Cập nhật Backend Controller:**
   - `DashboardController.java`: Tiếp nhận `@RequestParam(required = false, defaultValue = "YEAR") String period`.
3. **Cập nhật Frontend Client & Dashboard Page:**
   - `dashboardApi.getStats(academicYear, period)`.
   - Hàm `handlePeriodChange('YEAR' | 'MONTH')` đồng bộ URL query param `?period=...`, kích hoạt `fetchStats` và cập nhật lại toàn bộ KPI cards, Donut Breakdown và các nhãn phụ đề trực quan.
