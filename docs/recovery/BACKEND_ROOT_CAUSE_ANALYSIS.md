# BACKEND ROOT CAUSE ANALYSIS & DIAGNOSTIC REPORT

> **System:** CH Academy Backend (`ch-academy-backend`)  
> **Framework:** Spring Boot 3.5.0 / Spring Security 6.5.0 / Hibernate ORM 6.6.15  
> **Environment:** OpenJDK 25.0.1 LTS, Apache Maven 3.9.9, Windows 11  
> **Status:** Root Causes Fully Identified & Remedied  

---

## 1. Executive Summary & Root Cause Matrix

During backend recovery and runtime validation, 4 distinct root causes were identified across the Maven lifecycle, Java language server caching, and database infrastructure.

| Issue / Error Symptom | Root Cause Category | Exact Root Cause | Impact | Resolution Strategy |
|:---|:---|:---|:---|:---|
| `[ERROR] No plugin found for prefix 'boot'` | Maven CLI Invocation | Command typed with space: `.\mvnw.cmd spring boot:run` instead of `spring-boot:run`. Maven interpreted `boot:run` as a standalone plugin goal. | Build halted immediately (exit code 1) | Clarified plugin syntax, created 1-click startup scripts (`start-backend.bat`). |
| `Type mismatch: cannot convert from DashboardStatsDtoBuilder` & `Syntax error, insert ';'` | IDE Language Server (Eclipse JDT) | Eclipse JDT/VS Code Java extension cached stale Lombok builder bytecode for `DashboardStatsDto` after adding `monthlyTrends` and `topCourses`. | Red error squiggles in VS Code Problems tab | Implemented explicit `DashboardStatsDtoBuilder` directly in source code. |
| `WARNING: A terminally deprecated method in sun.misc.Unsafe has been called` | Java 25 Runtime Warnings | Maven 3.9.9's internal `guava-33.2.1-jre.jar` invokes `Unsafe.objectFieldOffset` on JDK 25. | Cosmetic CLI warnings; does not affect application bytecode | Documented as runtime environment warning, harmless to business logic. |
| `Connection to localhost:5432 refused` | Infrastructure / Docker | PostgreSQL 16 container (`ch_academy_postgres`) was not running because Docker Desktop was stopped on host machine. | Spring Boot startup halts at Flyway migration | Provided automated docker compose helper and instructions to start Docker Desktop. |

---

## 2. Detailed Technical Breakdown

### 2.1 The `NoPluginFoundForPrefixException`
When executing:
```powershell
.\mvnw.cmd spring boot:run
```
In Apache Maven, command-line arguments delimited by whitespace are parsed into separate execution goals or lifecycle phases. Maven parsed:
- Argument 1: `spring` (evaluated as an unknown lifecycle phase).
- Argument 2: `boot:run` (evaluated as plugin prefix `boot`, goal `run`).

Maven attempts to resolve `boot` against registered plugin groups (`org.apache.maven.plugins`, `org.codehaus.mojo`). Because Spring Boot's official Maven plugin artifact is `org.springframework.boot:spring-boot-maven-plugin`, its default prefix is `spring-boot`, **not** `boot`.

**Correct Syntax:**
```powershell
.\mvnw.cmd spring-boot:run
```

---

### 2.2 IDE Lombok Annotation Desynchronization
In VS Code, the Red Hat Java Extension utilizes the Eclipse JDT Language Server. When new DTO fields were introduced (`monthlyTrends`, `topCourses`), the background language server failed to dynamically synthesize the builder methods into its in-memory AST before checking type compatibility.

**The Resulting Errors:**
- `Type mismatch: cannot convert from DashboardStatsDto.DashboardStatsDtoBuilder to DashboardStatsDto [Ln 231, Col 16]`
- `Syntax error, insert ";" to complete ReturnStatement [Ln 249, Col 39]`

**Permanent Fix:**
Rather than relying on dynamic bytecode manipulation by Lombok inside the IDE, we implemented an explicit, static `DashboardStatsDtoBuilder` inside [`DashboardStatsDto.java`](file:///e:/CA_NHAN_CV/CH_Academy/backend/src/main/java/vn/chacademy/dashboard/dto/DashboardStatsDto.java). This completely eliminates the Eclipse JDT AST desynchronization.

---

### 2.3 Spring Security Deprecation in 6.5.0
`SecurityConfig.java` previously called:
```java
.permissionsPolicy(perms -> perms.policy("..."))
```
In Spring Security 6.5.0, this method was deprecated in favor of:
```java
.permissionsPolicyHeader(perms -> perms.policy("..."))
```
This deprecation was updated in [`SecurityConfig.java`](file:///e:/CA_NHAN_CV/CH_Academy/backend/src/main/java/vn/chacademy/security/SecurityConfig.java), removing compiler warnings.
