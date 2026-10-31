# BÁO CÁO CƠ CHẾ CÁ NHÂN HÓA BỐI CẢNH & CÔ LẬP DANH TÍNH HỘI THOẠI AI
**Tài liệu:** `AI_USER_CONTEXT_REPORT.md`  
**Ngày thực hiện:** 31/10/2026  
**Dự án:** CH Academy  

---

## 1. NGUYÊN TẮC CÔ LẬP DANH TÍNH & BỐI CẢNH (IDENTITY & PORTAL ISOLATION)
Trước đây hệ thống gặp lỗi nghiêm trọng: khi người dùng mở Chat AI ở cổng Giảng viên hỏi câu hỏi, sau đó chuyển sang cổng Admin thì vẫn thấy lịch sử trò chuyện cũ của Giảng viên.

Để giải quyết triệt để, hệ thống áp dụng cơ chế phân tách không gian hội thoại 4 lớp:
1. **Lớp 1 — UserId:** Định danh tài khoản đã xác thực thông qua JWT token (Spring Security Context).
2. **Lớp 2 — Active Portal:** Xác định rõ ràng cổng đang truy cập:
   - `PUBLIC`: Website giới thiệu, trang chủ cho khách vãng lai.
   - `STUDENT`: Cổng thông tin học viên (`/portal/*`).
   - `TEACHER`: Cổng thông tin giảng viên (`/teacher/*`).
   - `ADMIN`: Cổng quản trị trung tâm (`/admin/*`).
3. **Lớp 3 — Role Verification:** Backend kiểm tra quyền của người dùng đối với Agent phục vụ tương ứng:
   - Khách vãng lai: chỉ được chat với Agent có vai trò `PUBLIC`.
   - Học viên: chỉ được chat với `AGENT_STUDENT_TUTOR`.
   - Giảng viên: chỉ được chat với `AGENT_TEACHER_ASSISTANT`.
   - Quản trị viên: được chat với `AGENT_ADMIN_ASSISTANT`.
4. **Lớp 4 — Session / Conversation Id Isolation:** Khóa lưu trữ cục bộ (`localStorage`) ở Frontend phân tách theo `key = ch_ai_conv_${portal}_${userId}`. Khách vãng lai sử dụng UUID ngẫu nhiên `ch_ai_guest_session_id`.

---

## 2. MA TRẬN PHÂN QUYỀN VÀ TRÍCH XUẤT DỮ LIỆU ĐỘNG (ANTI-DATA-LEAKAGE)

| Vai trò người dùng | Agent phục vụ | Bối cảnh CSDL được phép truy xuất | Dữ liệu bị cấm tuyệt đối (Bảo mật) |
|:---|:---|:---|:---|
| **Khách vãng lai (PUBLIC)** | `AGENT_ADMISSIONS` | Danh mục khóa học đang mở (`status = 'ACTIVE'`), học phí niêm yết, lịch khai giảng từ `CourseRepository` và `ClassRepository`. | Không thấy danh sách học viên, không thấy doanh thu, không thấy tài liệu nội bộ trung tâm. |
| **Học viên (STUDENT)** | `AGENT_STUDENT_TUTOR` | Chỉ các lớp học viên đã ghi danh (`Enrollment`), điểm số, lịch học cá nhân, học phí cá nhân từ `StudentRepository`. | **Tuyệt đối không thấy dữ liệu học viên khác**, không thấy đáp án đề thi chưa công bố, không thấy thông tin tài chính của trung tâm. |
| **Giảng viên (TEACHER)** | `AGENT_TEACHER_ASSISTANT` | Danh sách các lớp được phân công giảng dạy (`primaryTeacher`), danh sách học viên trong lớp mình dạy, ngân hàng câu hỏi môn học mình phụ trách. | Không thấy lớp của giảng viên khác (trừ khi được chia sẻ), không thấy báo cáo lương/doanh thu toàn trường. |
| **Quản trị viên (ADMIN)** | `AGENT_ADMIN_ASSISTANT` | Tổng hợp toàn diện: tổng số học viên, doanh thu năm học, tỷ lệ chuyên cần, các đề thi chờ duyệt, số liệu chuyển đổi Lead. | Dữ liệu được tổng hợp theo quyền của tài khoản Admin/Center Admin. |

---

## 3. CƠ CHẾ XỬ LÝ KHI NGƯỜI DÙNG CHUYỂN PORTAL
- Tại Frontend, `FloatingChatWidget.tsx` lắng nghe sự thay đổi của `location.pathname` qua hook `useMemo` và `useEffect`.
- Khi URL chuyển từ `/teacher` sang `/admin` hoặc `/portal`:
  - `activeAiConvId` được reset về `undefined`.
  - Toàn bộ danh sách `aiTurns` (lịch sử tin nhắn) được nạp lại độc lập từ API tương ứng với cổng mới:  
    `GET /api/v1/chat/ai/conversations?portal=ADMIN`
  - Tiêu đề Trợ lý và lời chào tự động thay đổi tương ứng theo `agentMetadata` của cổng mới.
- Không bao giờ xảy ra hiện tượng rò rỉ hoặc hiển thị đè tin nhắn của Giảng viên sang Quản trị viên hay Học viên.

