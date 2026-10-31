# 14. FILE UPLOAD SECURITY Security Report

## Status: PASS (ĐÃ BỔ SUNG XÁC THỰC MAGIC BYTES & CHỐNG PATH TRAVERSAL)

## Findings
1. **Kiểm tra tệp tin trước đây:**
   - `FileStorageService.java` trước đây chỉ dựa vào đuôi mở rộng file (`extension`) để kiểm tra danh sách cho phép (PDF, Word, Excel, ZIP, Ảnh).
   - Nguy cơ: Kẻ tấn công có thể đổi tên tệp thực thi độc hại thành `.png` hoặc `.pdf` để vượt qua kiểm tra.
2. **Đường dẫn lưu trữ:**
   - Cần đảm bảo việc lưu trữ và tải tệp không bị lợi dụng để ghi đè hoặc đọc các tệp tin ngoài thư mục upload được chỉ định.

## What's at risk
- Upload webshell (tệp tin mã độc có thể thực thi) hoặc ghi đè các tệp tin hệ thống.

## What's already secure
- Tệp tin tải lên được đổi tên bằng tiền tố `UUID` ngẫu nhiên và chuẩn hóa tên tệp loại bỏ các ký tự đặc biệt nguy hiểm.
- Giới hạn dung lượng tối đa tệp tin trong cấu hình Spring Boot (`spring.servlet.multipart.max-file-size=50MB`).

## Recommendations
- Bổ sung kiểm tra **Magic Bytes** (chữ ký byte thực tế ở đầu tệp tin) cho tất cả các định dạng phổ biến (PDF, PNG, JPEG, GIF, ZIP/Office).
- Bổ sung kiểm tra nghiêm ngặt đường dẫn tệp tin: Chuẩn hóa `normalize()` và xác nhận `startsWith(fileStorageLocation)`.

## Remediation Implemented
- Cập nhật `FileStorageService.java`:
  ```java
  private void validateMagicBytes(MultipartFile file, String extension) {
      try (InputStream is = file.getInputStream()) {
          byte[] header = new byte[8];
          int read = is.read(header);
          if (read < 4) return;

          if ("pdf".equals(extension) && (header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46)) {
              throw new BadRequestException("Nội dung file không đúng định dạng PDF hợp lệ");
          }
          // Tương tự kiểm tra PNG, JPEG, GIF, ZIP/DOCX/XLSX/PPTX
      }
  }
  ```
  Và tại `loadFileAsResource`:
  ```java
  Path filePath = this.fileStorageLocation.resolve(filename).normalize();
  if (!filePath.startsWith(this.fileStorageLocation)) {
      throw new BadRequestException("Truy cập file ngoài phạm vi lưu trữ bị từ chối");
  }
  ```

## Verification Results
- Biên dịch backend thành công và kiểm thử logic kiểm tra chữ ký tệp tin hoạt động hoàn hảo.
