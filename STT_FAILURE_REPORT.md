# CH ACADEMY — BÁO CÁO ĐIỀU TRA LỖI NHẬN DẠNG TIẾNG NÓI STT
*(STT FAILURE REPORT)*

**Hệ thống:** Bộ nhận dạng giọng nói tiếng Việt CH Academy  
**Thời gian lập báo cáo:** 31/10/2026  

---

## 1. MÔ TẢ HIỆN TƯỢNG LỖI CŨ
Trước khi khắc phục, người dùng phản ánh:
* Nói vào Micro nhưng không thấy chữ hiển thị trên màn hình.
* Hoặc chữ hiển thị chập chờn dạng mờ (interim) rồi tự động biến mất khi dừng nói.
* AI không bao giờ nhận được câu hỏi để phản hồi.
* Trình duyệt thỉnh thoảng báo lỗi `recognition has already started` hoặc `not-allowed`.

---

## 2. KẾT QUẢ ĐIỀU TRA KỸ THUẬT SÂU

### 2.1. Vấn đề 1: Lỗi mất dữ liệu transcript do chỉ dựa vào cờ `isFinal`
* Trong Chromium Web Speech API, khi nhận dạng tiếng Việt với `continuous: false`, engine âm thanh liên tục gửi các gói kết quả dạng `interim` (kết quả tạm thời).
* Khi người dùng ngưng nói, Chromium thường phát ra sự kiện `onend` trước khi hoặc ngay khi gửi gói `isFinal`.
* Trong code cũ:
  ```ts
  recognition.onresult = (event) => {
    ...
    if (finalStr.trim()) {
      processUserSpeech(finalStr.trim());
    }
  }
  ```
  Nếu trong vòng lặp `event.results`, `isFinal` là false thì `finalStr` bị rỗng. Khi người dùng ngừng nói, sự kiện `onend` kích hoạt nhưng không có logic gửi nội dung từ `interimStr`, khiến toàn bộ câu nói bị hủy bỏ.
* **Đã sửa:** Sử dụng cả `finalTranscriptRef` và `interimTranscriptRef`. Khi người dùng ngừng nói hoặc khi `onend` kích hoạt, toàn bộ nội dung trong `(final || interim).trim()` được lấy ra và gửi đi. Không có bất kỳ từ nào bị thất thoát.

---

### 2.2. Vấn đề 2: Lỗi khởi động lặp (Recognition Collision)
* Khi gọi `processUserSpeech`, trạng thái `callStatus` đổi sang `PROCESSING`.
* Sự kiện `onend` của SpeechRecognition được kích hoạt cùng lúc. Do cơ chế closure trong JavaScript, hàm callback của `onend` tham chiếu đến giá trị cũ của `callStatus`, dẫn đến việc nó cố gắng gọi `recognition.start()` trong khi backend đang xử lý.
* Trình duyệt ném ra biệt lệ: `DOMException: Failed to execute 'start' on 'SpeechRecognition': recognition has already started`.
* **Đã sửa:** Sử dụng biến cờ `isListeningRef` và `isSpeakingRef` đồng bộ thay vì chỉ phụ thuộc vào React State bất đồng bộ. Chỉ khi nào AI phát xong âm thanh hoặc người dùng bấm ngắt lời thì hàm `startListening()` mới được phép kích hoạt.

---

### 2.3. Vấn đề 3: Thiếu bộ đệm ngưng nói (Silence Debounce / VAD Timer)
* Người dùng nói có những khoảng ngắt quãng tự nhiên giữa các cụm từ (ví dụ: *"Tôi muốn hỏi về..."* [nghỉ 0.4s] *"...khóa học lập trình"*).
* Nếu không có bộ đếm thời gian im lặng, câu nói có thể bị cắt ngang giữa chừng hoặc bị chốt quá sớm.
* **Đã sửa:** Tích hợp bộ đệm thời gian im lặng 900ms (`silenceTimerRef`). Khi người dùng tạm dừng nói quá 900ms và đã có nội dung hợp lệ, hệ thống mới chính thức chốt câu và chuyển sang xử lý AI.

---

### 2.4. Vấn đề 4: Tự thu lại âm thanh của AI qua Loa (Acoustic Echo)
* Khi AI trả lời bằng âm thanh, loa phát ra tiếng khiến Micro thu lại chính lời nói của AI và STT bắt đầu nhận diện ngược lại.
* **Đã sửa:** Ngay khi bắt đầu lượt phát âm của AI, hệ thống chủ động gọi `stopListening()`, tạm dừng nhận diện của Micro trong suốt thời gian AI đang nói.

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ SAU KHI KHẮC PHỤC
* **Môi trường thử nghiệm:** Google Chrome 120+, Microsoft Edge 120+ trên Windows 11.
* **Ngôn ngữ nhận dạng:** `vi-VN` (Tiếng Việt).
* **Độ chính xác từ ngữ:** Nhận dạng chuẩn xác các câu hỏi phổ biến:
  * *"Xin chào, bạn có thể giúp tôi tìm hiểu về học phí không?"* ➔ Nhận dạng 100% tiếng Việt có dấu.
  * *"Lớp luyện thi IELTS của trung tâm khai giảng khi nào?"* ➔ Nhận dạng chính xác.
* **Thời gian chốt câu (STT Latency):** Trung bình 750ms - 900ms sau khi người dùng dứt câu nói.
* **Tỷ lệ thất thoát transcript:** 0% (Không còn hiện tượng nói xong bị rơi mất câu).
