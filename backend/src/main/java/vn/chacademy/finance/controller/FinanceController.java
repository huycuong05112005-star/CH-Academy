package vn.chacademy.finance.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.finance.dto.*;
import vn.chacademy.finance.service.FinanceService;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;

@RestController
@RequestMapping("/api/v1/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;
    private final UserRepository userRepository;

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<FinanceOverviewDto>> getOverview() {
        FinanceOverviewDto overview = financeService.getOverview();
        return ResponseEntity.ok(ApiResponse.success(overview));
    }

    @GetMapping("/receivables")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACCOUNTANT', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<Page<ReceivableDto>>> searchReceivables(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        Page<ReceivableDto> receivables = financeService.searchReceivables(keyword, status, studentId, pageable);
        return ResponseEntity.ok(ApiResponse.success(receivables));
    }

    @GetMapping("/receivables/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACCOUNTANT', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<ReceivableDto>> getReceivableById(@PathVariable Long id) {
        ReceivableDto receivable = financeService.getReceivableById(id);
        return ResponseEntity.ok(ApiResponse.success(receivable));
    }

    @PostMapping("/receivables")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<ReceivableDto>> createReceivable(
            @Valid @RequestBody CreateReceivableRequest request
    ) {
        ReceivableDto created = financeService.createReceivable(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Tạo khoản thu thành công", created));
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<Page<PaymentDto>>> searchPayments(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String method,
            @RequestParam(required = false) Long studentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        Page<PaymentDto> payments = financeService.searchPayments(keyword, method, studentId, pageable);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping("/payments/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PaymentDto>> getPaymentById(@PathVariable Long id) {
        PaymentDto payment = financeService.getPaymentById(id);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    @PostMapping("/payments")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PaymentDto>> recordPayment(
            @Valid @RequestBody RecordPaymentRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long staffId = null;
        if (userDetails != null) {
            staffId = userRepository.findByUsername(userDetails.getUsername())
                    .map(User::getId)
                    .orElse(null);
        }
        PaymentDto payment = financeService.recordPayment(request, staffId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Ghi nhận thanh toán thành công", payment));
    }

    @PostMapping("/refunds")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<RefundDto>> processRefund(
            @Valid @RequestBody ProcessRefundRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long staffId = null;
        if (userDetails != null) {
            staffId = userRepository.findByUsername(userDetails.getUsername())
                    .map(User::getId)
                    .orElse(null);
        }
        RefundDto refund = financeService.processRefund(request, staffId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Xử lý hoàn tiền thành công", refund));
    }
}
