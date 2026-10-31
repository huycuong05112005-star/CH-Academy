# CH ACADEMY — HỆ THỐNG AN NINH THÔNG TIN TOÀN DIỆN
## Tài liệu 06: An ninh Mức Trường và Bảo vệ Dữ liệu Nhạy cảm (Field-Level Security & PII Protection)

---

## 1. PHÂN LOẠI DỮ LIỆU NHẠY CẢM (DATA CLASSIFICATION)

CH Academy phân loại dữ liệu theo 3 cấp độ bảo vệ:

1. **Dữ liệu Định danh Cá nhân (PII - Personally Identifiable Information)**:
   - Số điện thoại, CCCD/CMND, địa chỉ nhà riêng, thông tin người giám hộ (phụ huynh).
   - Chỉ được xem bởi: Quản trị viên và chính chủ sở hữu tài khoản.
   - Giảng viên phụ trách lớp chỉ nhìn thấy: Họ tên học viên, Mã học viên, Ảnh đại diện, Tình trạng điểm danh. Giảng viên **không** được xem số điện thoại cá nhân hoặc địa chỉ nhà riêng của học viên để ngăn ngừa rủi ro lạm dụng dữ liệu ngoài mục đích giảng dạy.

2. **Dữ liệu Tài chính & Học phí**:
   - Mức học phí thực đóng, chiết khấu học bổng, số tài khoản ngân hàng, lịch sử nợ phí.
   - Tuyệt đối bảo mật chỉ giữa Ban Quản trị / Kế toán và Phụ huynh/Học viên liên quan.

3. **Dữ liệu Khảo thí & Điểm thi**:
   - Đáp án chi tiết của đề thi đang trong thời gian mở thi: Bị mã hóa và ẩn hoàn toàn khỏi Client cho đến khi ca thi chính thức kết thúc.

---

## 2. KỸ THUẬT TRIỂN KHAI FIELD-LEVEL SECURITY

### 2.1. Phân tách DTO theo vai trò (Role-Segregated DTOs)
Thay vì trả về trực tiếp thực thể JPA (`Student` / `User`), hệ thống sử dụng các DTO chuyên biệt:
- `StudentAdminDetailDto`: Đầy đủ số điện thoại, địa chỉ, người giám hộ, công nợ.
- `StudentTeacherViewDto`: Chỉ có họ tên, mã học viên, lớp đăng ký, số buổi vắng.
- `StudentPublicProfileDto`: Chỉ có họ tên và avatar hiển thị trong nhóm chat lớp học.

### 2.2. Che giấu Dữ liệu (Data Masking)
- Số điện thoại trong các báo cáo xuất danh sách lớp chỉ hiển thị dạng che giấu (VD: `098***1234`).
- Mật khẩu lưu trữ luôn được băm bằng thuật toán `BCrypt` với độ dài muối 10 vòng lặp, không bao giờ được trả về qua bất kỳ API nào (sử dụng `@JsonProperty(access = JsonProperty.Access.WRITE_ONLY)` trên entity).
