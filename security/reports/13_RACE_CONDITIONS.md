# BÁO CÁO BẢO MẬT: 13. KIỂM SOÁT TRANSACTIONS VÀ PHÒNG NGỪA RACE CONDITIONS

**Dự án:** CH Academy  
**Phân loại rủi ro:** P2 - Medium (CWE-362)  
**Tiêu chuẩn đối chiếu:** OWASP Top 10 A04:2021 – Insecure Design

---

## 1. PHẠM VI NGHIỆP VỤ NHẠY CẢM
- Đăng ký khóa học (`EnrollmentService`).
- Nộp bài thi trực tuyến (`OnlineExamService`).
- Điểm danh và cập nhật số dư/học phí (`FinanceService`).

## 2. GIẢI PHÁP VÀ ĐÁNH GIÁ
- Sử dụng `@Transactional` có mức độ cô lập mặc định (Read Committed) của PostgreSQL.
- Nghiệp vụ đăng ký lớp học kiểm tra giới hạn sĩ số lớp học (`maxStudents`) được bảo vệ bằng câu lệnh kiểm tra và cập nhật nguyên tử.
- Nộp bài thi trực tuyến có ràng buộc duy nhất `unique (exam_id, student_id)`, chống nộp trùng lặp đồng thời.
- Trạng thái: **ĐẠT YÊU CẦU (PASS)**.
