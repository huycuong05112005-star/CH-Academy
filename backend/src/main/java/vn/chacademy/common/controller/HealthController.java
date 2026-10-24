package vn.chacademy.common.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Controller kiểm tra sức khỏe hệ thống.
 *
 * <p>Endpoint này dùng để xác nhận backend đang hoạt động bình thường.
 * Thường được gọi bởi load balancer, monitoring tool, hoặc frontend
 * để kiểm tra kết nối.</p>
 */
@RestController
@RequestMapping("/api/v1")
public class HealthController {

    /**
     * Kiểm tra sức khỏe cơ bản của ứng dụng.
     *
     * @return thông tin trạng thái và thời gian hiện tại của server
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        // Dùng LinkedHashMap để giữ thứ tự các trường trong JSON
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("service", "CH Academy Backend");
        response.put("version", "0.0.1-SNAPSHOT");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("message", "Hệ thống đang hoạt động bình thường");

        return ResponseEntity.ok(response);
    }
}
