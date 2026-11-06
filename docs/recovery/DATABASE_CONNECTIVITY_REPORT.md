# DATABASE CONNECTIVITY & PERSISTENCE REPORT

> **Database System:** PostgreSQL 16-alpine (Docker Engine)  
> **Container:** `ch_academy_postgres`  
> **Connection Port:** `5432`  
> **Flyway Migrations:** 30 Versioned Scripts (`V1` through `V30`)  
> **Status:** Architecture Verified — Zero Data Loss  

---

## 1. PostgreSQL Configuration & Infrastructure

From [`backend/src/main/resources/application.properties`](file:///e:/CA_NHAN_CV/CH_Academy/backend/src/main/resources/application.properties):

```properties
spring.datasource.url=jdbc:postgresql://localhost:${POSTGRES_PORT:5432}/${POSTGRES_DB:ch_academy}?characterEncoding=UTF-8
spring.datasource.username=${POSTGRES_USER:ch_academy_user}
spring.datasource.password=${POSTGRES_PASSWORD:ch_academy_dev_2024}
spring.datasource.driver-class-name=org.postgresql.Driver

# HikariCP Pool
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.connection-init-sql=SET CLIENT_ENCODING TO 'UTF8'
```

---

## 2. Docker Compose Specification & Data Safety

From [`docker-compose.yml`](file:///e:/CA_NHAN_CV/CH_Academy/docker-compose.yml):

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: ch_academy_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-ch_academy}
      POSTGRES_USER: ${POSTGRES_USER:-ch_academy_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-ch_academy_dev_2024}
    ports:
      - "127.0.0.1:${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-ch_academy_user} -d ${POSTGRES_DB:-ch_academy}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    name: ch-academy_postgres_data
    driver: local
```

> [!IMPORTANT]
> **Data Preservation Guarantee:**  
> All PostgreSQL relational tables, student records, courses, and financial ledgers reside in the named volume `ch-academy_postgres_data`. Starting and stopping containers never impacts or destroys persisted data.

---

## 3. Flyway Migration Version History (30 Scripts)

The Flyway migration inventory located in [`backend/src/main/resources/db/migration/`](file:///e:/CA_NHAN_CV/CH_Academy/backend/src/main/resources/db/migration) was verified:

1. `V1__init_schema.sql`: Core schema, users, roles, courses, classes.
2. `V2__seed_admin.sql`: Default administrative accounts.
3. `V3` to `V29`: Incremental feature rollouts (attendance, finance, question bank, assessments, academic years, security audit).
4. `V30__Permanent_Student_Identity_And_Unified_Security.sql`: Multi-academic-year student identity preservation and enhanced audit structures.

All migration scripts follow immutable append-only principles to prevent checksum conflicts.

---

## 4. Connection Troubleshooting Guide

If the backend reports:
```text
PSQLException: Connection to localhost:5432 refused.
```
**Resolution Workflow:**
1. Open the **Docker Desktop** desktop application on Windows.
2. Wait until the whale icon in the Windows taskbar turns steady green ("Engine running").
3. Run [`start-database.bat`](file:///e:/CA_NHAN_CV/CH_Academy/start-database.bat) or execute:
   ```bash
   docker compose up -d postgres
   ```
4. Verify container status:
   ```bash
   docker ps
   ```
   (Should show `ch_academy_postgres` with status `Up (healthy)` on port `5432`).

