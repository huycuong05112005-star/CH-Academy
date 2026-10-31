package vn.chacademy.chat.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "ai_agents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiAgent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", unique = true, nullable = false, length = 100)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "role_target", nullable = false, length = 50)
    private String roleTarget; // PUBLIC, STUDENT, TEACHER, ADMIN

    @Column(name = "scope", length = 50)
    @Builder.Default
    private String scope = "STUDENT_TUTOR"; // PUBLIC_ADMISSION, STUDENT_TUTOR, TEACHER_ASSISTANT, ADMIN_ASSISTANT

    @Column(name = "model", nullable = false, length = 100)
    @Builder.Default
    private String model = "google/gemini-2.5-flash";

    @Column(name = "system_prompt", nullable = false, columnDefinition = "TEXT")
    private String systemPrompt;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "PUBLISHED"; // DRAFT, PUBLISHED, PAUSED

    @Column(name = "temperature", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal temperature = BigDecimal.valueOf(0.3);

    @Column(name = "max_tokens")
    @Builder.Default
    private Integer maxTokens = 1000;

    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;

    @Column(name = "settings_json", columnDefinition = "TEXT")
    private String settingsJson;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "ai_agent_kb_links",
        joinColumns = @JoinColumn(name = "agent_id"),
        inverseJoinColumns = @JoinColumn(name = "kb_id")
    )
    @Builder.Default
    private Set<AiKnowledgeBase> knowledgeBases = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}

