# Tài liệu Kiến trúc - CH Academy

## Tổng quan kiến trúc

CH Academy được xây dựng theo kiến trúc **Monolithic Modular** — một ứng dụng duy nhất nhưng tổ chức code theo module nghiệp vụ rõ ràng. Đây là lựa chọn phù hợp cho giai đoạn đầu, dễ phát triển và bảo trì.

## Sơ đồ kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────┐
│                     CH Academy System                    │
│                                                         │
│  ┌──────────────────────┐    ┌──────────────────────┐   │
│  │  Frontend (React)    │    │  Backend (Spring Boot)│   │
│  │  Port: 5173          │◄──►│  Port: 8080           │   │
│  │                      │    │                       │   │
│  │  - Vite bundler      │    │  - REST API           │   │
│  │  - TypeScript        │    │  - Spring MVC         │   │
│  │  - CSS Modules       │    │  - Spring Data JPA    │   │
│  └──────────────────────┘    │  - Flyway Migrations  │   │
│                              └──────────┬─────────────┘   │
│                                         │                 │
│                              ┌──────────▼─────────────┐   │
│                              │  PostgreSQL DB          │   │
│                              │  Port: 5432 (Docker)   │   │
│                              └────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Cấu trúc Backend (theo module nghiệp vụ)

```
vn.chacademy/
│
├── ChAcademyApplication.java        # Entry point
│
├── common/                          # Dùng chung
│   ├── config/                      # Cấu hình (CORS, Security...)
│   ├── controller/                  # HealthController
│   ├── exception/                   # Global exception handling
│   └── dto/                         # Shared DTOs
│
├── student/                         # Module Học viên (sắp xây dựng)
│   ├── entity/Student.java
│   ├── repository/StudentRepository.java
│   ├── service/StudentService.java
│   └── controller/StudentController.java
│
├── course/                          # Module Chương trình học
├── teacher/                         # Module Giáo viên
├── enrollment/                      # Module Đăng ký học
└── payment/                         # Module Học phí
```

## Quy tắc thiết kế API

- Base path: `/api/v1/`
- Dùng HTTP verbs đúng nghĩa: GET (đọc), POST (tạo), PUT (cập nhật toàn bộ), PATCH (cập nhật một phần), DELETE (xóa)
- Response luôn trả JSON
- Error handling tập trung qua `@ControllerAdvice`
- Phân trang dùng Spring Pageable

## Quy tắc đặt tên Flyway Migration

```
V{version}__{Mô_tả}.sql

Ví dụ:
V1__Initial_Schema.sql
V2__Add_Students_Table.sql
V3__Add_Courses_Table.sql
V4__Add_Enrollment_Table.sql
```

> ⚠️ Không bao giờ chỉnh sửa file migration đã chạy. Tạo file migration mới nếu cần thay đổi.

## Quy ước Frontend

- Tất cả API call đi qua `src/api/client.ts`
- URL backend đọc từ `VITE_API_BASE_URL` (không hard-code)
- CSS dùng CSS Custom Properties (design tokens) trong `index.css`
- Component chia nhỏ theo chức năng trong `src/components/`

## Bảo mật (kế hoạch)

- JWT Bearer token cho authentication
- Spring Security filter chain
- Role-based access: ADMIN, TEACHER, STAFF
- CORS giới hạn theo danh sách origin cụ thể
- Không lưu password plaintext (BCrypt)
