# BÁO CÁO KIỂM TOÁN CHAT NHÓM LỚP HỌC DÀNH CHO QUẢN TRỊ VIÊN (ADMIN CHAT OVERSIGHT)
**Dự án:** CH Academy  
**Tệp liên quan:** `backend/src/main/java/vn/chacademy/chat/service/ClassChatService.java`, `frontend/src/components/chat/GroupChatPanel.tsx`  

---

## 1. THỰC TRẠNG LỖI VÀ HÌNH ẢNH MINH CHỨNG
Trong ảnh chụp giao diện quản trị, tab "Giám sát Chat Nhóm Lớp ADMIN" hiển thị màn hình trống với thông điệp:
> *"Chưa có nhóm lớp học — Bạn chưa được ghi danh hoặc phân công vào lớp học nào đang hoạt động. Khi có lớp học mới, nhóm trao đổi sẽ tự động xuất hiện tại đây."*

Quản trị viên là người giám sát và điều hành toàn bộ các lớp học trong trung tâm, thông báo này là thông điệp của học viên, hoàn toàn không phù hợp và gây gián đoạn nghiệp vụ giám sát.

---

## 2. NGUYÊN NHÂN KỸ THUẬT GỐC RỄ

1. **Thiếu sót vai trò Quản lý trong `ClassChatService`:**
   Mã nguồn ban đầu kiểm tra vai trò Quản trị viên bằng điều kiện:
   ```java
   boolean isAdminRole = user.getRoles().stream().anyMatch(r -> r.getId().contains("ADMIN"));
   ```
   Hệ thống phân quyền của CH Academy có các vai trò quản trị như `ACADEMIC_STAFF` (Nhân viên đào tạo), `CENTER_ADMIN`, `SUPER_ADMIN`. Vì mã vai trò `ACADEMIC_STAFF` không chứa chữ `"ADMIN"`, người dùng bị coi là người dùng thông thường và bị chuyển sang luồng kiểm tra Enrollment học viên, dẫn đến danh sách nhóm lớp trả về rỗng (`[]`).

2. **Giao diện Frontend thiếu xử lý ngữ cảnh:**
   Khi `conversations.length === 0`, `GroupChatPanel.tsx` hiển thị thông điệp mặc định của học viên mà không phân biệt theo cổng `portal === 'ADMIN'`.

3. **Tự động khởi tạo nhóm chat chưa triệt để:**
   Một số lớp học mới được tạo trong bảng `classes` chưa có bản ghi tương ứng trong bảng `chat_conversations` do sự kiện `syncClassGroup` chưa được kích hoạt cho toàn bộ lớp cũ.

---

## 3. GIẢI PHÁP ĐÃ THỰC HIỆN

1. **Mở rộng nhận diện vai trò Quản trị:**
   Xây dựng phương thức `isAdministrativeRole(User user)` bao quát toàn diện các vai trò điều hành:
   - `SUPER_ADMIN`
   - `CENTER_ADMIN`
   - `ACADEMIC_STAFF`
   - Bất kỳ vai trò nào có định danh chứa `"ADMIN"`.

2. **Tự động đồng bộ nhóm chat cho toàn bộ lớp học:**
   Trong phương thức `getUserConversations` của `ClassChatService`, khi người gọi là Quản trị viên và yêu cầu cổng `ADMIN`, hệ thống kiểm tra và tự động đồng bộ nhóm chat cho tất cả các lớp học hiện có trong trung tâm.

3. **Cải tiến giao diện & Bộ chuyển đổi nhóm lớp (Multi-Class Switcher):**
   - Thiết kế giao diện thông báo riêng biệt cho Quản trị viên: *"Hiện chưa có nhóm lớp học nào trên hệ thống hoặc danh sách đang đồng bộ."*
   - Bổ sung nút **"Tải lại danh sách" (Refresh)** trực tiếp trên giao diện để Quản trị viên chủ động kích hoạt đồng bộ.
   - Khi có nhiều lớp học, Header hiển thị Dropdown danh sách nhóm lớp kèm mã lớp, tên giảng viên phụ trách và số lượng tin nhắn chưa đọc.

