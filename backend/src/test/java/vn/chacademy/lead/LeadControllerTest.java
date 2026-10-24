package vn.chacademy.lead;

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
import vn.chacademy.lead.dto.AddActivityRequest;
import vn.chacademy.lead.dto.ConvertLeadRequest;
import vn.chacademy.lead.dto.CreateLeadRequest;
import vn.chacademy.lead.dto.PublicLeadRequest;
import vn.chacademy.lead.entity.Lead;
import vn.chacademy.lead.repository.LeadActivityRepository;
import vn.chacademy.lead.repository.LeadRepository;
import vn.chacademy.student.repository.StudentGuardianRepository;
import vn.chacademy.student.repository.StudentRepository;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LeadControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private LeadActivityRepository leadActivityRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private StudentGuardianRepository studentGuardianRepository;

    private Lead savedLead;

    @BeforeEach
    void setUp() {
        leadActivityRepository.deleteAll();
        leadRepository.deleteAll();

        savedLead = leadRepository.save(Lead.builder()
                .leadCode("LEAD-TEST-001")
                .fullName("Nguyễn Văn Tiềm Năng")
                .phone("0988112233")
                .email("tiemnang@test.com")
                .source("WEBSITE")
                .status("NEW")
                .notes("Khách cần tư vấn khóa IELTS")
                .build());
    }

    @Test
    @DisplayName("GET /api/v1/leads - Lấy danh sách khách hàng tiềm năng thành công")
    @WithMockUser(username = "admin", roles = {"SUPER_ADMIN"})
    void searchLeads_Success() throws Exception {
        mockMvc.perform(get("/api/v1/leads")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].leadCode").value("LEAD-TEST-001"));
    }

    @Test
    @DisplayName("POST /api/v1/public/leads - Đăng ký tư vấn công khai không cần token")
    void publicLead_Success() throws Exception {
        PublicLeadRequest request = PublicLeadRequest.builder()
                .fullName("Trần Thị Khách Hàng")
                .phone("0912345678")
                .email("khach@gmail.com")
                .notes("Tôi muốn đăng ký khóa học cho bé 6 tuổi")
                .build();

        mockMvc.perform(post("/api/v1/public/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Trần Thị Khách Hàng"))
                .andExpect(jsonPath("$.data.source").value("WEBSITE"))
                .andExpect(jsonPath("$.data.status").value("NEW"));
    }

    @Test
    @DisplayName("POST /api/v1/leads/{id}/activities - Thêm hoạt động chăm sóc tư vấn")
    @WithMockUser(username = "admin", roles = {"ADMISSIONS_STAFF"})
    void addActivity_Success() throws Exception {
        AddActivityRequest request = AddActivityRequest.builder()
                .actionType("CALL")
                .content("Đã gọi điện tư vấn lộ trình và gửi báo giá qua Zalo")
                .build();

        mockMvc.perform(post("/api/v1/leads/" + savedLead.getId() + "/activities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.actionType").value("CALL"))
                .andExpect(jsonPath("$.data.content").value("Đã gọi điện tư vấn lộ trình và gửi báo giá qua Zalo"));
    }

    @Test
    @DisplayName("POST /api/v1/leads/{id}/convert - Chuyển đổi Lead thành Học viên thành công")
    @WithMockUser(username = "admin", roles = {"SUPER_ADMIN"})
    void convertLeadToStudent_Success() throws Exception {
        ConvertLeadRequest request = ConvertLeadRequest.builder()
                .studentType("ADULT")
                .dob(LocalDate.of(2000, 5, 15))
                .gender("MALE")
                .address("123 Phố Huế, Hà Nội")
                .build();

        mockMvc.perform(post("/api/v1/leads/" + savedLead.getId() + "/convert")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CONVERTED"))
                .andExpect(jsonPath("$.data.convertedStudentCode", notNullValue()));
    }
}
