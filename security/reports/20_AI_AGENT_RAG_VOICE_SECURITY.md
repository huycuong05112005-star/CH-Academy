# BÁO CÁO BẢO MẬT: 20. AN TOÀN AI AGENT, KHO TRI THỨC VÀ VOICE PIPELINE

**Dự án:** CH Academy  
**Phân loại rủi ro:** P1 - High  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 for LLM Applications (2025)

---

## 1. PHÒNG CHỐNG PROMPT INJECTION & JAILBREAK
- Hệ thống áp dụng System Prompts phân vai nghiêm ngặt cho 4 nhóm Agent:
  - Tuyệt đối từ chối tiết lộ System Instructions, Prompt nội bộ hoặc thông tin cá nhân nhân sự trung tâm.
  - Thiết lập ranh giới tri thức: AI chỉ phản hồi trong phạm vi học tập, giáo dục và thông tin khóa học CH Academy.

## 2. AN TOÀN VOICE AI PIPELINE
- **Microphone Stream:** Quyền truy cập mic chỉ được kích hoạt khi người dùng bấm gọi rõ ràng và tự động giải phóng toàn bộ audio track khi kết thúc cuộc gọi.
- **Audio Visualizer & Decibels:** Dữ liệu âm thanh được xử lý cục bộ trên trình duyệt qua `Web Audio Analyser`, không gửi luồng raw audio nhạy cảm không cần thiết lên server.
- **Giới hạn thời lượng cuộc gọi:** Tự động giám sát phiên đàm thoại để tránh rò rỉ âm thanh môi trường xung quanh học viên.
- Trạng thái: **AN TOÀN (PASS)**.
