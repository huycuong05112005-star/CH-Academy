# BÁO CÁO KẾT QUẢ KIỂM THỬ TÍCH HỢP API (API INTEGRATION TEST REPORT)
**Dự án:** CH Academy  
**Công cụ kiểm thử:** JUnit 5, Spring MockMvc, Maven Surefire 3.5.3  
**Thời gian chạy:** 31/10/2026 22:04  

---

## 1. TỔNG QUAN KẾT QUẢ THỰC NGHIỆM

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S   R E S U L T S
[INFO] -------------------------------------------------------
[INFO] Tests run: 45, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  57.589 s
```

**Tỷ lệ đạt chuẩn:** **100% (45/45 kiểm thử vượt qua thành công)**

---

## 2. CHI TIẾT CÁC TẬP KIỂM THỬ (TEST SUITES)

1. **`AuthControllerTest` (5 tests):**
   - Đăng nhập tài khoản hợp lệ, sinh JWT access token và refresh token.
   - Thử nghiệm tài khoản không tồn tại, chống rò rỉ phân biệt thông tin đăng nhập (`BAD_CREDENTIALS`).
   - Truy cập `/api/v1/auth/me` không có token trả về đúng HTTP 401 Unauthorized.
   - Trạng thái: **PASSED (5/5)**

2. **`ClassChatAuthorizationAndVoiceAiTest` (4 tests):**
   - Học viên chỉ thấy và tham gia đúng nhóm lớp mình được ghi danh (`ENROLLED`).
   - Học viên không thể gửi tin nhắn vào nhóm lớp khác (`AccessDeniedException`).
   - Quản trị viên (`ADMIN`, `SUPER_ADMIN`, `ACADEMIC_STAFF`) có quyền giám sát toàn bộ các nhóm lớp học.
   - Endpoint chẩn đoán Voice AI (`/api/v1/chat/ai/voice/diagnostics`) trả về đúng cấu hình Web Speech và mô hình LLM.
   - Trạng thái: **PASSED (4/4)**

3. **`ClassControllerTest` (4 tests):**
   - Tìm kiếm danh sách lớp học theo phân trang và bộ lọc.
   - Tạo mới lớp học, ràng buộc sĩ số tối đa `maxCapacity > 0`.
   - Trạng thái: **PASSED (4/4)**

4. **`CourseControllerTest` (5 tests):**
   - Tìm kiếm khóa học theo danh mục và từ khóa.
   - Kiểm tra phân quyền: Từ chối truy cập HTTP 401 khi chưa xác thực JWT.
   - Trạng thái: **PASSED (5/5)**

5. **`DashboardControllerTest` (3 tests):**
   - Thống kê chỉ số Dashboard theo năm học động.
   - Kiểm tra phân quyền: Trả về HTTP 401 khi chưa đăng nhập và HTTP 403 khi người dùng có vai trò không đủ quyền (`STUDENT`).
   - Trạng thái: **PASSED (3/3)**

6. **`ScoringServiceTest`, `AttendanceControllerTest`, `StudentControllerTest` & các module khác (24 tests):**
   - Tính điểm bài thi, đồng bộ điểm danh, sinh mã học viên tự động.
   - Trạng thái: **PASSED (24/24)**

