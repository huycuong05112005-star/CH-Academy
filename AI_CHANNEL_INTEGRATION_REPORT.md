# BÁO CÁO TÍCH HỢP ĐA KÊNH & QUẢN LÝ KHÁCH HÀNG TIỀM NĂNG — CH ACADEMY

**Dự án:** CH Academy  
**Kênh hỗ trợ:** Website công khai, Cổng Học viên, Cổng Giảng viên, Cổng Quản trị, Zalo OA, AI Voice

---

## 1. MÔ HÌNH VẬN HÀNH ĐA KÊNH (OMNICHANNEL DEPLOYMENT)

Hệ sinh thái AI của CH Academy được cấu hình theo bảng `ai_channel_configs`, cho phép mỗi kênh liên lạc gắn kết với một Agent chuyên trách và sở hữu chính sách dữ liệu riêng:

| Kênh kết nối | URL / Điểm kết nối | Agent đảm nhiệm | Chính sách xác thực | Tính năng trọng tâm |
| :--- | :--- | :--- | :--- | :--- |
| **Website Công khai** | `/` (Landing Page & Toàn bộ trang public) | `AGENT_ADMISSIONS` | Không yêu cầu đăng nhập (Guest Session ID) | Tư vấn bảng giá, lịch học, thu thập Lead, chuyển nhân viên |
| **Cổng Học viên** | `/student/*`, `/portal/*` | `AGENT_STUDENT_TUTOR` | Yêu cầu JWT Học viên (`ROLE_STUDENT`) | Hướng dẫn giải bài tập, tra cứu lịch học cá nhân, học phí |
| **Cổng Giảng viên** | `/teacher/*` | `AGENT_TEACHER_ASSISTANT` | Yêu cầu JWT Giảng viên (`ROLE_TEACHER`) | Soạn dàn ý giáo án, gợi ý đề thi, tra cứu lớp phân công |
| **Cổng Quản trị** | `/admin/*` | `AGENT_ADMIN_ASSISTANT` | Yêu cầu JWT Quản trị (`ROLE_ADMIN`) | Báo cáo doanh thu, sĩ số, chuyên cần, phân tích vận hành |
| **Zalo Official Account** | Webhook `/api/v1/webhooks/zalo` | `AGENT_ADMISSIONS` | Xác thực Webhook Signature | Phản hồi tự động tin nhắn khách hàng qua Zalo |
| **AI Voice Call** | Trực tiếp trên Widget trình duyệt | Tùy theo cổng | Kế thừa phiên cổng hiện tại | Đàm thoại hai chiều bằng giọng nói tiếng Việt (STT & TTS) |

---

## 2. QUẢN LÝ KHÁCH HÀNG TIỀM NĂNG (LEAD CAPTURE) TỪ CHAT AI

### 2.1. Quy trình phát hiện và lưu trữ tự động
1. **Phát hiện qua ý định (Intent Recognition)**:
   * Khi khách hàng nhắn tin chứa số điện thoại (định dạng 10 số `03x`, `05x`, `07x`, `08x`, `09x`) hoặc có các từ khóa: *"tư vấn", "học phí", "đăng ký học", "gọi lại cho tôi"*.
   * Hệ thống tự động trích xuất số điện thoại và họ tên khách hàng từ ngữ cảnh hội thoại.
2. **Lưu trữ vào Cơ sở dữ liệu (`ai_leads`)**:
   * Kiểm tra trùng lặp qua phương thức `leadRepository.existsByPhoneAndCourseInterest(phone, course)`.
   * Tạo bản ghi mới với trạng thái mặc định `status = 'NEW'`, gắn kết với `conversation_id`.
3. **Form đăng ký chủ động trên giao diện (Lead Modal)**:
   * Khách hàng trên trang chủ có thể bấm trực tiếp nút *"Tư vấn ngay"* ở thanh tiêu đề Chat Widget.
   * Điền nhanh Họ tên, Số điện thoại và Khóa học quan tâm.
   * Dữ liệu được đẩy ngay về backend qua endpoint `POST /api/v1/chat/ai/public/lead`.

### 2.2. Quản lý và chăm sóc Lead tại AI Agent Studio
* Quản trị viên và bộ phận Tuyển sinh có thể theo dõi danh sách toàn bộ Leads thu thập được từ Chat AI tại tab **Leads** trong trang `AI Agent Studio`.
* Hỗ trợ cập nhật trạng thái chăm sóc: `NEW` (Mới) $\longrightarrow$ `CONTACTED` (Đã liên hệ) $\longrightarrow$ `CONVERTED` (Đã chốt nhập học).

---

## 3. CƠ CHẾ CHUYỂN GIAO NHÂN VIÊN (HUMAN HANDOFF)

* Khi khách hàng có yêu cầu gặp người thật, có khiếu nại hoặc khi AI không đủ thông tin để trả lời:
  1. Cuộc hội thoại được cập nhật trạng thái `status = 'WAITING_HUMAN'`.
  2. AI tạm dừng sinh câu trả lời tự động để tránh trả lời đè lên tư vấn viên.
  3. Giao diện người dùng xuất hiện thông báo trực quan: *"🔔 Yêu cầu kết nối nhân viên tư vấn đã được gửi đi thành công. Hotline: 0987.654.321"*.
  4. Quản trị viên nhìn thấy huy hiệu cảnh báo màu đỏ trên danh sách hội thoại tại Cổng Quản trị để mở khung chat tiếp quản ngay lập tức.

