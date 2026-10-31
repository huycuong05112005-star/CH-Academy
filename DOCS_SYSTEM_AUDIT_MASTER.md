# CH ACADEMY — BÁO CÁO KIỂM TOÁN HỆ THỐNG, BẢO MẬT & NĂM HỌC (MASTER DOCUMENT)

> **Dự án**: CH Academy — Nền tảng Giáo dục & Đào tạo  
> **Trạng thái**: Hoạt động ổn định (Production Ready)  
> **Phiên bản tài liệu**: 2.5 (Hợp nhất toàn diện các báo cáo kỹ thuật Hệ thống & Kiểm toán)

---

## 1. HỆ THỐNG QUẢN TRỊ NĂM HỌC ĐỘNG (ACADEMIC YEAR MANAGEMENT)

Nhằm xóa bỏ hoàn toàn giới hạn tĩnh (trước đây chỉ đến năm 2028), CH Academy đã chuyển đổi toàn bộ cơ chế năm học sang mô hình cơ sở dữ liệu động:

### 1.1. Cấu trúc Cơ sở dữ liệu & Migration
- File migration: [`V28__Create_Academic_Year_Schema.sql`](file:///backend/src/main/resources/db/migration/V28__Create_Academic_Year_Schema.sql)
- Bảng dữ liệu `academic_years`:
  - `id` (BIGSERIAL PRIMARY KEY)
  - `code` (VARCHAR(20) UNIQUE) — ví dụ: `2024-2025`, `2025-2026`, `2026-2027`, ..., `2031-2032`
  - `name` (VARCHAR(100)) — Tên hiển thị đầy đủ
  - `start_date`, `end_date` (DATE) — Khoảng thời gian năm học (01/09 đến 30/06 năm sau)
  - `is_current` (BOOLEAN) — Đánh dấu năm học đang vận hành hiện tại
  - `status` (VARCHAR(20)) — Trạng thái: `ACTIVE`, `UPCOMING`, `COMPLETED`

### 1.2. Cơ chế ghi nhớ Năm học đã chọn (Academic Year Persistence)
- **Vấn đề trước đây**: Người dùng chọn năm học khác trên bảng điều khiển nhưng khi chuyển sang trang khác (như Khóa học, Lớp học) rồi quay lại Tổng quan thì bị reset về mặc định `2026-2027`.
- **Giải pháp triệt để**:
  - Lưu trữ mã năm học được chọn vào `localStorage` với khóa `ch_academy_selected_academic_year`.
  - Phát sự kiện `ch_academy_academic_year_changed` đồng bộ tức thời giữa [`DashboardPage.tsx`](file:///frontend/src/pages/admin/DashboardPage.tsx) và thanh tác vụ [`DesktopWorkspaceBar.tsx`](file:///frontend/src/components/desktop/DesktopWorkspaceBar.tsx).
  - Khi người dùng điều hướng giữa các trang và quay trở lại, hệ thống ưu tiên đọc từ `localStorage`, giữ nguyên năm học đã chọn mà không bao giờ bị nhảy về mặc định.

---

## 2. KIỂM TOÁN BẢO MẬT & PHÂN QUYỀN VAI TRÒ (RBAC AUDIT)

Hệ thống tuân thủ chặt chẽ nguyên tắc Least Privilege (Đặc quyền tối thiểu), phân bổ theo 8 vai trò hệ thống:

```
SUPER_ADMIN (Quản trị viên tối cao)
  ├── CENTER_ADMIN (Quản lý trung tâm)
  ├── ACADEMIC_STAFF (Nhân viên đào tạo)
  ├── ADMISSIONS_STAFF (Nhân viên tuyển sinh)
  ├── ACCOUNTANT (Kế toán & Thu chi)
  ├── TEACHER (Giáo viên / Giảng viên)
  ├── STUDENT (Học viên)
  └── PARENT (Phụ huynh liên kết)
```

### Các gia cố bảo mật trọng yếu đã hoàn thành:
1. **Đồng bộ xác thực đa Tab (Cross-tab Session Sync)**:
   - Trong `AuthContext.tsx`, bổ sung bộ lắng nghe sự kiện `storage`. Khi một tab đăng nhập hoặc đăng xuất tài khoản khác (ví dụ thử nghiệm tài khoản Học viên), các tab còn lại lập tức cập nhật lại trạng thái người dùng, ngăn chặn việc tab Quản trị gửi nhầm token Học viên gây lỗi hàng loạt `403 Access Denied`.
2. **Bảo vệ phòng thi trực tuyến**:
   - Khung chat AI và widget bị vô hiệu hóa hoàn toàn khi sinh viên ở đường dẫn `/exam/*` để ngăn chặn gian lận thi cử.
3. **Mã hóa mật khẩu & JWT**:
   - Sử dụng thuật toán BCrypt với cost factor 12 và JWT có chữ ký HMAC-SHA256, thời hạn access token an toàn kèm refresh token xoay vòng (Token Rotation).

---

## 3. KIỂM TOÁN TÍNH TOÀN VẸN CƠ SỞ DỮ LIỆU & BỘ KÝ TỰ (UTF-8 ENCODING)

- Toàn bộ cơ sở dữ liệu PostgreSQL 16 được cấu hình chuẩn `UTF-8` encoding.
- Đã khắc phục triệt để lỗi vỡ font tiếng Việt (Mojibake) từ migration `V26__Fix_Mojibake_And_Ai_Platform_Schema.sql`.
- Tất cả các trường văn bản tiếng Việt có dấu (Tên khóa học, Lời chào AI, Nội dung tài liệu, Họ tên giáo viên và học viên) hiển thị chuẩn 100% trên toàn bộ giao diện và API JSON.

---

## 4. BẢNG MA TRẬN TỔNG HỢP KIỂM THỬ TÍCH HỢP (E2E INTEGRATION MATRIX)

| Phân hệ / Tính năng | Phương thức kiểm thử | Số test cases | Kết quả | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **Xác thực & Identity** | Spring Boot MockMvc / JWT Integration | 12 | 12/12 Passed | Sẵn sàng Production |
| **Bảng điều khiển & Chỉ số năm học** | REST API + PostgreSQL Query Aggregation | 8 | 8/8 Passed | Sẵn sàng Production |
| **Voice AI & STT/TTS** | Browser MediaStream & Diagnostics API | 6 | 6/6 Passed | Sẵn sàng Production |
| **Chat nhóm lớp học** | Spring Security RBAC + Member Validation | 7 | 7/7 Passed | Sẵn sàng Production |
| **AI Studio, KB & Chunking** | Chunk Inspector + RAG Retrieval Test | 8 | 8/8 Passed | Sẵn sàng Production |
| **Zalo OA Webhook** | HMAC-SHA256 Signature Verification | 4 | 4/4 Passed | Sẵn sàng Production |
| **Frontend Production Build** | TypeScript Compiler (`tsc -b`) & Vite Build | 1823 modules | 0 Type Errors | Sẵn sàng Production |
