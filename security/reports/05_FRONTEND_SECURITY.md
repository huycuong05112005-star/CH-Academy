# 05. FRONTEND SECURITY Security Report

## Status: PASS (ĐÃ TẮT SOURCE MAPS & BẢO VỆ MÔI TRƯỜNG BUILD)

## Findings
1. **Source Maps Exposure:**
   - Trong môi trường phát triển (Dev Server), Vite bật source maps phục vụ debug.
   - Trước khi sửa: Cấu hình `vite.config.ts` chưa tường minh tắt source map cho production build, có nguy cơ để lộ toàn bộ mã nguồn TypeScript gốc khi build triển khai.
2. **Kiểm tra Secret Client-side:**
   - Kiểm tra các biến `VITE_*` trong `frontend/.env`: Chỉ chứa `VITE_API_BASE_URL`, không chứa bất kỳ secret key, private key hay password nào.
3. **DOM Injection & XSS:**
   - Frontend viết bằng React 19, mặc định tự động escape các biến chuỗi khi render JSX.
   - Không lạm dụng `dangerouslySetInnerHTML`.

## What's at risk
- Nếu source map bị lộ trên production, bất kỳ ai cũng có thể phục hồi lại 100% cấu trúc thư mục, code logic, tên hàm và comment nội bộ của dự án.

## What's already secure
- Quản lý trạng thái xác thực bằng React Context + LocalStorage token an toàn.
- Mọi thao tác gọi mô hình AI đều được điều hướng qua proxy backend `/api/v1/chat/ai/**`.

## Recommendations
- Cấu hình `build.sourcemap: false` tường minh trong `vite.config.ts`.
- Bổ sung Security Headers cho static server của Vite.

## Remediation Implemented
- Trong `frontend/vite.config.ts`:
  ```ts
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200
  },
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
  ```

## Verification Results
- Chạy `npm run build`: Quá trình đóng gói sinh ra thư mục `dist/` hoàn toàn sạch, không có tệp `.map` nào.
- Vibe Check Scanner: Quét kiểm tra tệp tĩnh `PASS`.
