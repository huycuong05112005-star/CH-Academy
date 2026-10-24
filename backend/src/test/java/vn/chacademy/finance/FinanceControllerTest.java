package vn.chacademy.finance;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.finance.dto.CreateReceivableRequest;
import vn.chacademy.finance.dto.ProcessRefundRequest;
import vn.chacademy.finance.dto.RecordPaymentRequest;
import vn.chacademy.finance.entity.Payment;
import vn.chacademy.finance.entity.Receivable;
import vn.chacademy.finance.repository.PaymentAllocationRepository;
import vn.chacademy.finance.repository.PaymentRepository;
import vn.chacademy.finance.repository.ReceivableRepository;
import vn.chacademy.finance.repository.RefundRepository;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.repository.StudentRepository;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class FinanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ReceivableRepository receivableRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentAllocationRepository allocationRepository;

    @Autowired
    private RefundRepository refundRepository;

    private Student testStudent;
    private Receivable testReceivable;

    @BeforeEach
    void setUp() {
        testStudent = studentRepository.save(Student.builder()
                .studentCode("STU_FIN_" + System.currentTimeMillis())
                .fullName("Học Viên Test Tài Chính")
                .dateOfBirth(LocalDate.of(2012, 5, 20))
                .gender("MALE")
                .phone("0908889999")
                .email("fin.student@chacademy.vn")
                .status("ACTIVE")
                .build());

        testReceivable = receivableRepository.save(Receivable.builder()
                .code("REC_TEST_" + System.currentTimeMillis())
                .student(testStudent)
                .title("Học phí khóa học Test")
                .totalAmount(new BigDecimal("5000000.00"))
                .paidAmount(BigDecimal.ZERO)
                .status("UNPAID")
                .dueDate(LocalDate.now().plusDays(10))
                .build());
    }

    @Test
    @DisplayName("GET /api/v1/finance/overview - Trả về thống kê tài chính")
    @WithMockUser(roles = "ACCOUNTANT")
    void testGetOverview() throws Exception {
        mockMvc.perform(get("/api/v1/finance/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalReceivables", notNullValue()))
                .andExpect(jsonPath("$.data.totalPaid", notNullValue()))
                .andExpect(jsonPath("$.data.totalDebt", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/v1/finance/receivables - Tìm kiếm danh sách khoản thu")
    @WithMockUser(roles = "ACCOUNTANT")
    void testSearchReceivables() throws Exception {
        mockMvc.perform(get("/api/v1/finance/receivables")
                        .param("keyword", "Test")
                        .param("status", "UNPAID"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", not(empty())))
                .andExpect(jsonPath("$.data.content[0].studentFullName", is("Học Viên Test Tài Chính")));
    }

    @Test
    @DisplayName("POST /api/v1/finance/receivables - Tạo mới khoản thu thành công")
    @WithMockUser(roles = "ACCOUNTANT")
    void testCreateReceivable() throws Exception {
        CreateReceivableRequest request = CreateReceivableRequest.builder()
                .studentId(testStudent.getId())
                .title("Phí giáo trình và đồng phục")
                .totalAmount(new BigDecimal("650000.00"))
                .dueDate(LocalDate.now().plusDays(7))
                .note("Đợt 1")
                .build();

        mockMvc.perform(post("/api/v1/finance/receivables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.code", startsWith("REC")))
                .andExpect(jsonPath("$.data.totalAmount", is(650000.0)))
                .andExpect(jsonPath("$.data.status", is("UNPAID")));
    }

    @Test
    @DisplayName("POST /api/v1/finance/payments - Ghi nhận thanh toán và phân bổ khoản thu")
    @WithMockUser(username = "admin", roles = "ACCOUNTANT")
    void testRecordPaymentAndAllocation() throws Exception {
        RecordPaymentRequest request = RecordPaymentRequest.builder()
                .studentId(testStudent.getId())
                .receivableId(testReceivable.getId())
                .amount(new BigDecimal("2000000.00"))
                .paymentMethod("BANK_TRANSFER")
                .paymentDate(LocalDate.now())
                .referenceNumber("VNPAY123456")
                .note("Thanh toán đợt 1")
                .build();

        mockMvc.perform(post("/api/v1/finance/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.paymentCode", startsWith("PAY")))
                .andExpect(jsonPath("$.data.amount", is(2000000.0)))
                .andExpect(jsonPath("$.data.allocations", hasSize(1)))
                .andExpect(jsonPath("$.data.allocations[0].allocatedAmount", is(2000000.0)));

        Receivable updated = receivableRepository.findById(testReceivable.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(new BigDecimal("2000000.00"), updated.getPaidAmount());
        org.junit.jupiter.api.Assertions.assertEquals("PARTIALLY_PAID", updated.getStatus());
    }

    @Test
    @DisplayName("POST /api/v1/finance/refunds - Xử lý hoàn tiền cho khoản thanh toán")
    @WithMockUser(username = "admin", roles = "SUPER_ADMIN")
    void testProcessRefund() throws Exception {
        Payment payment = paymentRepository.save(Payment.builder()
                .paymentCode("PAY_REF_TEST_" + System.currentTimeMillis())
                .student(testStudent)
                .amount(new BigDecimal("1000000.00"))
                .paymentMethod("CASH")
                .paymentDate(LocalDate.now())
                .build());

        ProcessRefundRequest request = ProcessRefundRequest.builder()
                .paymentId(payment.getId())
                .amount(new BigDecimal("400000.00"))
                .reason("Học viên chuyển lớp sang khóa thấp hơn")
                .build();

        mockMvc.perform(post("/api/v1/finance/refunds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.refundCode", startsWith("REF")))
                .andExpect(jsonPath("$.data.amount", is(400000.0)));
    }

    @Test
    @DisplayName("POST /api/v1/finance/payments - Báo lỗi khi số tiền bằng hoặc nhỏ hơn 0")
    @WithMockUser(roles = "ACCOUNTANT")
    void testRecordPaymentZeroAmount() throws Exception {
        RecordPaymentRequest request = RecordPaymentRequest.builder()
                .studentId(testStudent.getId())
                .amount(new BigDecimal("0.00"))
                .paymentMethod("CASH")
                .build();

        mockMvc.perform(post("/api/v1/finance/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
