package vn.chacademy;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Kiểm thử tải context Spring Boot.
 *
 * <p>Test này xác nhận rằng toàn bộ cấu hình Spring Boot
 * được nạp thành công và ứng dụng có thể khởi động.</p>
 */
@SpringBootTest
@ActiveProfiles("test")
class ChAcademyApplicationTests {

    @Test
    void contextLoads() {
        // Assert context loads successfully
    }
}
