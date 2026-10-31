# CH ACADEMY — BÁO CÁO NGUYÊN NHÂN GỐC LỖI REAL-TIME VOICE AI (VOICE AI ROOT CAUSE)

**Dự án:** CH Academy — Real-Time Voice AI Rebuild  
**Tập tin tài liệu:** `VOICE_AI_ROOT_CAUSE.md`  
**Ngày thực hiện:** 31/10/2026  
**Chuyên môn:** Senior Voice AI Engineer & Audio Pipeline Specialist  

---

## 1. Tóm tắt 4 vấn đề nghiêm trọng trước khi khắc phục

Người dùng phản ánh:
1. AI đọc chậm, ngập ngừng, giật cục.
2. STT nhận dạng thiếu nội dung, ngắt câu giữa chừng.
3. Hội thoại chỉ chạy được đúng một lượt đầu tiên rồi dừng lại.
4. Giao diện có lúc bị kẹt ở trạng thái *"Đang kết nối..."* hoặc không ngắt được tiếng AI khi người dùng muốn nói.

---

## 2. Phân tích nguyên nhân kỹ thuật chi tiết

### 2.1. Giọng đọc AI bị ngập ngừng, giật cục (Choppy TTS Stutter)
- **Nguyên nhân 1 (Tách câu vi mô):** Cơ chế chia câu cũ tách dựa trên tất cả các ký tự dấu câu `[,.;:!?]`. Những vế câu tiếng Việt chỉ có 2-4 từ (VD: *"Chào bạn,"*, *"Theo tôi,"*, *"Thì hiện tại đơn,"*) bị tách thành các câu độc lập.
- **Nguyên nhân 2 (Chromium SpeechSynthesis Utterance Startup Lag):** Mỗi lần gọi `window.speechSynthesis.speak(utterance)`, trình duyệt mất từ 180ms đến 350ms để khởi động bộ giải mã âm thanh native. Việc nối tiếp hàng chục utterance quá ngắn gây ra khoảng lặng 300ms giữa từng cụm từ, tạo cảm giác AI bị cà lăm, ngập ngừng.
- **Nguyên nhân 3 (Garbage Collection Bug trong Chromium):** Trình duyệt Chrome có một lỗi kinh niên: nếu đối tượng `SpeechSynthesisUtterance` không được lưu giữ tham chiếu cứng trên biến toàn cục (`window`), tiến trình dọn rác (GC) của trình duyệt sẽ hủy đối tượng giữa chừng, khiến âm thanh bị tắt đột ngột mà không phát ra sự kiện `onend`.

### 2.2. STT bị ngắt sớm, nhận dạng thiếu chữ (Aggressive Silence Endpointing)
- `AiVoiceCallModal` cũ thiết lập `silenceTimerRef` là **900ms** và đặt `recognition.continuous = false`.
- Trong giao tiếp tiếng Việt tự nhiên, học viên thường có khoảng ngắt hơi hoặc suy nghĩ giữa hai vế câu từ 1.0 đến 1.5 giây (VD: *"Tôi muốn hỏi về... (nghỉ 1.1s) ...thì hiện tại hoàn thành"*). Với ngưỡng 900ms, bộ nhận diện ngắt ngang ngay lập tức và chỉ gửi đi vế đầu, bỏ sót toàn bộ câu hỏi chính.

### 2.3. Hội thoại chỉ hoạt động được đúng 1 lượt (Single Turn Bug)
- Khi người dùng gửi câu nói đầu tiên, API trả về `res.data.conversationId`. Tuy nhiên, trong component `AiVoiceCallModal.tsx`:
  ```typescript
  // CODE CŨ:
  const res = await aiChatApi.ask({
    question: clean,
    portal,
    conversationId: conversationId || undefined // CHỈ DÙNG PROP BAN ĐẦU, KHÔNG CẬP NHẬT TỪ RESPONSE!
  });
  ```
- Component không lưu lại `res.data.conversationId` vào state hoặc ref. Ở lượt nói thứ 2, component tiếp tục gửi `conversationId: undefined`, khiến Backend tạo ra một phiên hội thoại hoàn toàn mới không có ngữ cảnh của lượt trước.
- Đồng thời, ở tầng Backend (`GenAiChatService`), phương thức gọi LLM OpenRouter trước đây chỉ truyền câu hỏi hiện tại mà không kèm theo lịch sử tin nhắn gần nhất (`history`), khiến AI không có trí nhớ hội thoại.

### 2.4. Thiếu cơ chế Tự động Ngắt lời (Auto Barge-in)
- Khi AI đang phát âm, micro không được phân tích năng lượng âm thanh thời gian thực để phát hiện tiếng nói của người dùng. Học viên phải tìm nút bấm bằng tay để ngắt, làm mất đi tính tự nhiên của một cuộc đàm thoại hai chiều.

### 2.5. Hiện tượng treo ở trạng thái "Đang kết nối..."
- Khi mở modal, hệ thống chờ đợi sự kiện `utterance.onstart` để đổi trạng thái sang `SPEAKING`. Trên một số trình duyệt (khi danh sách giọng nói `window.speechSynthesis.getVoices()` chưa tải xong trong lần đầu mở trang), sự kiện `onstart` không kích hoạt kịp thời, khiến trạng thái giữ nguyên là `CONNECTING` kèm đồng hồ đếm 00:00.
