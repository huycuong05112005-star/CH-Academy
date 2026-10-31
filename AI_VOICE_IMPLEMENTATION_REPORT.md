# BÁO CÁO TRIỂN KHAI CUỘC GỌI GIỌNG NÓI THỜI GIAN THỰC (AI VOICE & AUDIO CALL)
**Tài liệu:** `AI_VOICE_IMPLEMENTATION_REPORT.md`  
**Ngày thực hiện:** 31/10/2026  
**Dự án:** CH Academy  

---

## 1. NGUYÊN TẮC THIẾT KẾ & TÍNH KHẢ THI
- Tuyệt đối không dùng hoạt ảnh giả lập (fake CSS animation) để giả lập giọng nói.
- Hệ thống xây dựng tính năng AI Voice tương tác thực tế 2 chiều (Real-time Full Duplex) trên nền tảng Web tiêu chuẩn của trình duyệt hiện đại (Chrome, Edge, Firefox, Safari) mà không yêu cầu cài đặt thêm plugin bên ngoài.

---

## 2. KIẾN TRÚC KỸ THUẬT & CÔNG NGHỆ ÁP DỤNG

### 2.1. Web Audio API & Visualizer Thời gian thực (Waveform Audio Visualizer)
- Sử dụng `AudioContext` kết hợp `AnalyserNode` và `navigator.mediaDevices.getUserMedia({ audio: true })`.
- Đọc mảng tần số âm thanh thực tế từ micro qua phương thức `analyser.getByteFrequencyData(dataArray)`.
- Vẽ biểu đồ sóng âm thời gian thực trên thẻ HTML5 `<canvas>` qua vòng lặp `requestAnimationFrame`:
  - 32 thanh tần số (Frequency bars) với hiệu ứng chuyển màu gradient tím - xanh (`#6366F1` đến `#A855F7`).
  - Phản ứng nhạy bén với âm lượng giọng nói thực tế của người dùng: khi nói to sóng dâng cao, khi im lặng sóng trở về trạng thái gợn nhẹ tĩnh (Idle wave).

### 2.2. Nhận dạng giọng nói tiếng Việt (Speech-to-Text — STT)
- Tích hợp `webkitSpeechRecognition` / `SpeechRecognition` với cấu hình:
  - Ngôn ngữ: `lang = 'vi-VN'`.
  - Chế độ: `continuous = true`, `interimResults = true`.
- Hiển thị phụ đề lời nói của người dùng trực tiếp trên màn hình theo thời gian thực (Live Transcription Subtitles).
- Khi người dùng dứt câu (sự kiện `result`), câu nói tự động được đóng gói gửi về API AI của backend.

### 2.3. Phát âm giọng nói tiếng Việt (Text-to-Speech — TTS)
- Sử dụng `window.speechSynthesis` với `SpeechSynthesisUtterance`.
- Tự động ưu tiên chọn các giọng đọc tiếng Việt chất lượng cao có sẵn trên hệ điều hành (`Microsoft HoaiMy`, `Google tiếng Việt`).
- Trạng thái chuyển đổi nhịp nhàng sang `SPEAKING` khi Trợ lý AI đang nói.
- Visualizer tự động chuyển sang chế độ dao động theo nhịp đọc của Trợ lý AI.

### 2.4. Tính năng Điều khiển & Trải nghiệm người dùng cao cấp
1. **Bộ đếm thời lượng cuộc gọi thực tế (Call Duration Timer):** Định dạng `MM:SS`, bắt đầu đếm khi kết nối thành công.
2. **Nút Ngắt lời AI (Interrupt Speech):** Khi AI đang nói dài, người dùng có thể bấm nút "Ngắt lời" để dừng phát âm ngay lập tức (`speechSynthesis.cancel()`) và quay về chế độ lắng nghe (`LISTENING`).
3. **Nút Tắt/Bật Micro (Mute/Unmute):** Ngắt micro tạm thời khi người dùng có việc riêng.
4. **Tự động lưu lịch sử hội thoại:** Toàn bộ lời nói của người dùng và câu trả lời của AI trong cuộc gọi thoại đều được đồng bộ vào chuỗi hội thoại văn bản của Widget Chat (`FloatingChatWidget.tsx`).

---

## 3. KHẢ NĂNG MỞ RỘNG (FUTURE WEBRTC / LIVE API)
Kiến trúc `AiVoiceCallModal.tsx` được module hóa hoàn toàn. Trong giai đoạn sau, khi trung tâm mở rộng lên hạ tầng WebRTC đa điểm hoặc kết nối trực tiếp với Gemini Multimodal Live API qua WebSocket, tầng visualizer và state machine của modal này sẽ được tái sử dụng 100% mà không cần viết lại giao diện.

