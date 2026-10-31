# BÁO CÁO NGHIÊN CỨU TÍNH KHẢ THI: AI VOICE & AI VIDEO CALL — CH ACADEMY

**Dự án:** CH Academy  
**Mục tiêu:** Đánh giá tính khả thi, phân tích công nghệ, độ trễ, chi phí và lộ trình triển khai giao tiếp bằng Giọng nói (AI Voice) và Cuộc gọi Video với AI Avatar (AI Video Call).

---

## 1. GIAI ĐOẠN 1: AI VOICE (GIAO TIẾP GIỌNG NÓI HAI CHIỀU)

### 1.1. Giải pháp hiện tại (Đã tích hợp trong Widget CH Academy)
* **Công nghệ:** **Web Speech API (Native Browser STT & TTS)**:
  * **Speech-to-Text (STT):** Sử dụng `webkitSpeechRecognition` / `SpeechRecognition` với ngôn ngữ `vi-VN`. Người dùng bấm biểu tượng Micro, nói tự nhiên bằng tiếng Việt; trình duyệt tự động chuyển đổi thành văn bản và gửi cho Agent.
  * **Text-to-Speech (TTS):** Sử dụng `window.speechSynthesis` đọc to câu trả lời của AI bằng giọng đọc tiếng Việt mượt mà.
* **Đánh giá trải nghiệm:**
  * **Độ trễ (Latency):** Dưới 200ms cho nhận diện và phát âm thanh.
  * **Chi phí:** **0 VNĐ (Hoàn toàn miễn phí)**, không làm phát sinh chi phí server hay bên thứ ba.
  * **Bảo mật & Quyền riêng tư:** Không lưu trữ dữ liệu âm thanh người dùng trên máy chủ nếu chưa được đồng ý.

### 1.2. Giải pháp nâng cao trong tương lai (Realtime Speech-to-Speech Streaming)
* **Công nghệ:** **Gemini Live API (WebSockets) / OpenAI Realtime API**:
  * Đàm thoại giọng nói liên tục hai chiều với độ trễ cực thấp (< 500ms), hỗ trợ ngắt lời (Barge-in / Interruption) khi người dùng đang nói.
* **Chi phí dự kiến:**
  * Gemini Live API: Khoảng 0.06 USD / phút đàm thoại âm thanh.
  * Ước tính cho 1.000 phút tư vấn tuyển sinh/tháng: Khoảng 60 USD (~1.500.000 VNĐ).

---

## 2. GIAI ĐOẠN 2: AI VIDEO CALL (HỘI THOẠI VIDEO VỚI AI AVATAR)

### 2.1. Phân biệt các hình thức Video AI
* **Video tạo sẵn (Pre-rendered Video):** Video clip ngắn render từ trước, chỉ phát lại khi có câu hỏi phù hợp. *Hạn chế: Không thể cá nhân hóa linh hoạt.*
* **Video Call tương tác thật với AI Avatar (Realtime Interactive Streaming):** AI nhận giọng nói người dùng, suy luận câu trả lời và stream video người ảo (Avatar) cử động môi (Lip-sync), biểu cảm khuôn mặt theo thời gian thực qua giao thức WebRTC.

### 2.2. So sánh các nhà cung cấp giải pháp Video Avatar hàng đầu

| Nhà cung cấp | Công nghệ Stream | Độ trễ (Latency) | Chất lượng tiếng Việt | Chi phí ước tính | Khả năng triển khai |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **D-ID Streaming API** | WebRTC Video Stream | 800ms - 1.5s | Khá tốt (kết hợp Azure/Google TTS) | ~0.15 USD / phút video stream | **Khả thi cao** (Có SDK JavaScript sẵn) |
| **HeyGen Interactive Avatar** | WebRTC Live Avatar | 600ms - 1.2s | Rất tự nhiên, biểu cảm chân thực | ~0.20 USD / phút video stream | **Rất tốt** (Chất lượng hình ảnh xuất sắc) |
| **Tavus Conversational Video** | WebRTC Replica | 700ms - 1.5s | Khá | ~0.25 USD / phút | Khá phức tạp khi đào tạo nhân vật mới |

### 2.3. Đánh giá rủi ro và khuyến nghị triển khai
1. **Băng thông & Thiết bị:** Video streaming WebRTC đòi hỏi đường truyền mạng ổn định tối thiểu 2-4 Mbps. Trên thiết bị di động cấu hình yếu có thể bị giật hình hoặc nóng máy.
2. **Chi phí vận hành:** Nếu mở video call tự do cho khách vãng lai trên website, chi phí có thể tăng đột biến. **Khuyến nghị:** Chỉ cấp quyền Video Call cho học viên VIP, buổi luyện thi nói IELTS 1-1, hoặc phiên tư vấn tuyển sinh có đặt lịch trước.
3. **Lộ trình:** Triển khai hoàn thiện AI Voice Web Speech API (hiện tại) $\longrightarrow$ Tích hợp Gemini Live Audio $\longrightarrow$ Thử nghiệm HeyGen Interactive Avatar cho module Luyện nói Tiếng Anh.

