package vn.chacademy.chat.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.chat.dto.ChatConversationDto;
import vn.chacademy.chat.dto.ChatMemberDto;
import vn.chacademy.chat.dto.ChatMessageDto;
import vn.chacademy.chat.dto.SendMessageRequest;
import vn.chacademy.chat.service.ClassChatService;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat/classes")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ClassChatController {

    private final ClassChatService classChatService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản"));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ChatConversationDto>>> getMyConversations(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        List<ChatConversationDto> list = classChatService.getUserConversations(user);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getTotalUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        long count = classChatService.getTotalUnreadCount(user);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getMessages(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        List<ChatMessageDto> messages = classChatService.getConversationMessages(id, user);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/conversations/{id}/members")
    public ResponseEntity<ApiResponse<List<ChatMemberDto>>> getMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        List<ChatMemberDto> members = classChatService.getConversationMembers(id, user);
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<ChatMessageDto>> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        ChatMessageDto sent = classChatService.sendMessage(id, request, user);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi tin nhắn", sent));
    }

    @PostMapping("/conversations/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        classChatService.markAsRead(id, user);
        return ResponseEntity.ok(ApiResponse.success("Đã đánh dấu đã đọc", null));
    }
}

