# BÁO CÁO BẢO MẬT: 18. CÔ LẬP VÀ PHÂN LUỒNG TRIỆT ĐỂ 3 CỔNG (PORTAL ISOLATION)

**Dự án:** CH Academy  
**Phân loại rủi ro:** P0 - Critical  
**Tiêu chuẩn đối chiếu:** Kiến trúc phân luồng nghiệp vụ CH Academy

---

## 1. NGUYÊN TẮC CÔ LẬP 3 CỔNG BẮT BUỘC
1. **Cổng Công Khai (Landing Page):**
   - Chỉ được phép hiển thị **AI Tư vấn Tuyển sinh CH Academy**.
   - Tuyệt đối không xuất hiện Chat nhóm lớp, danh sách giảng viên nội bộ hay dữ liệu cá nhân học viên.
2. **Cổng Học Viên (Student Portal):**
   - Chỉ được phép sử dụng **AI Gia sư / Trợ lý Đồng hành Học tập**.
   - Chỉ hiển thị và cho phép chat nhóm các lớp mà học viên đó đã ghi danh thực tế.
3. **Cổng Giảng Viên (Teacher Portal):**
   - Chỉ được phép sử dụng **Trợ lý Giảng dạy AI**.
   - Chỉ truy cập các nhóm lớp được Ban Giám đốc phân công giảng dạy.
4. **Cổng Quản Trị Viên (Admin Portal):**
   - Sử dụng **Trợ lý Quản trị & Vận hành AI**.
   - Có quyền giám sát và điều phối tất cả các nhóm lớp toàn trung tâm.

## 2. KẾT QUẢ KIỂM TRA VÀ GIA CỐ
- Đã tách biệt hoàn toàn các Chat Widget:
  - `PublicChatWidget.tsx` (Chỉ Tuyển sinh AI, form đăng ký Lead).
  - `StudentChatWidget.tsx` (AI Gia sư + Nhóm lớp đã học).
  - `TeacherChatWidget.tsx` (AI Giảng dạy + Nhóm lớp phụ trách).
  - `AdminChatWidget.tsx` (AI Vận hành + Giám sát toàn bộ).
- Trạng thái: **HOÀN THÀNH VÀ ĐẠT CHUẨN 100%**.
