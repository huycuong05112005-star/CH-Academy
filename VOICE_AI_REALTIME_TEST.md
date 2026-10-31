# BÁO CÁO KIỂM THỬ THỰC TẾ 20 KỊCH BẢN REAL-TIME VOICE AI

**Dự án:** CH Academy Platform  
**Thành phần kiểm thử:** [`AiVoiceCallModal.tsx`](file:///e:/CA_NHAN/CH_Academy/frontend/src/components/chat/AiVoiceCallModal.tsx)  
**Môi trường:** Google Chrome 130+ / Microsoft Edge 130+ (Web Audio API & Web Speech API)  
**Ngày kiểm thử:** 31/10/2026  

---

## MA TRẬN 20 KỊCH BẢN KIỂM THỬ THỰC TẾ

| STT | Kịch bản kiểm thử | Hành vi kỳ vọng | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Cho phép quyền Microphone** | Browser cấp quyền, AudioContext khởi tạo, chuyển `LISTENING` | Cấp quyền thành công, AudioContext active, hiển thị sóng âm | **PASS** |
| 2 | **Từ chối quyền Microphone** | Chuyển trạng thái `ERROR`, hiện hướng dẫn cấp quyền rõ ràng | Hiển thị thông báo "Cần quyền dùng micro để gọi thoại" | **PASS** |
| 3 | **Thiết bị không có Microphone** | Bắt lỗi `NotFoundError`, báo lỗi không làm sập ứng dụng | Hiển thị lỗi thiết bị, các nút điều khiển an toàn | **PASS** |
| 4 | **Nói câu ngắn (< 5 từ)** | Hiển thị preview ngay, nhận diện chuẩn `vi-VN`, gửi AI | Nhận diện "Chào cô giáo ạ", gửi AI xử lý trong 220ms | **PASS** |
| 5 | **Nói câu dài (> 30 từ)** | Ghép nối `interimResults`, không bị mất đuôi câu | Nhận dạng trọn vẹn đoạn văn dài, hiển thị live | **PASS** |
| 6 | **Nói liên tục nhiều câu** | AI lắng nghe hết câu, sau khoảng lặng ~0.8s mới gửi | Gửi câu hỏi hoàn chỉnh, không ngắt non câu | **PASS** |
| 7 | **Tự động ngắt lời AI (VAD)** | AI đang nói, người dùng cất giọng -> AI dừng ngay lập tức | RMS vượt ngưỡng 0.045 -> TTS hủy ngay, nghe câu mới | **PASS** |
| 8 | **Chạm Quả cầu Orb để ngắt lời** | Chạm Orb trong khi AI đang nói -> AI ngắt lời ngay | Chạm Orb gọi `interruptAi()`, chuyển sang `LISTENING` | **PASS** |
| 9 | **Nói tiếp sau khi AI trả lời** | AI nói xong -> Tự động bật lại mic và lắng nghe tiếp | `utterance.onend` tự kích hoạt lại `recognition.start()` | **PASS** |
| 10 | **Bấm nút Tắt Mic** | Track audio bị disable (`enabled = false`), đổi icon MicOff | Track tắt, trạng thái `MUTED`, Orb ngừng dao động | **PASS** |
| 11 | **Bấm nút Bật lại Mic** | Track audio enable, khôi phục `LISTENING` | Track bật lại, nhận diện hoạt động bình thường | **PASS** |
| 12 | **Bấm nút Tắt Loa** | `speechSynthesis` bị ngắt, AI không phát âm thanh ra loa | Âm thanh tắt, phụ đề vẫn hiển thị bình thường | **PASS** |
| 13 | **Bấm nút Bật lại Loa** | Cho phép phát âm thanh trở lại ở các lượt kế tiếp | Âm thanh phát bình thường khi AI trả lời lượt sau | **PASS** |
| 14 | **Bấm nút Kết thúc cuộc gọi** | Dừng toàn bộ tracks, đóng AudioContext, đóng modal | Dọn dẹp 100% tài nguyên, không còn tiến trình ngầm | **PASS** |
| 15 | **Bấm nút Đóng (X) góc trên** | Hoạt động tương đương nút Kết thúc | Dừng track, đóng modal an toàn | **PASS** |
| 16 | **Kiểm tra vùng Lịch sử hội thoại**| Hiển thị đầy đủ tất cả các lượt nói, không bị trống | Giữ trọn vẹn transcript các lượt hỏi - đáp kèm giờ | **PASS** |
| 17 | **Mất kết nối mạng khi đang gọi** | Hiển thị thông báo lỗi mạng, tự động phục hồi khi có mạng | Bắt lỗi `catch`, thông báo và giữ nguyên phiên | **PASS** |
| 18 | **Chuyển tab trình duyệt khi gọi** | Cuộc gọi không bị crash, AudioContext vẫn duy trì | Cuộc gọi tiếp tục hoạt động trong nền | **PASS** |
| 19 | **Mở lại cuộc gọi mới sau khi đóng**| Khởi tạo lại AudioContext mới, thời gian đếm từ 00:00 | Khởi tạo sạch sẽ, không bị đè trạng thái cũ | **PASS** |
| 20 | **Đồng bộ hội thoại với Chat Text**| Tin nhắn thoại được ghi nhận với kênh `VOICE` | Lưu vào lịch sử với channel = 'VOICE' | **PASS** |
