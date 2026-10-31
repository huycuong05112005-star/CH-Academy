# CH ACADEMY — BÁO CÁO PHÂN TÍCH NGUYÊN NHÂN GỐC VOICE AI
*(VOICE ROOT CAUSE ANALYSIS)*

**Hệ thống:** CH Academy Voice AI Runtime & Client Audio Pipeline  
**Ngày thực hiện:** 31/10/2026  
**Kỹ sư thực hiện:** Senior Voice AI Engineer & Real-time Audio Architect  

---

## 1. TỔNG QUAN HIỆN TƯỢNG TRƯỚC KHI KHẮC PHỤC
Người dùng gặp 5 triệu chứng nghiêm trọng:
1. **AI không nghe được hoặc không nhận dạng được giọng nói:** Người dùng nói vào Micro nhưng hệ thống không chuyển đổi thành chữ hoặc nhận diện chập chờn.
2. **Người dùng nói nhưng AI không phản hồi:** Sau khi nói xong một câu hoàn chỉnh, modal tiếp tục ở trạng thái chờ hoặc quay về lắng nghe mà không có bất kỳ câu trả lời nào từ AI.
3. **Hiện tượng tự ngắt tiếng (Self-Interruption / Barge-in lặp):** Khi AI bắt đầu phát âm thanh chào hoặc trả lời, loa vừa phát ra được 100-200ms thì lập tức bị ngắt tiếng đột ngột.
4. **Không thể duy trì hội thoại liên tục:** Sau mỗi câu hỏi/trả lời, người dùng phải bấm nút hoặc tắt mở lại modal mới có thể nói tiếp.
5. **Độ trễ cao và nguy cơ treo luồng:** Các cuộc gọi LLM không có timeout chặt chẽ dẫn đến việc nếu nhà cung cấp mạng hoặc dịch vụ ngoài trễ, toàn bộ tiến trình hội thoại bị đóng băng.

---

## 2. NGUYÊN NHÂN GỐC TỪNG CÔNG ĐOẠN (ROOT CAUSE ANALYSIS)

### 2.1. Lỗi tại Công đoạn STT Lifecycle & Endpointing (Frontend)
* **Vị trí file:** `frontend/src/components/chat/AiVoiceCallModal.tsx`
* **Cơ chế lỗi:**
  * Thuộc tính `recognition.continuous` được cấu hình là `false`. Trong trình duyệt Chromium (Google Chrome, Microsoft Edge, Opera), khi `continuous = false`, trình duyệt sẽ kích hoạt sự kiện `onend` ngay khi người dùng ngừng nói khoảng 500-800ms.
  * Trong mã nguồn cũ, logic gửi câu hỏi lại nằm bên trong `recognition.onresult`:
    ```ts
    if (finalStr.trim()) {
      processUserSpeech(finalStr.trim());
    }
    ```
  * **Tại sao không nghe được?** Nếu trình duyệt trả về transcript dưới dạng `interim` (chưa chốt cờ `isFinal = true`) trước khi sự kiện `onend` kích hoạt, biến `finalStr` vẫn là chuỗi rỗng. Khi người dùng dứt câu và sự kiện `onend` kích hoạt, câu nói của người dùng nằm trong `interim` bị bỏ rơi hoàn toàn và không bao giờ được gửi tới backend!
  * **Xung đột luồng gọi:** Khi `processUserSpeech` được gọi, `callStatus` được cập nhật thành `PROCESSING` thông qua React State (vốn bất đồng bộ). Đúng lúc đó `onend` kích hoạt; do stale closure, `callStatus` trong hàm callback của `onend` vẫn là giá trị cũ khác `PROCESSING`, dẫn đến việc `onend` lại tự động kích hoạt `recognition.start()` ngay lập tức. Hai tiến trình STT và AI LLM chạy đè lên nhau gây xung đột tài nguyên audio của hệ điều hành.

### 2.2. Lỗi VAD Tự Ngắt Lời (Echo Loop / False Barge-in)
* **Vị trí file:** `frontend/src/components/chat/AiVoiceCallModal.tsx`
* **Cơ chế lỗi:**
  * Hệ thống VAD trước đây liên tục đo mức âm lượng trung bình (`avg`) từ `analyser.getByteFrequencyData(dataArray)` ngay cả trong khi AI đang phát âm thanh (`callStatus === 'SPEAKING'`).
  * Âm thanh từ loa của máy tính/thiết bị người dùng phát ra ngoài lập tức được Micro thu lại. Ngưỡng âm lượng `avg > 25` bị vượt qua, kích hoạt hàm `interruptAi()`.
  * **Hậu quả:** AI vừa nói được 1 từ thì chính tiếng của AI qua loa làm VAD hiểu nhầm là người dùng đang ngắt lời, tự động hủy bỏ phát âm thanh (`window.speechSynthesis.cancel()`), tạo ra hiện tượng "AI không phản hồi hoặc vừa cất tiếng là tắt lịm".

### 2.3. Lỗi Garbage Collection của SpeechSynthesis trong Chromium
* **Vị trí file:** `frontend/src/components/chat/AiVoiceCallModal.tsx`
* **Cơ chế lỗi:**
  * Đối tượng `const utterance = new SpeechSynthesisUtterance(cleanText)` được tạo cục bộ bên trong hàm `speakAiResponse`.
  * Trong Google Chrome trên Windows, nếu đối tượng `SpeechSynthesisUtterance` không được lưu vào một biến tham chiếu toàn cục (`window`), bộ thu gom rác (Garbage Collector) của V8 engine sẽ tự động giải phóng đối tượng này sau 5-10 giây đang phát.
  * Khi bị thu gom rác, sự kiện `utterance.onend` **không bao giờ được bắn ra**. Kết quả là ứng dụng bị kẹt mãi mãi ở trạng thái `SPEAKING`, không bao giờ chuyển sang `LISTENING` để người dùng nói câu tiếp theo.

### 2.4. Khối văn bản TTS quá dài gây dừng phát âm (Chromium 15s Bug)
* **Cơ chế lỗi:** Trình duyệt Chromium có lỗi cố hữu (Chromium Issue 679437): nếu một chuỗi văn bản dài trên 200 ký tự được gửi vào `speechSynthesis.speak()`, hệ thống âm thanh nội bộ của trình duyệt sẽ tự động pause sau 15 giây mà không bắn lỗi.
* **Giải pháp tham chiếu từ Nexva:** Nexva sử dụng module `speech-split.ts` để phân cắt câu thành các phân đoạn tự nhiên (theo dấu câu tiếng Việt `. , ! ? …`) và nạp vào hàng đợi phát nối tiếp (Queue). CH Academy trước đây đã truyền toàn bộ đoạn văn bản hàng trăm chữ vào một lần gọi duy nhất.

### 2.5. Lỗi thiếu Timeout trong RestTemplate Backend
* **Vị trí file:** `backend/src/main/java/vn/chacademy/chat/service/GenAiChatService.java`
* **Cơ chế lỗi:**
  * `RestTemplate restTemplate = new RestTemplate();` được khởi tạo không có cấu hình `connectTimeout` và `readTimeout`.
  * Mặc định trong Java socket, timeout là vô hạn (hoặc phụ thuộc vào TCP keep-alive 60-120 giây). Khi mạng chậm hoặc dịch vụ LLM ngoài gặp quá tải, thread xử lý của Tomcat bị treo, người dùng đợi mãi không thấy phản hồi và cảm thấy hệ thống bị đơ.

---

## 3. BẢNG TỔNG HỢP NGUYÊN NHÂN VÀ GIẢI PHÁP ĐÃ ÁP DỤNG

| Công đoạn | Nguyên nhân gốc | Giải pháp kỹ thuật đã áp dụng | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Microphone & Capture** | Không xác minh được tín hiệu dB thực tế, chỉ kiểm tra getUserMedia() | Tính toán RMS và Decibels thực tế (-60dB..0dB), hiển thị VU Meter và tên thiết bị input | Đã khắc phục triệt để |
| **STT Turn & Endpointing** | `onresult` chỉ gửi khi có `isFinal`, bỏ rơi câu nói trong `interim` | Lưu `final` + `interim`; khi `onend` hoặc sau 900ms ngừng nói thì tự động commit câu | Đã khắc phục triệt để |
| **Barge-in / VAD** | Micro thu lại tiếng từ Loa gây tự ngắt tiếng của chính AI | Tạm dừng lắng nghe khi AI đang phát âm; chỉ cho phép ngắt lời qua thao tác chủ động của người dùng | Đã khắc phục triệt để |
| **TTS Queue & Chromium Bug** | Utterance bị Garbage Collector giải phóng và nghẽn câu dài > 200 ký tự | Chia nhỏ văn bản thành các câu tiếng Việt ngắn (`splitVietnameseSentences`), phát theo hàng đợi Queue, gán tham chiếu `_chAcademyUtterance` | Đã khắc phục triệt để |
| **Continuous Turn-taking** | Sau khi AI trả lời không tự động kích hoạt lượt nghe mới | Sự kiện `onend` của câu TTS cuối cùng tự động gọi `startListening()` sau 200ms | Đã khắc phục triệt để |
| **AI Backend Latency** | Không có timeout trên HTTP client gọi LLM | Thiết lập `connectTimeout = 3000ms`, `readTimeout = 8000ms`, tự động chuyển fallback engine | Đã khắc phục triệt để |
| **Debug & Giám sát** | Thiếu công cụ chẩn đoán tín hiệu và độ trễ | Bổ sung Bảng điều khiển Debug Voice Panel hiển thị chi tiết dB, STT, AI latency, TTFA | Đã khắc phục triệt để |
