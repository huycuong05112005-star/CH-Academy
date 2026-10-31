package vn.chacademy.chat.dto;

import lombok.*;
import vn.chacademy.chat.entity.ChatMember;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMemberDto {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String role; // TEACHER, STUDENT, ADMIN
    private String avatarUrl;
    private Instant joinedAt;

    public static ChatMemberDto fromEntity(ChatMember m) {
        return ChatMemberDto.builder()
                .id(m.getId())
                .userId(m.getUser() != null ? m.getUser().getId() : null)
                .username(m.getUser() != null ? m.getUser().getUsername() : null)
                .fullName(m.getUser() != null ? m.getUser().getFullName() : "Người dùng")
                .email(m.getUser() != null ? m.getUser().getEmail() : null)
                .role(m.getRole())
                .avatarUrl(m.getUser() != null ? m.getUser().getAvatarUrl() : null)
                .joinedAt(m.getJoinedAt())
                .build();
    }
}
