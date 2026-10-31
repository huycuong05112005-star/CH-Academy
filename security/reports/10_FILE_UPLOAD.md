# BÁO CÁO BẢO MẬT: 10. AN TOÀN TẢI TỆP TIN VÀ XÁC THỰC MAGIC BYTES (FILE UPLOAD)

**Dự án:** CH Academy  
**Phân loại rủi ro:** P1 - High (CWE-434 / CWE-116)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A04:2021 – Insecure Design

---

## 1. VẤN ĐỀ TRƯỚC KHI GIA CỐ
- `FileStorageService.java` chỉ kiểm tra đuôi mở rộng file (`extension`) mà chưa kiểm tra chữ ký định dạng thực sự của tệp tin (`magic bytes`).
- Kẻ tấn công có thể đổi đuôi file mã độc (.exe, .sh, .jsp) thành `.png` hoặc `.pdf` để tải lên máy chủ.

## 2. BIỆN PHÁP KHẮC PHỤC TRIỆT ĐỂ
- Bổ sung phương thức `validateMagicBytes(MultipartFile file, String extension)` trong `FileStorageService.java`:
  - **PDF:** Bắt buộc bắt đầu bằng `%PDF` (`0x25, 0x50, 0x44, 0x46`).
  - **PNG:** Bắt buộc bắt đầu bằng `0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A`.
  - **JPEG/JPG:** Bắt buộc bắt đầu bằng `0xFF, 0xD8, 0xFF`.
  - **GIF:** Bắt buộc bắt đầu bằng `GIF87a` hoặc `GIF89a`.
  - **ZIP & Tài liệu Office (DOCX, XLSX, PPTX):** Bắt buộc bắt đầu bằng `0x50, 0x4B` (PK header).
- Tệp tin không trùng khớp nội dung byte sẽ bị từ chối ngay lập tức với lỗi `BadRequestException`.
- Đổi tên tệp ngẫu nhiên bằng `UUID` kết hợp chuẩn hóa tên an toàn regex `[^a-zA-Z0-9.\-_]`, ngăn chặn việc thực thi tệp tin trực tiếp.

## 3. KẾT QUẢ
- Trạng thái: **ĐÃ GIA CỐ VÀ KIỂM THỬ THÀNH CÔNG (PASS)**.
