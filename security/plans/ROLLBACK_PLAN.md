# KẾ HOẠCH ROLLBACK VÀ DỰ PHÒNG RỦI RO (ROLLBACK PLAN)

**Dự án:** CH Academy  
**Mục tiêu:** Đảm bảo hệ thống có khả năng phục hồi nguyên trạng nếu phát sinh lỗi không mong muốn trong quá trình triển khai cập nhật bảo mật.

---

## 1. SAO LƯU DỮ LIỆU TRƯỚC KHI TRIỂN KHAI (BACKUP)
Trước khi áp dụng migration trên môi trường production, thực hiện lệnh sao lưu:
```bash
docker exec -t ch_academy_postgres pg_dump -U ch_academy_user ch_academy > backup_ch_academy_pre_hardening.sql
```

## 2. QUY TRÌNH ROLLBACK MÃ NGUỒN (GIT)
Nếu cần khôi phục mã nguồn về commit trước đó:
```bash
git log -n 5
git revert <commit-hash>
# Hoặc khôi phục nhánh an toàn
git checkout main
```

## 3. QUY TRÌNH ROLLBACK CƠ SỞ DỮ LIỆU
Nếu cần khôi phục lại cột trong CSDL:
```sql
ALTER TABLE users ADD COLUMN raw_password VARCHAR(255);
```
Sau đó nạp lại bản backup nếu cần thiết.
