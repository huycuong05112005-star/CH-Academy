# CH ACADEMY — BÁO CÁO KIỂM TOÁN PHỤ THUỘC & BUILD TOOL
## Document: DEPENDENCY_AUDIT.md

---

## 1. MÔ TẢ HỆ THỐNG BUILD

- **Công cụ Build**: Apache Maven 3.9.9 (sử dụng Maven Wrapper `mvnw.cmd`).
- **Java Runtime**: JDK 25.0.1 (Oracle Corporation) tại `C:\Program Files\Java\jdk-25`.
- **Target Source Compatibility**: Java 21 (`<java.version>21</java.version>`).
- **Framework nền tảng**: Spring Boot 3.5.0.

---

## 2. DANH MỤC DEPENDENCY TRỌNG YẾU (CORE LIBRARIES)

| Thư viện / Artifact ID | Group ID | Phiên bản | Mục đích sử dụng | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| `spring-boot-starter-web` | `org.springframework.boot` | 3.5.0 | REST API Controller, Jackson JSON | STABLE |
| `spring-boot-starter-data-jpa` | `org.springframework.boot` | 3.5.0 | Hibernate ORM 6.6.15, Transaction | STABLE |
| `spring-boot-starter-security` | `org.springframework.boot` | 3.5.0 | Bảo mật phân quyền, JWT Filter | STABLE |
| `spring-boot-starter-validation` | `org.springframework.boot` | 3.5.0 | Jakarta Bean Validation (@Valid, @NotNull) | STABLE |
| `spring-boot-starter-websocket` | `org.springframework.boot` | 3.5.0 | Real-time STOMP Chat Messaging | STABLE |
| `postgresql` | `org.postgresql` | 42.7.5 | JDBC Driver kết nối PostgreSQL 16 | STABLE |
| `flyway-core` | `org.flywaydb` | 10.15.2 | Quản lý migration database tuần tự (V1 -> V29) | STABLE |
| `jjwt-api` / `jjwt-impl` | `io.jsonwebtoken` | 0.12.6 | Xử lý JWT Token & HMAC-SHA256 | STABLE |
| `lombok` | `org.projectlombok` | 1.18.38 | Tự động sinh Getter, Setter, Builder, SLF4J | STABLE |
| `h2` | `com.h2database` | 2.3.232 | In-memory DB phục vụ Unit & Integration Tests | STABLE |

---

## 3. THƯ MỤC DEPENDENCY OFFLINE PHỤC VỤ IDE LINTER

- Đã xuất thành công **128 tệp JAR** từ local repository `.m2` sang `backend/target/dependency/`.
- Cấu hình này giúp Language Server trong VS Code nhận diện 100% các class thư viện Spring Boot, JPA, Hibernate và Lombok ngay cả khi không có kết nối mạng hoặc khi extension Maven bị ngắt kết nối.
