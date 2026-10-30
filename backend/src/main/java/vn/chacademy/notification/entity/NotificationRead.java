package vn.chacademy.notification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import vn.chacademy.identity.entity.User;

import java.time.Instant;

@Entity
@Table(name = "notification_reads",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "notification_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_id", nullable = false)
    private Notification notification;

    @CreationTimestamp
    @Column(name = "read_at", nullable = false, updatable = false)
    private Instant readAt;
}

