# BÁO CÁO TOÀN VẸN CƠ SỞ DỮ LIỆU — CH ACADEMY
**Hệ quản trị CSDL:** PostgreSQL 16.15 Alpine  
**Database Name:** `ch_academy`  
**Flyway Migration Status:** 21 migrations hoàn tất (`V1` đến `V21`), 0 lỗi.

---

## 1. THỐNG KÊ SCHEMA VÀ BẢNG DỮ LIỆU

- **Tổng số bảng:** 39 bảng
- **Khóa chính (Primary Key):** 100% các bảng đều có khóa chính kiểu `BIGSERIAL` (ID định danh số tăng dần) hoặc `VARCHAR` chuẩn hóa (như mã quyền, mã vai trò).
- **Ràng buộc duy nhất (Unique Constraints):**
  - `users.username`, `users.email`
  - `students.student_code`
  - `teachers.teacher_code`
  - `classes.code`
  - `courses.code`
  - `exam_attempts.idempotency_key` (chống nộp bài trùng lặp)
  - `notification_reads(notification_id, user_id)` (chống trùng lặp lượt đọc)

---

## 2. KẾT QUẢ KIỂM TRA BẢN GHI MỒ CÔI (ORPHAN RECORDS CHECK)

Thực hiện truy vấn SQL kiểm tra toàn bộ các cặp quan hệ Foreign Key chính trong hệ thống:

```sql
SELECT 'enrollments -> student', count(*) FROM enrollments e LEFT JOIN students s ON e.student_id = s.id WHERE s.id IS NULL
UNION ALL
SELECT 'enrollments -> class', count(*) FROM enrollments e LEFT JOIN classes c ON e.class_id = c.id WHERE c.id IS NULL
UNION ALL
SELECT 'classes -> course', count(*) FROM classes c LEFT JOIN courses co ON c.course_id = co.id WHERE co.id IS NULL
UNION ALL
SELECT 'class_sessions -> class', count(*) FROM class_sessions cs LEFT JOIN classes c ON cs.class_id = c.id WHERE c.id IS NULL
UNION ALL
SELECT 'attendance_records -> session', count(*) FROM attendance_records ar LEFT JOIN class_sessions cs ON ar.session_id = cs.id WHERE cs.id IS NULL
UNION ALL
SELECT 'exam_attempts -> exam', count(*) FROM exam_attempts ea LEFT JOIN exams ex ON ea.exam_id = ex.id WHERE ex.id IS NULL
UNION ALL
SELECT 'exam_attempts -> student', count(*) FROM exam_attempts ea LEFT JOIN students s ON ea.student_id = s.id WHERE s.id IS NULL
UNION ALL
SELECT 'attempt_answers -> attempt', count(*) FROM attempt_answers aa LEFT JOIN exam_attempts ea ON aa.attempt_id = ea.id WHERE ea.id IS NULL
UNION ALL
SELECT 'receivables -> student', count(*) FROM receivables r LEFT JOIN students s ON r.student_id = s.id WHERE s.id IS NULL
UNION ALL
SELECT 'payments -> student', count(*) FROM payments p LEFT JOIN students s ON p.student_id = s.id WHERE s.id IS NULL;
```

**Kết quả thực tế:**
| Mối quan hệ đối chiếu | Số bản ghi mồ côi | Đánh giá |
|---|---|---|
| `enrollments` $\rightarrow$ `students` | **0** | Toàn vẹn 100% |
| `enrollments` $\rightarrow$ `classes` | **0** | Toàn vẹn 100% |
| `classes` $\rightarrow$ `courses` | **0** | Toàn vẹn 100% |
| `class_sessions` $\rightarrow$ `classes` | **0** | Toàn vẹn 100% |
| `attendance_records` $\rightarrow$ `class_sessions` | **0** | Toàn vẹn 100% |
| `exam_attempts` $\rightarrow$ `exams` | **0** | Toàn vẹn 100% |
| `exam_attempts` $\rightarrow$ `students` | **0** | Toàn vẹn 100% |
| `attempt_answers` $\rightarrow$ `exam_attempts` | **0** | Toàn vẹn 100% |
| `receivables` $\rightarrow$ `students` | **0** | Toàn vẹn 100% |
| `payments` $\rightarrow$ `students` | **0** | Toàn vẹn 100% |

---

## 3. RÀNH GIỚI TRANSACTION VÀ TÍNH ĐỒNG BỘ DỮ LIỆU

1. **Ghi danh học viên & Tài chính:**
   - Khi ghi danh học viên vào lớp (`classService.enrollStudent`), nghiệp vụ tự động sinh công nợ học phí (`Receivable`) tương ứng. Toàn bộ nằm trong `@Transactional` của Spring Data JPA. Nếu sinh công nợ lỗi, việc ghi danh tự động rollback.
2. **Nộp bài và Chấm điểm tự luận:**
   - Đã chuẩn hóa: `gradeManualAttempt` chạy hoàn toàn trong `@Transactional`, bảo đảm tổng điểm bài thi, trạng thái `isPassed`, các bản ghi `attempt_answers`, và nhật ký kiểm toán `audit_logs` được ghi nhận nguyên khối (atomic).
3. **Connection Pool (HikariCP):**
   - Cấu hình: `maximum-pool-size=10`, `minimum-idle=2`, `connection-timeout=30000ms`, `idle-timeout=600000ms`.
   - Kết nối cơ sở dữ liệu ổn định, không xuất hiện rò rỉ kết nối (leak connections).

