package vn.chacademy.lead.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import vn.chacademy.course.entity.Course;
import vn.chacademy.identity.entity.User;
import vn.chacademy.student.entity.Student;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "leads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lead_code", nullable = false, unique = true, length = 30)
    private String leadCode;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String source = "WEBSITE"; // WEBSITE, FACEBOOK, REFERRAL, WALK_IN, HOTLINE, OTHER

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_course_id")
    private Course targetCourse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_staff_id")
    private User assignedStaff;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "NEW"; // NEW, CONTACTED, CONSULTING, APPOINTMENT, CONVERTED, LOST

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_student_id", unique = true)
    private Student convertedStudent;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "lead", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("activityTime DESC")
    @Builder.Default
    private List<LeadActivity> activities = new ArrayList<>();
}
