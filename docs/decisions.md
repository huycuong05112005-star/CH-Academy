# Quyết Định Kiến Trúc - CH Academy (ADR)

> Tài liệu ghi nhận các quyết định kiến trúc và công nghệ quan trọng (Architecture Decision Records) nhằm định hướng phát triển và bảo trì lâu dài.

---

## ADR 01: Kiến trúc Monolithic Modular (Modular Monolith)

- **Trạng thái:** Chấp thuận.
- **Bối cảnh:** CH Academy là hệ thống quản lý trung tâm giáo dục có quy mô vừa, cần tốc độ phát triển nhanh, tính nhất quán giao dịch (ACID) cao (đặc biệt trong tài chính, xếp lớp, điểm danh) và chi phí vận hành thấp.
- **Quyết định:** Sử dụng Monolithic Modular với Spring Boot cho backend và React SPA cho frontend.
- **Hệ quả:** Tránh được độ phức tạp về mạng, distributed transactions và deployment của microservices, trong khi vẫn duy trì ranh giới nghiệp vụ độc lập giữa các package: `security`, `course`, `student`, `enrollment`, `scheduling`, `attendance`, `finance`.

---

## ADR 02: Xác thực & Phân quyền bằng Spring Security + JWT

- **Trạng thái:** Chấp thuận.
- **Bối cảnh:** Cần hỗ trợ phân quyền chặt chẽ theo 8 vai trò (`SUPER_ADMIN`, `CENTER_ADMIN`, `ADMISSIONS_STAFF`, `ACADEMIC_STAFF`, `ACCOUNTANT`, `TEACHER`, `STUDENT`, `PARENT`) và kiểm soát quyền ở cả tầng backend (`@PreAuthorize`) và frontend routing/component level.
- **Quyết định:** Sử dụng Spring Security 6 với JWT (JSON Web Token).
  - Thuật toán ký: HMAC-SHA256 (`HS256`).
  - Access Token chứa `sub` (username), `userId`, `roles`, và `permissions`.
  - Hạn dùng ngắn hạn, được client gửi qua header `Authorization: Bearer <token>`.
  - Mã hóa mật khẩu: `BCryptPasswordEncoder`.

---

## ADR 03: Xử lý Tiền tệ và Độ chính xác Tài chính

- **Trạng thái:** Chấp thuận.
- **Bối cảnh:** Các khoản học phí, giảm giá, thanh toán và hoàn tiền cần sự chính xác tuyệt đối. Việc dùng `float`/`double` dẫn đến sai số dấu phẩy động.
- **Quyết định:**
  - Database: Sử dụng `NUMERIC(15, 2)` cho toàn bộ cột tài chính (`amount`, `paid_amount`, `applied_tuition_fee`, `discount_amount`, `final_fee`).
  - Java Backend: Sử dụng `java.math.BigDecimal` kèm `RoundingMode.HALF_UP`.
  - Frontend: Sử dụng `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.

---

## ADR 04: Lưu trữ và Hiển thị Thời gian (Múi giờ Asia/Ho_Chi_Minh)

- **Trạng thái:** Chấp thuận.
- **Bối cảnh:** Lịch học, ca học và điểm danh cần chính xác theo múi giờ Việt Nam.
- **Quyết định:**
  - Thời điểm giao dịch / hệ thống: Lưu kiểu `TIMESTAMPTZ` (UTC trong DB, `java.time.Instant` trong Java).
  - Ngày nghiệp vụ (ngày sinh, ngày bắt đầu lớp, ngày đến hạn): Lưu kiểu `DATE` (`java.time.LocalDate`).
  - Giờ học trong ngày (ví dụ 18:00 - 19:30): Lưu kiểu `TIME` (`java.time.LocalTime`).
  - Hiển thị người dùng: Luôn format theo múi giờ `Asia/Ho_Chi_Minh` và định dạng `dd/MM/yyyy` hoặc `dd/MM/yyyy HH:mm`.

---

## ADR 05: Tính Bất biến của Giao dịch Tài chính & Điểm danh

- **Trạng thái:** Chấp thuận.
- **Bối cảnh:** Nghiệp vụ kế toán và quản lý đào tạo yêu cầu dữ liệu lịch sử không được phép xóa tùy tiện.
- **Quyết định:**
  - Tuyệt đối không xóa bản ghi `payments` hoặc `receivables` đã phát sinh. Khi có nhu cầu điều chỉnh: tạo bản ghi `refunds` hoặc cập nhật trạng thái `CANCELLED` có lý do và audit log.
  - Điểm danh có lịch sử `recorded_by`, `recorded_at`, `updated_at`.
