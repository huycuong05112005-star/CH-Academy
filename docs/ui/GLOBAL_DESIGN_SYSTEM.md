# CH ACADEMY — HỆ THỐNG THIẾT KẾ TOÀN DIỆN (GLOBAL DESIGN SYSTEM)

## 1. Giới thiệu & Tôn chỉ Thiết kế

CH Academy là nền tảng quản lý đào tạo & khảo thí trực tuyến (EdTech SaaS) hướng đến tiêu chuẩn Enterprise. Hệ thống thiết kế (Design System) này thiết lập các quy chuẩn giao diện toàn diện, đồng nhất giữa cả ba không gian người dùng:
- **Admin Portal (Cổng Quản trị viên)**
- **Teacher Portal (Cổng Giảng viên)**
- **Student Portal (Cổng Học viên)**

### Tôn chỉ cốt lõi:
1. **Bảo tồn bản sắc thương hiệu CH Academy:** Giữ vững bảng màu nhận diện (CH Navy `#0F243E`, Electric Sky/Cyan `#0EA5E9`), phong cách bo góc hiện đại, logo và icon đặc trưng.
2. **Loại bỏ tính chất AI-generated:** Không sử dụng các khối cầu xoay 3D lòe loẹt, các quầng sáng mờ (ambient glow) kích thước lớn làm mờ nhạt nội dung chuyên môn, hoặc các khẩu hiệu marketing sáo rỗng.
3. **Mật độ thông tin tối ưu (High-density SaaS layout):** Học tập cấu trúc phân cấp thông tin và tổ chức bảng biểu, thẻ số liệu từ mô hình Enterprise Dashboard (tham khảo Nexora) mà không sao chép nguyên mẫu Dark Theme hay phá vỡ nhận diện thương hiệu.

---

## 2. Bảng Design Tokens chuẩn hóa (`:root`)

Các tokens dùng chung được cấu hình trực tiếp tại `frontend/src/index.css`:

```css
:root {
  /* ==========================================================================
     TYPOGRAPHY TOKENS
     ========================================================================== */
  --font-family-base: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* Font Size Scale */
  --font-size-xs: 11px;    /* Secondary metadata, tooltips, tags */
  --font-size-sm: 12px;    /* Table data, secondary actions, badge text */
  --font-size-base: 13px;  /* Nav items, compact body text, input fields */
  --font-size-md: 14px;    /* Primary body text, card subtitles */
  --font-size-lg: 16px;    /* Section titles, modal headers */
  --font-size-xl: 18px;    /* Sub-page titles, highlights */
  --font-size-2xl: 22px;   /* Page titles, major portal headings */
  --font-size-3xl: 26px;   /* Major KPI values, metric hero digits */

  /* Font Weights */
  --font-regular: 400;     /* Body copy, table cells */
  --font-medium: 500;      /* Nav links, table headers, labels */
  --font-semibold: 600;    /* Card titles, buttons, section headers */
  --font-bold: 700;        /* Page titles, primary KPI numbers */

  /* ==========================================================================
     SPACING & LAYOUT TOKENS
     ========================================================================== */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* ==========================================================================
     BORDER RADIUS TOKENS
     ========================================================================== */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* ==========================================================================
     BRAND & THEME PALETTE
     ========================================================================== */
  --color-brand-navy: #0F243E;
  --color-brand-cyan: #0EA5E9;
  --color-brand-indigo: #4F46E5;
  --color-surface-light: #F8FAFC;
  --color-surface-dark: #0B1220;
  --color-border-light: #E2E8F0;
  --color-border-dark: #1E293B;

  /* Status Colors */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-info: #0EA5E9;
}
```

---

## 3. Hệ thống Component Chuẩn hóa

### 3.1. Page Header (Tiêu đề trang)
- **Chiều cao & khoảng cách:** Khoảng cách đáy `pb-3` hoặc `pb-4`, phân tách rõ với nội dung chính.
- **Tiêu đề chính:** Sử dụng `.typo-page-title` (22px, font-weight 700), màu chữ Slate-900 (Dark: White).
- **Huy hiệu bối cảnh:** Kèm mã định danh hoặc trạng thái (ví dụ mã giảng viên, mã học sinh) với font 11px, bo góc `rounded-full`.
- **Thanh thao tác phụ:** Nhóm nút bên phải gồm lọc năm học, thời gian hoặc nút hành động chính (button primary).

### 3.2. Navigation Tabs (Thanh điều hướng phân tab)
- **Container:** Nền bán trong suốt `bg-white/90 dark:bg-[#151F31]/90`, đệm `p-1`, bo góc `rounded-xl`, viền mờ `border-slate-200/80 dark:border-[#2A3A50]`.
- **Tab Item:**
  - Font chữ: `text-[12.5px] font-medium`.
  - Padding: `px-3 py-1.5 rounded-lg`.
  - Icon: `size={14}` hoặc `size={15}` đặt thẳng hàng bên trái nhãn.
  - Trạng thái Active: Nền thương hiệu đặc trưng theo portal (Admin: Sky/Slate; Teacher: Indigo-600; Student: Navy/Sky), chữ tương phản cao, đổ bóng tối thiểu `shadow-xs`.

### 3.3. Card & Container
- **Bo góc chuẩn:** `rounded-xl` (12px) hoặc `rounded-2xl` (16px) cho container lớn.
- **Viền & Đổ bóng:** Viền sắc nét `border border-slate-200/80 dark:border-slate-800`, không lạm dụng bóng mờ lớn hoặc gradient sặc sỡ.
- **Card Header:** Chiều cao 48px - 52px, bao gồm tiêu đề nhóm (`.typo-card-title`, 13.5px, 600) và nút thao tác nhanh bên phải.

### 3.4. Bảng Dữ liệu (Data Tables)
- **Header:** Chiều cao 36px, nền `bg-slate-50 dark:bg-slate-900/60`, font `.typo-table font-semibold text-slate-500 uppercase tracking-wider text-[11px]`.
- **Hàng dữ liệu:** Chiều cao 44px - 48px, font `.typo-table text-[12.5px]`, hiệu ứng hover nhẹ `hover:bg-slate-50/70 dark:hover:bg-slate-800/40`.
- **Căn lề chuẩn:** Văn bản căn trái, số liệu và tiền tệ căn phải với font số mono/tabular, trạng thái và hành động căn giữa.

### 3.5. Biểu mẫu & Nút bấm (Forms & Buttons)
- **Input Fields:** Chiều cao chuẩn 36px (`h-9`), padding ngang `px-3`, font `text-[12.5px]`, bo góc `rounded-lg`.
- **Buttons:**
  - Primary: Chiều cao 36px, font `.typo-btn` (12.5px, 600), bo góc `rounded-lg`.
  - Secondary/Ghost: Nền trong suốt hoặc xám nhẹ, viền mảnh.
  - Icon Button: Kích thước `w-8 h-8` hoặc `w-9 h-9`, bo góc `rounded-lg`.
