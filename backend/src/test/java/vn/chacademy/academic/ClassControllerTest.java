package vn.chacademy.academic;

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
import vn.chacademy.academic.dto.CreateClassRequest;
import vn.chacademy.academic.dto.CreateEnrollmentRequest;
import vn.chacademy.academic.dto.ScheduleSlotRequest;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.entity.Teacher;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.ClassScheduleRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.academic.repository.TeacherRepository;
import vn.chacademy.course.entity.Course;
import vn.chacademy.course.entity.CourseCategory;
import vn.chacademy.course.repository.CourseCategoryRepository;
import vn.chacademy.course.repository.CourseRepository;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.repository.StudentRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ClassControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClassRepository classRepository;

    @Autowired
    private ClassScheduleRepository classScheduleRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseCategoryRepository courseCategoryRepository;

    @Autowired
    private StudentRepository studentRepository;

    private Course savedCourse;
    private Teacher savedTeacher;
    private Student savedStudent;
    private ClassEntity savedClass;

    @BeforeEach
    void setUp() {
        enrollmentRepository.deleteAll();
        classScheduleRepository.deleteAll();
        classRepository.deleteAll();
        teacherRepository.deleteAll();
        studentRepository.deleteAll();

        CourseCategory category = courseCategoryRepository.save(CourseCategory.builder()
                .code("CAT-TEST")
                .name("Danh mục Test")
                .build());

        savedCourse = courseRepository.save(Course.builder()
                .code("CRS-TEST-01")
                .name("Khóa học Thử nghiệm")
                .category(category)
                .defaultTuitionFee(new BigDecimal("3000000"))
                .durationHours(30)
                .build());

        savedTeacher = teacherRepository.save(Teacher.builder()
                .teacherCode("GV-TEST-01")
                .fullName("Thầy Giáo Thử Nghiệm")
                .email("teacher@test.com")
                .status("ACTIVE")
                .build());

        savedStudent = studentRepository.save(Student.builder()
                .studentCode("HV-TEST-100")
                .fullName("Học Viên Thử Nghiệm")
                .targetType("ADULT")
                .status("ACTIVE")
                .build());

        savedClass = classRepository.save(ClassEntity.builder()
                .code("CLS-TEST-01")
                .name("Lớp Thử Nghiệm 01")
                .course(savedCourse)
                .primaryTeacher(savedTeacher)
                .maxCapacity(2)
                .room("P101")
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(60))
                .status("OPEN_FOR_ENROLLMENT")
                .build());
    }

    @Test
    @DisplayName("GET /api/v1/classes - Lấy danh sách lớp học")
    @WithMockUser(username = "admin", roles = {"SUPER_ADMIN"})
    void searchClasses_Success() throws Exception {
        mockMvc.perform(get("/api/v1/classes")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].code").value("CLS-TEST-01"));
    }

    @Test
    @DisplayName("POST /api/v1/classes - Tạo mới lớp học kèm lịch học")
    @WithMockUser(username = "admin", roles = {"SUPER_ADMIN"})
    void createClass_Success() throws Exception {
        CreateClassRequest request = CreateClassRequest.builder()
                .code("CLS-TEST-02")
                .name("Lớp Thử Nghiệm 02")
                .courseId(savedCourse.getId())
                .primaryTeacherId(savedTeacher.getId())
                .maxCapacity(15)
                .room("P202")
                .startDate(LocalDate.now().plusDays(10))
                .endDate(LocalDate.now().plusDays(70))
                .status("OPEN_FOR_ENROLLMENT")
                .schedules(List.of(
                        ScheduleSlotRequest.builder()
                                .dayOfWeek(2) // Thứ 3
                                .startTime(LocalTime.of(18, 0))
                                .endTime(LocalTime.of(19, 30))
                                .room("P202")
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/classes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("CLS-TEST-02"))
                .andExpect(jsonPath("$.data.schedules", hasSize(1)));
    }

    @Test
    @DisplayName("POST /api/v1/classes/enrollments - Ghi danh học viên thành công")
    @WithMockUser(username = "admin", roles = {"SUPER_ADMIN"})
    void enrollStudent_Success() throws Exception {
        CreateEnrollmentRequest request = CreateEnrollmentRequest.builder()
                .classId(savedClass.getId())
                .studentId(savedStudent.getId())
                .appliedTuitionFee(new BigDecimal("3000000"))
                .discountAmount(new BigDecimal("500000"))
                .notes("Học viên đóng đợt 1")
                .build();

        mockMvc.perform(post("/api/v1/classes/enrollments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.finalFee").value(2500000))
                .andExpect(jsonPath("$.data.status").value("ENROLLED"));
    }

    @Test
    @DisplayName("POST /api/v1/classes/enrollments - Báo lỗi khi ghi danh trùng học viên vào cùng 1 lớp")
    @WithMockUser(username = "admin", roles = {"SUPER_ADMIN"})
    void enrollStudent_DuplicateThrowsBadRequest() throws Exception {
        CreateEnrollmentRequest request = CreateEnrollmentRequest.builder()
                .classId(savedClass.getId())
                .studentId(savedStudent.getId())
                .build();

        // Lần 1: Thành công
        mockMvc.perform(post("/api/v1/classes/enrollments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Lần 2: Trùng học viên
        mockMvc.perform(post("/api/v1/classes/enrollments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("đã được ghi danh")));
    }
}
