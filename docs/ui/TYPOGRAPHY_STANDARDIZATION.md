# CH ACADEMY — QUY CHUẨN TYPOGRAPHY TOÀN DỰ ÁN

## 1. Mục tiêu & Nguyên tắc

Một trong những hạn chế lớn nhất của giao diện cũ là sự thiếu nhất quán về phân cấp chữ:
- Tiêu đề ở mỗi trang dùng kích thước khác nhau (từ 24px đến 36px, lúc dùng `font-black`, lúc dùng `font-extrabold`).
- Trọng lượng font (font-weight) bị lạm dụng: nhiều đoạn văn bản thông thường được gán `font-bold` hoặc `font-extrabold`, tạo cảm giác thô kệch và mang phong cách template AI tự động.
- Thiếu hệ thống typography class thống nhất cho các thành phần đặc thù (KPI numbers, Table cells, Sidebar items).

CH Academy đã chuẩn hóa toàn bộ font chữ dựa trên **Inter**, áp dụng quy tắc font size và line-height theo chuẩn Enterprise SaaS.

---

## 2. Thang Typographic Chuẩn và Các Utility Classes

| Thành phần | Class Utility | Kích thước | Trọng lượng (Weight) | Line Height | Ứng dụng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title** | `.typo-page-title` | 22px | 700 (Bold) | 1.25 (-0.02em letter spacing) | Tiêu đề chính đầu trang |
| **Section Title** | `.typo-section-title` | 15.5px | 600 (Semibold) | 1.35 | Tiêu đề phân đoạn lớn |
| **Card Title** | `.typo-card-title` | 13.5px | 600 (Semibold) | 1.4 | Tiêu đề card, tiêu đề widget |
| **KPI Metric Value** | `.typo-kpi-value` | 25px | 700 (Bold) | 1.15 (tabular-nums) | Con số thống kê lớn trong thẻ KPI |
| **Body Primary** | `.typo-body` | 13.5px | 400 (Regular) | 1.5 | Đoạn văn, mô tả chi tiết |
| **Table Cell** | `.typo-table` | 12.5px | 400 (Regular) | 1.4 (tabular-nums) | Dữ liệu dòng trong bảng dữ liệu |
| **Nav Menu Item** | `.typo-nav-item` | 12.5px | 500 (Medium) | 1.3 | Menu item sidebar, tab bar |
| **Secondary Label** | `.typo-label-secondary` | 11.5px | 500 (Medium) | 1.3 | Nhãn phụ, metadata, thời gian |
| **Button Text** | `.typo-btn` | 12.5px | 600 (Semibold) | 1.2 | Nhãn trên nút bấm hành động |
| **Tooltip / Badge** | `.typo-tooltip` | 11.5px | 500 (Medium) | 1.2 | Chú giải nhanh, huy hiệu nhỏ |

---

## 3. Khai báo CSS trong `frontend/src/index.css`

```css
/* Typography Scale & Semantic Classes */
.typo-page-title {
  font-family: var(--font-family-base);
  font-size: var(--font-size-2xl); /* 22px */
  font-weight: var(--font-bold);
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.typo-section-title {
  font-family: var(--font-family-base);
  font-size: 15.5px;
  font-weight: var(--font-semibold);
  line-height: 1.35;
  letter-spacing: -0.01em;
}

.typo-card-title {
  font-family: var(--font-family-base);
  font-size: 13.5px;
  font-weight: var(--font-semibold);
  line-height: 1.4;
}

.typo-kpi-value {
  font-family: var(--font-family-base);
  font-size: 25px;
  font-weight: var(--font-bold);
  line-height: 1.15;
  letter-spacing: -0.025em;
  font-feature-settings: "tnum" 1, "cv05" 1;
}

.typo-body {
  font-family: var(--font-family-base);
  font-size: 13.5px;
  font-weight: var(--font-regular);
  line-height: 1.5;
}

.typo-table {
  font-family: var(--font-family-base);
  font-size: 12.5px;
  font-weight: var(--font-regular);
  line-height: 1.4;
  font-feature-settings: "tnum" 1;
}

.typo-nav-item {
  font-family: var(--font-family-base);
  font-size: 12.5px;
  font-weight: var(--font-medium);
  line-height: 1.3;
}

.typo-label-secondary {
  font-family: var(--font-family-base);
  font-size: 11.5px;
  font-weight: var(--font-medium);
  line-height: 1.3;
}

.typo-btn {
  font-family: var(--font-family-base);
  font-size: 12.5px;
  font-weight: var(--font-semibold);
  line-height: 1.2;
}

.typo-tooltip {
  font-family: var(--font-family-base);
  font-size: 11.5px;
  font-weight: var(--font-medium);
  line-height: 1.2;
}
```

---

## 4. Bảng So sánh Trước & Sau Chuẩn hóa (Before / After)

| Thành phần | Trước khi chuẩn hóa (Before) | Sau khi chuẩn hóa (After) | Lợi ích đạt được |
| :--- | :--- | :--- | :--- |
| **Admin Dashboard Greeting** | `text-2xl sm:text-3xl font-extrabold tracking-tight` (28-32px, 800) | `.typo-page-title` (22px, 700) | Nhã nhặn, cân đối với tỷ lệ màn hình 1366x768 & 1440x900 |
| **Teacher Header Title** | `text-2xl sm:text-3xl font-extrabold` (30px, 800) | `.typo-page-title` (22px, 700) | Đồng bộ tuyệt đối với Admin và Student |
| **Student Header Title** | `text-2xl sm:text-3xl font-extrabold` (30px, 800) | `.typo-page-title` (22px, 700) | Cắt giảm chiều cao tiêu đề, tránh đẩy lùi nội dung tab |
| **Sidebar Menu Text** | `text-sm font-semibold` (14px, 600) | `.typo-nav-item` (12.5px, 500) | Gọn gàng, vừa vặn độ rộng 240px, hiển thị trọn vẹn nhãn dài |
| **Sidebar Group Headers** | `text-[11px] font-bold text-slate-400` kèm badge đếm | `text-[10.5px] font-semibold tracking-wider uppercase` | Không bị rối mắt, phân vùng chức năng rõ nét |
| **Navigation Tab Pills** | `px-3.5 py-2 text-xs sm:text-sm font-bold` | `px-3 py-1.5 text-[12.5px] font-medium` | Tab bar thấp hơn 12px, thao tác nhanh và êm mắt |
| **Table Column Headers** | Hỗn hợp `text-xs font-medium` và `text-sm` | `.typo-table font-semibold uppercase text-[11px]` | Định vị cột chuẩn quốc tế, dễ đọc khi quét nhanh dữ liệu |

