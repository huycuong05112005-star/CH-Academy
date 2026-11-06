# FULL BACKEND API VALIDATION & BUSINESS WORKFLOW AUDIT

> **Scope:** 20 Core EdTech Business API Modules  
> **Protocol:** RESTful JSON over HTTP + JWT Bearer Authentication  
> **Status:** All Endpoints Audited & Schema Aligned  

---

## 1. 20 Core Business API Modules Matrix

| Module # | Business Domain | Primary Endpoints | Allowed Roles | Validation Status |
|:---:|:---|:---|:---|:---:|
| **1** | Authentication & OAuth | `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh` | Public | **Audited (Pass)** |
| **2** | User Management | `GET /api/v1/admin/users`, `PUT /api/v1/admin/users/{id}` | ADMIN, SUPER_ADMIN | **Audited (Pass)** |
| **3** | Student Management | `GET /api/v1/students`, `GET /api/v1/student-portal/dashboard` | ADMIN, STAFF, STUDENT | **Audited (Pass)** |
| **4** | Teacher Management | `GET /api/v1/teachers`, `GET /api/v1/teacher-portal/overview` | ADMIN, TEACHER | **Audited (Pass)** |
| **5** | Course Curriculum | `GET /api/v1/courses`, `POST /api/v1/courses` | ADMIN, STAFF, PUBLIC | **Audited (Pass)** |
| **6** | Class Management | `GET /api/v1/classes`, `POST /api/v1/classes` | ADMIN, TEACHER | **Audited (Pass)** |
| **7** | Enrollment Requests | `GET /api/v1/enrollment-requests`, `POST /api/v1/enrollments` | ADMIN, STAFF | **Audited (Pass)** |
| **8** | Academic Year Ecosystem | `GET /api/v1/academic-years`, `POST /api/v1/academic-years` | ADMIN, ALL (Read) | **Audited (Pass)** |
| **9** | Schedule & Attendance | `GET /api/v1/class-sessions`, `POST /api/v1/attendance/mark` | ADMIN, TEACHER | **Audited (Pass)** |
| **10** | Finance & Tuition Ledger| `GET /api/v1/finance/receivables`, `POST /api/v1/payments` | ADMIN, FINANCE | **Audited (Pass)** |
| **11** | Question Bank | `GET /api/v1/assessment/questions`, `POST /api/v1/assessment/questions` | ADMIN, TEACHER | **Audited (Pass)** |
| **12** | Exam Management | `GET /api/v1/assessment/exams`, `POST /api/v1/assessment/exams` | ADMIN, TEACHER, STUDENT | **Audited (Pass)** |
| **13** | Exam Grading & Scores | `GET /api/v1/assessment/grading`, `POST /api/v1/assessment/submissions/{id}/grade`| ADMIN, TEACHER | **Audited (Pass)** |
| **14** | Enterprise Analytics | `GET /api/v1/dashboard/stats?academicYear={year}` | ADMIN, STAFF | **Audited (Pass)** |
| **15** | Notifications | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/{id}/read` | ALL AUTHENTICATED | **Audited (Pass)** |
| **16** | Class Realtime Chat | `GET /api/v1/chat/channels`, `POST /api/v1/chat/messages` | TEACHER, STUDENT (Enrolled) | **Audited (Pass)** |
| **17** | AI Studio & Assistant | `POST /api/v1/ai/generate`, `POST /api/v1/ai/analyze-assessment` | ADMIN, TEACHER | **Audited (Pass)** |
| **18** | Knowledge Base Pipeline | `GET /api/v1/knowledge-base/documents`, `POST /api/v1/knowledge-base/upload` | ADMIN | **Audited (Pass)** |
| **19** | System Audit Logging | `GET /api/v1/audit/logs`, `GET /api/v1/audit/export` | SUPER_ADMIN, AUDITOR | **Audited (Pass)** |
| **20** | Unified Security Center | `GET /api/v1/security/alerts`, `POST /api/v1/security-admin/reset-password` | SUPER_ADMIN | **Audited (Pass)** |

---

## 2. API Contract & Data Flow Verification

```
Frontend Request 
  ↓ (Vite Proxy: /api -> http://localhost:8088)
Backend Gateway (Tomcat Port 8088)
  ↓
SecurityFilterChain (JwtAuthFilter, CORS, CSRF, Header Security)
  ↓
Spring MVC DispatcherServlet
  ↓
Business Controller (@RestController, @RequestMapping)
  ↓
DTO Validation (@Valid, JSR-380 Hibernate Validator)
  ↓
Service Layer (@Transactional, Business Rules & SecurityContext)
  ↓
Spring Data JPA Repository (52 Interfaces, Parameterized Queries)
  ↓
PostgreSQL Database (Tables, Foreign Keys, Indexes, Flyway V1-V30)
```

---

## 3. Security & Anti-IDOR Authorization Audit
- **Tenant & Object Isolation:** Endpoints serving teacher classes (`/api/v1/teacher-portal/*`) verify `teacher.userId == SecurityContext.userId`.
- **Student Data Privacy:** Students cannot query exam grades, schedules, or chat channels of classes they are not actively enrolled in (`403 Forbidden` response).
- **Academic Year Filtering:** The `academicYear` parameter is validated against registered academic year entities.
