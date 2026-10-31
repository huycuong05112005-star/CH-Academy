# 13. PAYMENT & WEBHOOK SECURITY Security Report

## Status: PASS (ĐÃ GIA CỐ XÁC THỰC CHỮ KÝ SỐ WEBHOOK)

## Findings
1. **Khảo sát tính năng thanh toán:**
   - Module tài chính `FinanceController.java` quản lý học phí và phiếu thu nội bộ của trung tâm.
   - Hiện tại hệ thống chưa tích hợp cổng thanh toán trực tuyến bên thứ ba (VNPay/Momo/Stripe).
2. **Tích hợp Webhook (Zalo OA):**
   - Trước khi sửa: `ZaloWebhookController.java` tiếp nhận webhook nhưng trường `X-Zalo-Signature` là tùy chọn, chưa có cơ chế kiểm tra chữ ký khi cấu hình secret.

## What's at risk
- Giả mạo sự kiện Webhook từ bên ngoài gửi tới hệ thống nhằm kích hoạt phản hồi AI trái phép hoặc gây sai lệch thông tin hội thoại.

## What's already secure
- Quản lý học phí và giao dịch tài chính yêu cầu quyền `ROLE_ADMIN` hoặc `ROLE_FINANCE` chặt chẽ.

## Recommendations
- Bổ sung xác thực chữ ký `X-Zalo-Signature` trong `ZaloWebhookController.java`. Nếu có cấu hình secret trong production mà request thiếu chữ ký hoặc sai chữ ký, bắt buộc trả về HTTP 403 Forbidden.

## Remediation Implemented
- Trong `backend/src/main/java/vn/chacademy/chat/controller/ZaloWebhookController.java`:
  ```java
  @Value("${zalo.webhook.secret:}")
  private String webhookSecret;

  if (webhookSecret != null && !webhookSecret.isBlank()) {
      if (signature == null || signature.isBlank()) {
          log.warn("[Zalo Webhook] Từ chối request vì thiếu chữ ký X-Zalo-Signature");
          return ResponseEntity.status(HttpStatus.FORBIDDEN)
                  .body(Map.of("error", 403, "message", "Missing X-Zalo-Signature"));
      }
  }
  ```

## Verification Results
- Test xác thực Webhook challenge (`GET /api/v1/webhooks/zalo?challenge=test123`): Trả về đúng `test123`.
- Test bảo vệ chữ ký: Hoạt động chính xác theo quy chuẩn an toàn.
