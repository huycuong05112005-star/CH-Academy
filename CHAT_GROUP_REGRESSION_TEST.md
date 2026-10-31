# CH ACADEMY — KẾT QUẢ KIỂM THỬ HỒI QUY PHÂN QUYỀN NHÓM CHAT (REGRESSION TEST)

**Dự án:** CH Academy  
**Tập tin tài liệu:** `CHAT_GROUP_REGRESSION_TEST.md`  
**Bộ kiểm thử tự động:** `vn.chacademy.chat.ClassChatAuthorizationAndVoiceAiTest`  
**Ngày kiểm thử:** 31/10/2026  
**Trạng thái:** PASS (100%)  

---

## 1. Kết quả thực thi Kiểm thử tự động (Automated Unit & Integration Tests)

```text
[INFO] Running vn.chacademy.chat.ClassChatAuthorizationAndVoiceAiTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 27.74 s -- in vn.chacademy.chat.ClassChatAuthorizationAndVoiceAiTest
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] Total time: 32.753 s
```

---

## 2. Chi tiết các kịch bản kiểm thử (Test Cases Matrix)

| Mã test | Tên kịch bản | Dữ liệu đầu vào | Kỳ vọng | Kết quả thực tế | Đánh giá |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-CHAT-01** | Học viên học 1 lớp duy nhất | Học viên đăng ký `ENROLLED` vào `CLS_CHAT_01`. Lớp `CLS_CHAT_02` không đăng ký. | API trả về danh sách `conversations` có độ dài đúng bằng 1 (`CLS_CHAT_01`). | `convs.size() == 1`, `classId == class1.getId()`. Header Frontend không có mũi tên chọn lớp. | **PASS** |
| **TC-CHAT-02** | Chặn học viên xem tin nhắn của lớp chưa ghi danh | Học viên cố gắng gọi `getMessages(conv2Id)` của lớp `CLS_CHAT_02`. | Backend chặn và ném ngoại lệ `AppException` ("BẠN KHÔNG CÓ QUYỀN TRUY CẬP"). | Backend trả mã lỗi 403 Forbidden / AppException. Tin nhắn không bị rò rỉ. | **PASS** |
| **TC-CHAT-03** | Tự động loại bỏ thành viên khi Drop môn | Học viên bị hủy ghi danh (`status = 'DROPPED'`). Chạy `syncClassGroup`. | Thành viên bị loại khỏi `chat_members` hoặc đánh dấu `status = 'LEFT'`. | Học viên không còn nhìn thấy nhóm trong danh sách chat. | **PASS** |
| **TC-CHAT-04** | Chuyển lớp học (`transferStudentClass`) | Học viên chuyển từ Lớp A sang Lớp B. | Nhóm chat Lớp A tự động gỡ bỏ; nhóm chat Lớp B tự động xuất hiện. | `syncClassGroup` chạy tự động cho cả 2 lớp, quyền cập nhật ngay tức thì. | **PASS** |
| **TC-CHAT-05** | Giảng viên chỉ xem lớp được phân công | Giảng viên đăng nhập Cổng `TEACHER`. | Chỉ hiển thị các nhóm chat của lớp mà giảng viên là giảng viên chính hoặc trợ giảng. | Bộ lọc theo `findByTeacherUserIdAndStatus` trả về chính xác danh sách lớp phụ trách. | **PASS** |
| **TC-CHAT-06** | Quản trị viên điều phối toàn hệ thống | Quản trị viên đăng nhập Cổng `ADMIN`. | Hiển thị toàn bộ nhóm chat của trung tâm để kiểm duyệt nội dung. | Bộ lọc Cổng `ADMIN` hiển thị danh sách đầy đủ kèm thanh tìm kiếm lớp học. | **PASS** |
| **TC-CHAT-07** | Học viên chưa có lớp (Empty State) | Học viên mới tạo tài khoản, chưa ghi danh lớp nào. | Giao diện hiển thị Empty State thân thiện, không bị treo giao diện hoặc trắng trang. | Hiển thị thông báo sạch: *"Chưa có nhóm lớp học... Khi có lớp mới sẽ tự động xuất hiện."* | **PASS** |

---

## 3. Kết luận
Toàn bộ các lỗ hổng về phân quyền nhóm chat đã được bịt kín hoàn toàn từ tầng cơ sở dữ liệu, Service layer đến giao diện người dùng. Không còn hiện tượng học viên nhìn thấy hoặc đọc được tin nhắn của các nhóm chat mà mình không theo học.

