# BÁO CÁO HỆ THỐNG QUẢN LÝ NĂM HỌC ĐỘNG (ACADEMIC YEAR MANAGEMENT)
**Dự án:** CH Academy  
**Công nghệ:** Flyway Migration V28, PostgreSQL, Spring Data JPA, REST API, React Vite  

---

## 1. THỰC TRẠNG VÀ HẠN CHẾ BAN ĐẦU
Trong các phiên bản trước:
- Bộ chọn năm học tại Dashboard và Desktop Workspace Bar chỉ hỗ trợ tĩnh đến năm 2028 (mảng cố định `['2023-2024', '2024-2025', '2025-2026', '2026-2027', '2027-2028']`).
- Không có bảng cơ sở dữ liệu riêng để quản lý thông tin năm học, ngày bắt đầu, ngày kết thúc và trạng thái năm học hiện tại (`isCurrent`).
- Không có API để thêm mới các năm học tương lai (2028-2029, 2029-2030, 2030-2031, 2031-2032+).

---

## 2. THIẾT KẾ KIẾN TRÚC MỚI

### 2.1. Cấu trúc Cơ sở Dữ liệu (Migration V28)
```sql
CREATE TABLE IF NOT EXISTS academic_years (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_academic_years_code ON academic_years(code);
CREATE INDEX IF NOT EXISTS idx_academic_years_is_current ON academic_years(is_current);
```

### 2.2. Dữ liệu hạt giống (Seed Data)
Đã khởi tạo các năm học từ quá khứ đến tương lai dài hạn:
- `2023-2024` (COMPLETED)
- `2024-2025` (COMPLETED)
- `2025-2026` (ACTIVE)
- `2026-2027` (ACTIVE — Năm học hiện tại mặc định: `is_current = true`)
- `2027-2028` (UPCOMING)
- `2028-2029` (UPCOMING)
- `2029-2030` (UPCOMING)
- `2030-2031` (UPCOMING)
- `2031-2032` (UPCOMING)

### 2.3. Danh mục API RESTful
- `GET /api/v1/academic-years`: Lấy danh sách toàn bộ các năm học, sắp xếp theo thời gian mới nhất.
- `GET /api/v1/academic-years/current`: Lấy thông tin năm học hiện tại.
- `POST /api/v1/academic-years`: Tạo mới một năm học bất kỳ trong tương lai.
- `PUT /api/v1/academic-years/{id}/set-current`: Thiết lập năm học hiện tại của hệ thống.

### 2.4. Tích hợp Giao diện (Frontend)
- Tạo service `academicYearApi` trong `frontend/src/api/academicYear.ts`.
- Cập nhật thanh công cụ nhanh `DesktopWorkspaceBar.tsx` tự động tải danh sách năm học từ database, loại bỏ hoàn toàn hardcode.
- Cập nhật `DashboardPage.tsx` tự động đồng bộ theo danh sách năm học từ backend và hỗ trợ lọc chỉ số theo từng năm học linh hoạt.
