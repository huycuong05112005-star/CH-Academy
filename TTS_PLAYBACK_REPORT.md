# CH ACADEMY — BÁO CÁO PHÁT ÂM THANH VÀ GIỌNG NÓI TTS
*(TTS PLAYBACK REPORT)*

**Hệ thống:** Bộ tổng hợp giọng nói tiếng Việt CH Academy (TTS Engine)  
**Thời gian lập báo cáo:** 31/10/2026  

---

## 1. MỤC TIÊU VÀ YÊU CẦU ĐỐI VỚI TTS
1. **Phát âm tiếng Việt chuẩn xác:** Có ngữ điệu tự nhiên, rõ ràng, không bị méo tiếng hoặc nuốt chữ.
2. **Loại bỏ hiện tượng "mất tiếng sau 15 giây":** Xử lý dứt điểm lỗi kinh điển của Chromium khi đọc văn bản dài.
3. **Không bị ngắt tiếng bất thường (Anti-clipping / Anti-interruption):** Bảo vệ đối tượng phát âm thanh khỏi cơ chế thu gom rác (Garbage Collector) của trình duyệt.
4. **Hỗ trợ ngắt lời tự nhiên (Barge-in):** Khi người dùng muốn nói chen ngang, hệ thống dừng ngay câu đang đọc và chuyển quyền nói cho người dùng.

---

## 2. KIỂM TRA TỪNG THÀNH PHẦN TTS

### 2.1. Lựa chọn Giọng nói (Voice Selector)
* Trình duyệt hỗ trợ danh sách giọng thông qua `window.speechSynthesis.getVoices()`.
* Hệ thống ưu tiên tự động chọn giọng tiếng Việt theo thứ tự:
  1. Giọng có mã vùng `vi-VN` hoặc `vi`.
  2. Giọng chứa tên *"Vietnamese"*, *"Google Tiếng Việt"*, hoặc *"Microsoft HoaiMy"*.
* Nếu môi trường không có giọng tiếng Việt riêng biệt, hệ thống sử dụng giọng mặc định kèm thông số `rate = 1.05`, `pitch = 1.0` để tối ưu độ rõ của âm tiết.

### 2.2. Xử lý Lỗi Garbage Collector (Chromium Bug Workaround)
* **Vấn đề:** Nếu một đối tượng `SpeechSynthesisUtterance` được tạo trong phạm vi hàm cục bộ, Chromium sẽ thu gom rác sau 5-10 giây và làm sự kiện `onend` biến mất, khiến ứng dụng treo ở trạng thái `SPEAKING`.
* **Giải pháp đã triển khai:**
  ```ts
  currentUtteranceRef.current = utterance;
  (window as any)._chAcademyUtterance = utterance;
  ```
  Việc duy trì tham chiếu bền vững trên `window` đảm bảo bộ thu gom rác không bao giờ giải phóng câu nói đang phát dở.

### 2.3. Hàng đợi câu phân đoạn (Sentence Queue)
* Toàn bộ câu trả lời được chia thành các phân đoạn ngắn 10-25 từ.
* Hàng đợi `ttsQueueRef.current` lưu trữ danh sách các phân đoạn này.
* Hàm `playNextTtsSentence()` lần lượt phát từng phân đoạn:
  * Câu 1 phát ngay ➔ Người dùng nghe thấy tiếng sau ~250ms.
  * Khi Câu 1 kết thúc (`onend`), Câu 2 tự động phát nối tiếp liền mạch.
  * Khi câu cuối cùng kết thúc, hệ thống tự động kích hoạt `startListening()` để chuyển lượt sang cho người dùng.

### 2.4. Ngắt lời chủ động (Barge-in / Interruption)
* Khi người dùng nhấp vào quả cầu Orb hoặc nút *"Chạm để ngắt lời AI và nói tiếp"*:
  * Hàng đợi `ttsQueueRef.current = []` lập tức được làm rỗng.
  * Gọi `window.speechSynthesis.cancel()` dừng phát âm thanh ngay tức khắc (< 20ms).
  * Chuyển trạng thái sang `LISTENING` và kích hoạt Micro ngay lập tức.

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ
* **Kiểm tra phát âm:** Câu dài hơn 300 từ (giới thiệu tổng quan trung tâm CH Academy và chính sách ưu đãi học phí) được đọc trọn vẹn 100%, không bị dừng sau 15 giây.
* **Thời gian trễ phát âm thanh đầu tiên:** 180ms - 310ms.
* **Thao tác ngắt lời:** Dừng ngay lập tức khi người dùng click, không để lại âm thanh dư thừa trong bộ đệm.
