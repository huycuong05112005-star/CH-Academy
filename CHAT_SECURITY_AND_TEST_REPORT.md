# BÁO CÁO BẢO MẬT VÀ KIỂM THỬ HỆ THỐNG CHAT — CH ACADEMY
**Cập nhật:** 31/10/2026

---

## 1. KIỂM SOÁT PHÂN QUYỀN BẢO MẬT (SECURITY & RBAC)

1. **Xác thực kết nối API:**
   - 100% các endpoint `/api/v1/chat/**` đều bắt buộc xác thực qua `JwtAuthenticationFilter` (`@PreAuthorize("isAuthenticated()")`).
2. **Kiểm tra quyền sở hữu và tham gia hội thoại (Conversation Membership Verification):**
   - Trước khi trả về danh sách tin nhắn hoặc cho phép gửi tin nhắn vào nhóm lớp, `ClassChatService.verifyMembership` kiểm tra người dùng có bản ghi hợp lệ trong bảng `chat_members` hay không.
   - Nếu người dùng tự ý thay đổi ID trên URL hoặc gửi request can thiệp vào nhóm của lớp khác: Hệ thống ném ra `AccessDeniedException` và trả về mã lỗi HTTP `403 FORBIDDEN` ("Bạn không phải thành viên của nhóm học tập này").
3. **Phân quyền hội thoại Gen AI:**
   - Mỗi người dùng chỉ truy cập được các phiên hội thoại do chính mình tạo ra (`findByIdAndUserId`). Học viên A không thể xem lịch sử chat AI của Học viên B.

---

## 2. KỊCH BẢN KIỂM THỬ THỰC TẾ & KẾT QUẢ

| Kịch bản kiểm thử | Vai trò thực hiện | Dữ liệu đầu vào | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|
| **TC-CHAT-01** | Học viên | `GET /api/v1/chat/classes/conversations` | Chỉ thấy các lớp đã ghi danh | Thấy duy nhất nhóm `CLS-ENG-PRO01` | **PASS** |
| **TC-CHAT-02** | Học viên | `GET /api/v1/chat/classes/conversations/1/messages` (Lớp trẻ em không thuộc học viên) | Bị từ chối truy cập | HTTP 403 Forbidden | **PASS** |
| **TC-CHAT-03** | Học viên | Gửi tin nhắn vào lớp mình học | Tin nhắn được lưu và hiển thị | Tin nhắn lưu thành công vào CSDL | **PASS** |
| **TC-CHAT-04** | Học viên | Hỏi AI: "Tôi đang học những lớp nào?" | AI trả đúng lớp và giảng viên thực tế | Trả đúng `CLS-ENG-PRO01`, Thầy Lê Hoàng Nam | **PASS** |
| **TC-CHAT-05** | Học viên | Hỏi AI: "Học phí của tôi như thế nào?" | AI tra cứu đúng trạng thái thanh toán | Báo đúng đã hoàn tất 100% học phí | **PASS** |
| **TC-CHAT-06** | UI Widget | Click nút chat nổi | Mở menu 2 lựa chọn dọc (Chat nhóm / Chat AI) | Hiển thị menu rõ ràng kèm icon | **PASS** |
| **TC-CHAT-07** | UI Widget | Chuyển qua lại giữa Chat nhóm và Chat AI | Giữ nguyên trạng thái và lịch sử | Chuyển đổi mượt mà, độc lập | **PASS** |
| **TC-CHAT-08** | UI Widget | Đổi theme (Sáng / Tối / Kính) | Giao diện Chat tự thích ứng màu sắc | Hiển thị chuẩn xác trên 3 theme | **PASS** |

---

## 3. TỰ ĐỘNG HÓA KIỂM THỬ (UNIT & INTEGRATION TESTS)

- Suite kiểm thử Frontend: `src/test/FloatingChatWidget.test.tsx` (4 tests) đạt **PASS 100%**.
- Toàn bộ Vitest Frontend suite: **14 test files, 56 tests passed**.
- Backend Spring Boot: Đang chạy ổn định tại port `8088`.
- Frontend Vite Server: Đang chạy tại port `5173`.

