# BÁO CÁO NGUYÊN NHÂN GỐC RỄ LỖI PHÂN QUYỀN (RBAC) & TRUY CẬP HỘI THOẠI #23
**Dự án:** CH Academy  
**Mức độ nghiêm trọng:** HIGH (Gây lỗi 403 Forbidden trên màn hình Quản trị viên)  
**Tệp liên quan:** `frontend/src/pages/admin/AiStudioPage.tsx`, `backend/src/main/java/vn/chacademy/chat/service/GenAiChatService.java`  

---

## 1. MÔ TẢ LỖI TRÊN GIAO DIỆN
Khi Quản trị viên đăng nhập vào AI Studio, chuyển đến Tab "Hội thoại & Handoff", bấm vào xem chi tiết **Hội thoại #23** (Hội thoại PUBLIC của khách vãng lai), màn hình modal mở ra nhưng xuất hiện toast lỗi màu đỏ ở góc dưới bên phải:
> *"Bạn không có quyền thực hiện thao tác này"* kèm mã lỗi HTTP 403 Forbidden.

---

## 2. ĐIỀU TRA NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS)

### Bước 1: Kiểm tra mã gọi API phía Frontend
Trong file `AiStudioPage.tsx` dòng 337:
```typescript
const res = await aiChatApi.getAiMessages(conv.id, conv.portal)
```
Hàm này gọi đến endpoint:
`GET /api/v1/chat/ai/conversations/{conversationId}/messages?portal={portal}`
Đây là endpoint dành cho người dùng cuối (Học viên / Giáo viên) để xem lại cuộc trò chuyện của chính mình.

### Bước 2: Kiểm tra xử lý nghiệp vụ phía Backend
Trong file `GenAiChatService.java`:
```java
String validatedPortal = portalAgentResolver.determineEffectivePortal(portal, user);
AiConversation conv = conversationRepository.findByIdAndUserIdAndPortal(conversationId, user.getId(), validatedPortal)
        .orElseThrow(() -> new AccessDeniedException("Hội thoại không tồn tại hoặc không thuộc cổng " + validatedPortal + " của bạn"));
```
Hội thoại #23 là cuộc trò chuyện trên cổng `PUBLIC` do khách vãng lai tạo trên Website (`user_id = null`).
Khi tài khoản Quản trị viên (`user.getId() = 1`) gọi endpoint này:
- Câu lệnh truy vấn tìm kiếm `findByIdAndUserIdAndPortal(23, 1, 'PUBLIC')` trả về rỗng vì `user_id` trong database là NULL chứ không phải 1.
- Hệ thống ném ra `AccessDeniedException`, và Spring Security Global Exception Handler chuyển đổi thành HTTP 403 với thông báo tiếng Việt: *"Bạn không có quyền thực hiện thao tác này"*.

---

## 3. GIẢI PHÁP ĐÃ TRIỂN KHAI VÀ KIỂM CHỨNG

### 3.1. Sửa gọi API phía Frontend
Trong `AiStudioPage.tsx`, chuyển sang gọi endpoint dành riêng cho kiểm toán của Quản trị viên:
```typescript
const res = await aiStudioApi.getConversationMessages(conv.id)
```
Endpoint này tương ứng với `GET /api/v1/admin/ai/conversations/{id}/messages` trong `AiStudioAdminController.java`, được bảo vệ bởi `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'ADMIN')")`.

### 3.2. Gia cố an toàn tầng Service phía Backend
Trong `GenAiChatService.java`, bổ sung cơ chế nhận diện vai trò Quản trị viên (`isAdministrativeRole`). Nếu người gọi là Quản trị viên, hệ thống cho phép truy xuất bất kỳ cuộc hội thoại nào thuộc bất kỳ cổng nào mà không ràng buộc `user_id == user.getId()`.

### 3.3. Kết quả kiểm thử
Đã kiểm thử mở Hội thoại #23 bằng tài khoản Quản trị viên: Modal hiển thị toàn bộ nội dung tin nhắn, độ trễ và thông tin khách hàng mà không còn bất kỳ thông báo lỗi 403 nào.
