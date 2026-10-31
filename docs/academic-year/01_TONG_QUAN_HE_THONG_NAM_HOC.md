# CH ACADEMY — HỆ SINH THÁI ĐA NĂM HỌC THỐNG NHẤT
## Tài liệu 01: Tổng quan Kiến trúc Hệ thống Đa Năm học (Multi-Academic-Year Architecture)

---

## 1. BỐI CẢNH VÀ MỤC TIÊU HỆ THỐNG

Trước khi nâng cấp, hệ thống quản lý học tập CH Academy gặp phải tình trạng rời rạc giữa các năm học:
- Bộ chọn năm học trên giao diện quản trị bị giới hạn cứng đến năm 2028.
- Khi người dùng chuyển đổi qua lại giữa các menu trên Dashboard, năm học bị reset về mặc định do thiếu state persistence liên trang.
- Học viên và giảng viên khi chuyển sang năm học mới bị ngắt quãng luồng đăng ký hoặc phải tạo hồ sơ mới, gây phân mảnh dữ liệu.
- Chưa có luồng tự phục vụ (self-service) để học viên cũ tiếp tục đăng ký khóa học cho năm học kế tiếp.

**Mục tiêu giải pháp:**
Xây dựng một hệ sinh thái năm học thống nhất xuyên suốt ba cổng (Admin Portal, Teacher Portal, Student Portal) với các nguyên tắc cốt lõi:
1. **Một danh tính duy nhất (Single Identity)**: Một học viên/giảng viên chỉ sở hữu 1 tài khoản (`users`), 1 hồ sơ nghiệp vụ (`students`/`teachers`), được bảo lưu trọn đời qua mọi năm học.
2. **Quản lý đa năm học toàn diện (Unified Multi-Year Lifecycle)**: Năm học có vòng đời chuẩn (`PLANNING`, `ACTIVE`, `CLOSED`, `ARCHIVED`), hỗ trợ thiết lập năm học hiện tại (`is_current = true`), kiểm tra an toàn toàn vẹn trước khi chỉnh sửa/xóa.
3. **Luồng đăng ký & phê duyệt khép kín (Autonomous Registration Workflow)**: Học viên tự tra cứu lớp mở trong năm học, gửi yêu cầu đăng ký (`enrollment_requests`). Admin duyệt yêu cầu -> tự động tạo bản ghi học tập (`enrollments`), phân quyền vào nhóm chat lớp học (`chat_group_members`), và khởi tạo bản ghi công nợ học phí (`receivables`).
4. **Lịch sử đào tạo & giảng dạy xuyên suốt (Cross-Year Historical Records)**: Cả học viên và giảng viên đều tra cứu được toàn bộ quá trình học tập/giảng dạy được nhóm theo từng năm học.

---

## 2. KIẾN TRÚC PHÂN TẦNG VÀ ĐỒNG BỘ DỮ LIỆU

```
+-----------------------------------------------------------------------------------+
|                               CH ACADEMY CLIENTS                                  |
|   +-----------------------+ +-----------------------+ +-----------------------+   |
|   |     ADMIN PORTAL      | |    TEACHER PORTAL     | |    STUDENT PORTAL     |   |
|   | - Dynamic Year Switch | | - Dynamic Year Switch | | - Course Registration |   |
|   | - Review Enrollments  | | - Teaching History    | | - Learning History    |   |
|   | - Year Lifecycle Ops  | | - Multi-Year Classes  | | - Persistent Profile  |   |
|   +-----------+-----------+ +-----------+-----------+ +-----------+-----------+   |
|               |                         |                         |               |
|               +-------------------------+-------------------------+               |
|                                         |                                         |
|                      [ AcademicYearContext / LocalStorage ]                       |
|                          Window Event: 'ch_academic_year_changed'                 |
+-----------------------------------------+-----------------------------------------+
                                          | REST HTTP / Bearer JWT
                                          v
+-----------------------------------------------------------------------------------+
|                             SPRING BOOT BACKEND API                               |
|   +-----------------------+ +-----------------------+ +-----------------------+   |
|   | AcademicYearService   | | EnrollmentRequestSvc  | | TeacherPortalService  |   |
|   | - Vòng đời năm học    | | - Đăng ký khóa học    | | - Phân công giảng dạy |   |
|   | - Kiểm tra phụ thuộc  | | - Phê duyệt tự động   | | - Lịch sử đa năm học  |   |
|   +-----------+-----------+ +-----------+-----------+ +-----------+-----------+   |
|               |                         |                         |               |
|   +-----------v-------------------------v-------------------------v-----------+   |
|   |                  ZERO TRUST & AUTHORIZATION LAYER                         |   |
|   |  - Role Based (ADMIN, TEACHER, STUDENT) + Data Scope Filter               |   |
|   |  - Bảo vệ IDOR/BOLA: Học viên chỉ thấy yêu cầu của mình                   |   |
|   +-------------------------------------+-------------------------------------+   |
+-----------------------------------------+-----------------------------------------+
                                          | JPA / Hibernate
                                          v
+-----------------------------------------------------------------------------------+
|                           POSTGRESQL RELATIONAL SCHEMA                            |
|  [academic_years] <---> [classes] <---> [enrollments] <---> [students]            |
|                              |                                                    |
|                              +---------> [enrollment_requests]                    |
|                              |                                                    |
|                              +---------> [teacher_assignments]                    |
|                              |                                                    |
|                              +---------> [chat_groups]                            |
+-----------------------------------------------------------------------------------+
```

---

## 3. VÒNG ĐỜI NĂM HỌC (ACADEMIC YEAR LIFECYCLE)

Mỗi năm học trong hệ thống tuân thủ một chu trình trạng thái nghiêm ngặt:

1. **PLANNING (Lập kế hoạch)**:
   - Năm học mới được khởi tạo (VD: 2027-2028).
   - Thiết lập thời gian mở đăng ký (`registration_start_date` -> `registration_end_date`).
   - Thiết lập danh mục khóa học và tạo khung các lớp học dự kiến.

2. **ACTIVE (Đang vận hành)**:
   - Năm học được kích hoạt và đánh dấu `is_current = true`. Chỉ có duy nhất 1 năm học `is_current = true` tại một thời điểm trên toàn hệ thống.
   - Học viên được đăng ký vào các lớp học thuộc năm học này.
   - Giảng viên tiếp nhận phân công và tiến hành điểm danh, ghi nhận kết quả thi.

3. **CLOSED (Đã kết thúc)**:
   - Toàn bộ các lớp học trong năm đã hoàn tất kỳ thi và đánh giá kết quả.
   - Chuyển trạng thái sang `CLOSED`: dữ liệu chuyển sang chế độ chỉ đọc (Read-Only) đối với các thao tác ghi danh mới, nhưng vẫn truy vấn lịch sử bình thường.

4. **ARCHIVED (Lưu trữ lịch sử)**:
   - Dữ liệu năm học được niêm phong phục vụ báo cáo kiểm toán tài chính và kiểm định giáo dục.
   - Không cho phép xóa năm học nếu đã phát sinh lớp học, ghi danh hoặc phân công giảng dạy (đảm bảo tính toàn vẹn dữ liệu).

---

## 4. MA TRẬN TƯƠNG TÁC 3 CỔNG (PORTAL ROLES & CAPABILITIES)

| Nghiệp vụ | Cổng Quản trị (Admin) | Cổng Giảng viên (Teacher) | Cổng Học viên (Student) |
| :--- | :--- | :--- | :--- |
| **Quản trị Năm học** | Toàn quyền CRUD, đặt năm học hiện tại, đóng, lưu trữ | Xem danh sách năm học, lọc lớp dạy | Xem năm học đang mở đăng ký |
| **Đăng ký Khóa học** | Duyệt/từ chối yêu cầu, áp dụng ưu đãi/học bổng | Xem danh sách học viên trong lớp theo năm | Gửi yêu cầu đăng ký, hủy đơn chờ duyệt |
| **Lịch sử Đào tạo** | Tra cứu hồ sơ học tập xuyên năm của mọi học viên | Tra cứu hồ sơ học viên thuộc lớp mình phụ trách | Tra cứu toàn bộ khóa học đã học qua các năm |
| **Lịch sử Giảng dạy** | Phân công và xem lịch sử phân công mọi giảng viên | Tra cứu hồ sơ các lớp đã dạy qua từng năm | Xem thông tin giảng viên phụ trách lớp |
| **Nhóm Chat Lớp học**| Giám sát toàn quyền mọi nhóm chat lớp học | Truy cập nhóm chat các lớp mình trực tiếp giảng dạy | Chỉ được vào nhóm chat của lớp mình đã ghi danh |
