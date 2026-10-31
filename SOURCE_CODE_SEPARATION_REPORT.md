# BÁO CÁO TÁI CẤU TRÚC PHÂN TÁCH MÃ NGUỒN (SOURCE CODE SEPARATION REPORT)

## 1. MỤC ĐÍCH & PHẠM VI

Báo cáo chi tiết phương án và kết quả rà soát phân tách các tầng kiến trúc trong hệ thống CH Academy, đảm bảo mã nguồn các phân hệ:
1. Website công khai (`/`, `/courses`, `/about`, `/contact`)
2. Cổng Quản trị (`/admin/*`)
3. Cổng Giảng viên (`/teacher/*`)
4. Cổng Học viên (`/student/*`)
5. Hệ thống Chat nhóm Lớp học
6. Nền tảng AI Agent & Voice AI Runtime

Không bị phụ thuộc vòng (circular dependency), không rò rỉ mã nguồn hoặc dữ liệu nhạy cảm giữa các vai trò người dùng.

---

## 2. KẾT QUẢ TÁI CẤU TRÚC PHÂN TÁCH

### 2.1. Phân tách Cổng Frontend (Portals Separation)
| Phân hệ | Thư mục Frontend | Tuyến đường (Routes) | Quyền hạn bảo vệ (Guards) | Trạng thái |
|---|---|---|---|---|
| **Public Portal** | `src/pages/public/`, `src/components/public/` | `/`, `/courses`, `/about`, `/contact`, `/terms`, `/privacy` | Public (Không yêu cầu đăng nhập) | **Tách biệt hoàn toàn** |
| **Admin Portal** | `src/pages/admin/`, `src/layouts/AdminLayout.tsx` | `/admin/*` | `hasAnyRole(['SUPER_ADMIN', 'CENTER_ADMIN', 'ADMIN', ...])` | **Tách biệt hoàn toàn** |
| **Teacher Portal**| `src/pages/teacher/` | `/teacher/*` | `hasAnyRole(['TEACHER'])` | **Tách biệt hoàn toàn** |
| **Student Portal**| `src/pages/student/` | `/student/*` | `hasAnyRole(['STUDENT'])` | **Tách biệt hoàn toàn** |
| **Online Exam** | `src/pages/exam/OnlineExamRoomPage.tsx` | `/exam/:examId` | Học viên thuộc lớp hoặc Giáo viên/Admin kiểm tra đề | **Tách biệt hoàn toàn** |

### 2.2. Phân tách Backend Package Structure
Cấu trúc package theo domain-driven:
- `vn.chacademy.identity`: Quản lý tài khoản, User, Role, Permission, Auth JWT, Spring Security Config.
- `vn.chacademy.academic`: Khóa học (Course), Lớp học (Class), Điểm danh (Attendance), Phân công giảng viên.
- `vn.chacademy.student`: Nghiệp vụ học viên, đăng ký khóa học, hồ sơ học viên cá nhân (`StudentPortalController`).
- `vn.chacademy.assessment`: Ngân hàng câu hỏi, bài thi, nộp bài (`ExamAttempt`), chấm tự luận (`GradingController`).
- `vn.chacademy.finance`: Biểu phí, khoản phải thu, giao dịch chuyển khoản.
- `vn.chacademy.notification`: Đẩy thông báo hệ thống, quản lý trạng thái đã đọc cá nhân (`NotificationRead`).
- `vn.chacademy.chat`: Tin nhắn nhóm lớp (`ClassChatService`), AI Agent Platform (`AiStudioService`, `GenAiChatService`).

### 2.3. Loại bỏ hoàn toàn Insecure Fallback ngầm
- Loại bỏ toàn bộ hardcoded fallback `HV20240002` trong `StudentPortalController.java`, `AssessmentAnalyticsController.java` và `ExamAttemptService.java`.
- Nếu tài khoản Quản trị cố tình truy cập Cổng học viên hoặc gọi API cá nhân của học sinh khi chưa được liên kết hồ sơ, backend trả về mã lỗi `400 BAD_REQUEST` hoặc `404 NOT_FOUND` với thông điệp rõ ràng, không để xảy ra hiện tượng mạo danh hay trộn lẫn dữ liệu.

