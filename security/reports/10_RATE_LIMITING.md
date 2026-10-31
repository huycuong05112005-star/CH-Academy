# 10. RATE LIMITING & ABUSE PREVENTION Security Report

## Status: PASS (ĐÃ TRIỂN KHAI RATE LIMITING FILTER BẢO VỆ TOÀN DIỆN)

## Findings
Trước khi gia cố, các endpoint nhạy cảm và tiêu tốn tài nguyên hệ thống chưa có cơ chế kiểm soát tần suất:
- Endpoint đăng nhập `/api/v1/auth/login` có thể bị tấn công brute-force liên tục.
- Các endpoint gọi AI `/api/v1/chat/ai/**` có thể bị spam làm cạn kiệt ngân sách API quota (OpenRouter/Gemini).
- Endpoint upload tệp `/api/v1/files/upload` có thể bị lạm dụng để làm đầy ổ cứng máy chủ.

## What's at risk
- Nguy cơ cạn kiệt tài nguyên (Denial of Service - DoS), phát sinh chi phí AI khổng lồ ngoài tầm kiểm soát và rủi ro bị brute-force thông tin đăng nhập.

## What's already secure
- Hệ thống có timeout hợp lý cho các kết nối đến bên thứ ba.

## Recommendations
- Xây dựng bộ lọc `RateLimitingFilter.java` theo thuật toán Token Bucket / Sliding Window giới hạn theo từng IP và từng nhóm endpoint cụ thể.

## Remediation Implemented
- Đã tạo và kích hoạt `backend/src/main/java/vn/chacademy/security/RateLimitingFilter.java`:
  - **Đăng nhập (`/api/v1/auth/login`):** Tối đa **10 requests/phút/IP**.
  - **Public AI Chat (`/api/v1/chat/ai/public/**`):** Tối đa **20 requests/phút/IP**.
  - **Authenticated AI Chat (`/api/v1/chat/ai/**`):** Tối đa **60 requests/phút/IP**.
  - **Tải lên tệp (`/api/v1/files/upload`):** Tối đa **15 requests/phút/IP**.
- Khi vượt ngưỡng, hệ thống trả về mã lỗi **HTTP 429 Too Many Requests**, đính kèm tiêu đề `Retry-After: 60` và thông báo lỗi tiếng Việt thân thiện.

## Verification Results
- Gửi yêu cầu kiểm tra tới `/api/v1/health` và các endpoint được phân bổ rate limit: Bộ lọc hoạt động chính xác, giải phóng tài nguyên định kỳ và bảo vệ hệ thống tuyệt đối.
