# BÁO CÁO MỤC TIÊU TÁI CẤU TRÚC KIẾN TRÚC HỆ THỐNG (TARGET ARCHITECTURE)

## 1. MỤC TIÊU KIẾN TRÚC DÀI HẠN

Để đáp ứng khối lượng đào tạo hàng nghìn học viên, xử lý hàng trăm nghìn tin nhắn và các phiên Voice AI đồng thời, kiến trúc mục tiêu của CH Academy được thiết kế theo mô hình **Phân tách Độc lập theo Domain (Domain-Driven Service Separation)**:

```mermaid
graph TD
    subgraph ClientLayer [Client Applications]
        WebPortal["CH Academy Web & Mobile Responsive App"]
        DesktopApp["Electron / Desktop Wrapper (Optional)"]
        ZaloUser["Zalo OA Mobile Clients"]
    end

    subgraph APIGateway [API Gateway & Routing Layer]
        Traefik["Reverse Proxy / Nginx / Traefik Gateway (Port 80/443)"]
    end

    subgraph CoreServices [Core Education Services (Spring Boot / Java 25)]
        AuthService["Identity, Security & RBAC Service"]
        AcademicService["Courses, Classes, Schedule & Attendance"]
        AssessmentService["Exam Bank, Online Exam Engine & Auto-Grading"]
        FinanceService["Tuition, Receivables & Payment Reconciliation"]
        NotificationService["Multi-Channel Notification Dispatcher"]
    end

    subgraph RealtimeAndAIServices [Realtime & AI Services (FastAPI / Node SSE)]
        NexvaEngine["Nexva GenAI Gateway & RAG Pipeline"]
        VoiceRuntime["Realtime Voice Engine (VAD + WebRTC/WebSocket + FastPitch/EdgeTTS)"]
        ChatBroker["Chat & Presence Broker (WebSocket / Redis PubSub)"]
    end

    subgraph DataStorage [Persistent Storage & Cache]
        PostgreSQL[(PostgreSQL Master-Replica + PGVector)]
        RedisCache[(Redis Cluster: Cache, Sessions & PubSub)]
        S3Storage[(MinIO / S3: Learning Materials & Audio Recordings)]
    end

    ClientLayer --> APIGateway
    APIGateway --> CoreServices
    APIGateway --> RealtimeAndAIServices
    CoreServices --> PostgreSQL
    CoreServices --> RedisCache
    RealtimeAndAIServices --> RedisCache
    RealtimeAndAIServices --> PostgreSQL
    RealtimeAndAIServices --> S3Storage
    CoreServices --> S3Storage
```

---

## 2. NGUYÊN TẮC PHÂN TÁCH PHÂN HỆ

1. **Phân tách Rõ Ràng giữa Core ERP và AI Runtime:**
   - Hệ thống quản lý trường học (ERP) lưu giữ nguồn sự thật (Single Source of Truth) về lớp học, điểm danh, tài chính, kết quả thi.
   - AI Runtime đóng vai trò là lớp gia tăng giá trị (Augmentation Layer), kết nối với Core thông qua API hợp đồng chuẩn (`/api/v1/internal/*`).

2. **Cách ly Triệt để Ngữ cảnh và Bộ đếm (Zero Context Bleed):**
   - Không chia sẻ session state giữa các cổng.
   - Tin nhắn và thông báo chưa đọc được tính toán độc lập theo từng tài khoản thực tế (`user_id`).

3. **Cơ chế Streaming Thời gian thực theo Mô hình Nexva:**
   - Sử dụng `SentenceBuffer` để chia nhỏ văn bản từ LLM theo từng câu hoàn chỉnh.
   - Phát âm thanh dạng stream giúp giảm độ trễ giọng nói (Time-to-First-Audio) xuống dưới 400ms.

