# DASHBOARD DATA VALIDATION & REAL-METRIC VERIFICATION REPORT

> **Database:** PostgreSQL (CH Academy Production / Staging)  
> **Core Objective:** Validate strict data integrity, zero mock data, real SQL calculations, academic year scoping, and cross-portal security isolation.  
> **Status:** Fully Validated & Compliant  

---

## 1. Zero-Mock Data Policy & Validation Matrix

Every metric surfaced on Admin, Teacher, and Student Dashboards is sourced from actual relational rows in PostgreSQL.

| Metric | Source Database Table | Computation Logic | Mock Data Check |
|:---|:---|:---|:---:|
| **Total Students** | `enrollments`, `users` | Distinct count of student user IDs in active enrollments | **100% Real** |
| **Active Students** | `enrollments` | Count with `status = 'ACTIVE'` | **100% Real** |
| **Total Revenue** | `payments` | `SUM(amount)` where `payment_date BETWEEN start_date AND end_date` | **100% Real** |
| **Tuition Debt** | `courses`, `payments` | Expected tuition fees minus collected payments | **100% Real** |
| **Total Teachers** | `teachers` / `users` | `teacherRepository.count()` | **100% Real** |
| **Attendance Rate** | `attendance_records` | `(Attended Records / Total Records) * 100` | **100% Real** |
| **Monthly Trend** | `payments`, `enrollments` | Grouped by month of `payment_date` and `enrolled_at` | **100% Real** |
| **Top Courses** | `courses`, `enrollments` | Aggregated enrollments per course, sorted descending | **100% Real** |

---

## 2. Academic Year Scoping Verification

The academic year filter enforces strict temporal and relational boundaries:

### 2.1 Academic Year Boundaries
```java
// Logic from DashboardService.java
AcademicYear yearEntity = academicYearRepository.findByCode(selectedYear)
    .orElseGet(() -> academicYearRepository.findByIsActiveTrue().orElse(null));

LocalDate academicStartDate = (yearEntity != null) ? yearEntity.getStartDate() : LocalDate.of(currentYear, 1, 1);
LocalDate academicEndDate   = (yearEntity != null) ? yearEntity.getEndDate()   : LocalDate.of(currentYear, 12, 31);
```

### 2.2 Scoping Outcomes
- **When switching from "2024-2025" to "2025-2026":**
  - Classes query filters strictly: `classRepository.findByAcademicYear("2025-2026")`.
  - Payment revenue calculates strictly within `[2025-09-01, 2026-06-30]`.
  - Sessions displayed in the admin upcoming data table are filtered by `academicYear`.
  - Empty states render correctly with informative messaging if no sessions are scheduled for the selected year.

---

## 3. Teacher Dashboard Data Isolation

In `TeacherDashboardTab.tsx` and the teacher service layer:
- The teacher ID is extracted from the authenticated user's JWT token (`SecurityContextHolder.getContext().getAuthentication()`).
- Classes are retrieved via `teacherApi.getMyClasses()`:
  ```sql
  SELECT c.* FROM classes c WHERE c.teacher_id = :currentTeacherId
  ```
- **Anti-Data Leak Verification:** Teachers cannot access metrics, attendance sheets, or exam scores of classes assigned to other instructors.

---

## 4. Student Multi-Course Isolation & Anti-IDOR Verification

In `StudentDashboardTab.tsx`:
- When a student is enrolled in multiple courses (e.g., Course A and Course B):
  - **Schedule Isolation:** Selecting "Course A" displays only sessions matching `session.classId` for Course A.
  - **Attendance Calculation:** The attendance percentage is computed solely against sessions of the selected course.
  - **Exam & Assessment Isolation:** Only exams assigned to the active class/course are listed.
  - **Chat Integration:** The "Vào nhóm chat lớp" button links to the specific chat channel of the selected class (`/student?tab=chat&classId=...`).
- Students attempting to query non-enrolled courses receive an immediate `403 Forbidden` from the backend authorization layer.

---

## 5. Financial & Numerical Precision

- All financial calculations (`totalRevenue`, `pendingTuition`, monthly amounts) utilize `BigDecimal` in the backend service layer to prevent floating-point rounding discrepancies.
- Frontend displays formatted Vietnamese currency with `toLocaleString('vi-VN') + ' đ'`, handling billions and millions cleanly.

