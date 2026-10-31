# BÁO CÁO TÍCH HỢP ĐỒNG BỘ DỮ LIỆU KHÁCH HÀNG TIỀM NĂNG (AI LEAD CRM INTEGRATION)
**Tài liệu:** `AI_LEAD_INTEGRATION_REPORT.md`  
**Ngày thực hiện:** 31/10/2026  
**Dự án:** CH Academy  

---

## 1. MÔ TẢ VẤN ĐỀ TRƯỚC NÂNG CẤP
Trước đây, luồng thu thập thông tin khách hàng từ Chatbot AI trên Website công khai bị ngắt quãng:
1. Khi khách hàng để lại thông tin (Họ tên, Số điện thoại, Khóa học quan tâm, Ghi chú), dữ liệu chỉ được lưu vào bảng nội bộ `ai_leads`.
2. Không đồng bộ vào bảng nghiệp vụ chính `leads` của bộ phận Tuyển sinh (CRM).
3. Bảng `leads` của PostgreSQL có ràng buộc check constraint `chk_lead_source` chỉ chấp nhận các nguồn: `['WEBSITE', 'FACEBOOK', 'REFERRAL', 'WALK_IN', 'HOTLINE', 'OTHER']`. Nếu đưa nguồn `AI_CHATBOT` vào sẽ bị lỗi vi phạm ràng buộc (Check violation).
4. Nhân viên tuyển sinh truy cập màn hình Quản lý Leads (`/admin/leads`) không nhìn thấy các khách hàng do Trợ lý AI thu thập được.

---

## 2. THIẾT KẾ & GIẢI PHÁP TÍCH HỢP TOÀN DIỆN

### 2.1. Cập nhật Cơ sở dữ liệu (Flyway Migration V24)
- Chỉnh sửa check constraint trên bảng `leads`:
  ```sql
  ALTER TABLE leads DROP CONSTRAINT IF EXISTS chk_lead_source;
  ALTER TABLE leads ADD CONSTRAINT chk_lead_source 
      CHECK (source IN ('WEBSITE', 'FACEBOOK', 'REFERRAL', 'WALK_IN', 'HOTLINE', 'OTHER', 'AI_CHATBOT', 'AI_WEBSITE'));
  ```
- Bổ sung cột khóa ngoại `lead_id BIGINT REFERENCES leads(id)` vào bảng `ai_leads` để liên kết 1-1 giữa bản ghi AI Lead và CRM Lead.

### 2.2. Xử lý nghiệp vụ tại Service (`AiStudioService.java` & `LeadService.java`)
- Bổ sung `crmLeadRepository`, `crmLeadActivityRepository` và `courseRepository` vào `AiStudioService`.
- **Cơ chế khử trùng lặp (Deduplication) theo số điện thoại:**
  - Khi có thông tin gửi lên từ `POST /api/v1/chat/ai/public/lead`, hệ thống kiểm tra số điện thoại qua `crmLeadRepository.findByPhone(trimmedPhone)`.
  - **Nếu đã tồn tại Lead:** Hệ thống không tạo mới mà bổ sung thông tin vào trường `notes` của Lead hiện tại, kèm dấu thời gian và khóa học quan tâm mới, đồng thời cập nhật thời gian liên hệ.
  - **Nếu là Lead mới:**
    - Tự động sinh mã Lead duy nhất theo chuẩn định dạng: `LEAD-AI-XXXXXX`.
    - Tự động đối soát khóa học khách quan tâm với danh mục thực tế từ `courseRepository.findAll()` để gắn trực tiếp `targetCourse`.
    - Gán trạng thái ban đầu: `NEW`, nguồn: `AI_CHATBOT`.
    - Ghi nhận lịch sử hoạt động vào bảng `lead_activities` với loại hành động: `AI_CONSULTATION_CAPTURED` ("Thu thập thông tin tư vấn tự động từ Chatbot AI").
    - Cập nhật trường `lead_id` trên bản ghi `AiLead`.

### 2.3. Cập nhật giao diện Quản lý CRM (`LeadListPage.tsx`)
- Thêm tùy chọn `AI_CHATBOT` vào danh sách dropdown lọc nguồn khách hàng.
- Bổ sung badge hiển thị màu tím nổi bật:
  ```tsx
  case 'AI_CHATBOT':
  case 'AI_WEBSITE':
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
        <Bot className="w-3 h-3" />
        <span>Trợ lý AI</span>
      </span>
    )
  ```

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ TRÊN DATABASE
Đã chạy kiểm thử E2E tự động qua API thực tế:
- **Đầu vào:** Khách hàng Vũ Hoàng Minh, SĐT `0988681795`, khóa học "Tiếng Anh Giao Tiếp Doanh Nghiệp".
- **Kết quả trả về:**
  - Bản ghi `ai_leads`: ID = 4, phone = `0988681795`, `leadId` = 9.
  - Bản ghi `leads` (CRM): ID = 9, mã `LEAD-AI-796959`, nguồn `AI_CHATBOT`, trạng thái `NEW`.
  - Ghi chú: "Đăng ký tư vấn tự động qua Trợ lý Tuyển sinh AI CH Academy. Khóa học quan tâm: Tiếng Anh Giao Tiếp Doanh Nghiệp...".
  - Kiểm tra truy vấn `GET /api/v1/leads?keyword=0988681795`: Tìm thấy đúng 1 bản ghi với đầy đủ liên kết.

