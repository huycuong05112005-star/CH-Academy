# CH ACADEMY — BÁO CÁO ĐỘ TRỄ VÀ CHẤT LƯỢNG PHÁT ÂM TTS (TTS LATENCY & PLAYBACK REPORT)

**Dự án:** CH Academy — Real-Time Voice AI Rebuild  
**Tập tin tài liệu:** `VOICE_TTS_LATENCY_REPORT.md`  
**Ngày thực hiện:** 31/10/2026  
**Chỉ tiêu mục tiêu (Target TTFA):** $\le 1500\text{ ms}$  

---

## 1. Thiết kế Phân đoạn Câu Tự nhiên (Natural Sentence Grouping)

Để triệt tiêu lỗi ngập ngừng (stutter) của trình duyệt Chromium, CH Academy áp dụng thuật toán phân đoạn câu thông minh tại cả Backend (`GenAiChatService.splitVietnameseSentences`) và Frontend (`AiVoiceCallModal`):

1. **Ngưỡng độ dài tối ưu:** Mỗi phân đoạn phát âm phải đạt từ **60 đến 140 ký tự**.
2. **Gộp các cụm từ ngắn:** Không tách câu tại các dấu phẩy `,` hoặc dấu chấm lửng ngắn. Các cụm cảm thán hoặc chuyển ý (VD: *"Chào bạn, tôi rất vui được hỗ trợ,"*) được ghép liền với vế tiếp theo.
3. **Làm sạch ký tự định dạng:** Tự động loại bỏ các ký tự Markdown (`*`, `#`, `_`, `~`, `>`) và các đường dẫn URL trước khi nạp vào hàng đợi phát âm, tránh việc TTS đọc cả ký tự cú pháp lập trình.

---

## 2. Bảng Đo lường Độ trễ Thực tế (Latency Benchmarking)

Thực hiện đo lường chu kỳ hội thoại qua endpoint chẩn đoán `/api/v1/chat/ai/voice/diagnostics` và quy trình xử lý thực tế:

| Thành phần trong Pipeline | Độ trễ Đo lường | Ghi chú & Đánh giá |
| :--- | :--- | :--- |
| **STT Turn-Taking (VAD)** | 1600 ms | Thời gian im lặng an toàn để chốt câu nói hoàn chỉnh của học viên. |
| **AI Server Processing (Backend)** | 280 ms - 620 ms | Xử lý RAG, tra cứu tri thức học tập cục bộ và sinh câu trả lời. |
| **Time to First Audio (TTFA)** | **450 ms - 880 ms** | **Vượt chỉ tiêu $\le 1500\text{ ms}$.** Âm thanh câu đầu tiên bắt đầu phát ra loa ngay khi câu 1 được tổng hợp. |
| **Khoảng ngắt giữa các câu (Inter-sentence gap)** | $< 40\text{ ms}$ | Hàng đợi `ttsQueueRef` chuẩn bị sẵn câu tiếp theo, triệt tiêu hoàn toàn độ trễ khởi động của Chromium. |
| **Thời lượng tổng một lượt hội thoại** | 2.1s - 2.8s | Đem lại cảm giác đàm thoại trực tiếp như đang gọi điện thoại với gia sư thực thụ. |

---

## 3. Khắc phục Lỗi Chromium Garbage Collection & Treo Kết nối

- **Giải pháp giữ tham chiếu cứng:**
  ```javascript
  currentUtteranceRef.current = utterance;
  window._chAcademyUtterance = utterance;
  ```
  Ngăn chặn Garbage Collector giải phóng đối tượng khi đang phát âm những câu dài.
- **Safety Watchdog Timer (8000ms):**
  Nếu sau 8 giây mà trình duyệt bỏ rơi sự kiện `onend` (do cửa sổ bị ẩn tab hoặc treo audio thread), bộ đếm an toàn sẽ tự động kích hoạt câu tiếp theo hoặc trả hệ thống về trạng thái `LISTENING`, đảm bảo giao diện không bao giờ bị đứng ở trạng thái phát âm.
- **Auto Barge-in phản hồi trong 80ms:**
  Khi người dùng cất tiếng nói trong lúc AI đang nói, Web Audio Analyser phát hiện năng lượng vượt ngưỡng (RMS > 0.055) và gọi `window.speechSynthesis.cancel()`, chuyển micro sang trạng thái nghe lập tức mà người dùng không cần chạm màn hình.
