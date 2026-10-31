# BÁO CÁO BẢO MẬT: 11. PHÒNG CHỐNG TRUY CẬP THƯ MỤC TRÁI PHÉP (PATH TRAVERSAL)

**Dự án:** CH Academy  
**Phân loại rủi ro:** P1 - High (CWE-22)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A01:2021 – Broken Access Control

---

## 1. VẤN ĐỀ PHÂN TÍCH
- Tại `FileStorageService.loadFileAsResource(filename)`: Cần đảm bảo kẻ tấn công không thể sử dụng kỹ thuật thoát thư mục `../../../../etc/passwd` hoặc `..\..\Windows\win.ini`.

## 2. BIỆN PHÁP GIA CỐ ĐÃ TRIỂN KHAI
- Trong `FileStorageService.java`:
  ```java
  if (filename == null || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
      throw new BadRequestException("Tên file không hợp lệ");
  }
  Path filePath = this.fileStorageLocation.resolve(filename).normalize();
  if (!filePath.startsWith(this.fileStorageLocation)) {
      throw new BadRequestException("Truy cập file ngoài phạm vi lưu trữ bị từ chối");
  }
  ```
- Kiểm tra tính hợp lệ ở cả 2 đầu: Chuẩn hóa đường dẫn (`normalize()`) và xác nhận tiền tố thư mục gốc (`startsWith(this.fileStorageLocation)`).

## 3. KẾT QUẢ
- Trạng thái: **AN TOÀN TUYỆT ĐỐI (PASS)**.
