package vn.chacademy.chat.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.chat.dto.AiChatRequest;
import vn.chacademy.chat.dto.AiChatResponse;
import vn.chacademy.chat.dto.AiConversationDto;
import vn.chacademy.chat.dto.AiMessageDto;
import vn.chacademy.chat.service.GenAiChatService;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat/ai")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class GenAiChatController {

    private final GenAiChatService genAiChatService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản"));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<AiConversationDto>>> getMyAiConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        List<AiConversationDto> list = genAiChatService.getUserConversations(user);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<List<AiMessageDto>>> getAiMessages(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        List<AiMessageDto> messages = genAiChatService.getConversationMessages(id, user);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<AiChatResponse>> askAi(
            @Valid @RequestBody AiChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        AiChatResponse response = genAiChatService.askAi(request, user);
        return ResponseEntity.ok(ApiResponse.success("Trợ lý AI đã trả lời", response));
    }
}

