# CH ACADEMY — HỆ THỐNG AN NINH THÔNG TIN TOÀN DIỆN
## Tài liệu 02: Kiến trúc Zero Trust và Phân vùng Phòng thủ (Zero Trust Architecture & Network Zones)

---

## 1. MÔ HÌNH PHÂN VÙNG PHÒNG THỦ (MICRO-SEGMENTATION)

Kiến trúc mạng và dịch vụ của CH Academy được chia làm 3 vùng độc lập có kiểm soát nghiêm ngặt:

1. **Vùng Công cộng (Public Ingress Zone)**:
   - Điểm chạm bên ngoài: Trình duyệt người dùng (Client SPA), Webhook từ đối tác (Zalo OA).
   - Được bảo vệ bởi Reverse Proxy Nginx, SSL/TLS 1.3, Rate Limiting chống DDoS và Web Application Firewall (WAF) rule.

2. **Vùng Ứng dụng & Dịch vụ Nghiệp vụ (Application Zone)**:
   - Spring Boot Application Container chạy trên môi trường sandbox không cấp đặc quyền (non-root).
   - Tầng lọc Security Filter Chain kiểm soát toàn bộ Request Header, Bearer Token và Session State trước khi chuyển đến Controller.

3. **Vùng Lưu trữ Dữ liệu An toàn (Data Persistence Zone)**:
   - PostgreSQL 16 và Vector Store (RAG KB Chunks).
   - Chỉ chấp nhận kết nối nội bộ từ Container Backend thông qua mạng Docker Bridge cô lập, không công khai port ra Internet bên ngoài môi trường production.

---

## 2. QUY TẮC XÁC THỰC VÀ ỦY QUYỀN TRÊN MỖI TRANSACTION

Mọi luồng dữ liệu vào hệ thống đều phải vượt qua 4 chốt kiểm tra độc lập (4-Gate Verification):

```
HTTP Request
     |
     v
[ Gate 1: Rate Limiter & IP Reputation ] ---> Vượt ngưỡng? -> HTTP 429 Too Many Requests
     |
     v
[ Gate 2: JWT Integrity & Session Active ] --> Token sai / Phiên đã bị thu hồi? -> HTTP 401 Unauthorized
     |
     v
[ Gate 3: RBAC (Role-Based Access Control) ] -> Quyền hạn Role không đủ? -> HTTP 403 Forbidden
     |
     v
[ Gate 4: ABAC (Attribute-Based Access Control) ] -> Không đúng sở hữu / Niên khóa / Nhóm lớp? -> HTTP 403 Forbidden
     |
     v
Business Logic & Database Execution
```
