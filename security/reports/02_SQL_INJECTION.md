# BÁO CÁO BẢO MẬT: 02. KIỂM SOÁT VÀ PHÒNG CHỐNG SQL INJECTION

**Dự án:** CH Academy  
**Phân loại rủi ro:** P1 - High (CVSS 8.2 / CWE-89)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A03:2021 – Injection, Vibe Check Category 2

---

## 1. PHẠM VI VÀ KIỂM SOÁT MÃ NGUỒN
Đã quét toàn bộ 48 Spring Data JPA Repositories và các Controller:
- `backend/src/main/java/vn/chacademy/*/repository/*Repository.java`
- Đã phân tích toàn bộ các câu truy vấn `@Query`, `EntityManager`, `JdbcTemplate`, `CriteriaBuilder`.

## 2. KẾT QUẢ PHÂN TÍCH
- Dự án sử dụng Spring Data JPA với Hibernate ORM 6.6.
- 100% các câu truy vấn động tìm kiếm sinh viên, khóa học, điểm thi đều sử dụng Parameterized Queries (`:keyword`, `?1`, `Specification<T>`).
- Không phát hiện hành vi nối chuỗi SQL trực tiếp (`"SELECT * FROM ... WHERE x = " + userInput`).
- Phân trang (`Pageable`) sử dụng `Sort.by(...)` đã được validate qua Enum thuộc tính Entity, chống kỹ thuật khai thác SQL Injection qua mệnh đề `ORDER BY`.

## 3. KẾT LUẬN & ĐỀ XUẤT PHÒNG THỦ
- Trạng thái: **AN TOÀN (PASS)**.
- Đề xuất: Tiếp tục duy trì quy tắc cấm sử dụng Native Query nối chuỗi động không kiểm soát trong các module tương lai.
