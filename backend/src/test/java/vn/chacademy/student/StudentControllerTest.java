package vn.chacademy.student;

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
import vn.chacademy.student.dto.CreateStudentRequest;
import vn.chacademy.student.entity.Guardian;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.repository.GuardianRepository;
import vn.chacademy.student.repository.StudentGuardianRepository;
import vn.chacademy.student.repository.StudentRepository;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private GuardianRepository guardianRepository;

    @Autowired
    private StudentGuardianRepository studentGuardianRepository;

    private Guardian savedGuardian;

    @BeforeEach
    void setUp() {
        studentGuardianRepository.deleteAll();
        studentRepository.deleteAll();
        guardianRepository.deleteAll();

        savedGuardian = guardianRepository.save(Guardian.builder()
                .guardianCode("PH-TEST-01")
                .fullName("Phụ Huynh Thử Nghiệm")
                .phone("0911223344")
                .email("phuhuynh@test.com")
                .build());

        studentRepository.save(Student.builder()
                .studentCode("HV-TEST-01")
                .fullName("Học Viên Thử Nghiệm")
                .dateOfBirth(LocalDate.of(2015, 6, 1))
                .gender("MALE")
                .phone("0988776655")
                .targetType("KID")
                .status("ACTIVE")
                .build());
    }

    @Test
    @DisplayName("GET /api/v1/students - Lấy danh sách học viên thành công")
    @WithMockUser(username = "admin", roles = {"SUPER_ADMIN"})
    void searchStudents_Success() throws Exception {
        mockMvc.perform(get("/api/v1/students")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].studentCode").value("HV-TEST-01"));
    }

    @Test
    @DisplayName("POST /api/v1/students - Tạo mới học viên và liên kết người giám hộ thành công")
    @WithMockUser(username = "admin", roles = {"SUPER_ADMIN"})
    void createStudent_Success() throws Exception {
        CreateStudentRequest request = CreateStudentRequest.builder()
                .studentCode("HV-TEST-02")
                .fullName("Học Viên Nhí 02")
                .dateOfBirth(LocalDate.of(2017, 3, 20))
                .gender("FEMALE")
                .targetType("KID")
                .status("ACTIVE")
                .guardians(List.of(
                        CreateStudentRequest.GuardianLinkRequest.builder()
                                .guardianId(savedGuardian.getId())
                                .relationshipType("MOTHER")
                                .isPrimaryContact(true)
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.studentCode").value("HV-TEST-02"))
                .andExpect(jsonPath("$.data.guardians", hasSize(1)))
                .andExpect(jsonPath("$.data.guardians[0].relationshipType").value("MOTHER"));
    }

    @Test
    @DisplayName("POST /api/v1/students - Báo lỗi trùng mã học viên")
    @WithMockUser(username = "admin", roles = {"SUPER_ADMIN"})
    void createStudent_DuplicateCode() throws Exception {
        CreateStudentRequest request = CreateStudentRequest.builder()
                .studentCode("HV-TEST-01") // Duplicate
                .fullName("Học Viên Trùng Mã")
                .gender("MALE")
                .targetType("ADULT")
                .build();

        mockMvc.perform(post("/api/v1/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("HV-TEST-01")));
    }
}
