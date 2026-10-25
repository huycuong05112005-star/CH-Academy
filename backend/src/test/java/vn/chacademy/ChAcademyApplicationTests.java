package vn.chacademy;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Kiểm thử tải context Spring Boot.
 *
 * <p>Test này xác nhận rằng toàn bộ cấu hình Spring Boot
 * được nạp thành công và ứng dụng có thể khởi động.</p>
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(locations = "classpath:application-test.properties")
class ChAcademyApplicationTests {

    @Test
    void contextLoads() {
        // Assert context loads successfully
    }
}
