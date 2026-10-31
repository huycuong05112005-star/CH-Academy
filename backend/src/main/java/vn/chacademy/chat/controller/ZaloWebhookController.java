package vn.chacademy.chat.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.chat.dto.AiChatRequest;
import vn.chacademy.chat.dto.AiChatResponse;
import vn.chacademy.chat.service.GenAiChatService;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/webhooks/zalo")
@RequiredArgsConstructor
@Slf4j
public class ZaloWebhookController {

    private final GenAiChatService genAiChatService;

    @Value("${zalo.webhook.secret:}")
    private String webhookSecret;

    @GetMapping
    public ResponseEntity<String> verifyWebhook(
            @RequestParam(value = "challenge", required = false) String challenge,
            @RequestParam(value = "hub.challenge", required = false) String hubChallenge) {
        String res = challenge != null ? challenge : (hubChallenge != null ? hubChallenge : "ZALO_WEBHOOK_READY");
        log.info("[Zalo Webhook] Nhận yêu cầu xác thực webhook: {}", res);
        return ResponseEntity.ok(res);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> handleZaloEvent(
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestHeader(value = "X-Zalo-Signature", required = false) String signature,
            @RequestHeader(value = "X-Zalo-Timestamp", required = false) String timestamp) {
        log.info("[Zalo Webhook] Nhận sự kiện webhook: payload={}", payload);

        if (webhookSecret != null && !webhookSecret.isBlank()) {
            if (signature == null || signature.isBlank()) {
                log.warn("[Zalo Webhook] Từ chối request vì thiếu chữ ký X-Zalo-Signature");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", 403, "message", "Missing X-Zalo-Signature"));
            }
        }

        if (payload == null) {
            return ResponseEntity.ok(Map.of("error", 0, "message", "Empty payload"));
        }

        try {
            // Trích xuất nội dung tin nhắn và người gửi nếu có
            String eventName = (String) payload.get("event_name");
            Map<?, ?> messageObj = (Map<?, ?>) payload.get("message");
            String senderId = (String) payload.get("sender");

            if ("user_send_text".equalsIgnoreCase(eventName) && messageObj != null) {
                String text = (String) messageObj.get("text");
                if (text != null && !text.isBlank()) {
                    AiChatRequest chatReq = AiChatRequest.builder()
                            .question(text)
                            .portal("PUBLIC")
                            .channel("ZALO")
                            .agentCode("AGENT_ADMISSIONS")
                            .sessionId("ZALO_" + senderId)
                            .build();

                    AiChatResponse aiRes = genAiChatService.askAi(chatReq, null);
                    log.info("[Zalo Webhook] AI đã phản hồi cho Zalo User {}: {}", senderId, aiRes.getAnswer());
                }
            }
        } catch (Exception ex) {
            log.error("[Zalo Webhook] Lỗi xử lý sự kiện: {}", ex.getMessage());
        }

        return ResponseEntity.ok(Map.of("error", 0, "message", "SUCCESS"));
    }
}

