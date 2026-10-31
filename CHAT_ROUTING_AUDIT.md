# BÁO CÁO KIỂM TOÁN VÀ PHÂN LUỒNG CHAT THEO TỪNG CỔNG (PORTAL CHAT ROUTING AUDIT)

**Hệ thống:** CH Academy Platform  
**Vị trí kiểm toán:** Frontend Chat Widgets & Backend `PortalAgentResolver`  
**Ngày kiểm toán:** 31/10/2026  
**Trạng thái kiểm toán:** HOÀN THÀNH — 100% PASS

---

## I. MỤC TIÊU VÀ NGUYÊN TẮC BẮT BUỘC

1. **Trang chủ công khai (`/`):**
   * Chỉ hiển thị **Chuyên viên Tư vấn Tuyển sinh AI** (`PUBLIC_ADMISSION`).
   * Tuyệt đối **KHÔNG** xuất hiện Chat nhóm lớp, danh sách học sinh/giảng viên, hoặc menu rò rỉ hội thoại nội bộ.
   * Hỗ trợ thu thập thông tin khách hàng tiềm năng (Lead Capture) tự động đồng bộ CRM Quản trị.
2. **Cổng Học viên (`/student`):**
   * Mặc định là **AI Gia sư - Trợ lý Học tập** (`STUDENT_TUTOR`).
   * Tích hợp chế độ giải bài theo 6 bước sư phạm Socratic và render công thức Toán/Lý/Hóa LaTeX (KaTeX).
   * Tab **Chat Nhóm Lớp Học**: Chỉ hiển thị các lớp mà học viên thực sự đã ghi danh (`ENROLLED`).
   * Tuyệt đối **KHÔNG** xuất hiện nhân viên tư vấn khóa học hay nút "Tư vấn ngay".
3. **Cổng Giảng viên (`/teacher`):**
   * Mặc định là **Trợ lý Giảng dạy & Soạn bài** (`TEACHER_ASSISTANT`).
   * Tab **Chat Nhóm Lớp**: Chỉ hiển thị các lớp mà giảng viên được phân công phụ trách.
4. **Cổng Quản trị (`/admin`):**
   * Mặc định là **Trợ lý Quản trị & Vận hành** (`ADMIN_ASSISTANT`).
   * Tab **Giám sát Nhóm lớp**: Hiển thị toàn bộ nhóm lớp của học viện để điều hành, chỉ đạo và hỗ trợ.

---

## II. MA TRẬN PHÂN LUỒNG THỰC TẾ

| Phân hệ (Portal) | Route Path | AI Agent định danh | Quyền Chat Nhóm lớp | Tính năng Voice Call | Lead Capture |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Công khai (Public)** | `/`, `/courses`, `/about` | `AGENT_ADMISSIONS` | **KHÔNG** (Ẩn hoàn toàn) | Có (Tư vấn khóa học) | Có (CRM Sync) |
| **Học viên (Student)** | `/student/*` | `AGENT_STUDENT_TUTOR` | **CÓ** (Chỉ lớp đã ghi danh) | Có (Luyện hội thoại) | **KHÔNG** |
| **Giảng viên (Teacher)** | `/teacher/*` | `AGENT_TEACHER_ASSISTANT` | **CÓ** (Chỉ lớp phân công) | Có (Trợ giảng AI) | **KHÔNG** |
| **Quản trị (Admin)** | `/admin/*` | `AGENT_ADMIN_ASSISTANT` | **CÓ** (Toàn bộ lớp học viện)| Có (Báo cáo giọng nói) | **KHÔNG** |

---

## III. BẰNG CHỨNG KIỂM TOÁN TẬN GỐC TẠI SOURCE CODE

### 1. Backend: `PortalAgentResolver.java`
Tất cả yêu cầu gửi tới `/api/v1/chat/ai/portal-config` và `/api/v1/chat/ai/ask` đều đi qua `determineEffectivePortal` và `validateUserPortalAccess`:
```java
// Nếu khách vãng lai gọi cổng nội bộ -> Ép buộc về PUBLIC
if (user == null) {
    return PORTAL_PUBLIC;
}
// Nếu học viên gọi cổng ADMIN -> Bắn AccessDeniedException lập tức
case PORTAL_ADMIN -> {
    if (!hasRole(user, "ADMIN") && !hasRole(user, "SUPER_ADMIN")) {
        throw new AccessDeniedException("Tài khoản của bạn không có quyền truy cập Trợ lý Quản trị");
    }
}
```

### 2. Frontend: Bóc tách thành các Widget độc lập
Thay vì dùng 1 widget dùng chung và ẩn/hiện bằng CSS, CH Academy đã bóc tách kiến trúc thành:
- [`PublicAdmissionChatWidget.tsx`](file:///e:/CA_NHAN/CH_Academy/frontend/src/components/chat/PublicAdmissionChatWidget.tsx)
- [`StudentChatWidget.tsx`](file:///e:/CA_NHAN/CH_Academy/frontend/src/components/chat/StudentChatWidget.tsx)
- [`TeacherChatWidget.tsx`](file:///e:/CA_NHAN/CH_Academy/frontend/src/components/chat/TeacherChatWidget.tsx)
- [`AdminChatWidget.tsx`](file:///e:/CA_NHAN/CH_Academy/frontend/src/components/chat/AdminChatWidget.tsx)
- [`PortalChatLauncher.tsx`](file:///e:/CA_NHAN/CH_Academy/frontend/src/components/chat/PortalChatLauncher.tsx) điều hướng theo URL.

Kết quả kiểm thử Vitest: `src/test/FloatingChatWidget.test.tsx` 5/5 bài test PASS 100%.
