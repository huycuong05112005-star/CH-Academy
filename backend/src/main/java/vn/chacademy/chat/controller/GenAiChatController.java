package vn.chacademy.chat.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.chat.dto.*;
import vn.chacademy.chat.service.AiStudioService;
import vn.chacademy.chat.service.GenAiChatService;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/chat/ai")
@RequiredArgsConstructor
public class GenAiChatController {

    private final GenAiChatService genAiChatService;
    private final AiStudioService aiStudioService;
    private final UserRepository userRepository;
    private final vn.chacademy.chat.service.PortalAgentResolver portalAgentResolver;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản"));
    }

    // ==========================================
    // 0. CẤU HÌNH VÀ RESOLVE AGENT THEO PORTAL
    // ==========================================

    @GetMapping("/portal-config")
    public ResponseEntity<ApiResponse<PortalConfigDto>> getPortalConfig(
            @RequestParam(required = false) String portal,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = (userDetails != null) ? userRepository.findByUsername(userDetails.getUsername()).orElse(null) : null;
        PortalConfigDto config = portalAgentResolver.getPortalConfig(portal, user);
        return ResponseEntity.ok(ApiResponse.success(config));
    }

    @GetMapping("/voice/diagnostics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getVoiceDiagnostics() {
        return ResponseEntity.ok(ApiResponse.success("Kiểm tra Voice AI Runtime thành công", genAiChatService.getVoiceDiagnostics()));
    }

    // ==========================================
    // 1. CỔNG XÁC THỰC (AUTHENTICATED PORTALS)
    // ==========================================

    @GetMapping("/conversations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AiConversationDto>>> getMyAiConversations(
            @RequestParam(required = false) String portal,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        List<AiConversationDto> userConversations = genAiChatService.getUserConversations(user, portal);
        return ResponseEntity.ok(ApiResponse.success(userConversations));
    }

    @GetMapping("/conversations/{id}/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<AiMessageDto>>> getAiMessages(
            @PathVariable Long id,
            @RequestParam(required = false) String portal,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        List<AiMessageDto> conversationMessages = genAiChatService.getConversationMessages(id, user, portal);
        return ResponseEntity.ok(ApiResponse.success(conversationMessages));
    }

    @PostMapping("/ask")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AiChatResponse>> askAi(
            @Valid @RequestBody AiChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        AiChatResponse response = genAiChatService.askAi(request, user);
        return ResponseEntity.ok(ApiResponse.success("Trợ lý AI đã trả lời", response));
    }

    @PostMapping("/conversations/{id}/handoff")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> requestHumanHandoff(
            @PathVariable Long id,
            @RequestParam(required = false) String portal,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        genAiChatService.markHandoff(id, user, portal);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu chuyển nhân viên tư vấn đã được ghi nhận", "HANDOFF_REQUESTED"));
    }

    // ==========================================
    // 2. CỔNG CÔNG KHAI (PUBLIC WEBSITE GUEST)
    // ==========================================

    @GetMapping("/public/conversations")
    public ResponseEntity<ApiResponse<List<AiConversationDto>>> getPublicConversations(
            @RequestParam String sessionId) {
        List<AiConversationDto> publicConversations = genAiChatService.getPublicConversations(sessionId);
        return ResponseEntity.ok(ApiResponse.success(publicConversations));
    }

    @GetMapping("/public/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<List<AiMessageDto>>> getPublicMessages(
            @PathVariable Long id,
            @RequestParam String sessionId) {
        List<AiMessageDto> publicMessages = genAiChatService.getPublicConversationMessages(id, sessionId);
        return ResponseEntity.ok(ApiResponse.success(publicMessages));
    }

    @PostMapping("/public/ask")
    public ResponseEntity<ApiResponse<AiChatResponse>> askPublicAi(
            @Valid @RequestBody AiChatRequest request) {
        request.setPortal("PUBLIC");
        request.setChannel("WEBSITE");
        request.setAgentCode("AGENT_ADMISSIONS");
        AiChatResponse response = genAiChatService.askAi(request, null);
        return ResponseEntity.ok(ApiResponse.success("Chuyên viên tư vấn AI đã trả lời", response));
    }

    @PostMapping("/public/lead")
    public ResponseEntity<ApiResponse<AiLeadDto>> submitLead(
            @Valid @RequestBody CreateLeadRequest request) {
        AiLeadDto lead = aiStudioService.createLead(request);
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận thông tin tư vấn thành công", lead));
    }
}
