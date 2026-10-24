package vn.chacademy.finance.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.entity.Enrollment;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.finance.dto.*;
import vn.chacademy.finance.entity.Payment;
import vn.chacademy.finance.entity.PaymentAllocation;
import vn.chacademy.finance.entity.Receivable;
import vn.chacademy.finance.entity.Refund;
import vn.chacademy.finance.repository.PaymentAllocationRepository;
import vn.chacademy.finance.repository.PaymentRepository;
import vn.chacademy.finance.repository.ReceivableRepository;
import vn.chacademy.finance.repository.RefundRepository;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.repository.StudentRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinanceService {

    private final ReceivableRepository receivableRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentAllocationRepository allocationRepository;
    private final RefundRepository refundRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<ReceivableDto> searchReceivables(String keyword, String status, Long studentId, Pageable pageable) {
        return receivableRepository.searchReceivables(keyword, status, studentId, pageable)
                .map(this::toReceivableDto);
    }

    @Transactional(readOnly = true)
    public ReceivableDto getReceivableById(Long id) {
        Receivable receivable = receivableRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản thu với ID: " + id));
        return toReceivableDto(receivable);
    }

    @Transactional
    public ReceivableDto createReceivable(CreateReceivableRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + request.getStudentId()));

        Enrollment enrollment = null;
        if (request.getEnrollmentId() != null) {
            enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ghi danh với ID: " + request.getEnrollmentId()));
        }

        String code = "REC" + System.currentTimeMillis();

        Receivable receivable = Receivable.builder()
                .code(code)
                .student(student)
                .enrollment(enrollment)
                .title(request.getTitle())
                .totalAmount(request.getTotalAmount())
                .paidAmount(BigDecimal.ZERO)
                .status("PENDING")
                .dueDate(request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(15))
                .note(request.getNote())
                .build();

        Receivable saved = receivableRepository.save(receivable);
        log.info("Created receivable {} for student {}", saved.getCode(), student.getStudentCode());
        return toReceivableDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<PaymentDto> searchPayments(String keyword, String method, Long studentId, Pageable pageable) {
        return paymentRepository.searchPayments(keyword, method, studentId, pageable)
                .map(this::toPaymentDto);
    }

    @Transactional(readOnly = true)
    public PaymentDto getPaymentById(Long id) {
        Payment payment = paymentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch thanh toán với ID: " + id));
        return toPaymentDto(payment);
    }

    @Transactional
    public PaymentDto recordPayment(RecordPaymentRequest request, Long staffId) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học viên với ID: " + request.getStudentId()));

        User staff = null;
        if (staffId != null) {
            staff = userRepository.findById(staffId).orElse(null);
        }

        String paymentCode = "PAY" + System.currentTimeMillis();

        Payment payment = Payment.builder()
                .paymentCode(paymentCode)
                .student(student)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod().toUpperCase())
                .paymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now())
                .referenceNumber(request.getReferenceNumber())
                .note(request.getNote())
                .createdBy(staff)
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        List<PaymentAllocation> allocations = new ArrayList<>();
        BigDecimal remainingToAllocate = request.getAmount();

        if (request.getReceivableId() != null) {
            Receivable receivable = receivableRepository.findById(request.getReceivableId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản thu với ID: " + request.getReceivableId()));

            if (!receivable.getStudent().getId().equals(student.getId())) {
                throw new BadRequestException("Khoản thu không thuộc về học viên này");
            }

            BigDecimal currentDue = receivable.getTotalAmount().subtract(receivable.getPaidAmount());
            if (currentDue.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Khoản thu này đã được thanh toán đầy đủ");
            }

            BigDecimal allocationAmount = remainingToAllocate.min(currentDue);
            receivable.setPaidAmount(receivable.getPaidAmount().add(allocationAmount));
            if (receivable.getPaidAmount().compareTo(receivable.getTotalAmount()) >= 0) {
                receivable.setStatus("PAID");
            } else {
                receivable.setStatus("PARTIALLY_PAID");
            }
            receivableRepository.save(receivable);

            PaymentAllocation allocation = PaymentAllocation.builder()
                    .payment(savedPayment)
                    .receivable(receivable)
                    .allocatedAmount(allocationAmount)
                    .build();
            allocations.add(allocationRepository.save(allocation));
        } else {
            // FIFO allocation to student's pending / partially paid receivables
            List<Receivable> unpaidReceivables = receivableRepository.findByStudentIdAndStatusInOrderByIdAsc(
                    student.getId(), List.of("PENDING", "PARTIALLY_PAID")
            );

            for (Receivable rec : unpaidReceivables) {
                if (remainingToAllocate.compareTo(BigDecimal.ZERO) <= 0) {
                    break;
                }
                BigDecimal debt = rec.getTotalAmount().subtract(rec.getPaidAmount());
                if (debt.compareTo(BigDecimal.ZERO) <= 0) {
                    continue;
                }

                BigDecimal alloc = remainingToAllocate.min(debt);
                rec.setPaidAmount(rec.getPaidAmount().add(alloc));
                if (rec.getPaidAmount().compareTo(rec.getTotalAmount()) >= 0) {
                    rec.setStatus("PAID");
                } else {
                    rec.setStatus("PARTIALLY_PAID");
                }
                receivableRepository.save(rec);

                PaymentAllocation allocation = PaymentAllocation.builder()
                        .payment(savedPayment)
                        .receivable(rec)
                        .allocatedAmount(alloc)
                        .build();
                allocations.add(allocationRepository.save(allocation));

                remainingToAllocate = remainingToAllocate.subtract(alloc);
            }
        }

        savedPayment.setAllocations(allocations);
        log.info("Recorded payment {} amount {} for student {}", paymentCode, request.getAmount(), student.getStudentCode());
        return toPaymentDto(savedPayment);
    }

    @Transactional
    public RefundDto processRefund(ProcessRefundRequest request, Long staffId) {
        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch thanh toán với ID: " + request.getPaymentId()));

        List<Refund> existingRefunds = refundRepository.findByPaymentId(payment.getId());
        BigDecimal totalRefunded = existingRefunds.stream()
                .map(Refund::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal availableToRefund = payment.getAmount().subtract(totalRefunded);
        if (request.getAmount().compareTo(availableToRefund) > 0) {
            throw new BadRequestException("Số tiền hoàn lại vượt quá số tiền khả dụng (" + availableToRefund + " VND)");
        }

        User staff = null;
        if (staffId != null) {
            staff = userRepository.findById(staffId).orElse(null);
        }

        String refundCode = "REF" + System.currentTimeMillis();

        Refund refund = Refund.builder()
                .refundCode(refundCode)
                .payment(payment)
                .amount(request.getAmount())
                .reason(request.getReason())
                .approvedBy(staff)
                .refundDate(LocalDate.now())
                .build();

        Refund saved = refundRepository.save(refund);

        // Adjust receivables that were allocated by this payment
        List<PaymentAllocation> allocations = allocationRepository.findByPaymentId(payment.getId());
        BigDecimal refundLeft = request.getAmount();

        for (PaymentAllocation alloc : allocations) {
            if (refundLeft.compareTo(BigDecimal.ZERO) <= 0) break;
            Receivable rec = alloc.getReceivable();
            BigDecimal deduction = refundLeft.min(alloc.getAllocatedAmount());

            rec.setPaidAmount(rec.getPaidAmount().subtract(deduction).max(BigDecimal.ZERO));
            if (rec.getPaidAmount().compareTo(BigDecimal.ZERO) == 0) {
                rec.setStatus("PENDING");
            } else if (rec.getPaidAmount().compareTo(rec.getTotalAmount()) < 0) {
                rec.setStatus("PARTIALLY_PAID");
            }
            receivableRepository.save(rec);
            refundLeft = refundLeft.subtract(deduction);
        }

        log.info("Processed refund {} amount {} for payment {}", refundCode, request.getAmount(), payment.getPaymentCode());
        return toRefundDto(saved);
    }

    @Transactional(readOnly = true)
    public FinanceOverviewDto getOverview() {
        BigDecimal totalReceivables = receivableRepository.sumTotalReceivables();
        BigDecimal totalPaid = receivableRepository.sumTotalPaid();
        BigDecimal totalDebt = totalReceivables.subtract(totalPaid).max(BigDecimal.ZERO);
        BigDecimal totalRefunds = refundRepository.sumTotalRefunds();

        long recCount = receivableRepository.count();
        long payCount = paymentRepository.count();

        return FinanceOverviewDto.builder()
                .totalReceivables(totalReceivables)
                .totalPaid(totalPaid)
                .totalDebt(totalDebt)
                .totalRefunds(totalRefunds)
                .totalReceivableCount(recCount)
                .totalPaymentCount(payCount)
                .build();
    }

    private ReceivableDto toReceivableDto(Receivable r) {
        BigDecimal remaining = r.getTotalAmount().subtract(r.getPaidAmount()).max(BigDecimal.ZERO);
        return ReceivableDto.builder()
                .id(r.getId())
                .code(r.getCode())
                .studentId(r.getStudent().getId())
                .studentCode(r.getStudent().getStudentCode())
                .studentFullName(r.getStudent().getFullName())
                .enrollmentId(r.getEnrollment() != null ? r.getEnrollment().getId() : null)
                .className(r.getEnrollment() != null && r.getEnrollment().getClassEntity() != null ? r.getEnrollment().getClassEntity().getClassName() : null)
                .title(r.getTitle())
                .totalAmount(r.getTotalAmount())
                .paidAmount(r.getPaidAmount())
                .remainingAmount(remaining)
                .status(r.getStatus())
                .dueDate(r.getDueDate())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private PaymentDto toPaymentDto(Payment p) {
        List<PaymentAllocationDto> allocDtos = p.getAllocations() == null ? List.of() :
                p.getAllocations().stream().map(a -> PaymentAllocationDto.builder()
                        .id(a.getId())
                        .paymentId(p.getId())
                        .receivableId(a.getReceivable().getId())
                        .receivableCode(a.getReceivable().getCode())
                        .receivableTitle(a.getReceivable().getTitle())
                        .allocatedAmount(a.getAllocatedAmount())
                        .createdAt(a.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());

        return PaymentDto.builder()
                .id(p.getId())
                .paymentCode(p.getPaymentCode())
                .studentId(p.getStudent().getId())
                .studentCode(p.getStudent().getStudentCode())
                .studentFullName(p.getStudent().getFullName())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .paymentDate(p.getPaymentDate())
                .referenceNumber(p.getReferenceNumber())
                .note(p.getNote())
                .createdByName(p.getCreatedBy() != null ? p.getCreatedBy().getFullName() : null)
                .createdAt(p.getCreatedAt())
                .allocations(allocDtos)
                .build();
    }

    private RefundDto toRefundDto(Refund r) {
        return RefundDto.builder()
                .id(r.getId())
                .refundCode(r.getRefundCode())
                .paymentId(r.getPayment().getId())
                .paymentCode(r.getPayment().getPaymentCode())
                .amount(r.getAmount())
                .reason(r.getReason())
                .approvedByName(r.getApprovedBy() != null ? r.getApprovedBy().getFullName() : null)
                .refundDate(r.getRefundDate())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
