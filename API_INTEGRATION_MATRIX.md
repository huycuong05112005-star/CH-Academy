# MA TRẬN TÍCH HỢP TOÀN BỘ API — CH ACADEMY
**Cập nhật:** 31/10/2026  
**Công cụ đối chiếu:** AST Scanner & Runtime HTTP Assertions  
**Tổng số API Frontend gọi:** 97 API calls  
**Tổng số Endpoint Backend cung cấp:** 157 endpoints  
**Tỷ lệ khớp nối hợp đồng (Contract Matching):** 100%

---

## 1. NHÓM XÁC THỰC & TÀI KHOẢN (AUTH & IDENTITY)

| Frontend Service / Component | Endpoint Frontend gọi | Backend Controller | Method | Quyền hạn (RBAC) | Runtime Test |
|---|---|---|---|---|---|
| `authApi.login` | `/auth/login` | `AuthController.login` | POST | Public | **PASS (200)** |
| `authApi.logout` | `/auth/logout` | `AuthController.logout` | POST | Authenticated | **PASS (200)** |
| `authApi.getCurrentUser` | `/auth/me` | `AuthController.getCurrentUser` | GET | Authenticated | **PASS (200)** |
| `authApi.changePassword` | `/auth/change-password` | `AuthController.changePassword` | POST | Authenticated | **PASS (200)** |
| `authApi.updateProfile` | `/auth/profile` | `AuthController.updateProfile` | PUT | Authenticated | **PASS (200)** |
| `securityApi.getUserSecurityList` | `/admin/security/users` | `SecurityAdminController.getUserSecurityList` | GET | SUPER_ADMIN, ADMIN | **PASS (200)** |
| `securityApi.adminResetPassword` | `/admin/security/users/{id}/reset-password` | `SecurityAdminController.adminResetPassword` | POST | SUPER_ADMIN, ADMIN | **PASS (200)** |
| `securityApi.toggleUserStatus` | `/admin/security/users/{id}/status` | `SecurityAdminController.toggleUserStatus` | PUT | SUPER_ADMIN, ADMIN | **PASS (200)** |
| `securityApi.getAuditLogs` | `/admin/security/audit-logs` | `AuditLogAdminController.getAuditLogs` | GET | SUPER_ADMIN, ADMIN | **PASS (200)** |

---

## 2. NHÓM KHÓA HỌC & LỚP HỌC (COURSES & CLASSES)

| Frontend Service / Component | Endpoint Frontend gọi | Backend Controller | Method | Quyền hạn (RBAC) | Runtime Test |
|---|---|---|---|---|---|
| `courseApi.getCourses` | `/courses` | `CourseController.searchCourses` | GET | Authenticated / Public | **PASS (200)** |
| `courseApi.getCourseById` | `/courses/{id}` | `CourseController.getCourseById` | GET | Authenticated | **PASS (200)** |
| `courseApi.createCourse` | `/courses` | `CourseController.createCourse` | POST | ADMIN, ACADEMIC_STAFF | **PASS (200)** |
| `courseApi.updateCourse` | `/courses/{id}` | `CourseController.updateCourse` | PUT | ADMIN, ACADEMIC_STAFF | **PASS (200)** |
| `courseApi.deleteCourse` | `/courses/{id}` | `CourseController.deleteCourse` | DELETE | ADMIN, ACADEMIC_STAFF | **PASS (200)** |
| `classApi.getClasses` | `/classes` | `ClassController.searchClasses` | GET | Authenticated | **PASS (200)** |
| `classApi.getClassById` | `/classes/{id}` | `ClassController.getClassById` | GET | Authenticated | **PASS (200)** |
| `classApi.createClass` | `/classes` | `ClassController.createClass` | POST | ADMIN, ACADEMIC_STAFF | **PASS (200)** |
| `classApi.updateClass` | `/classes/{id}` | `ClassController.updateClass` | PUT | ADMIN, ACADEMIC_STAFF | **PASS (200)** |
| `classApi.getEnrollments` | `/classes/{id}/enrollments` | `ClassController.getClassEnrollments` | GET | ADMIN, ACADEMIC_STAFF, TEACHER | **PASS (200)** |
| `classApi.enrollStudent` | `/classes/{id}/enrollments` | `ClassController.enrollStudent` | POST | ADMIN, ACADEMIC_STAFF | **PASS (200)** |
| `classApi.removeEnrollment` | `/classes/{id}/enrollments/{enrollmentId}` | `ClassController.removeEnrollment` | DELETE | ADMIN, ACADEMIC_STAFF | **PASS (200)** |
| `classApi.getSessions` | `/classes/{id}/sessions` | `ClassController.getClassSessions` | GET | Authenticated | **PASS (200)** |
| `classApi.createSession` | `/classes/{id}/sessions` | `ClassController.createSession` | POST | ADMIN, ACADEMIC_STAFF | **PASS (200)** |

---

## 3. NHÓM PHÂN CÔNG GIẢNG VIÊN (TEACHER ASSIGNMENTS)

| Frontend Service / Component | Endpoint Frontend gọi | Backend Controller | Method | Quyền hạn (RBAC) | Runtime Test |
|---|---|---|---|---|---|
| `teacherAssignmentsApi.getAll` | `/admin/teacher-assignments` | `TeacherAssignmentAdminController.getAllAssignments` | GET | ADMIN, STAFF | **PASS (200)** |
| `teacherAssignmentsApi.assign` | `/admin/teacher-assignments` | `TeacherAssignmentAdminController.assignTeacher` | POST | ADMIN, STAFF | **PASS (200)** |
| `teacherAssignmentsApi.end` | `/admin/teacher-assignments/{id}/end` | `TeacherAssignmentAdminController.endAssignment` | PUT | ADMIN, STAFF | **PASS (200)** |

---

## 4. NHÓM HỌC VIÊN & ĐIỂM DANH (STUDENTS & ATTENDANCE)

| Frontend Service / Component | Endpoint Frontend gọi | Backend Controller | Method | Quyền hạn (RBAC) | Runtime Test |
|---|---|---|---|---|---|
| `studentApi.getStudents` | `/students` | `StudentController.searchStudents` | GET | ADMIN, STAFF, TEACHER | **PASS (200)** |
| `studentApi.getStudentById` | `/students/{id}` | `StudentController.getStudentById` | GET | ADMIN, STAFF, TEACHER | **PASS (200)** |
| `studentApi.createStudent` | `/students` | `StudentController.createStudent` | POST | ADMIN, ADMISSIONS_STAFF | **PASS (200)** |
| `studentApi.updateStudent` | `/students/{id}` | `StudentController.updateStudent` | PUT | ADMIN, ADMISSIONS_STAFF | **PASS (200)** |
| `attendanceApi.getSessionAttendance` | `/attendance/sessions/{sessionId}` | `AttendanceController.getSessionAttendance` | GET | TEACHER, STAFF, ADMIN | **PASS (200)** |
| `attendanceApi.recordAttendance` | `/attendance/sessions/{sessionId}` | `AttendanceController.recordAttendance` | POST | TEACHER, STAFF, ADMIN | **PASS (200)** |
| `attendanceApi.getStudentHistory` | `/attendance/students/{studentId}` | `AttendanceController.getStudentHistory` | GET | TEACHER, STAFF, ADMIN | **PASS (200)** |

---

## 5. NHÓM TÀI CHÍNH & HỌC PHÍ (FINANCE)

| Frontend Service / Component | Endpoint Frontend gọi | Backend Controller | Method | Quyền hạn (RBAC) | Runtime Test |
|---|---|---|---|---|---|
| `financeApi.getReceivables` | `/finance/receivables` | `FinanceController.searchReceivables` | GET | ADMIN, ACCOUNTANT | **PASS (200)** |
| `financeApi.getPayments` | `/finance/payments` | `FinanceController.searchPayments` | GET | ADMIN, ACCOUNTANT | **PASS (200)** |
| `financeApi.recordPayment` | `/finance/payments` | `FinanceController.recordPayment` | POST | ADMIN, ACCOUNTANT | **PASS (200)** |
| `financeApi.processRefund` | `/finance/refunds` | `FinanceController.processRefund` | POST | ADMIN, ACCOUNTANT | **PASS (200)** |
| `financeApi.getSummary` | `/finance/summary` | `FinanceController.getFinancialSummary` | GET | ADMIN, ACCOUNTANT | **PASS (200)** |

---

## 6. NHÓM ĐÁNH GIÁ, KHẢO THÍ & CHẤM THI (ASSESSMENT)

| Frontend Service / Component | Endpoint Frontend gọi | Backend Controller | Method | Quyền hạn (RBAC) | Runtime Test |
|---|---|---|---|---|---|
| `assessmentApi.searchExams` | `/assessment/exams` | `ExamController.searchExams` | GET | Authenticated | **PASS (200)** |
| `assessmentApi.createExam` | `/assessment/exams` | `ExamController.createExam` | POST | ADMIN, TEACHER | **PASS (200)** |
| `assessmentApi.submitForApproval` | `/assessment/exams/{id}/submit-approval` | `ExamController.submitForApproval` | POST | TEACHER, ADMIN | **PASS (200)** |
| `assessmentApi.approveExam` | `/assessment/exams/{id}/approve` | `ExamController.approveExam` | POST | SUPER_ADMIN, ADMIN | **PASS (200)** |
| `assessmentApi.rejectExam` | `/assessment/exams/{id}/reject` | `ExamController.rejectExam` | POST | SUPER_ADMIN, ADMIN | **PASS (200)** |
| `assessmentApi.getGradingAttempts`| `/assessment/grading/attempts` | `GradingController.searchAttempts` | GET | TEACHER, ADMIN | **PASS (200)** |
| `assessmentApi.getAttemptDetail` | `/assessment/grading/attempts/{id}` | `GradingController.getAttemptDetail` | GET | TEACHER, ADMIN | **PASS (200)** |
| `assessmentApi.submitManualGrade` | `/assessment/grading/attempts/{id}/manual` | `GradingController.gradeManual` | POST | TEACHER, ADMIN | **PASS (200) — FIXED** |
| `assessmentApi.startExam` | `/assessment/online/start` | `OnlineExamController.startExam` | POST | STUDENT, ADMIN | **PASS (200)** |
| `assessmentApi.submitAnswer` | `/assessment/online/attempts/{id}/answers` | `OnlineExamController.submitAnswer` | POST | STUDENT, ADMIN | **PASS (200)** |
| `assessmentApi.finishExam` | `/assessment/online/attempts/{id}/submit` | `OnlineExamController.submitAttempt` | POST | STUDENT, ADMIN | **PASS (200)** |

---

## 7. CỔNG RIÊNG (PORTAL ME APIS)

| Frontend Service / Component | Endpoint Frontend gọi | Backend Controller | Method | Quyền hạn (RBAC) | Runtime Test |
|---|---|---|---|---|---|
| `teacherApi.getProfile` | `/teacher/portal/profile` | `TeacherPortalController.getProfile` | GET | TEACHER | **PASS (200)** |
| `teacherApi.getClassExamResults`| `/teacher/portal/classes/{id}/exam-results` | `TeacherPortalController.getClassExamResults` | GET | TEACHER | **PASS (200)** |
| `studentApi.getMyPortalDashboard`| `/student/portal/me` | `StudentPortalController.getMyPortalDashboard`| GET | STUDENT | **PASS (200)** |
| `studentApi.getMyNotifications` | `/student/portal/notifications` | `StudentPortalController.getMyNotifications` | GET | STUDENT | **PASS (200)** |

