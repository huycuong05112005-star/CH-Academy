# BÁO CÁO KIỂM THỬ CHỨC NĂNG NỀN TẢNG AI PLATFORM (FUNCTIONAL TEST REPORT)

**Tài liệu:** `AI_PLATFORM_FUNCTIONAL_TEST.md`  
**Ngày thực hiện:** 31 tháng 10 năm 2026  
**Dự án:** Hệ sinh thái AI Studio & Chat/Voice — CH Academy  
**Kết quả tổng thể:** 100% Kịch bản ĐẠT (Passed)  

---

## 1. PHẠM VI KIỂM THỬ (TEST SCOPE)

Đợt kiểm thử chức năng bao trùm toàn diện các thành phần sau:
1. **Kiểm thử Thu thập Lead Tuyển sinh Tự động:** Nhận diện số điện thoại, tên khách hàng và đồng bộ sang CRM `leads` & `lead_activities`.
2. **Kiểm thử Trợ giảng AI Học viên & Hiển thị Toán học:** Chế độ sư phạm 6 bước, Rich Markdown & Math LaTeX, cách ly dữ liệu lớp học.
3. **Kiểm thử 11 Phân hệ AI Studio Quản trị:** Điều hướng thanh cuộn ngang, quản lý Agents, Knowledge Base, Flows, Calls, Analytics, Settings.
4. **Kiểm thử Tự động Hóa (Vitest Suite):** Kiểm thử đơn vị và tích hợp các React Components và API Mocking.

---

## 2. KẾT QUẢ KIỂM THỬ KỊCH BẢN CHI TIẾT

| Mã test | Kịch bản kiểm thử | Dữ liệu đầu vào / Thao tác | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Bắt số điện thoại & tạo Lead CRM tự động | Gửi câu hỏi: `"Em tên là Trần Hoàng Nam, muốn tìm hiểu lớp IELTS 6.5, sđt của em là 0912345678"` qua `/api/v1/chat/ai/public/ask` | Tự động tạo bản ghi trong bảng `leads` với mã `LEAD-AI-xxx`, họ tên `Trần Hoàng Nam`, số điện thoại `0912345678`, nguồn `AI_CHATBOT` | Đã kiểm tra trực tiếp PostgreSQL: Bản ghi ID 10 tạo thành công, có ghi nhận trong `lead_activities` | **ĐẠT** |
| **TC-02** | Chuyển giao tư vấn viên (Human Handoff) | Gửi câu hỏi chứa từ khóa: `"Tôi muốn gặp nhân viên tư vấn người thật"` | Cập nhật trạng thái hội thoại thành `WAITING_HUMAN`, trả về thông điệp tiếp nhận kèm số hotline hỗ trợ | Hội thoại #22 chuyển trạng thái `WAITING_HUMAN`, trích dẫn nguồn Quy trình Handoff | **ĐẠT** |
| **TC-03** | Khóa học không tồn tại (Chống bịa đặt) | Gửi câu hỏi: `"Trung tâm có dạy tiếng Nhật hoặc tiếng Hàn không?"` | AI phản hồi trung thực trung tâm không đào tạo các thứ tiếng này, giới thiệu các khóa tiếng Anh & Lập trình | AI trả lời chuẩn xác, không bịa đặt học phí tiếng Nhật/Hàn, đề xuất tư vấn | **ĐẠT** |
| **TC-04** | Toggle Chế độ Sư phạm 6 bước | Học viên chọn chế độ `"Hướng dẫn từng bước (6 bước)"` trên `/student` | AI trả lời bài toán theo cấu trúc 6 bước có huy hiệu màu xanh dương nổi bật | Hiển thị trọn vẹn Bước 1 đến Bước 6 kèm công thức toán học | **ĐẠT** |
| **TC-05** | Hiển thị công thức Toán KaTeX/LaTeX | Chuỗi toán học `\frac{-b \pm \sqrt{\Delta}}{2a}` | Hiển thị dạng phân số có căn bậc hai và ký hiệu $\pm$ trực quan | `RichMarkdownRenderer` dựng công thức toán mượt mà, không vỡ layout | **ĐẠT** |
| **TC-06** | Cách ly Cổng & Lịch sử Hội thoại | Đăng nhập Giảng viên chat AI -> Đăng xuất -> Đăng nhập Admin | Không gian Admin không hiển thị tin nhắn của Giảng viên; Giảng viên không thấy tin nhắn Admin | Phân tách tuyệt đối theo `portal` trong bảng `ai_conversations` | **ĐẠT** |
| **TC-07** | Phân hệ Cuộc gọi AI (`tab: calls`) | Quản trị viên vào `/admin/ai-studio` chọn tab `Cuộc gọi AI` | Hiển thị bảng lịch sử cuộc gọi, visualizer sóng âm và nút "Bắt đầu cuộc gọi thử nghiệm" | Dữ liệu cuộc gọi hiển thị đầy đủ từ bảng `call_sessions`, modal hoạt động chuẩn | **ĐẠT** |
| **TC-08** | Thanh cuộn ngang AI Studio | Nhấn nút `<` và `>` trên thanh điều hướng tab, hoặc cuộn chuột ngang | Thanh tab trượt mượt mà sang trái/phải, tự động focus vào tab được chọn | Cuộn ngang hoạt động trơn tru trên mọi độ phân giải màn hình | **ĐẠT** |
| **TC-09** | Chống truy cập trái phép AI Studio | Học viên hoặc Giảng viên truy cập URL `/admin/ai-studio` | Backend trả về 403 Forbidden, Frontend chặn và điều hướng về cổng chính | Bị chặn bởi `SecurityConfig` và `ProtectedRoute` | **ĐẠT** |
| **TC-10** | Sửa lỗi Điều hướng Đăng nhập | Đăng nhập tài khoản `admin` sau khi hết phiên ở trang sinh viên | Điều hướng thẳng vào `/admin`, không bị rớt về trang `/student` | Hàm `getTargetPortal` chuyển hướng chính xác 100% | **ĐẠT** |

---

## 3. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG HÓA FRONTEND (VITEST SUITE)

Hệ thống đã chạy toàn bộ 15 bộ kiểm thử tự động của Frontend:
```text
Test Files  15 passed (15)
     Tests  59 passed (59)
  Start at  11:32:04
  Duration  1.58s (transform 312ms, setup 648ms, collect 842ms, tests 2.12s, environment 5.21s, prepare 1.45s)
```

### Các Suite kiểm thử trọng điểm đã thông qua:
1. `src/test/FloatingChatWidget.test.tsx`: Kiểm thử tính năng mở/đóng widget, chuyển đổi chế độ sư phạm, gửi tin nhắn, trích xuất lead và render Markdown.
2. `src/test/AiStudioAndIdentityIsolation.test.tsx`: Kiểm thử 11 module điều hướng AI Studio, scrollbar ngang, gọi API danh sách Agent và cách ly định danh cổng.
3. `src/test/LoginPage.test.tsx`: Kiểm thử điều hướng đúng cổng sau khi đăng nhập theo từng vai trò (`ADMIN`, `TEACHER`, `STUDENT`).
4. `src/test/SecurityFlow.test.tsx`: Kiểm thử giải phóng token sạch sẽ khi đăng xuất (`POST /auth/logout`).

