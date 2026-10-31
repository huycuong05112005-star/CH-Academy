# BÁO CÁO KIỂM THỬ HỒI QUY TOÀN DIỆN (END-TO-END REGRESSION REPORT)
**Dự án:** CH Academy  
**Thời gian:** 31/10/2026  
**Môi trường:** Local Dev / Docker PostgreSQL / Spring Boot 3.5 / Vite React  

---

## 1. PHẠM VI KIỂM THỬ HỒI QUY
Kiểm tra chéo toàn bộ 5 vấn đề cốt lõi và các tính năng liên quan:
1. **Phân tách Kho tri thức (KB) vs Tài liệu & Chunking:**
   - Tab 3 ("Kho tri thức") hiển thị danh sách các kho tri thức độc lập, phạm vi truy cập (Scope), tổng số tài liệu và chunks.
   - Nút "Tài liệu & Chunking" trên từng kho chuyển hướng chính xác sang Tab 4 với kho đó được chọn.
   - Tab 4 ("Tài liệu & Chunking") hiển thị bảng tài liệu, thông số chunking pipeline (500 tokens, 50 overlap, `text-embedding-3-small`, PostgreSQL pgvector).
   - Nút "Xem Chunks" mở Chunk Inspector Modal hiển thị danh sách chunks và độ dài văn bản chi tiết.
   - Trạng thái: **ĐẠT (PASSED)**

2. **Cấu hình & Tích hợp Zalo Official Account:**
   - Thẻ Zalo OA trong Tab 6 hiển thị trạng thái chuẩn xác (`HOẠT ĐỘNG` hoặc `CHỜ CẤU HÌNH OA`).
   - Modal cấu hình Zalo OA mở mượt mà, cho phép nhập OA ID, App ID, Secret Key, chọn Agent tiếp nhận.
   - Nút "Sao chép Webhook URL" copy chính xác `/api/v1/webhooks/zalo`.
   - Nút "Test Webhook" gửi request ping và hiển thị kết quả thành công `HTTP 200 OK`.
   - Trạng thái: **ĐẠT (PASSED)**

3. **Khắc phục lỗi Phân quyền (RBAC) trên Hội thoại #23:**
   - Đăng nhập tài khoản Quản trị viên (`admin`).
   - Mở modal xem chi tiết Hội thoại #23 (cuộc trò chuyện của khách vãng lai).
   - Không xuất hiện bất kỳ thông báo lỗi 403 Forbidden hay *"Bạn không có quyền thực hiện thao tác này"*.
   - Toàn bộ nội dung câu hỏi và câu trả lời hiển thị rõ ràng.
   - Trạng thái: **ĐẠT (PASSED)**

4. **Giám sát Chat Nhóm Lớp cho Quản trị viên:**
   - Mở widget "Giám sát Chat Nhóm Lớp ADMIN".
   - Widget tải thành công toàn bộ các nhóm lớp học đang có trong trung tâm (`CLS-ENG-PRO01`, `CLS-ENG-KID01`).
   - Dropdown chuyển đổi nhóm lớp hiển thị tên lớp, mã lớp, tên giảng viên và số lượng thành viên.
   - Không còn hiển thị thông điệp trống của học viên.
   - Trạng thái: **ĐẠT (PASSED)**

5. **Bộ chọn Năm học Động (Academic Year):**
   - API `GET /api/v1/academic-years` trả về danh sách 9 năm học từ 2023-2024 đến 2031-2032.
   - Dashboard và Desktop Workspace Bar hiển thị các năm học động, vượt qua giới hạn cứng 2028 cũ.
   - Chuyển đổi năm học cập nhật đúng các chỉ số tài chính, số lớp và buổi học tương ứng.
   - Trạng thái: **ĐẠT (PASSED)**

6. **Voice AI & Cuộc gọi Thời gian thực:**
   - Mở modal Voice AI Call.
   - Hệ thống không bị đơ ở `00:00 • Đang kết nối...`.
   - Fallback Timer tự động kích hoạt chế độ lắng nghe (`LISTENING`), nhận dạng giọng nói từ microphone.
   - Trạng thái: **ĐẠT (PASSED)**

---

## 2. KẾT LUẬN NGHIỆM THU
Toàn bộ hệ thống Backend, Frontend, Cơ sở dữ liệu và AI Platform của dự án CH Academy đã được củng cố toàn diện, khắc phục triệt để mọi lỗi kiến trúc và nghiệp vụ, sẵn sàng cho vận hành thực tế.
