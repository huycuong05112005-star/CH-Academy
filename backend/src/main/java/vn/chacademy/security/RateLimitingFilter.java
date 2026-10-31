package vn.chacademy.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Bộ lọc giới hạn tần suất yêu cầu (Rate Limiting Filter)
 * Bảo vệ hệ thống CH Academy khỏi tấn công Brute-force đăng nhập,
 * cạn kiệt tài nguyên máy chủ và phát sinh chi phí AI bất thường.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
@Slf4j
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000L; // Cửa sổ 1 phút

    // Giới hạn số lượng request cho từng nhóm endpoint
    private static final int MAX_LOGIN_PER_MIN = 10;
    private static final int MAX_PUBLIC_AI_PER_MIN = 20;
    private static final int MAX_AUTH_AI_PER_MIN = 60;
    private static final int MAX_UPLOAD_PER_MIN = 15;

    private static class RequestBucket {
        long windowStart;
        AtomicInteger count;

        RequestBucket(long now) {
            this.windowStart = now;
            this.count = new AtomicInteger(1);
        }
    }

    private final Map<String, RequestBucket> clientBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Bỏ qua các request OPTIONS (Preflight)
        if ("OPTIONS".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        int maxLimit = 0;
        String bucketType = null;

        if (path.startsWith("/api/v1/auth/login") && "POST".equalsIgnoreCase(method)) {
            maxLimit = MAX_LOGIN_PER_MIN;
            bucketType = "LOGIN";
        } else if (path.startsWith("/api/v1/chat/ai/public")) {
            maxLimit = MAX_PUBLIC_AI_PER_MIN;
            bucketType = "PUBLIC_AI";
        } else if (path.startsWith("/api/v1/chat/ai")) {
            maxLimit = MAX_AUTH_AI_PER_MIN;
            bucketType = "AUTH_AI";
        } else if (path.startsWith("/api/v1/files/upload") && "POST".equalsIgnoreCase(method)) {
            maxLimit = MAX_UPLOAD_PER_MIN;
            bucketType = "UPLOAD";
        }

        if (bucketType != null) {
            String clientIp = getClientIp(request);
            String bucketKey = bucketType + ":" + clientIp;
            long now = System.currentTimeMillis();

            cleanupExpiredBuckets(now);

            RequestBucket bucket = clientBuckets.compute(bucketKey, (k, v) -> {
                if (v == null || (now - v.windowStart) > WINDOW_MS) {
                    return new RequestBucket(now);
                }
                v.count.incrementAndGet();
                return v;
            });

            if (bucket.count.get() > maxLimit) {
                log.warn("Rate limit vượt ngưỡng cho client IP [{}] tại [{} {}] (Hiện tại: {}/{})",
                        clientIp, method, path, bucket.count.get(), maxLimit);

                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding("UTF-8");
                response.setHeader("Retry-After", "60");
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút.\",\"errorCode\":\"RATE_LIMIT_EXCEEDED\"}"
                );
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private void cleanupExpiredBuckets(long now) {
        if (clientBuckets.size() > 2000) {
            clientBuckets.entrySet().removeIf(entry -> (now - entry.getValue().windowStart) > WINDOW_MS);
        }
    }
}

