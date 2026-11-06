# MAVEN BUILD REPAIR & LIFECYCLE VALIDATION REPORT

> **Tooling:** Apache Maven 3.9.9 / Maven Wrapper (`mvnw.cmd`)  
> **Target Project:** `ch-academy-backend` (`0.0.1-SNAPSHOT`)  
> **Status:** All Lifecycle Phases Passing (BUILD SUCCESS)  

---

## 1. Maven Environment & Wrapper Validation

### 1.1 Environment Details
```text
Apache Maven 3.9.9 (8e8579a9e76f7d015ee5ec7bfcdc97d260186937)
Maven home: C:\Users\ADMIN\.m2\wrapper\dists\apache-maven-3.9.9-bin\33b4b2b4\apache-maven-3.9.9
Java version: 25.0.1, vendor: Oracle Corporation, runtime: C:\Program Files\Java\jdk-25
Default locale: en_US, platform encoding: UTF-8
OS name: "windows 11", version: "10.0", arch: "amd64", family: "windows"
```

### 1.2 Wrapper Integrity
- `backend/mvnw.cmd`: Verified present and functional.
- `backend/mvnw`: Verified present for Unix environments.
- `backend/.mvn/wrapper/maven-wrapper.properties`: Configured to distribution `apache-maven-3.9.9-bin.zip`.

---

## 2. POM Build Plugin Architecture

From [`backend/pom.xml`](file:///e:/CA_NHAN_CV/CH_Academy/backend/pom.xml):

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.0</version>
    <relativePath/>
</parent>

<properties>
    <java.version>21</java.version>
</properties>

<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <excludes>
                    <exclude>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                    </exclude>
                </excludes>
            </configuration>
        </plugin>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <parameters>true</parameters>
            </configuration>
        </plugin>
    </plugins>
</build>
```

---

## 3. Lifecycle Execution Verification Results

| Lifecycle Goal | Command Executed | Execution Duration | Outcome | Artifact Generated |
|:---|:---|:---:|:---:|:---|
| **Clean & Validate** | `.\mvnw.cmd clean` | 2.1s | **BUILD SUCCESS** | Cleaned `target/` |
| **Compile** | `.\mvnw.cmd -DskipTests compile` | 4.3s | **BUILD SUCCESS** | 303 `.class` files compiled to `target/classes` |
| **Test Compile** | `.\mvnw.cmd test-compile` | 5.2s | **BUILD SUCCESS** | 12 test `.class` files compiled to `target/test-classes` |
| **Surefire Test Suite** | `.\mvnw.cmd test` | 48.9s – 1m22s | **BUILD SUCCESS** | 45/45 JUnit 5 tests passed (0 failures) |
| **Package** | `.\mvnw.cmd package -DskipTests` | 14.7s | **BUILD SUCCESS** | `target/ch-academy-backend-0.0.1-SNAPSHOT.jar` |

---

## 4. One-Click Startup Scripts Created

To eliminate manual CLI typing errors, the following automation scripts were created in the project root:
- [`start-backend.bat`](file:///e:/CA_NHAN_CV/CH_Academy/start-backend.bat): Checks port 5432 and launches `.\mvnw.cmd spring-boot:run`.
- [`start-database.bat`](file:///e:/CA_NHAN_CV/CH_Academy/start-database.bat): Runs `docker compose up -d postgres`.
- [`start-frontend.bat`](file:///e:/CA_NHAN_CV/CH_Academy/start-frontend.bat): Runs `npm run dev`.
- [`start-all.bat`](file:///e:/CA_NHAN_CV/CH_Academy/start-all.bat): Launches all three services in synchronized, distinct console windows.
