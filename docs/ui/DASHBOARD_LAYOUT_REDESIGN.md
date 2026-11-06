# DASHBOARD LAYOUT REDESIGN — NEXORA ENTERPRISE INTEGRATION

> **Target Platform:** CH Academy (Admin, Teacher, and Student Portals)  
> **Reference Model:** Nexora Analytics Workspace Layout  
> **Philosophy:** Adopt layout density, bi-column intelligence, and information hierarchy while 100% preserving CH Academy branding and multi-surface theming.

---

## 1. Architectural Layout Overview & Paradigm

CH Academy adopts an enterprise analytical workspace inspired by the Nexora layout structure.

```
+-----------------------------------------------------------------------------------------------+
| TOPBAR: Brand Logo | Global Search | Academic Year Selector | Notification Bell | User Profile |
+-----------------------------------------------------------------------------------------------+
| SIDEBAR   | PAGE HEADER: Title, Academic Year Badge, Sync Status, Refresh Action             |
|           | FILTER BAR: Search Query, Filter Badges (All/Active/Pending), Export Action       |
|           +----------------------------------------------------+------------------------------+
|           | PRIMARY WORKSPACE (Left Column ~66% Width)         | SECONDARY WORKSPACE (~34%)   |
|           |                                                    |                              |
|           | [KPI METRICS GRID: 4 Main Cards + 4 Sub-metrics]   | [OPERATIONAL ALERTS]         |
|           | - GlowCard with 3D hover & conic beam               | - Actionable warning items   |
|           |                                                    | - Real-time system flags     |
|           | [TREND & ANALYTICS VISUALS]                        |                              |
|           | - SVG Revenue & Enrollment Monthly Trend Chart     | [CATEGORY BREAKDOWN]         |
|           | - Dual line/bar visualization & Metric switcher    | - Top Performing Courses     |
|           |                                                    | - Progress & enrollment %    |
|           | [UPCOMING SCHEDULE & OPERATIONS DATA TABLE]        |                              |
|           | - Rich interactive table with status indicators    | [QUICK ACTIONS WIDGET]       |
|           | - Real-time filtering, search, and CSV export      | - Shortcuts to key tasks     |
+-----------+----------------------------------------------------+------------------------------+
```

---

## 2. Admin Dashboard Refinement (`DashboardPage.tsx`)

File Reference: [`frontend/src/pages/admin/DashboardPage.tsx`](file:///e:/CA_NHAN_CV/CH_Academy/frontend/src/pages/admin/DashboardPage.tsx)

### 2.1 Workspace Header & Filters
- **Personalized Admin Greeting:** Dynamic greeting with real current time and user avatar context.
- **Academic Year Isolation:** Strict filtering using `useAcademicYear()` hook.
- **Real-Time Data Timestamp:** "Cập nhật: [thời gian hiện tại]" with manual refresh capability.
- **Search & Filter Row:** Search input with live debounced filtering across class codes, subjects, and teacher names; filter pills (`Tất cả`, `Đã xếp lịch`, `Đang diễn ra`, `Đã hoàn thành`).

### 2.2 KPI Metric Matrix (8 Real Indicators)
All metrics are wrapped in interactive `StatCard` / `GlowCard` components with 3D hover elevation:
1. **Tổng học viên:** Active and total students enrolled.
2. **Doanh thu thực tế:** Sum of approved tuition payments for the selected academic year.
3. **Công nợ học phí:** Outstanding unpaid balances requiring collection.
4. **Tỷ lệ chuyên cần:** Calculated from actual attendance logs (`ATTENDED / TOTAL_LOGS`).
5. **Tổng giảng viên:** Active teaching staff assigned to classes.
6. **Lớp học hoạt động:** Total classes currently active in this academic year.
7. **Khóa học triển khai:** Active academic courses in curriculum.
8. **Buổi học hôm nay:** Scheduled sessions running on the current day.

### 2.3 Analytical Visual Section
- **TrendAnalyticsChart:** Custom lightweight SVG chart rendering 12-month trends for Revenue (`Doanh thu (VND)`) and Enrollment (`Học viên mới`). Includes line/bar view switcher.
- **DonutBreakdownChart:** Visual distribution of tuition status (`Đã thanh toán`, `Chờ xử lý`, `Quá hạn`).

### 2.4 Data Table & Secondary Workspace
- **Upcoming Sessions Table:** Formatted date, time, class code, course name, teacher badge, and session status badge. Includes quick action to export table data to CSV.
- **Right Column Operational Center (34%):**
  - **Trung tâm Cảnh báo:** Flags low-attendance sessions (<70%), classes missing assigned teachers, and high tuition debt balances.
  - **Top Khóa học:** Real dynamic list of courses sorted by active enrollments and fee generation.
  - **Thao tác nhanh:** Direct links to "Tạo lớp học mới", "Ghi nhận học phí", and "Điểm danh nhanh".

---

## 3. Teacher Dashboard Refinement (`TeacherDashboardTab.tsx`)

File Reference: [`frontend/src/pages/teacher/components/TeacherDashboardTab.tsx`](file:///e:/CA_NHAN_CV/CH_Academy/frontend/src/pages/teacher/components/TeacherDashboardTab.tsx)

### 3.1 8 Pedagogical KPIs
Implemented with `GlowCard`:
- **Lớp phụ trách:** Total classes assigned to current instructor.
- **Tổng học viên:** Sum of all enrolled students across teacher's classes.
- **Buổi dạy tuần này:** Sessions scheduled between Monday and Sunday of current week.
- **Buổi học kế tiếp:** Countdown to next scheduled class.
- **Cần điểm danh:** Finished sessions where attendance has not yet been submitted.
- **Bài kiểm tra chờ chấm:** Submitted student tests awaiting grading.
- **Bài tập cần xử lý:** Homework submissions awaiting review.
- **Thông báo mới:** Unread administrative notices.

### 3.2 Dual Column Layout
- **Left Column (Primary):**
  - Lịch giảng dạy hôm nay: Detailed timeline cards with start time, room code, and "Vào lớp / Điểm danh" action.
  - Lịch trình 7 ngày tới: Chronological table with date, time, and class information.
  - Danh sách lớp phụ trách: Matrix of active classes showing enrollment count and progress.
- **Right Column (Secondary):**
  - **Việc cần xử lý ngay:** Urgent cards for unsubmitted attendance sheets and pending exam evaluations.
  - **Phím tắt giảng viên:** "Nhập điểm nhanh", "Tạo bài kiểm tra", "Gửi thông báo lớp".

---

## 4. Student Dashboard Implementation (`StudentDashboardTab.tsx`)

File Reference: [`frontend/src/pages/student/StudentDashboardTab.tsx`](file:///e:/CA_NHAN_CV/CH_Academy/frontend/src/pages/student/StudentDashboardTab.tsx)

Previously, the Student Portal lacked a dedicated analytical overview tab, defaulting directly to the raw class list. We engineered `StudentDashboardTab.tsx` as the first-class `dashboard` tab in `StudentPortalPage.tsx`.

### 4.1 Multi-Course Context Switcher
Students often enroll in multiple courses concurrently. The header features an interactive Course Selector:
```
[Tất cả các khóa học] | [IELTS Intensive 6.5] | [Fullstack Web Developer] | ...
```
Selecting a specific course immediately filters the schedule, attendance percentage, GPA, exam roster, and class chat link without mixing data between courses.

### 4.2 8 Learning Metrics
1. **Khóa học đang học**
2. **Buổi học hoàn thành**
3. **Buổi học kế tiếp**
4. **Tỷ lệ chuyên cần**
5. **Điểm trung bình (GPA)**
6. **Bài tập cần nộp**
7. **Bài thi sắp tới**
8. **Thông báo chưa đọc**

### 4.3 Bi-Column Layout
- **Left Column (Primary):**
  - Buổi học kế tiếp & Lịch học trong tuần: Next immediate session card with room link.
  - Bài kiểm tra & Đánh giá: Table showing assigned tests, due dates, and real scores (`Đã chấm: 9.0/10` or `Chưa làm`).
  - Khóa học đang tham gia: Cards displaying progress bars and teacher info.
- **Right Column (Secondary):**
  - **Nhắc nhở học tập:** Dynamic alert for upcoming exam deadlines and session attendance.
  - **Kênh trao đổi lớp học:** One-click integration navigating directly to the Class Chat room.

---

## 5. Verification Checklist

| Aspect | Verification Status | Notes |
|:---|:---:|:---|
| **Bi-column 66/34 Ratio** | Verified | Responsive: stacks to single column on screens < 1024px. |
| **KPI Information Density** | Verified | 8 metrics per dashboard, neatly partitioned into primary and secondary rows. |
| **Integrated Search & Filters** | Verified | Dynamic search by class code, teacher, and subject with live filtering. |
| **Brand Integrity** | Verified | Preserved CH Academy oceanic navy, sky blue accents, and surface modes. |
| **Real Data Integrity** | Verified | Zero mock metrics; queries real backend endpoints. |

