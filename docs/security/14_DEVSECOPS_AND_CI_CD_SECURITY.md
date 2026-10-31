# CH ACADEMY — HỆ THỐNG AN NINH THÔNG TIN TOÀN DIỆN
## Tài liệu 14: Quy trình DevSecOps và Kiểm thử Mã nguồn An toàn (DevSecOps & SAST Pipeline)

---

## 1. NGUYÊN TẮC SHIFT-LEFT SECURITY

CH Academy áp dụng triết lý Shift-Left Security: Đưa các kiểm tra an ninh vào giai đoạn sớm nhất của chu trình phát triển phần mềm (SDLC):

1. **Phân tích Mã nguồn Tĩnh (SAST - Static Application Security Testing)**:
   - Sử dụng SonarQube / Linter quét toàn bộ mã nguồn Java và TypeScript trước khi đóng gói.
   - Phát hiện sớm các lỗi cú pháp, biến không sử dụng (unused imports/fields) và các đoạn code có nguy cơ null-pointer hoặc rò rỉ bộ nhớ.

2. **Kiểm tra Phụ thuộc Thứ ba (SCA - Software Composition Analysis)**:
   - Quét file `pom.xml` và `package.json` định kỳ để phát hiện các thư viện phụ thuộc có lỗ hổng CVE đã công bố.
   - Tự động cập nhật các phiên bản vá lỗi (VD: nâng cấp Spring Boot 3.5, Hibernate 6.6, Vite 6).

3. **Áp dụng Vibe Check Framework**:
   - Sử dụng bộ quy tắc kiểm tra an toàn theo danh mục kiểm tra chuyên sâu (`vibe-check`):
     - Kiểm tra không để lộ secret, API key trong git commit.
     - Kiểm tra không lưu mật khẩu thô trong mã nguồn hoặc log.
     - Kiểm tra 100% endpoint quản trị có gắn `@PreAuthorize("hasRole('ADMIN')")`.

---

## 2. QUY TRÌNH KIỂM SOÁT PHIÊN BẢN VÀ COMMIT CODE (GIT SECURITY)

- Không bao giờ commit các tệp `.env`, `.pem`, khóa bí mật hoặc credentials vào Git. Các tệp này được khai báo nghiêm ngặt trong `.gitignore`.
- Mọi nhánh tính năng (feature branch) phải vượt qua `mvn test` (45/45 tests pass) và `npm run build` (0 error) trước khi được phép merge vào nhánh `main`.
