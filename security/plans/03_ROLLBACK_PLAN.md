# KẾ HOẠCH ROLLBACK VÀ DỰ PHÒNG RỦI RO (ROLLBACK PLAN)

**Dự án:** CH Academy  
**Mục tiêu:** Định nghĩa quy trình khôi phục trạng thái hoạt động trong trường hợp có sự cố phát sinh.

---

## 1. PHƯƠNG ÁN DỰ PHÒNG DỮ LIỆU (DATABASE BACKUP)
Trước khi nâng cấp hệ thống trên môi trường production, thực hiện sao lưu CSDL:
```bash
docker exec -t ch_academy_postgres pg_dump -U ch_academy_user ch_academy > backup_pre_hardening.sql
```

## 2. QUY TRÌNH ROLLBACK CƠ SỞ DỮ LIỆU (NẾU CẦN)
Nếu vì lý do tương thích nào đó cần bổ sung lại cột:
```sql
ALTER TABLE users ADD COLUMN raw_password VARCHAR(255);
```

## 3. QUY TRÌNH ROLLBACK MÃ NGUỒN (GIT)
Các thay đổi đã được đóng gói thành từng commit độc lập trên git:
```bash
git log -n 5 --oneline
# Nếu cần khôi phục lại commit trước đó:
git revert <commit-id>
```
