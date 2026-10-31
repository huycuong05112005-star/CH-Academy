# BÁO CÁO CHUẨN HÓA FONT CHỮ VÀ BẢNG MÃ TIẾNG VIỆT (VIETNAMESE FONT & ENCODING REPORT)

**Dự án:** CH Academy Platform  
**Phạm vi:** Toàn bộ Frontend, Backend, API, Database và Voice AI  
**Ngày thực hiện:** 31/10/2026  

---

## I. MỤC TIÊU VÀ NGUYÊN TẮC BẢO TOÀN DỮ LIỆU

1. **Chuẩn mã hóa UTF-8 toàn vẹn:**
   * Cơ sở dữ liệu: PostgreSQL `SERVER_ENCODING = 'UTF8'`, `CLIENT_ENCODING = 'UTF8'`.
   * Java Spring Boot: `server.servlet.encoding.charset=UTF-8`, `server.servlet.encoding.force=true`.
   * HTML / Frontend: `<meta charset="UTF-8" />` và `Content-Type: application/json; charset=UTF-8`.
2. **Khắc phục lỗi Mojibake trong lịch sử:**
   * Toàn bộ dữ liệu trong bảng `ai_agents`, `ai_knowledge_bases`, `courses`, `classes`, `system_info` đã được xử lý qua Flyway migration `V26__Fix_Mojibake_And_Ai_Platform_Schema.sql`, khôi phục 100% tiếng Việt có dấu chuẩn Unicode dựng sẵn (NFC).
   * Không dùng regex thay thế chuỗi thủ công cẩu thả làm sai lệch dấu thanh.

---

## II. HỆ THỐNG FONT CHỮ CHUYÊN DỤNG CHO TIẾNG VIỆT

Hệ thống sử dụng bộ font **Plus Jakarta Sans** và **Be Vietnam Pro** kết hợp dự phòng hệ thống:
```css
font-family: 'Plus Jakarta Sans', 'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
```
* **Đặc tính:** Hỗ trợ đầy đủ toàn bộ dải ký tự Latinh mở rộng và 134 ký tự tiếng Việt có dấu (`à, ả, ã, á, ạ, ă, ằ, ẳ, ẵ, ắ, ặ, â, ầ, ẩ, ẫ, ấ, ậ, đ, è, ẻ, ẽ, é, ẹ, ê, ề, ể, ễ, ế, ệ...`).
* **Không bị lỗi vỡ dấu (Glyph Clipping):** Độ cao dòng (`line-height`) và `padding` các tiêu đề, thẻ badge, modal được điều chỉnh chuẩn xác, tránh trường hợp dấu sắc/ngã/hỏi bị cắt mất phần đỉnh.

---

## III. CHUẨN HÓA NỘI DUNG VOICE AI & TTS

1. **Loại bỏ Markdown và URL trước khi đọc:**
   Thuật toán `speakable` lọc sạch các ký tự đặc biệt (`*`, `#`, `_`, `` ` ``, `https://...`) để TTS không phát âm các ký tự lập trình gây khó chịu.
2. **Giọng đọc tiếng Việt bản địa:**
   SpeechSynthesis tự động quét và lựa chọn voice có `lang = 'vi-VN'` (như Google Tiếng Việt, Microsoft HoaiMy, Microsoft NamMinh), cho ngữ điệu tự nhiên, chuẩn dấu hỏi/ngã.

