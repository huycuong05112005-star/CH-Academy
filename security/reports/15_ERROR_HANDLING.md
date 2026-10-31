# BÁO CÁO BẢO MẬT: 15. XỬ LÝ LỖI TOÀN CỤC VÀ BẢO VỆ STACK TRACE (ERROR HANDLING)

**Dự án:** CH Academy  
**Phân loại rủi ro:** P2 - Medium (CWE-209)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A05:2021 – Security Misconfiguration, Vibe Check Category 15

---

## 1. ĐÁNH GIÁ CƠ CHẾ HIỆN TẠI
- Hệ thống sử dụng `GlobalExceptionHandler.java` (@RestControllerAdvice) để đón toàn bộ ngoại lệ phát sinh trong hệ thống.
- Các phản hồi lỗi tuân thủ format chuẩn `ApiResponse<T>`:
  - `success: false`
  - `message`: Thông điệp thân thiện với người dùng (tiếng Việt).
  - `errorCode`: Mã lỗi nghiệp vụ cụ thể.
  - Tuyệt đối **không hiển thị stack trace Java, câu lệnh SQL Hibernate hoặc đường dẫn file nội bộ** ra màn hình client.

## 2. KẾT QUẢ QUÉT THỰC TẾ (VIBE CHECK SCANNER)
- `Error pages don't leak internals on http://localhost:5173` -> **PASS**
- `Error pages don't leak internals on http://localhost:8088` -> **PASS**
- `No debug or API-docs endpoints on http://localhost:8088` -> **PASS**
