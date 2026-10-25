package vn.chacademy.lead.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import vn.chacademy.identity.entity.User;

import java.time.Instant;

@Entity
@Table(name = "lead_activities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private User staff;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType; // CALL, MESSAGE, MEETING, NOTE, STATUS_CHANGE

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "activity_time", nullable = false)
    @Builder.Default
    private Instant activityTime = Instant.now();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
