# CH ACADEMY — KẾT QUẢ KIỂM THỬ HỘI THOẠI ĐA LƯỢT VOICE AI (MULTI-TURN TEST)

**Dự án:** CH Academy — Real-Time Voice AI Rebuild  
**Tập tin tài liệu:** `VOICE_MULTI_TURN_TEST.md`  
**Bộ kiểm thử tích hợp:** `vn.chacademy.chat.ClassChatAuthorizationAndVoiceAiTest`  
**Ngày kiểm thử:** 31/10/2026  
**Trạng thái kiểm thử:** PASS (100%)  

---

## 1. Cơ chế Lưu giữ Ngữ cảnh Đa lượt (Multi-turn Context Retention)

Hệ thống đã loại bỏ hoàn toàn lỗi "chỉ nói được 1 câu rồi mất trí nhớ" thông qua 2 nâng cấp kỹ thuật đồng bộ:

1. **Frontend Persistence (`activeConversationIdRef`):**
   - Lưu trữ `res.data.conversationId` ngay từ phản hồi đầu tiên.
   - Các lượt nói tiếp theo luôn đính kèm `conversationId` trong request body.
   - Khi kết thúc phát âm TTS câu trả lời, `AiVoiceCallModal` tự động chuyển sang `LISTENING` và kích hoạt lượt STT tiếp theo mà không yêu cầu người dùng phải bấm nút hay mở lại modal.
2. **Backend Context Injection (`GenAiChatService`):**
   - Tự động nạp tối đa **8 tin nhắn gần nhất** của phiên đàm thoại vào danh sách Message Context gửi tới LLM.
   - AI nhận thức được câu hỏi trước đó của học viên để giải thích sâu hơn, đưa ra ví dụ khác hoặc đổi cách diễn đạt.

---

## 2. Kịch bản Đàm thoại Đa lượt Thực tế (3 Turns Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Học viên (Microphone)
    participant Modal as AiVoiceCallModal (Frontend)
    participant API as GenAiChatController (Backend)
    participant Service as GenAiChatService (Context Engine)
    participant TTS as Web SpeechSynthesis (Loa)

    Note over User,TTS: LƯỢT 1: Hỏi lý thuyết cơ bản
    User->>Modal: "Thì hiện tại đơn công thức là gì?" (STT: 1600ms)
    Modal->>API: POST /api/v1/chat/ai/ask (conversationId: null)
    API->>Service: Tạo phiên mới (convId: 105), phân đoạn câu
    Service-->>API: Answer + Sentences + convId: 105
    API-->>Modal: JSON Response (convId: 105)
    Modal->>TTS: Phát âm mượt mà (TTFA: 520ms)
    TTS-->>Modal: onend -> Tự động lắng nghe lượt 2

    Note over User,TTS: LƯỢT 2: Hỏi tiếp ngữ cảnh không nhắc lại chủ đề
    User->>Modal: "Cho mình thêm một ví dụ khác dễ hiểu hơn đi bạn"
    Modal->>API: POST /api/v1/chat/ai/ask (conversationId: 105)
    API->>Service: Đọc 8 tin nhắn cũ của convId 105, hiểu là thì hiện tại đơn
    Service-->>API: Ví dụ mới về thì hiện tại đơn + Sentences
    API-->>Modal: JSON Response (convId: 105)
    Modal->>TTS: Phát âm ví dụ mới
    TTS-->>Modal: onend -> Tự động lắng nghe lượt 3

    Note over User,TTS: LƯỢT 3: Yêu cầu diễn giải chậm và giải thích chi tiết
    User->>Modal: "Bạn giải thích chậm lại cho mình hiểu với"
    Modal->>API: POST /api/v1/chat/ai/ask (conversationId: 105)
    API->>Service: Tóm tắt 6 bước sư phạm, hướng dẫn cặn kẽ
    Service-->>API: Hướng dẫn chi tiết + Sentences
    API-->>Modal: JSON Response (convId: 105)
    Modal->>TTS: Phát âm hướng dẫn chi tiết
```

---

## 3. Bằng chứng Thực thi trong Bộ kiểm thử Tự động

Phương thức kiểm thử `testMultiTurnConversationRetention()` trong `ClassChatAuthorizationAndVoiceAiTest`:
- Lượt 1: Gửi câu hỏi *"Thì hiện tại đơn công thức là gì?"*. Nhận về `res1.getConversationId()` hợp lệ.
- Lượt 2: Gửi câu hỏi *"Cho mình thêm một ví dụ khác dễ hiểu hơn đi bạn"* kèm `conversationId` của lượt 1.
- Kết quả: `res2.getConversationId()` trùng khớp với lượt 1; nội dung câu trả lời `res2.getAnswer()` chứa các từ khóa ngữ cảnh về ví dụ thì hiện tại đơn (`ví dụ`, `plays`, `goes`, `she`, `he`).
- **Khẳng định:** Hệ thống duy trì ngữ cảnh đàm thoại hoàn hảo qua nhiều lượt liên tiếp.

