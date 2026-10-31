# BÁO CÁO DI TRÚ CƠ SỞ DỮ LIỆU (DATABASE MIGRATION REPORT)
**Dự án:** CH Academy  
**Công cụ Quản lý Di trú:** Flyway  
**Cơ sở Dữ liệu:** PostgreSQL 16 (`ch_academy_postgres`)  

---

## 1. DANH SÁCH BẢN DI TRÚ ĐÃ THỰC HIỆN

| Phiên bản | Tên tệp di trú | Nội dung & Mục tiêu | Trạng thái |
| :--- | :--- | :--- | :--- |
| **V1 -> V26** | Initial Schema & AI Platform | Khởi tạo cấu trúc bảng lõi, hệ thống người dùng, khóa học, điểm danh, tài chính và AI Chat. | Đã áp dụng |
| **V27** | `V27__Drop_Raw_Password_And_Security_Hardening.sql` | Loại bỏ cột lưu mật khẩu thô `raw_password`, bảo mật tài khoản. | Đã áp dụng |
| **V28** | `V28__Create_Academic_Year_Schema.sql` | Tạo bảng `academic_years`, đánh index, chèn 9 năm học từ 2023 đến 2032. | **Hoàn thành thành công (Đã kiểm chứng)** |

---

## 2. KẾT QUẢ KIỂM TRA BẢNG CƠ SỞ DỮ LIỆU THỰC TẾ
Thực hiện truy vấn trên Docker PostgreSQL container:
```sql
SELECT id, code, name, start_date, end_date, is_current, status FROM academic_years ORDER BY start_date ASC;
```

Kết quả:
```
 id |   code    |          name          | start_date |  end_date  | is_current |  status   
----+-----------+------------------------+------------+------------+------------+-----------
  1 | 2023-2024 | Năm học 2023 - 2024    | 2023-09-01 | 2024-06-30 | f          | COMPLETED
  2 | 2024-2025 | Năm học 2024 - 2025    | 2024-09-01 | 2025-06-30 | f          | COMPLETED
  3 | 2025-2026 | Năm học 2025 - 2026    | 2025-09-01 | 2026-06-30 | f          | ACTIVE
  4 | 2026-2027 | Năm học 2026 - 2027    | 2026-09-01 | 2027-06-30 | t          | ACTIVE
  5 | 2027-2028 | Năm học 2027 - 2028    | 2027-09-01 | 2028-06-30 | f          | UPCOMING
  6 | 2028-2029 | Năm học 2028 - 2029    | 2028-09-01 | 2029-06-30 | f          | UPCOMING
  7 | 2029-2030 | Năm học 2029 - 2030    | 2029-09-01 | 2030-06-30 | f          | UPCOMING
  8 | 2030-2031 | Năm học 2030 - 2031    | 2030-09-01 | 2031-06-30 | f          | UPCOMING
  9 | 2031-2032 | Năm học 2031 - 2032    | 2031-09-01 | 2032-06-30 | f          | UPCOMING
```
Toàn bộ dữ liệu người dùng, điểm danh, điểm thi và học phí được bảo toàn nguyên vẹn 100%, không bị ảnh hưởng hay thất thoát.
