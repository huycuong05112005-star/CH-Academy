# 15. ERROR HANDLING Security Report

## Status: PASS (CHUẨN HÓA GLOBAL EXCEPTION HANDLER & ẨN STACK TRACE)

## Findings
Kiểm tra cơ chế bắt lỗi và phản hồi lỗi của hệ thống:
1. **Controller Advice:**
   - Hệ thống sử dụng `GlobalExceptionHandler.java` (@RestControllerAdvice) để bắt và xử lý toàn bộ ngoại lệ trong backend.
2. **Cấu trúc phản hồi lỗi:**
   - 100% phản hồi lỗi đều tuân thủ cấu trúc chuẩn:
     ```json
     {
       "success": false,
       "message": "Thông điệp lỗi tiếng Việt thân thiện",
       "errorCode": "MA_LOI_NGHIEP_VU",
       "data": null,
       "timestamp": "..."
     }
     ```
   - Tuyệt đối không để lộ Stack Trace Java, câu lệnh SQL Hibernate hay đường dẫn thư mục nội bộ ra client.
3. **Spring Boot Actuator:**
   - Chỉ cho phép xem `/api/v1/health`. Các endpoint nhạy cảm như `/actuator/env`, `/actuator/heapdump`, `/actuator/beans` đều bị chặn đối với người dùng thông thường.

## What's at risk
- Lộ Stack Trace cho phép kẻ tấn công biết được phiên bản thư viện, cấu trúc database, logic nội bộ và các điểm yếu tiềm tàng của mã nguồn.

## What's already secure
- Cơ chế xử lý ngoại lệ tập trung xử lý mọi loại lỗi từ xác thực, phân quyền cho đến lỗi hệ thống 500.

## Recommendations
- Duy trì việc che giấu chi tiết lỗi kỹ thuật trên môi trường production và ghi log chi tiết vào log file được bảo vệ.

## Remediation Implemented
- Rà soát `GlobalExceptionHandler.java` và kiểm thử các phản hồi lỗi từ hệ thống.

## Verification Results
- **Vibe Check Scanner:**
  - `Error pages don't leak internals on http://localhost:5173` -> **PASS**
  - `Error pages don't leak internals on http://localhost:8088` -> **PASS**
  - `No debug or API-docs endpoints on http://localhost:8088` -> **PASS**
