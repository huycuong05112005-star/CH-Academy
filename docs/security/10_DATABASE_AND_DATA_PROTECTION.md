# CH ACADEMY — HỆ THỐNG AN NINH THÔNG TIN TOÀN DIỆN
## Tài liệu 10: Bảo vệ Cơ sở Dữ liệu và Mã hóa Dữ liệu (Database Security & Data Protection)

---

## 1. PHÒNG CHỐNG TẤN CÔNG SQL INJECTION

1. **Sử dụng Hibernate ORM / Spring Data JPA**:
   - 100% các câu truy vấn cơ sở dữ liệu được tham số hóa (Parameterized Queries / Prepared Statements) thông qua Hibernate Criteria API hoặc JPQL có binding parameter:
   ```java
   @Query("SELECT c FROM ClassEntity c WHERE c.academicYear = :academicYear AND c.status = :status")
   List<ClassEntity> findByAcademicYearAndStatus(@Param("academicYear") String academicYear, @Param("status") String status);
   ```
   - Tuyệt đối không nối chuỗi thô (String concatenation) trong các câu lệnh SQL.

2. **Kiểm tra đầu vào (Input Validation)**:
   - Áp dụng các annotation validation chuẩn Jakarta Bean Validation (`@NotBlank`, `@Size`, `@Pattern`) trên toàn bộ các DTO đầu vào, ngăn chặn các ký tự điều khiển hoặc payload độc hại.

---

## 2. QUẢN LÝ TÀI KHOẢN VÀ QUYỀN HẠN DATABASE (LEAST PRIVILEGE)

- Database PostgreSQL trong môi trường sản xuất không sử dụng user `postgres` siêu quyền (superuser) để kết nối từ Backend.
- Ứng dụng Backend sử dụng user chuyên biệt `chacademy_app` với các quyền tối thiểu (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) trên schema nghiệp vụ, không cấp quyền `DROP TABLE` hoặc can thiệp catalog hệ thống trong phiên chạy runtime.
- Dịch chuyển cấu trúc bảng (Schema Migration) được quản lý tập trung và tuần tự thông qua Flyway (`backend/src/main/resources/db/migration/`). Mọi thay đổi đều được kiểm toán và version hóa chặt chẽ.
