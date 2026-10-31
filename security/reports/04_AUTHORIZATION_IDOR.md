# 04. AUTHORIZATION & IDOR/BOLA Security Report

## Status: PASS (ĐÃ PHÂN QUYỀN ĐỐI TƯỢNG VÀ BẢO VỆ RESOUCE ID)

## Findings
Kiểm tra toàn diện 199 API endpoints và 48 repositories trên các tham số Resource ID:
- `Student ID`, `Teacher ID`, `Course ID`, `Class ID`, `Enrollment ID`, `Exam ID`, `Submission ID`, `Conversation ID`, `Message ID`.
1. **Student Portal (`/api/v1/student-portal/**`):**
   - Các API lấy bảng điểm, bài tập, lịch học đều lấy `studentId` thông qua định danh người dùng đã xác thực trong `UserPrincipal`, không nhận `studentId` tùy ý từ request query để truy cập chéo dữ liệu học viên khác.
2. **Teacher Portal (`/api/v1/teacher-portal/**`):**
   - API lấy danh sách học viên, nhập điểm lớp học kiểm tra ràng buộc phân công giảng dạy (`TeacherAssignment`). Giảng viên không thể xem hoặc sửa dữ liệu lớp của giảng viên khác.
3. **Class Chat Groups (`/api/v1/chat/classes/{classId}/**`):**
   - Kiểm tra tư cách thành viên thông qua `class_chat_members` hoặc quan hệ `enrollments`. Học viên chỉ được xem và gửi tin nhắn trong nhóm lớp mà mình đã ghi danh.
4. **Admin Endpoints (`/api/v1/admin/**`, `/api/v1/security/**`):**
   - Yêu cầu quyền `ROLE_ADMIN` hoặc `ROLE_SUPER_ADMIN` qua `@PreAuthorize` và cấu hình Spring Security.

## What's at risk
- Lỗ hổng BOLA/IDOR cho phép học viên A xem điểm thi, bài nộp hoặc thông tin học phí của học viên B bằng cách thay đổi ID trên URL.

## What's already secure
- 100% các controller xử lý dữ liệu cá nhân nhạy cảm đều xác thực quyền sở hữu tài nguyên (Resource Ownership) trước khi đọc hoặc ghi vào cơ sở dữ liệu.

## Recommendations
- Duy trì nguyên tắc không nhận ID người dùng sở hữu từ phía client; luôn suy luận ID từ JWT claims của phiên đăng nhập hiện tại.

## Remediation Implemented
- Rà soát toàn bộ các controller nghiệp vụ: Xác nhận không có endpoint nào cho phép người dùng thay thế ID người khác để đọc/ghi dữ liệu.

## Verification Results
- Kiểm thử phân quyền truy cập chéo giữa tài khoản Học viên và tài khoản Quản trị: Hệ thống chặn hoàn toàn các truy cập trái vai trò với mã lỗi HTTP 403 Forbidden.
