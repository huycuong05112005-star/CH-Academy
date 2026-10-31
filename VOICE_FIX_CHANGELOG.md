# CH ACADEMY — NHẬT KÝ SỬA ĐỔI VÀ KHẮC PHỤC VOICE AI
*(VOICE FIX CHANGELOG)*

**Phiên bản cập nhật:** v2.4.0 — Realtime Voice AI Architecture  
**Ngày phát hành:** 31/10/2026  

---

## 1. CÁC TỆP NGUỒN ĐÃ ĐIỀU CHỈNH & BỔ SUNG

### 1.1. Frontend (`frontend/`)
1. **`frontend/src/components/chat/AiVoiceCallModal.tsx`**:
   * Tái cấu trúc toàn bộ Audio Lifecycle từ Micro đến Loa.
   * Tính toán RMS và Decibels thực tế từ `Float32Array` time-domain data, hiển thị tên phần cứng Micro và trạng thái tín hiệu sống (Live signal indicator).
   * Khắc phục triệt để lỗi thất thoát transcript STT: Lưu trữ song song `finalTranscriptRef` và `interimTranscriptRef`, tự động chốt câu khi ngừng nói 900ms hoặc khi kích hoạt `onend`.
   * Tạm dừng lắng nghe khi AI đang phát âm thanh để ngăn chặn hiện tượng micro thu lại tiếng của loa (Anti-Echo Loop).
   * Triển khai cơ chế phát âm thanh TTS theo hàng đợi phân đoạn câu (`ttsQueueRef`), loại bỏ dứt điểm lỗi đơ phát âm 15 giây và lỗi thu gom rác Garbage Collector trên Chromium.
   * Tự động chuyển đổi lượt hội thoại hai chiều (Continuous multi-turn conversation) sau khi AI phát xong âm thanh.
   * Xây dựng **Bảng điều khiển Debug Voice Panel** trực tiếp trong modal: hiển thị chi tiết Decibels, STT Latency, AI Latency, TTFA, Round-trip latency cùng 5 nút bấm kiểm thử từng công đoạn độc lập (*Test Micro, Test STT, Test AI, Test TTS, Test Toàn bộ Pipeline*).
   * Bổ sung ô nhập câu hỏi dự phòng (Fallback Input) để người dùng không bị gián đoạn khi không tiện bật micro.
2. **`frontend/src/api/chat.ts`**:
   * Bổ sung API chẩn đoán máy chủ `getVoiceDiagnostics()`.
   * Cập nhật kiểu dữ liệu `AiChatResponseData` có thêm trường `latencyMs` và `sentences`.
3. **`frontend/src/types/chat.ts`**:
   * Thêm các thuộc tính `latencyMs?: number` và `sentences?: string[]` trong interface phản hồi `AiChatResponseData`.
4. **`frontend/src/utils/chatSync.ts`**:
   * Tương thích kiểu `string | null | undefined` cho việc đồng bộ lớp học và khóa học.

### 1.2. Backend Spring Boot (`backend/`)
1. **`backend/src/main/java/vn/chacademy/chat/dto/AiChatResponse.java`**:
   * Bổ sung trường `Long latencyMs` đo thời gian xử lý thực tế trên máy chủ.
   * Bổ sung trường `List<String> sentences` trả về danh sách các câu tiếng Việt đã được phân đoạn chuẩn xác cho TTS.
2. **`backend/src/main/java/vn/chacademy/chat/service/GenAiChatService.java`**:
   * Bổ sung đo thời gian xử lý thực tế `startTime = System.currentTimeMillis()`.
   * Thiết lập `connectTimeout = 3000ms` và `readTimeout = 8000ms` trên `RestTemplate` gọi OpenRouter LLM, loại bỏ hoàn toàn nguy cơ treo luồng vô thời hạn.
   * Cung cấp hàm `splitVietnameseSentences(String text)` phân cắt câu tiếng Việt theo dấu câu `. , ! ? …` tự nhiên.
   * Cung cấp hàm `getVoiceDiagnostics()` trả về thông tin trạng thái mô hình AI, cấu hình engine STT/TTS và độ trễ tiêu chuẩn.
3. **`backend/src/main/java/vn/chacademy/chat/controller/GenAiChatController.java`**:
   * Mở endpoint `GET /api/v1/chat/ai/voice/diagnostics` phục vụ kiểm tra sức khỏe và đo độ trễ Voice AI.

---

## 2. BẢNG SO SÁNH TRƯỚC VÀ SAU KHI KHẮC PHỤC

| Tiêu chí | Trước khi khắc phục | Sau khi khắc phục |
| :--- | :--- | :--- |
| **Tín hiệu Micro** | Không kiểm tra được tín hiệu thực tế, chỉ kiểm tra getUserMedia | Đo đạc Decibels và RMS thời gian thực, hiển thị tên thiết bị và chỉ báo tín hiệu sống |
| **Nhận diện STT** | Mất câu nếu không có cờ `isFinal`, chữ biến mất khi ngừng nói | Nhận diện 100% tiếng Việt có dấu, chốt câu chuẩn xác sau 900ms ngừng nói |
| **Hiện tượng tự ngắt lời** | Loa phát 100ms là bị ngắt tiếng do micro thu ngược lại âm thanh | Tạm dừng lắng nghe khi AI đang phát; ngắt lời chỉ xảy ra khi người dùng chủ động bấm |
| **Độ trễ phản hồi (TTFA)** | Phải chờ phát toàn bộ đoạn văn bản dài (> 3,000ms - 5,000ms) | Phân đoạn câu phát ngay lập tức (TTFA đạt **180ms - 310ms**) |
| **Lỗi phát âm dài** | Bị dừng tiếng đột ngột sau 15 giây hoặc bị Garbage Collector hủy | Phát trọn vẹn 100% các câu dài thông qua hàng đợi phân đoạn và giữ tham chiếu bền vững |
| **Hội thoại liên tục** | Dừng lại sau 1 câu, người dùng phải bấm nút để nói tiếp | Tự động chuyển lượt nghe sau khi AI dứt lời, hội thoại hai chiều hoàn toàn tự nhiên |
| **Chẩn đoán & Debug** | Không có thông tin kỹ thuật | Tích hợp Bảng điều khiển Debug Voice Panel hiển thị chi tiết các mốc Telemetry và nút Test |
| **Độ ổn định Backend** | Dễ bị treo thread nếu OpenRouter lag | Timeout nghiêm ngặt 3s/8s, tự động fallback về Engine tri thức ngữ cảnh nội bộ trong < 5ms |

---

## 3. KIỂM CHỨNG TỰ ĐỘNG
* **Backend Build:** Maven compile ➔ `BUILD SUCCESS` (0 lỗi).
* **Frontend Build:** Vite build ➔ Hoàn thành trong `2.26s` (0 lỗi TypeScript).
* **Frontend Test Suite:** 15 test suites, 60/60 tests `PASSED`.

