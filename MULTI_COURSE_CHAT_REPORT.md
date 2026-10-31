# BÁO CÁO THIẾT KẾ & KIỂM THỬ CHAT NHÓM ĐA KHÓA HỌC (MULTI-COURSE GROUP CHAT)

**Dự án:** CH Academy Platform  
**Phân hệ:** Class Group Messaging & Multi-Class Roster Management  
**Ngày thực hiện:** 31/10/2026  

---

## I. MÔ THỨC QUẢN LÝ DỮ LIỆU NHÓM THEO `classId`

Trong thực tế giáo dục, một khóa học (ví dụ: *Tiếng Anh Giao Tiếp*) có thể được mở thành nhiều lớp khác nhau (ví dụ: `CLS-ENG-PRO01`, `CLS-ENG-PRO02`). Việc định danh nhóm chat theo `courseId` là sai nghiệp vụ vì sẽ làm trộn lẫn học viên giữa các lớp khác nhau.

**Giải pháp chuẩn hóa:**
- Mỗi cuộc trò chuyện nhóm được gắn chặt với `classId` thông qua thực thể `ChatConversation` (`type = 'CLASS_GROUP'`, `class_id = classEntity.id`).
- Mã lớp (`classCode`) và tên lớp (`className`) đóng vai trò là nhận diện cốt lõi.
- DTO trả về bổ sung `courseName` và `teacherName` để hiển thị ngữ cảnh đầy đủ cho học viên.

---

## II. QUY TRÌNH LUỒNG NGHIỆP VỤ (WORKFLOW)

```mermaid
sequenceDiagram
    autonumber
    actor User as Học viên / Giảng viên
    participant UI as GroupChatPanel (Frontend)
    participant API as ClassChatController (Backend)
    participant Svc as ClassChatService
    participant DB as PostgreSQL Database

    User->>UI: Mở tab Chat Nhóm Lớp Học
    UI->>API: GET /api/v1/chat/classes/conversations
    API->>Svc: getUserConversations(user)
    Svc->>DB: Lọc lớp theo User Role (Học viên: Enrollment; Giáo viên: Assignment; Admin: All)
    DB-->>Svc: Danh sách cuộc trò chuyện nhóm
    Svc-->>API: List<ChatConversationDto> kèm sĩ số, unread, teacherName
    API-->>UI: 200 OK + Conversations List
    UI->>UI: Tự động chọn lớp đầu tiên (selectedConvId)
    UI->>API: GET /api/v1/chat/classes/conversations/{id}/messages
    API-->>UI: 200 OK + Lịch sử tin nhắn của lớp
    User->>UI: Chọn chuyển sang lớp học khác (Pill Tab)
    UI->>API: GET /api/v1/chat/classes/conversations/{newId}/messages
    API-->>UI: 200 OK + Lịch sử tin nhắn lớp mới (Không tải lại trang)
```

---

## III. TÍNH NĂNG ĐÃ TRIỂN KHAI TRÊN FRONTEND (`GroupChatPanel.tsx`)

1. **Bộ chọn lớp học đa khóa:** Nếu học viên tham gia nhiều lớp (ví dụ: `CLS-ENG-PRO01`, `CLS-MATH-01`), thanh tab chuyển đổi lớp xuất hiện ở phía trên cùng với badge số tin nhắn chưa đọc của từng lớp.
2. **Hộp tìm kiếm lớp nhanh:** Cho phép lọc danh sách lớp theo tên môn học hoặc mã lớp khi số lượng lớp > 3.
3. **Thanh thông tin lớp chi tiết:** Hiển thị Tên lớp, Mã lớp, Tên môn học (`courseName`), và Giảng viên phụ trách (`GV: Lê Hoàng Nam`).
4. **Xem danh sách thành viên:** Nút sĩ số mở bảng danh sách học sinh và giáo viên trong lớp thông qua API `GET /api/v1/chat/classes/conversations/{id}/members`.
5. **Chống gửi trùng tin nhắn (Deduplication):** Sử dụng `clientMsgId` độc bản cho mỗi tin nhắn gửi đi, đảm bảo tính toàn vẹn ngay cả khi mạng lag hoặc người dùng click liên tục.

---

## IV. BẰNG CHỨNG KIỂM THỬ THỰC TẾ

1. **API Kiểm tra danh sách nhóm:**
   ```bash
   GET /api/v1/chat/classes/conversations
   ```
   *Kết quả thực tế:* Trả về chính xác các lớp kèm đầy đủ `courseName` ("Tiếng Anh Giao Tiếp Công Sở & Doanh Nghiệp") và `teacherName` ("Lê Hoàng Nam").
2. **API Kiểm tra danh sách thành viên:**
   ```bash
   GET /api/v1/chat/classes/conversations/1/members
   ```
   *Kết quả thực tế:* Trả về 5 thành viên gồm Giảng viên Nguyễn Thị Minh Hạnh (`TEACHER`), các học viên (`STUDENT`) và Quản trị viên (`ADMIN`).
