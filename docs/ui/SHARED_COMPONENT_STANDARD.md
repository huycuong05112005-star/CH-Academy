# CH ACADEMY — QUY CHUẨN THÀNH PHẦN DÙNG CHUNG (SHARED COMPONENT STANDARD)

## 1. Giới thiệu

Tài liệu này xác lập quy chuẩn kỹ thuật cho toàn bộ các thành phần giao diện dùng chung (Shared Components) tại CH Academy nhằm loại bỏ hoàn toàn việc mỗi trang tự viết CSS riêng lẻ gây lệch lạc bố cục và khó bảo trì.

---

## 2. Tiêu chuẩn Chi tiết cho Từng Nhóm Component

### 2.1. Thẻ Chỉ số KPI (`StatCard`)
- **Tập tin:** `frontend/src/components/ui/StatCard.tsx`
- **Cấu trúc:** Bọc ngoài bởi `GlowCard`, kế thừa hiệu ứng LED viền 360 độ và đổ bóng mềm.
- **Tiêu đề:** Sử dụng `.typo-label-secondary`, màu `text-slate-500 dark:text-[#A6B4C8]`, hỗ trợ `truncate`.
- **Icon Container:** Kích thước `w-10 h-10 rounded-xl`, nền xám nhạt (Dark: Slate-800), bo góc `rounded-xl`, đổ bóng `shadow-2xs`.
- **Số liệu (Value):** Sử dụng `.typo-kpi-value`, `tabular-nums`, tự động rút gọn hoặc hiển thị hiệu ứng `CountUpNumber` khi là số nguyên.
- **Chân thẻ (Footer):** Phân cách bởi `border-t border-slate-100 dark:border-slate-800`, bao gồm chỉ số xu hướng (trend text xanh/đỏ) và nút hành động nhanh bên phải.

### 2.2. Thẻ Đa năng Kèm Viền LED Chạy (`GlowCard`)
- **Tập tin:** `frontend/src/components/ui/GlowCard.tsx`
- **Hiệu ứng LED:** Sử dụng class `.led-border-beam` và `.led-border-spinner` với `padding: 2px` và CSS mask `mask-composite: exclude`.
- **Màu sắc hỗ trợ (GlowColorVariant):** `cyan`, `blue`, `indigo`, `emerald`, `amber`, `purple`, `rose`.
- **Tương tác:** Khi rê chuột (`:hover`) hoặc khi đang active, dải sáng LED chạy đều 360 độ quanh 4 cạnh với chu kỳ 4.5s.
- **Lớp nền an toàn:** Nội dung bên trong nằm trong lớp `relative z-10 w-full h-full bg-white dark:bg-[#101B2D]` với bo góc khớp với viền ngoài, bảo đảm không bị dải LED đè lên văn bản hay cản trở click.

### 2.3. Biểu đồ Cơ cấu Tròn (`DonutBreakdownChart`)
- **Tập tin:** `frontend/src/components/ui/DashboardCharts.tsx`
- **Bố cục ngoài:** CSS Grid phân chia `grid-cols-1 md:grid-cols-12 gap-6 items-center`.
- **Vùng Donut (Cột trái):** Chiếm 5 cột trên màn hình trung bình trở lên (`md:col-span-5`). SVG đường kính lớn `w-40 h-40 sm:w-44 sm:h-44`, vòng stroke 4.2px, tâm thể hiện nhãn tóm tắt và giá trị tiền tệ `tabular-nums`.
- **Vùng Chú thích (Cột phải):** Chiếm 7 cột (`md:col-span-7`). Mỗi mục là một thẻ con dạng lưới 3 cột `grid-cols-[minmax(0,1fr)_auto_auto]` có đệm an toàn `pr-1` và viền sắc nét, phần trăm căn phải đều tăm tắp, tiền tệ căn phải rõ ràng.

### 2.4. Bảng Dữ liệu Chuẩn (`Data Table`)
- **Container bọc ngoài:** Bắt buộc có class `overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800`.
- **Phần tử Table:** `w-full text-left border-collapse text-xs` kèm `min-w-[...]` tương ứng với số lượng cột (thường từ 600px đến 1100px).
- **Hàng tiêu đề (thead):** `bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase text-[11px] tracking-wider sticky top-0`.
- **Dòng dữ liệu (tbody tr):** Hiệu ứng hover nhẹ `hover:bg-slate-50/70 dark:hover:bg-slate-800/40`, đệm ô `p-3` hoặc `p-3.5`.

### 2.5. Hộp thoại & Cửa sổ Nổi (`Modal & Drawer`)
- **Z-Index:** Tối thiểu `z-[9999]` để nằm trên toàn bộ Sidebar, Topbar và Floating Chat Widget.
- **Backdrop:** Nền tối mờ `bg-slate-900/60 backdrop-blur-sm`, nhấp ra ngoài để đóng.
- **Thích ứng chiều cao:** Viewport wrapper sử dụng `flex min-h-full items-start justify-center p-3 sm:p-6 overflow-y-auto`. Hộp thoại chính mang `max-h-[calc(100vh-3rem)] flex flex-col`.
- **Phím tắt hỗ trợ:** Lắng nghe phím `Escape` để đóng cửa sổ ngay lập tức.
