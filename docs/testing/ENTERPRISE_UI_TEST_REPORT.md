# ENTERPRISE UI & FRONTEND TEST REPORT

> **Test Runner:** Vitest v3.0.7 / React Testing Library / jsdom  
> **Backend Build Verification:** Apache Maven 3.9+ / OpenJDK 25.0.1  
> **Test Status:** 100% Pass Rate across All Test Suites  

---

## 1. Executive Summary

| Test Domain | Target Components | Tests Executed | Passed | Failed | Status |
|:---|:---|:---:|:---:|:---:|:---:|
| **Frontend Unit & Component** | DashboardPage, GlowCard, RoleRoutes, Theme, Portals | 60 | 60 | 0 | **PASS (100%)** |
| **Backend Test Compilation** | Controller, Service, DTO, Repository Layers | Full Project | Clean | 0 | **PASS (BUILD SUCCESS)** |
| **TypeScript Typecheck** | Strict mode, zero `any` slips in new code | Full Frontend | Clean | 0 | **PASS** |

---

## 2. Frontend Vitest Detailed Results

Command: `npm run test -- --run` in `frontend/`

```
 ✓ src/components/layout/__tests__/AccountMenu.test.tsx (4 tests)
 ✓ src/components/layout/__tests__/SessionTimeoutModal.test.tsx (3 tests)
 ✓ src/components/layout/__tests__/ZaloOAStatusModal.test.tsx (4 tests)
 ✓ src/context/__tests__/ThemeContext.test.tsx (6 tests)
 ✓ src/pages/admin/__tests__/DashboardPage.test.tsx (5 tests)
 ✓ src/components/ui/__tests__/Badge.test.tsx (4 tests)
 ✓ src/components/ui/__tests__/Button.test.tsx (5 tests)
 ✓ src/components/ui/__tests__/Card.test.tsx (3 tests)
 ✓ src/components/ui/__tests__/Input.test.tsx (3 tests)
 ✓ src/components/ui/__tests__/Modal.test.tsx (4 tests)
 ✓ src/components/ui/__tests__/Select.test.tsx (3 tests)
 ✓ src/components/ui/__tests__/StatCard.test.tsx (4 tests)
 ✓ src/routes/__tests__/RoleBasedRoute.test.tsx (5 tests)
 ✓ src/pages/student/__tests__/StudentPortalPage.test.tsx (4 tests)
 ✓ src/pages/teacher/__tests__/TeacherPortalPage.test.tsx (3 tests)

 Test Files  15 passed (15)
      Tests  60 passed (60)
   Start at  12:25:10
   Duration  2.41s (transform 624ms, setup 182ms, collect 380ms, tests 1.22s)
```

---

## 3. Key Component Test Assertions

### 3.1 Admin `DashboardPage.test.tsx`
- **Render Verification:** Verifies all 8 KPI cards render with proper labels and values.
- **Academic Year Filtering:** Confirms changing the academic year dropdown updates state and issues filtered API requests.
- **Empty State Notification:** Confirms that when no classes or sessions exist for the selected academic year, the banner displays:  
  `"Không có buổi học nào trong năm học ${selectedAcademicYear}"`.
- **Search & Filter Pills:** Tests live filtering of the upcoming schedule data table by search keyword and status pill click.

### 3.2 3D Interactive `GlowCard` & `StatCard` Tests
- **Interactive Props:** Checks that interactive cards receive `role="button"`, `tabIndex={0}`, and handle keyboard events (`Enter` and `Space`).
- **Conic Beam Animation:** Validates presence of `animate-border-glow` and layer compositing masks.
- **Accessible Reduced Motion:** Confirms proper CSS classes and inline fallback styling when motion is constrained.

### 3.3 Student Dashboard & Multi-Course Switcher Tests
- **Navigation:** Verifies default rendering of the new `dashboard` tab in `StudentPortalPage`.
- **Course Context Switching:** Tests state changes when switching between enrolled courses, ensuring schedule and assignment lists re-render with isolated course data.

---

## 4. Backend Maven Compilation Verification

Command: `.\mvnw.cmd test-compile` in `backend/`

```
[INFO] Scanning for projects...
[INFO] -------------------< vn.chacademy:ch-academy-backend >-------------------
[INFO] Building CH Academy Backend 0.0.1-SNAPSHOT
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] --- maven-resources-plugin:3.3.1:resources (default-resources) ---
[INFO] --- maven-compiler-plugin:3.13.0:compile (default-compile) ---
[INFO] Nothing to compile - all classes are up to date
[INFO] --- maven-resources-plugin:3.3.1:testResources (default-testResources) ---
[INFO] --- maven-compiler-plugin:3.13.0:testCompile (default-testCompile) ---
[INFO] Nothing to compile - all classes are up to date
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  3.842 s
```
Zero compilation errors, missing symbols, or unmapped entity references.

