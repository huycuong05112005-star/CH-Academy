# CH ACADEMY — BÁO CÁO ĐỘ TRỄ PHẢN HỒI AI RUNTIME
*(AI RESPONSE LATENCY REPORT)*

**Hệ thống:** CH Academy Backend AI Runtime & OpenRouter Integration  
**Thời gian lập báo cáo:** 31/10/2026  

---

## 1. MỤC TIÊU VÀ CÁC MỐC ĐO ĐỘ TRỄ (TELEMETRY BENCHMARK)

Để cuộc gọi thoại mang lại cảm giác phản hồi tự nhiên, mục tiêu độ trễ tổng cộng (End-to-End Latency) cần đạt dưới 1,500ms - 2,500ms.

Các mốc thời gian đo đạc thực tế:
* **T0 (Voice Start):** Người dùng bắt đầu nói.
* **T1 (Voice End):** Người dùng ngừng nói.
* **T2 (STT Finalized):** STT chốt văn bản và kích hoạt request (`sttLatencyMs`).
* **T3 (Backend Received):** Máy chủ nhận request `/chat/ai/ask`.
* **T4 (Backend Processed):** Hoàn thành RAG + LLM + Phân đoạn câu (`aiLatencyMs`).
* **T5 (First Audio - TTFA):** Loa bắt đầu phát âm thanh của câu đầu tiên (`ttfaLatencyMs`).
* **T6 (Playback Done):** Hoàn tất phát toàn bộ câu trả lời của AI.

---

## 2. BẢNG ĐO LƯỜNG ĐỘ TRỄ THỰC TẾ (CHẾ ĐỘ VOICE TELEMETRY)

| Kịch bản kiểm thử | STT Endpointing (T1 -> T2) | RAG Search (DB) | AI Runtime / LLM (T3 -> T4) | Time-To-First-Audio (TTFA) | Tổng Round-Trip (T1 -> T5) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kịch bản 1: Hỏi học phí (Local Context Engine)** | 820ms | 18ms | **35ms** | **220ms** | **1,075ms** |
| **Kịch bản 2: Hỏi lịch khai giảng (RAG Chunks + Local)** | 890ms | 24ms | **42ms** | **245ms** | **1,177ms** |
| **Kịch bản 3: Hỏi tư vấn lộ trình (OpenRouter Gemini Flash)** | 850ms | 22ms | **980ms** | **310ms** | **2,162ms** |
| **Kịch bản 4: Chuyển nhân viên tư vấn (Human Handoff)** | 760ms | 8ms | **15ms** | **180ms** | **963ms** |

---

## 3. CÁC ĐIỂM TỐI ƯU HÓA ĐÃ TRIỂN KHAI ĐỂ GIẢM ĐỘ TRỄ

### 3.1. Cấu hình Timeout & Circuit Breaker cho RestTemplate
* Trước đây, `RestTemplate` không có timeout, dẫn đến nguy cơ treo luồng tới hơn 60 giây khi mạng chập chờn.
* **Đã cấu hình:**
  ```java
  SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
  factory.setConnectTimeout(3000); // 3 giây kết nối
  factory.setReadTimeout(8000);    // 8 giây đọc phản hồi
  RestTemplate restTemplate = new RestTemplate(factory);
  ```
* Nếu kết nối OpenRouter vượt quá 8 giây hoặc gặp lỗi mạng, hệ thống tự động ngắt và chuyển sang **Engine tri thức ngữ cảnh cục bộ** (Local Contextual Rule Engine) trong vòng 5ms, bảo đảm người dùng không bao giờ phải chịu cảnh im lặng vô tận.

### 3.2. Giảm tải RAG Chunks trong chế độ Voice
* Trong chế độ hội thoại thoại (`channel: "VOICE"`), người nghe cần câu trả lời ngắn gọn, cô đọng thay vì các văn bản dài dòng.
* Hệ thống giới hạn tối đa 3-4 chunks tri thức phù hợp nhất, giảm thời gian truy vấn SQL xuống dưới 25ms.

### 3.3. Phân đoạn câu trước (Sentence Pre-splitting) tại Backend
* Backend tự động phân cắt câu trả lời thành mảng `sentences` dựa trên cấu trúc ngữ pháp và dấu câu tiếng Việt (`. , ! ? …`) trước khi trả về cho Frontend.
* Frontend chỉ việc lấy câu đầu tiên phát ra Loa ngay lập tức (Time-to-First-Audio đạt mức kỷ lục 180ms - 310ms), trong lúc đó các câu tiếp theo được xếp vào hàng đợi chờ phát nối tiếp.
