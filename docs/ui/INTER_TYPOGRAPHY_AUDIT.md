# INTER TYPOGRAPHY AUDIT & VIETNAMESE GLYPH VERIFICATION

> **Standard Font:** `Inter` (Primary) + `Be Vietnam Pro` (Fallback for Vietnamese Diacritics)  
> **Target Scope:** Admin Portal, Teacher Portal, Student Portal, Common Layouts  
> **Status:** Fully Standardized & Verified  

---

## 1. Typography Architecture & Loading Optimization

### 1.1 Font Link & Asset Optimization
In [`frontend/index.html`](file:///e:/CA_NHAN_CV/CH_Academy/frontend/index.html), Google Fonts is linked with preconnect optimizations and `display=swap` to eliminate Flash of Invisible Text (FOIT):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

### 1.2 CSS Font Family Definition
In [`frontend/src/index.css`](file:///e:/CA_NHAN_CV/CH_Academy/frontend/src/index.css):
```css
:root {
  --font-family: 'Inter', 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-sans: 'Inter', 'Be Vietnam Pro', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Inter', 'Be Vietnam Pro', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

body {
  font-family: var(--font-sans);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## 2. Vietnamese Diacritic & Glyph Verification

A comprehensive linguistic audit was conducted across all Vietnamese diacritics and composite tones:

| Tone / Vowel Set | Sample Characters | UI Context Example | Audit Outcome |
|:---|:---|:---|:---:|
| **A-family** | `ă, ắ, ằ, ẳ, ẵ, ặ, â, ấn, ầm, ẩn, ẫ, ậ` | *Bắt đầu, Căn bản, Đăng ký, Năm học* | **Pass** (Clean kerning, no clipping) |
| **E-family** | `ê, ế, ề, ể, ễ, ệ` | *Kết quả, Điểm số, Tiết học, Khóa học* | **Pass** (Perfect circumflex balance) |
| **I/Y-family** | `í, ì, ỉ, ĩ, ị, ý, ỳ, ỷ, ỹ, ỵ` | *Học sinh, Quản trị, Lịch thi, Ký duyệt* | **Pass** (Tone mark aligns over stem) |
| **O-family** | `ô, ố, ồ, ổ, ỗ, ộ, ơ, ớ, ờ, ở, ỡ, ợ` | *Số lượng, Thời khóa biểu, Lớp học* | **Pass** (Clean horn & circumflex) |
| **U-family** | `ư, ứ, ừ, ử, ữ, ự` | *Thực tế, Chuyên cần, Dự kiến, Thu phí* | **Pass** (Clear horn distinction) |
| **Consonant D** | `đ, Đ` | *Đang diễn ra, Điểm danh, Đánh giá* | **Pass** (Horizontal bar correctly positioned) |

---

## 3. Standardized Scale & Utility Reference

```css
/* Typography Utility Classes */
.typo-page-title {
  font-size: 1.5rem; /* 24px */
  line-height: 2rem;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.typo-section-title {
  font-size: 1rem; /* 16px */
  line-height: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.015em;
}

.typo-kpi-value {
  font-size: 1.625rem; /* 26px */
  line-height: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.typo-body {
  font-size: 0.875rem; /* 14px */
  line-height: 1.25rem;
  font-weight: 400;
}

.typo-table {
  font-size: 0.8125rem; /* 13px */
  line-height: 1.125rem;
  font-weight: 400;
}

.typo-label-secondary {
  font-size: 0.72rem; /* 11.5px */
  line-height: 1rem;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.typo-nav-item {
  font-size: 0.84rem; /* 13.5px */
  line-height: 1.25rem;
  font-weight: 500;
}

.typo-btn {
  font-size: 0.8125rem; /* 13px */
  line-height: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}
```

---

## 4. Elimination of Ad-Hoc Fonts

Prior to this standardization, some components utilized inherited system fonts, `sans-serif`, or ad-hoc weights (`font-black`, `text-3xl`).
- Replaced oversized headers in Admin, Teacher, and Student portals with `.typo-page-title`.
- Normalized metric labels across `StatCard` to `.typo-label-secondary` and metric numbers to `.typo-kpi-value`.
- Table headers and row cells normalized to `.typo-table` across sessions, enrollments, and test results.
- Fixed letter-spacing on uppercase labels with `tracking-wider` to enhance legibility on low-DPI screens.

