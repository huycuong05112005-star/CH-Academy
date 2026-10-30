package vn.chacademy.chat.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "ai_flows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiFlow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private AiAgent agent;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "graph_json", nullable = false, columnDefinition = "TEXT")
    private String graphJson;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, PUBLISHED

    @Column(name = "trigger_type", length = 50)
    @Builder.Default
    private String triggerType = "NEW_CONVERSATION"; // NEW_CONVERSATION, INTENT

    @Column(name = "version")
    @Builder.Default
    private Integer version = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
