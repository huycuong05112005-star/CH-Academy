package vn.chacademy.course;

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
import vn.chacademy.course.dto.CreateCourseRequest;
import vn.chacademy.course.entity.Course;
import vn.chacademy.course.entity.CourseCategory;
import vn.chacademy.course.repository.CourseCategoryRepository;
import vn.chacademy.course.repository.CourseRepository;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CourseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CourseCategoryRepository categoryRepository;

    @Autowired
    private CourseRepository courseRepository;

    private CourseCategory savedCategory;

    @BeforeEach
    void setUp() {
        courseRepository.deleteAll();
        categoryRepository.deleteAll();

        savedCategory = categoryRepository.save(CourseCategory.builder()
                .code("ENG-TEST")
                .name("Tiếng Anh Thử Nghiệm")
                .description("Mô tả danh mục thử nghiệm")
                .displayOrder(1)
                .isActive(true)
                .build());

        courseRepository.save(Course.builder()
                .category(savedCategory)
                .code("ENG-TEST-01")
                .name("Khóa học Thử Nghiệm 01")
                .description("Mô tả khóa học")
                .targetAudience("KIDS")
                .level("BEGINNER")
                .durationHours(30)
                .defaultTuitionFee(new BigDecimal("3000000.00"))
                .learningOutcomes("Đầu ra thử nghiệm")
                .maxStudents(15)
                .status("ACTIVE")
                .isPublic(true)
                .build());
    }

    @Test
    @DisplayName("GET /api/v1/courses - Lấy danh sách khóa học có phân quyền thành công")
    @WithMockUser(username = "admin", roles = {"SUPER_ADMIN"})
    void searchCourses_Success() throws Exception {
        mockMvc.perform(get("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].code").value("ENG-TEST-01"));
    }

    @Test
    @DisplayName("GET /api/v1/courses - Bị từ chối khi chưa đăng nhập")
    void searchCourses_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/courses - Tạo mới khóa học thành công bởi Admin")
    @WithMockUser(username = "admin", roles = {"SUPER_ADMIN"})
    void createCourse_Success() throws Exception {
        CreateCourseRequest request = CreateCourseRequest.builder()
                .categoryId(savedCategory.getId())
                .code("ENG-TEST-02")
                .name("Khóa học Thử Nghiệm 02")
                .description("Chi tiết")
                .targetAudience("ADULTS")
                .level("INTERMEDIATE")
                .durationHours(45)
                .defaultTuitionFee(new BigDecimal("4500000.00"))
                .learningOutcomes("Đầu ra 02")
                .maxStudents(20)
                .status("ACTIVE")
                .isPublic(true)
                .build();

        mockMvc.perform(post("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("ENG-TEST-02"))
                .andExpect(jsonPath("$.data.categoryCode").value("ENG-TEST"));
    }

    @Test
    @DisplayName("POST /api/v1/courses - Thất bại khi trùng mã khóa học")
    @WithMockUser(username = "admin", roles = {"SUPER_ADMIN"})
    void createCourse_DuplicateCode() throws Exception {
        CreateCourseRequest request = CreateCourseRequest.builder()
                .categoryId(savedCategory.getId())
                .code("ENG-TEST-01") // Duplicate with savedCourse
                .name("Khóa học trùng mã")
                .targetAudience("ADULTS")
                .level("BEGINNER")
                .durationHours(30)
                .defaultTuitionFee(new BigDecimal("2000000.00"))
                .maxStudents(15)
                .build();

        mockMvc.perform(post("/api/v1/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("ENG-TEST-01")));
    }

    @Test
    @DisplayName("GET /api/v1/public/courses - Công khai không cần token truy cập")
    void getPublicCourses_NoAuthNeeded() throws Exception {
        mockMvc.perform(get("/api/v1/public/courses")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))));
    }
}
