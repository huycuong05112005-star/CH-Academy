# CH ACADEMY — HỆ THỐNG AN NINH THÔNG TIN TOÀN DIỆN
## Tài liệu 15: Quy trình Ứng phó Sự cố và Phục hồi Thảm họa (Incident Response & Disaster Recovery)

---

## 1. QUY TRÌNH ỨNG PHÓ SỰ CỐ AN NINH (5 BƯỚC CHUẨN)

Khi hệ thống ghi nhận cảnh báo mức độ `CRITICAL` tại Trung tâm An ninh Quản trị:

```
[ 1. Phát hiện & Phân loại ] ---> Hệ thống tạo Security Alert (CRITICAL/HIGH)
              |
              v
[ 2. Cô lập Ngay lập tức ] -----> Admin kích hoạt Remote Session Revocation & Tạm khóa User
              |
              v
[ 3. Điều tra & Ngăn chặn ] ----> Trích xuất Audit Logs & Phân tích IP/Dấu vết tấn công
              |
              v
[ 4. Khắc phục & Khôi phục ] ---> Vá lỗ hổng, Reset Token, Khôi phục dịch vụ an toàn
              |
              v
[ 5. Tổng kết & Đóng hồ sơ ] ---> Lập báo cáo sự cố (Post-Mortem Report) & Gia cố hệ thống
```

---

## 2. KẾ HOẠCH PHỤC HỒI THẢM HỌA (DISASTER RECOVERY PLAN)

1. **Sao lưu Cơ sở Dữ liệu Định kỳ (Automated Backups)**:
   - Thực hiện sao lưu toàn bộ (Full Backup) cơ sở dữ liệu PostgreSQL hàng ngày vào lúc 02:00 sáng.
   - Sao lưu nhật ký ghi trước (WAL - Write Ahead Logging) liên tục, hỗ trợ phục hồi dữ liệu về bất kỳ thời điểm nào trong vòng 30 ngày (Point-in-Time Recovery - PITR).

2. **Chỉ số Mục tiêu Phục hồi**:
   - **RPO (Recovery Point Objective)**: Dưới 15 phút (mất mát dữ liệu tối đa không quá 15 phút giao dịch gần nhất).
   - **RTO (Recovery Time Objective)**: Dưới 60 phút (khôi phục toàn bộ hệ thống hoạt động bình thường trong vòng 1 giờ kể từ khi xảy ra sự cố phần cứng hoặc thảm họa máy chủ).

3. **Kiểm tra Toàn vẹn Dữ liệu**:
   - Tệp backup được mã hóa bằng AES-256 trước khi đẩy lên bộ lưu trữ đám mây tách biệt.
   - Thử nghiệm phục hồi định kỳ hàng quý trên môi trường Staging để đảm bảo tính sẵn sàng của bản sao lưu.
