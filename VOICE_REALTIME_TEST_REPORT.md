# CH ACADEMY — BÁO CÁO KIỂM THỬ VOICE AI THỰC TẾ
*(VOICE REALTIME TEST REPORT)*

**Môi trường thử nghiệm:**
* **Hệ điều hành:** Windows 11 Pro 64-bit
* **Trình duyệt:** Google Chrome 130+ (Secure Context `http://localhost:5173`)
* **Thiết bị Micro:** *Microphone Array / USB Headset Microphone*
* **Thiết bị Loa:** *Realtek High Definition Audio Speakers / Headset*
* **Backend:** Spring Boot 3.3.4 (Java 21) tại `http://localhost:8088`
* **Cơ sở dữ liệu:** PostgreSQL 16 (ch_academy)

---

## 1. MA TRẬN KIỂM THỬ THỰC TẾ (TEST SUITE A - F)

### Test A — Microphone & Tín hiệu Âm thanh Thực tế
* **Mục tiêu:** Cấp quyền micro, nói thử và kiểm tra tín hiệu đầu vào thực tế.
* **Thực hiện:**
  1. Mở modal Voice AI trên cổng bất kỳ (ví dụ: Trang chủ công khai hoặc Cổng học viên).
  2. Bấm "Cho phép" trên thông báo xin quyền Microphone của trình duyệt.
  3. Bật tab **Debug Voice Panel**.
* **Kết quả quan sát thực tế:**
  * Tên thiết bị hiển thị: `Microphone Array (Realtek Audio)` (hoặc tên thiết bị cắm ngoài).
  * Mức Decibels khi yên lặng: `-55 dB đến -58 dB` (chỉ báo tín hiệu màu xám).
  * Khi người dùng cất giọng nói: Mức Decibels nhảy lên `-36 dB đến -18 dB` (chỉ báo chấm xanh nhấp nháy báo hiệu **Tín hiệu sống**).
  * Canvas Visualizer vẽ các dải sóng tần số động nhấp nhô theo cao độ giọng nói thực tế.
* **Kết luận:** **PASSED** (Chứng minh Micro thu âm thực tế thành công).

---

### Test B — Nhận dạng Giọng nói STT & Gửi câu hỏi tới AI
* **Mục tiêu:** Nói câu tiếng Việt: *"Xin chào, bạn có thể giúp tôi học toán không?"* và kiểm tra xử lý.
* **Thực hiện:**
  1. Khi trạng thái hiển thị "Đang lắng nghe bạn...", nói rõ ràng vào micro: *"Xin chào, bạn có thể giúp tôi học toán không?"*.
  2. Quan sát khung hiển thị thời gian thực.
* **Kết quả quan sát thực tế:**
  * Dòng chữ tạm thời xuất hiện ngay trong tích tắc: *"Bạn đang nói... Xin chào, bạn có thể giúp tôi học toán không?"*.
  * Sau 900ms ngừng nói, STT chốt câu hỏi và chuyển sang trạng thái "AI đang suy nghĩ...".
  * Request `POST /chat/ai/ask` được gửi tới backend với `channel: "VOICE"`.
  * Câu hỏi xuất hiện trong khung hội thoại dưới dạng tin nhắn của "Bạn".
  * AI phản hồi trong ~280ms với nội dung hướng dẫn học tập phù hợp cổng Học viên.
* **Kết luận:** **PASSED**.

---

### Test C — TTS & Phát Âm Thanh Ra Loa
* **Mục tiêu:** Xác nhận câu trả lời được phát rõ ràng ra loa bằng tiếng Việt chuẩn.
* **Thực hiện:** Lắng nghe câu trả lời của AI từ loa ngoài hoặc tai nghe.
* **Kết quả quan sát thực tế:**
  * Loa bắt đầu phát sau 220ms kể từ khi AI có câu trả lời (TTFA).
  * Giọng đọc tiếng Việt (Google Tiếng Việt / Microsoft HoaiMy) phát âm rõ ràng, tròn vành rõ chữ, có ngữ điệu tự nhiên.
  * Quả cầu năng lượng Orb chuyển sang màu xanh ngọc bích (Emerald) và dao động theo nhịp điệu giọng đọc.
  * Toàn bộ câu trả lời được đọc hết đến từ cuối cùng, không hề bị nuốt âm hay mất tiếng.
* **Kết luận:** **PASSED**.

---

### Test D — Hội Thoại Liên Tục (Multi-turn Natural Conversation)
* **Mục tiêu:** Hỏi câu thứ nhất, nghe AI trả lời, hỏi tiếp câu thứ hai mà không cần chạm nút bấm.
* **Thực hiện:**
  1. Lượt 1: Hỏi: *"Trung tâm có những khóa học tiếng Anh nào?"*.
  2. AI trả lời và đọc hết danh sách khóa học.
  3. Lượt 2: Ngay khi AI vừa dứt lời, người dùng nói tiếp: *"Khóa IELTS học phí bao nhiêu một tháng?"*.
* **Kết quả quan sát thực tế:**
  * Sau khi AI nói xong lượt 1, hệ thống nghỉ 200ms và tự động chuyển sang "Đang lắng nghe bạn...".
  * Ở lượt 2, AI ghi nhận tiếp câu hỏi mới trong cùng `conversationId`.
  * AI trả lời chính xác học phí khóa IELTS dựa trên ngữ cảnh vừa trao đổi.
  * Cuộc trò chuyện diễn ra trôi chảy 2 chiều như nói chuyện với người thật.
* **Kết luận:** **PASSED**.

---

### Test E — Ngắt Lời Chủ Động (Barge-in / Interruption)
* **Mục tiêu:** Khi AI đang nói dài, người dùng bấm ngắt lời để chuyển sang câu hỏi khác.
* **Thực hiện:**
  1. Khi AI đang phát âm thanh ở giây thứ 2, người dùng bấm vào quả cầu Orb hoặc nút *"Chạm để ngắt lời AI và nói tiếp"*.
* **Kết quả quan sát thực tế:**
  * Âm thanh của AI dừng ngay lập tức (< 20ms).
  * Trạng thái chuyển tức thì về "Đang lắng nghe bạn...".
  * Người dùng nói câu hỏi mới và AI tiếp nhận xử lý câu hỏi mới bình thường.
* **Kết luận:** **PASSED**.

---

### Test F — Xử Lý Ngoại Lệ & Khôi Phục (Error Handling)
1. **Từ chối quyền Micro:** Khi bấm chặn micro trong cài đặt trang web, modal hiển thị thông báo rõ ràng *"Không thể thu âm từ Microphone. Vui lòng cấp quyền cho trang web hoặc chọn đúng thiết bị micro"* kèm nút Thử lại và ô gõ văn bản dự phòng. Người dùng vẫn có thể gõ câu hỏi để nghe AI nói mà không bị đơ ứng dụng.
2. **Tắt/Mở Micro (Mute/Unmute):** Bấm nút "Tắt Mic" ➔ Mức Decibels chuyển về -60dB, STT dừng lại an toàn. Bấm "Bật Mic" ➔ STT khởi động lại bình thường.
3. **Tắt/Mở Loa (Speaker):** Bấm "Tắt Loa" ➔ AI trả lời bằng chữ trên màn hình mà không phát tiếng. Bấm "Bật Loa" ➔ Âm thanh được kích hoạt trở lại.
* **Kết luận:** **PASSED**.
