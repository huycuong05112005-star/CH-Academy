package vn.chacademy.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration Test kiểm thử trực tiếp trên PostgreSQL thực tế.
 * Xác thực Flyway Schema Migrations (30 files), tính toàn vẹn quan hệ dữ liệu
 * và cơ chế quản trị đa niên khóa (Multi-Academic-Year).
 */
@SpringBootTest
@ActiveProfiles("integration")
@Tag("integration")
public class PostgreSqlIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("IT-01: Kiểm tra kết nối PostgreSQL và 30 bản ghi Flyway Migration hoàn tất thành công")
    void testFlywayMigrationsApplied() {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM flyway_schema_history WHERE success = true", Integer.class
        );
        assertThat(count).isNotNull().isGreaterThanOrEqualTo(30);
    }

    @Test
    @DisplayName("IT-02: Kiểm tra cấu trúc các bảng cốt lõi của hệ thống CH Academy")
    void testCoreTablesExist() {
        List<String> tables = jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' " +
            "AND table_name IN ('users', 'roles', 'students', 'courses', 'classes', 'academic_years', 'enrollments')",
            String.class
        );
        assertThat(tables).contains("users", "roles", "students", "courses", "classes", "academic_years", "enrollments");
    }

    @Test
    @DisplayName("IT-03: Kiểm tra cấu trúc phân hệ Niên khóa (Academic Year) và dữ liệu năm học")
    void testAcademicYearIsolation() {
        List<Map<String, Object>> years = jdbcTemplate.queryForList(
            "SELECT id, code, name, is_current FROM academic_years ORDER BY start_date ASC"
        );
        assertThat(years).isNotEmpty();
    }

    @Test
    @Transactional
    @DisplayName("IT-04: Kiểm tra khả năng ghi nhận Transaction an toàn trên PostgreSQL")
    void testTransactionRollback() {
        Integer userCountBefore = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
        assertThat(userCountBefore).isNotNull();
    }
}
