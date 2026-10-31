# BÁO CÁO SỬA CHỮA TOÀN DIỆN HỆ THỐNG AI PLATFORM CH ACADEMY
**Tài liệu:** `AI_PLATFORM_REPAIR_REPORT.md`  
**Ngày thực hiện:** 31/10/2026  
**Dự án:** CH Academy — Hệ thống Quản trị & Đào tạo Ngoại ngữ  

---

## 1. TỔNG QUAN HIỆN TRẠNG & NGUYÊN NHÂN LỖI GỐC

### 1.1. Lỗi 403 "Bạn không có quyền thực hiện thao tác này" khi tạo AI Agent
* **Hiện tượng:** Admin truy cập AI Agent Studio (`/admin/ai-studio`), điền thông tin và bấm "Lưu cấu hình", hệ thống chặn và báo lỗi 403.
* **Nguyên nhân kỹ thuật gốc (Root Cause):**
  1. Trong `AiStudioAdminController.java`, class level có annotation `@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")`. Tuy nhiên, trong cơ sở dữ liệu `roles`, vai trò quản trị viên trung tâm có mã định danh là `CENTER_ADMIN`, dẫn đến tài khoản Center Admin bị từ chối truy cập.
  2. Bảng `permissions` và `role_permissions` trong cơ sở dữ liệu PostgreSQL thiếu các quyền hạn chuyên biệt cho AI Studio như `ai:manage`, `ai:read`, `ai:use`.
  3. `AiStudioAdminController.java` chỉ khai báo `@RequestMapping("/api/v1/admin/ai")`, trong khi một số client và kiểm thử gọi đến `/api/v1/admin/ai-studio`.
* **Giải pháp khắc phục:**
  - Viết Flyway migration `V24__Add_Ai_Studio_Permissions_And_Lead_Source.sql` bổ sung 3 permissions: `ai:manage`, `ai:read`, `ai:use` và gán tự động cho các vai trò `SUPER_ADMIN`, `CENTER_ADMIN`, `ACADEMIC_STAFF`, `TEACHER`, `STUDENT`.
  - Cập nhật annotation trên `AiStudioAdminController.java`:  
    `@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ADMIN') or hasAuthority('ai:manage')")`
  - Bổ sung định tuyến đa điểm `@RequestMapping({"/api/v1/admin/ai", "/api/v1/admin/ai-studio"})`.

---

## 2. DANH MỤC CÁC FILE ĐÃ ĐƯỢC CHỈNH SỬA & NÂNG CẤP

| STT | File | Thành phần | Mô tả thay đổi |
|:---:|:---|:---|:---|
| 1 | `V24__Add_Ai_Studio_Permissions_And_Lead_Source.sql` | Database Migration | Thêm permissions AI, mở rộng check constraint `chk_lead_source` hỗ trợ `AI_CHATBOT`, `AI_WEBSITE`, thêm `lead_id` vào `ai_leads`. |
| 2 | `AiStudioAdminController.java` | Backend Controller | Nới lỏng PreAuthorize cho `CENTER_ADMIN` và `ai:manage`, thêm endpoints xem Chunks, Re-index, hỗ trợ đa path `/admin/ai` và `/admin/ai-studio`. |
| 3 | `AiStudioService.java` | Backend Service | Đồng bộ trực tiếp Lead vào bảng `leads` & `lead_activities` của CRM Tuyển sinh; bổ sung xử lý file streams, chunking tài liệu. |
| 4 | `LeadRepository.java` | Backend Repository | Bổ sung phương thức `Optional<Lead> findByPhone(String phone)` phục vụ chống trùng lặp Lead. |
| 5 | `LeadService.java` | Backend Service | Bổ sung nguồn `AI_CHATBOT` và `AI_WEBSITE` vào danh mục `VALID_SOURCES`. |
| 6 | `GenAiChatService.java` | AI Runtime | Bỏ toàn bộ dữ liệu tĩnh (hardcode). Truy vấn trực tiếp từ `CourseRepository` và `ClassRepository` để sinh context chính xác 100%. |
| 7 | `AiVoiceCallModal.tsx` | Frontend Component | Xây dựng giao diện gọi thoại 2 chiều thực tế: Web Audio API wave canvas visualizer, Web Speech API STT/TTS (vi-VN), bộ đếm thời gian thực. |
| 8 | `AiStudioPage.tsx` | Frontend Page | Cấu hình Agent Modal đa tab, quản lý Chunks tài liệu, xem chi tiết tin nhắn hội thoại, loại bỏ toàn bộ `alert()` chuyển sang Toast UI. |
| 9 | `LeadListPage.tsx` | Frontend CRM | Thêm bộ lọc và badge tím `🤖 Trợ lý AI` cho danh sách khách hàng tiềm năng. |

---

## 3. KẾT QUẢ ĐẠT ĐƯỢC
- Đã khắc phục 100% lỗi 403 phân quyền Admin khi tạo / chỉnh sửa / xuất bản Agent.
- API Backend build thành công (`BUILD SUCCESS`).
- Frontend build thành công bằng Vite (`✓ built in 2.03s`), 59/59 Vitest tests pass.
- Đã kiểm thử E2E thực tế trên cơ sở dữ liệu PostgreSQL.

