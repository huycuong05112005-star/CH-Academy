# CH ACADEMY — HỆ THỐNG AN NINH THÔNG TIN TOÀN DIỆN
## Tài liệu 12: An ninh Tải lên Tệp tin và Kiểm soát Nội dung (File Upload & Content Security)

---

## 1. NGUY CƠ BẢO MẬT KHI TẢI TỆP TIN

Các tính năng nạp tài liệu giáo trình, bài tập và kho tri thức AI (PDF, DOCX, XLSX, TXT) tiềm ẩn các nguy cơ:
- Tải lên mã độc (Web Shell, thực thi file `.jsp`, `.exe`, `.sh`).
- Giả mạo phần mở rộng file (Extension spoofing) nhằm vượt qua bộ lọc client.
- Tấn công Zip-Bomb hoặc file có dung lượng khổng lồ gây cạn kiệt dung lượng đĩa (Disk Exhaustion DoS).

---

## 2. KIẾN TRÚC PHÒNG THỦ KHI TẢI TỆP TIN TẠI CH ACADEMY

1. **Bộ lọc danh sách trắng định dạng (Whitelist Extensions)**:
   - Chỉ cho phép các định dạng an toàn: `.pdf`, `.docx`, `.xlsx`, `.csv`, `.txt`, `.png`, `.jpg`.
   - Mọi tệp có phần mở rộng khả thi thực thi (`.exe`, `.jsp`, `.sh`, `.bat`, `.jar`) bị từ chối ngay lập tức.

2. **Kiểm tra Magic Bytes (MIME Type Verification)**:
   - Backend sử dụng thư viện kiểm tra cấu trúc nhị phân thực tế của tệp (Magic Bytes header), không phụ thuộc vào tên tệp do người dùng đặt.

3. **Lưu trữ ngoài thư mục Web Root**:
   - Các tệp sau khi tải lên được lưu trữ tại thư mục chuyên biệt nằm ngoài phạm vi phục vụ trực tiếp của web server.
   - Tên tệp được sinh ngẫu nhiên bằng `UUID` (VD: `550e8400-e29b-41d4-a716-446655440000.pdf`), ngăn chặn tấn công Path Traversal (`../../etc/passwd`).

4. **Giới hạn kích thước tệp (File Size Limit)**:
   - Giới hạn tối đa 20MB cho mỗi tệp tài liệu và 5MB cho ảnh đại diện, bảo vệ hệ thống trước tấn công cạn kiệt tài nguyên lưu trữ.
