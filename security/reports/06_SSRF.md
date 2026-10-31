# 06. SSRF (SERVER-SIDE REQUEST FORGERY) Security Report

## Status: PASS (KHÔNG CÓ TÍNH NĂNG FETCH URL ĐẦU VÀO TỰ DO)

## Findings
Đã kiểm tra toàn bộ các điểm sử dụng `RestTemplate`, `WebClient`, `HttpClient`, `URL`, `URLConnection` trong backend Java:
1. **Dịch vụ gọi ra ngoài:**
   - `GenAiChatService.java`: Gọi API suy luận mô hình tới OpenAI / OpenRouter / Gemini.
   - `ZaloWebhookController.java`: Tiếp nhận webhook và gửi tin nhắn phản hồi qua Zalo OA SDK.
2. **Đánh giá nguồn URL:**
   - Toàn bộ các địa chỉ endpoint mục tiêu đều được đọc từ cấu hình hệ thống an toàn (`application.yml` / System Environment), hoàn toàn **không nhận URL do người dùng truyền vào từ request query hay request body**.
   - Hệ thống không có tính năng cho phép học viên hay người dùng nhập URL website bên ngoài để máy chủ tự động tải về (remote fetch, image preview URL, webhook tester).

## What's at risk
- Nếu có tính năng fetch URL tự do không kiểm soát, kẻ tấn công có thể điều hướng máy chủ quét mạng nội bộ (`http://127.0.0.1:5432`, `http://169.254.169.254`) để đánh cắp metadata hoặc xâm nhập dịch vụ nội bộ.

## What's already secure
- Toàn bộ luồng kết nối ngoại vi đều có đích đến cố định và được xác thực qua API Key/Token lưu trong cấu hình backend.

## Recommendations
- Tiếp tục duy trì nguyên tắc không mở tính năng nhận URL ngoài tùy ý từ người dùng. Nếu tương lai cần tính năng đọc website (web scraping cho AI), bắt buộc áp dụng IP whitelist và chặn toàn bộ dải IP private (RFC 1918) và link-local.

## Remediation Implemented
- Ghi nhận trạng thái an toàn theo thiết kế (Secure by Design).

## Verification Results
- Audit mã nguồn 33 controllers xác nhận: 0 endpoint nhận tham số URL để máy chủ truy xuất từ xa.
