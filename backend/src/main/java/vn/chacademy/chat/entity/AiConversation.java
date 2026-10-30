package vn.chacademy.chat.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.chacademy.identity.entity.User;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ai_conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "role", nullable = false, length = 50)
    private String role; // STUDENT, TEACHER, ADMIN, PUBLIC

    @Column(name = "portal", nullable = false, length = 50)
    @Builder.Default
    private String portal = "STUDENT"; // STUDENT, TEACHER, ADMIN, PUBLIC

    @Column(name = "channel", nullable = false, length = 50)
    @Builder.Default
    private String channel = "PORTAL"; // PORTAL, WEBSITE, ZALO, VOICE

    @Column(name = "agent_code", length = 100)
    @Builder.Default
    private String agentCode = "AGENT_STUDENT_TUTOR";

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, WAITING_HUMAN, AGENT_JOINED, CLOSED

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "guest_name", length = 150)
    private String guestName;

    @Column(name = "guest_phone", length = 50)
    private String guestPhone;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<AiMessage> messages = new ArrayList<>();
}
