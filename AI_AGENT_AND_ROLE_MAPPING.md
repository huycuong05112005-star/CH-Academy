# MA TRẬN ĐỊNH DANH VÀ PHÂN QUYỀN AI AGENT (AI AGENT & ROLE MAPPING)

**Tài liệu:** `AI_AGENT_AND_ROLE_MAPPING.md`  
**Ngày cập nhật:** 31 tháng 10 năm 2026  
**Dự án:** Nền tảng Đào tạo & AI Studio CH Academy  

---

## 1. DANH MỤC 7 AI AGENTS TRONG HỆ THỐNG

Sau đợt chuẩn hóa cơ sở dữ liệu và áp dụng Flyway Migration V26, toàn bộ danh mục AI Agent trong bảng `ai_agents` đã được làm sạch tiếng Việt UTF-8 và phân bổ trường `scope` chính xác:

| ID | Mã Agent (`code`) | Tên hiển thị (`name`) | Vai trò phục vụ (`role`) | Phạm vi hoạt động (`scope`) | Mô hình (`model`) | Nhiệt độ (`temp`) | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| 1 | `AGENT_ADMISSIONS` | Chuyên viên Tư vấn Tuyển sinh AI | Khách vãng lai & Phụ huynh | `PUBLIC_ADMISSION` | `google/gemini-2.5-flash` | 0.3 | Kích hoạt |
| 2 | `AGENT_STUDENT_TUTOR` | Trợ giảng AI Đồng hành | Học viên chính quy | `STUDENT_TUTOR` | `google/gemini-2.5-flash` | 0.2 | Kích hoạt |
| 3 | `AGENT_TEACHER_ASSISTANT` | Trợ lý Giảng dạy & Soạn bài | Giảng viên trung tâm | `TEACHER_ASSISTANT` | `google/gemini-2.5-flash` | 0.4 | Kích hoạt |
| 4 | `AGENT_ADMIN_ASSISTANT` | Trợ lý Quản trị & Vận hành | Ban Giám đốc & Quản trị | `ADMIN_ASSISTANT` | `google/gemini-2.5-flash` | 0.2 | Kích hoạt |
| 5 | `AGENT_VOICE_OUTBOUND` | Trợ lý Cuộc gọi Tuyển sinh | Tổng đài viên tự động | `PUBLIC_ADMISSION` | `google/gemini-2.5-flash` | 0.3 | Kích hoạt |
| 6 | `AGENT_STUDENT_ENGLISH` | Trợ giảng Luyện giao tiếp & Ngữ pháp | Học viên tiếng Anh | `STUDENT_TUTOR` | `google/gemini-2.5-flash` | 0.4 | Kích hoạt |
| 7 | `AGENT_ACADEMIC_AUDITOR` | Trợ lý Kiểm soát Học vụ & Đề thi | Khảo thí & Đảm bảo chất lượng | `TEACHER_ASSISTANT` | `google/gemini-2.5-flash` | 0.1 | Kích hoạt |

---

## 2. MA TRẬN PHÂN QUYỀN TRUY CẬP (ACCESS CONTROL MATRIX)

Bảng dưới đây quy định quyền hạn của từng nhóm người dùng đối với các Agent và các chức năng AI Studio:

| Nhóm người dùng | Vai trò hệ thống | Cổng truy cập | Agent được phép tương tác | Quyền vào AI Agent Studio | Quyền sửa cấu hình Agent / KB | Quyền xem Leads CRM |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **Khách vãng lai** | Khách (`ANONYMOUS`) | Public Website (`/`) | `AGENT_ADMISSIONS`, `AGENT_VOICE_OUTBOUND` | ❌ Từ chối | ❌ Từ chối | ❌ Từ chối |
| **Học viên** | `STUDENT` | Cổng Học viên (`/student`) | `AGENT_STUDENT_TUTOR`, `AGENT_STUDENT_ENGLISH` | ❌ Từ chối (403) | ❌ Từ chối (403) | ❌ Từ chối (403) |
| **Giảng viên** | `TEACHER` | Cổng Giảng viên (`/teacher`) | `AGENT_TEACHER_ASSISTANT`, `AGENT_ACADEMIC_AUDITOR` | ❌ Từ chối (403) | ❌ Từ chối (403) | ❌ Từ chối (403) |
| **Giáo vụ** | `ACADEMIC_STAFF` | Quản trị học vụ | `AGENT_TEACHER_ASSISTANT`, `AGENT_ADMIN_ASSISTANT` | ❌ Từ chối (403) | ❌ Từ chối (403) | ❌ Từ chối (403) |
| **Quản trị viên** | `ADMIN`, `CENTER_ADMIN` | Quản trị (`/admin`) | `AGENT_ADMIN_ASSISTANT` (và mọi Agent trong Playground) |  Cho phép |  Cho phép |  Cho phép |
| **Super Admin** | `SUPER_ADMIN` | Toàn quyền (`/admin`) | Toàn bộ Agents |  Toàn quyền |  Toàn quyền |  Toàn quyền |

---

## 3. CƠ CHẾ PHÒNG VỆ CHỐNG RÒ RỈ DỮ LIỆU (ROLE LEAKAGE PREVENTION)

### 3.1. Xác thực đa tầng ở Backend (`GenAiChatService.java`)
Mỗi khi người dùng gửi câu hỏi tới `/api/v1/chat/ai/ask`, phương thức `normalizeAndValidatePortal(portal, user)` thực hiện kiểm tra:
1. Nếu yêu cầu gửi lên cổng `ADMIN`: Kiểm tra tài khoản có vai trò `ADMIN` hoặc `SUPER_ADMIN`. Nếu không, ném ngay ngoại lệ `AccessDeniedException("Tài khoản của bạn không có quyền truy cập không gian hội thoại Admin")`.
2. Nếu yêu cầu gửi lên cổng `TEACHER`: Kiểm tra tài khoản có vai trò `TEACHER`, `ADMIN` hoặc `SUPER_ADMIN`.
3. Nếu yêu cầu gửi lên cổng `STUDENT`: Người dùng có tài khoản hợp lệ được phép truy vấn trong phạm vi lớp học mình đã đăng ký.
4. Nếu yêu cầu gửi lên cổng `PUBLIC`: Bắt buộc sử dụng qua endpoint công khai `/api/v1/chat/ai/public/ask`, không thể mạo nhận để lấy dữ liệu nội bộ.

### 3.2. Cô lập hội thoại ở Cơ sở dữ liệu (`ai_conversations`)
Bảng `ai_conversations` lưu trữ đồng thời cả `user_id` và `portal`:
- Khi người dùng đăng nhập bằng vai trò Giảng viên và mở Chat AI, hệ thống chỉ truy vấn các bản ghi `WHERE user_id = :id AND portal = 'TEACHER'`.
- Khi người dùng đăng nhập bằng tài khoản Quản trị, hệ thống chỉ truy vấn `WHERE user_id = :id AND portal = 'ADMIN'`.
- Khi người dùng đăng xuất hoặc chuyển vai trò, lịch sử hội thoại của vai trò cũ hoàn toàn không hiển thị ở vai trò mới, giải quyết triệt để lỗi trộn lẫn ngữ cảnh chat.

### 3.3. Bảo vệ giao diện AI Studio (`AiStudioPage.tsx`)
Tại Frontend, tuyến đường `/admin/ai-studio` được bảo vệ bởi thẻ `<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'CENTER_ADMIN']} />`. Học viên hoặc Giảng viên khi cố ý nhập URL `/admin/ai-studio` trên thanh địa chỉ trình duyệt sẽ lập tức bị chặn và điều hướng về đúng cổng của mình.
