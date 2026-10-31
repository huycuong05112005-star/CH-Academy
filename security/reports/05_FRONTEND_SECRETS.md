# BÁO CÁO BẢO MẬT: 05. BẢO VỆ MÃ NGUỒN FRONTEND VÀ KHÓA BÍ MẬT CLIENT

**Dự án:** CH Academy  
**Phân loại rủi ro:** P1 - High (CWE-540 / CWE-200)  
**Tiêu chuẩn đối chiếu:** Vibe Check Category 5

---

## 1. VẤN ĐỀ TRƯỚC KHI GIA CỐ
- Cấu hình `vite.config.ts` chưa tường minh tắt Source Maps trong bản build production, có nguy cơ để lộ toàn bộ cấu trúc code TypeScript, tên biến và comment nội bộ khi triển khai thực tế.
- Kiểm tra các biến môi trường `VITE_*` trên client.

## 2. BIỆN PHÁP KHẮC PHỤC ĐÃ TRIỂN KHAI
- Trong `frontend/vite.config.ts`, cấu hình:
  ```ts
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1200
  }
  ```
- Kiểm tra toàn bộ mã nguồn frontend: Không chứa bất kỳ Private API Key, Database Password hay JWT Secret nào trong code client. Các lệnh gọi AI đều đi qua Backend Proxy `/api/v1/chat/ai/**`.

## 3. KẾT QUẢ
- Bản build production (`npm run build`) tạo gói `dist/` sạch sẽ, không sinh bất kỳ tệp `.map` nào.
- Trạng thái: **AN TOÀN (PASS)**.
