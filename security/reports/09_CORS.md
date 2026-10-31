# BÁO CÁO BẢO MẬT: 09. CẤU HÌNH VÀ KIỂM SOÁT TÀI NGUYÊN GỐC CHÉO (CORS)

**Dự án:** CH Academy  
**Phân loại rủi ro:** P1 - High (CWE-942)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A05:2021 – Security Misconfiguration, Vibe Check Category 9

---

## 1. PHÂN TÍCH CẤU HÌNH HIỆN TẠI
- `SecurityConfig.java` cấu hình CORS với danh sách tên miền tin cậy được kiểm soát:
  - Frontend nội bộ: `http://localhost:5173`, `http://localhost:3000`.
  - Các method cho phép: GET, POST, PUT, DELETE, PATCH, OPTIONS.
  - Headers: `Authorization`, `Content-Type`, `X-Requested-With`, `Accept`.
  - Tuyệt đối không cho phép ký tự đại diện `*` khi `allowCredentials = true`.

## 2. KẾT QUẢ KIỂM THỬ THỰC TẾ
- Vibe Check Scanner gửi request với Origin độc hại `http://evil.com`:
  - `page: foreign origins are not allowed` -> **PASS**
  - `static asset: foreign origins are not allowed` -> **PASS**
  - `API localhost:8088/api/v1/health: foreign origins are not allowed` -> **PASS**
