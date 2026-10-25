package vn.chacademy.attendance.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.chacademy.attendance.entity.AttendanceRecord;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecordDto {
    private Long id;
    private Long sessionId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate sessionDate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    private String topic;
    private Long studentId;
    private String studentCode;
    private String studentFullName;
    private String status;
    private String note;
    private Long recordedById;
    private String recordedByName;
    private Instant recordedAt;

    public static AttendanceRecordDto fromEntity(AttendanceRecord r) {
        if (r == null) return null;
        return AttendanceRecordDto.builder()
                .id(r.getId())
                .sessionId(r.getSession() != null ? r.getSession().getId() : null)
                .sessionDate(r.getSession() != null ? r.getSession().getSessionDate() : null)
                .startTime(r.getSession() != null ? r.getSession().getStartTime() : null)
                .endTime(r.getSession() != null ? r.getSession().getEndTime() : null)
                .topic(r.getSession() != null ? r.getSession().getTopic() : null)
                .studentId(r.getStudent() != null ? r.getStudent().getId() : null)
                .studentCode(r.getStudent() != null ? r.getStudent().getStudentCode() : null)
                .studentFullName(r.getStudent() != null ? r.getStudent().getFullName() : null)
                .status(r.getStatus())
                .note(r.getNote())
                .recordedById(r.getRecordedBy() != null ? r.getRecordedBy().getId() : null)
                .recordedByName(r.getRecordedBy() != null ? r.getRecordedBy().getFullName() : null)
                .recordedAt(r.getRecordedAt())
                .build();
    }
}
