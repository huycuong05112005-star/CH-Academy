# BÁO CÁO KIỂM TOÁN VÀ KIẾN TRÚC PHÂN HỆ VOICE AI (AI VOICE AUDIT)

**Tài liệu:** `AI_VOICE_AUDIT.md`  
**Ngày kiểm toán:** 31 tháng 10 năm 2026  
**Dự án:** Phân hệ Giọng nói Trí tuệ Nhân tạo — CH Academy  
**Phiên bản:** 2.0 (Real-time Audio Analyser & Multi-Channel Voice)  

---

## 1. TỔNG QUAN PHÂN HỆ VOICE AI

Phân hệ Voice AI tại CH Academy được xây dựng nhằm cung cấp khả năng đàm thoại tự nhiên bằng giọng nói giữa học viên/khách hàng với các AI Agent của trung tâm:
- **Tư vấn Tuyển sinh qua Điện thoại (`AGENT_VOICE_OUTBOUND`):** Tự động liên hệ tư vấn khóa học, giải đáp biểu phí và xếp lịch hẹn kiểm tra trình độ.
- **Luyện nói tiếng Anh 1-1 (`AGENT_STUDENT_ENGLISH`):** Hỗ trợ học viên luyện phản xạ giao tiếp tiếng Anh, chỉnh sửa ngữ điệu và phát âm chuẩn bản ngữ.
- **Tổng đài Quản trị & Giám sát (`AiStudioPage -> calls`):** Cho phép Quản trị viên theo dõi toàn bộ danh sách cuộc gọi, nghe lại đoạn ghi âm và xem lại bản gỡ băng văn bản (Transcript).

---

## 2. KIẾN TRÚC KỸ THUẬT CLIENT-SIDE (WEB AUDIO & SÓNG ÂM)

### 2.1. Bộ phân tích sóng âm thời gian thực (`AudioContext` & `AnalyserNode`)
Để mang lại trải nghiệm thị giác trực quan, `AiVoiceCallModal.tsx` sử dụng trực tiếp Web Audio API tiêu chuẩn:
- **`AudioContext`:** Khởi tạo luồng xử lý âm thanh trong trình duyệt.
- **`AnalyserNode`:** Trích xuất mảng dữ liệu tần số âm thanh (Frequency Data) kích thước 32-64 bins với độ phân giải `fftSize = 64`.
- **Hiển thị Sóng âm sinh động (Dynamic Waveform):** Mảng giá trị tần số được ánh xạ thành chiều cao của 12-24 thanh bar chuyển động liên tục theo nhịp điệu giọng nói thực tế của người dùng hoặc âm thanh phản hồi của AI.

### 2.2. Vòng đời Cuộc gọi (Call State Machine)
Cuộc gọi được quản lý qua 5 trạng thái tuần tự:
1. `IDLE`: Chờ người dùng nhấn bắt đầu cuộc gọi.
2. `CONNECTING`: Thiết lập luồng kết nối tới Agent, khởi động micro và microphone permissions.
3. `CONNECTED / LISTENING`: Agent đang lắng nghe người dùng nói, thanh sóng âm phản hồi theo micro.
4. `SPEAKING`: Agent đang phát âm thanh phản hồi câu trả lời, sóng âm dao động theo âm sắc AI.
5. `ENDED`: Kết thúc cuộc gọi, tổng kết thời lượng và lưu bản ghi phiên gọi.

---

## 3. PHÂN HỆ QUẢN TRỊ CUỘC GỌI TRONG AI STUDIO (`tab: calls`)

Nhằm đồng bộ với kiến trúc NEXVA AI, CH Academy đã bổ sung một phân hệ độc lập dành riêng cho Voice AI tại tab thứ 9 (`calls`) trong `AiStudioPage.tsx`:

### 3.1. Bảng dữ liệu Cuộc gọi Hệ thống
- Hiển thị danh sách các phiên gọi từ bảng `call_sessions` gồm: Mã phiên (`session_code`), Người gọi (`user_id`), Agent phụ trách, Cổng (`portal`), Thời lượng (`duration_seconds`), Trạng thái (`COMPLETED`), Ngày gọi và Trích đoạn hội thoại.

### 3.2. Trình phát lại âm thanh mô phỏng (Audio Player & Visualizer)
- Tích hợp thanh phát lại âm thanh trực quan với nút Play/Pause, thanh kéo thời gian (Scrubber) và sóng âm chuyển động theo thời gian phát lại.

### 3.3. Nút kích hoạt Cuộc gọi Trực tiếp (Live Interactive Call)
- Quản trị viên có thể nhấn nút **"Bắt đầu cuộc gọi thử nghiệm"** ngay trong giao diện AI Studio để mở modal tương tác giọng nói với Agent trong môi trường thực.

---

## 4. DỮ LIỆU & BACKEND ENDPOINTS (`call_sessions`)

### 4.1. Cấu trúc bảng `call_sessions` trong PostgreSQL
Bảng `call_sessions` được thiết kế chặt chẽ:
```sql
CREATE TABLE IF NOT EXISTS call_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_code VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    agent_code VARCHAR(50) NOT NULL,
    portal VARCHAR(20) NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);
```

### 4.2. Danh mục API Backend
- **`GET /api/v1/admin/ai/calls`:** Trả về danh sách 50 cuộc gọi gần nhất phục vụ kiểm toán và giám sát chất lượng.
- **`AiStudioService.recordCallSession(...)`:** Ghi nhận phiên gọi mới vào cơ sở dữ liệu ngay khi cuộc gọi kết thúc.

---

## 5. ĐÁNH GIÁ TÍNH KHẢ THI TỔNG ĐÀI TELEPHONY & TIẾNG VIỆT (TTS/STT)

1. **Khả thi trên trình duyệt:** Sử dụng `webkitSpeechRecognition` / Web Speech API cho STT tiếng Việt và Web Speech Synthesis cho TTS có độ trễ cực thấp (0ms network round-trip), hoạt động hoàn hảo trên Google Chrome/Edge.
2. **Khả thi triển khai TTS tiếng Việt chuyên sâu:** Có thể kết nối microservice Python FastAPI (như mô hình `nexva/tts`) hoặc FPT.AI / Viettel AI qua REST API để có giọng đọc biểu cảm chuẩn ba miền Bắc - Trung - Nam.
3. **Khả thi kết nối Tổng đài SIP/VoIP:** Sẵn sàng tích hợp qua giao thức WebRTC SIP Client (như SIP.js hoặc JsSIP) với tổng đài Asterisk của trung tâm để thực hiện cuộc gọi ra ngoài mạng di động thực tế.

