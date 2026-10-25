package vn.chacademy.student.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.chacademy.academic.dto.EnrollmentDto;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.attendance.repository.AttendanceRecordRepository;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.finance.dto.PaymentDto;
import vn.chacademy.finance.dto.ReceivableDto;
import vn.chacademy.finance.entity.Payment;
import vn.chacademy.finance.entity.Receivable;
import vn.chacademy.finance.repository.PaymentRepository;
import vn.chacademy.finance.repository.ReceivableRepository;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.student.dto.StudentDto;
import vn.chacademy.student.dto.StudentPortalSummaryDto;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.repository.StudentRepository;
import vn.chacademy.student.service.StudentService;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/student/portal")
@RequiredArgsConstructor
public class StudentPortalController {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentService studentService;
    private final EnrollmentRepository enrollmentRepository;
    private final ReceivableRepository receivableRepository;
    private final PaymentRepository paymentRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<StudentPortalSummaryDto>> getMyPortalDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) {
            throw new ResourceNotFoundException("Phiên đăng nhập không hợp lệ");
        }

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng"));

        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ học viên liên kết với tài khoản này chưa được kích hoạt"));

        StudentDto studentDto = studentService.getStudentById(student.getId());

        List<EnrollmentDto> enrollments = enrollmentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .map(EnrollmentDto::fromEntity)
                .toList();

        List<Receivable> recList = receivableRepository.findByStudentIdAndStatusInOrderByIdAsc(
                student.getId(), List.of("UNPAID", "PARTIALLY_PAID", "PAID")
        );
        List<ReceivableDto> receivableDtos = recList.stream().map(r -> ReceivableDto.builder()
                .id(r.getId())
                .code(r.getCode())
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .studentFullName(student.getFullName())
                .title(r.getTitle())
                .totalAmount(r.getTotalAmount())
                .paidAmount(r.getPaidAmount())
                .remainingAmount(r.getTotalAmount().subtract(r.getPaidAmount()))
                .status(r.getStatus())
                .dueDate(r.getDueDate())
                .createdAt(r.getCreatedAt())
                .build()
        ).toList();

        List<Payment> payments = paymentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId());
        List<PaymentDto> paymentDtos = payments.stream().map(p -> PaymentDto.builder()
                .id(p.getId())
                .paymentCode(p.getPaymentCode())
                .studentId(student.getId())
                .studentCode(student.getStudentCode())
                .studentFullName(student.getFullName())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .paymentDate(p.getPaymentDate())
                .referenceNumber(p.getReferenceNumber())
                .note(p.getNotes())
                .createdAt(p.getCreatedAt())
                .build()
        ).toList();

        long totalSessions = attendanceRecordRepository.countByStudentId(student.getId());
        long presentSessions = attendanceRecordRepository.countByStudentIdAndStatus(student.getId(), "PRESENT");
        double rate = totalSessions > 0 ? ((double) presentSessions / totalSessions) * 100.0 : 100.0;

        StudentPortalSummaryDto summary = StudentPortalSummaryDto.builder()
                .student(studentDto)
                .enrollments(enrollments)
                .receivables(receivableDtos)
                .payments(paymentDtos)
                .totalTuition(studentDto.getTotalTuition())
                .paidTuition(studentDto.getPaidTuition())
                .remainingTuition(studentDto.getRemainingTuition())
                .tuitionStatus(studentDto.getTuitionStatus())
                .totalSessions(totalSessions)
                .presentSessions(presentSessions)
                .attendanceRate(Math.round(rate * 10.0) / 10.0)
                .build();

        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}
