package vn.chacademy.attendance.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.entity.ClassSession;
import vn.chacademy.academic.repository.ClassSessionRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.attendance.dto.AttendanceRecordDto;
import vn.chacademy.attendance.dto.AttendanceStatsDto;
import vn.chacademy.attendance.dto.BulkAttendanceRequest;
import vn.chacademy.attendance.dto.MarkAttendanceRequest;
import vn.chacademy.attendance.entity.AttendanceRecord;
import vn.chacademy.attendance.repository.AttendanceRecordRepository;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.repository.StudentRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final ClassSessionRepository classSessionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    private static final Set<String> VALID_STATUSES = Set.of("PRESENT", "ABSENT", "LATE", "EXCUSED");

    @Transactional(readOnly = true)
    public List<AttendanceRecordDto> getSessionAttendance(Long sessionId) {
        if (!classSessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("Không tìm thấy buổi học với ID: " + sessionId);
        }
        return attendanceRecordRepository.findBySessionId(sessionId).stream()
                .map(AttendanceRecordDto::fromEntity)
                .toList();
    }

    @Transactional
    public List<AttendanceRecordDto> markSessionAttendance(Long sessionId, BulkAttendanceRequest request, Long currentUserId) {
        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy buổi học với ID: " + sessionId));

        ClassEntity classEntity = session.getClassEntity();
        User staff = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;

        List<AttendanceRecord> savedRecords = new ArrayList<>();

        for (MarkAttendanceRequest r : request.getRecords()) {
            String status = r.getStatus().trim().toUpperCase();
            if (!VALID_STATUSES.contains(status)) {
                throw new BadRequestException("Trạng thái điểm danh không hợp lệ: " + r.getStatus() + ". Cho phép: " + VALID_STATUSES);
            }

            Student student = studentRepository.findById(r.getStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + r.getStudentId()));

            // Ràng buộc nghiệp vụ: Không cho điểm danh học viên không thuộc lớp
            boolean isEnrolled = enrollmentRepository.existsByClassEntityIdAndStudentId(classEntity.getId(), student.getId());
            if (!isEnrolled) {
                throw new BadRequestException("Học viên '" + student.getFullName() + "' không thuộc danh sách lớp '" + classEntity.getName() + "'!");
            }

            AttendanceRecord record = attendanceRecordRepository.findBySessionIdAndStudentId(sessionId, student.getId())
                    .orElse(AttendanceRecord.builder()
                            .session(session)
                            .student(student)
                            .build());

            record.setStatus(status);
            record.setNote(r.getNote());
            record.setRecordedBy(staff);

            savedRecords.add(attendanceRecordRepository.save(record));
        }

        return savedRecords.stream().map(AttendanceRecordDto::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public AttendanceStatsDto getStudentAttendanceStats(Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Không tìm thấy học viên với ID: " + studentId);
        }

        long total = attendanceRecordRepository.countByStudentId(studentId);
        long present = attendanceRecordRepository.countByStudentIdAndStatus(studentId, "PRESENT");
        long absent = attendanceRecordRepository.countByStudentIdAndStatus(studentId, "ABSENT");
        long late = attendanceRecordRepository.countByStudentIdAndStatus(studentId, "LATE");
        long excused = attendanceRecordRepository.countByStudentIdAndStatus(studentId, "EXCUSED");

        double rate = total > 0 ? ((double) (present + late) / total) * 100.0 : 0.0;

        return AttendanceStatsDto.builder()
                .studentId(studentId)
                .totalSessions(total)
                .presentCount(present)
                .absentCount(absent)
                .lateCount(late)
                .excusedCount(excused)
                .attendanceRatePercent(Math.round(rate * 10.0) / 10.0)
                .build();
    }
}
