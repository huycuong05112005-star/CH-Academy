package vn.chacademy.attendance;

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
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.entity.ClassSession;
import vn.chacademy.academic.entity.Enrollment;
import vn.chacademy.academic.entity.Teacher;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.ClassSessionRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.academic.repository.TeacherRepository;
import vn.chacademy.attendance.dto.BulkAttendanceRequest;
import vn.chacademy.attendance.dto.MarkAttendanceRequest;
import vn.chacademy.attendance.entity.AttendanceRecord;
import vn.chacademy.attendance.repository.AttendanceRecordRepository;
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
class AttendanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private ClassSessionRepository classSessionRepository;

    @Autowired
    private ClassRepository classRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseCategoryRepository courseCategoryRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    private ClassSession savedSession;
    private Student enrolledStudent;
    private Student unEnrolledStudent;

    @BeforeEach
    void setUp() {
        attendanceRecordRepository.deleteAll();
        classSessionRepository.deleteAll();
        enrollmentRepository.deleteAll();
        classRepository.deleteAll();
        studentRepository.deleteAll();
        teacherRepository.deleteAll();
        courseRepository.deleteAll();
        courseCategoryRepository.deleteAll();

        CourseCategory category = courseCategoryRepository.save(CourseCategory.builder()
                .code("CAT-ATT")
                .name("Danh mục Test")
                .build());

        Course course = courseRepository.save(Course.builder()
                .code("CRS-ATT-01")
                .name("Khóa học Điểm danh")
                .category(category)
                .defaultTuitionFee(new BigDecimal("2000000"))
                .durationHours(20)
                .build());

        Teacher teacher = teacherRepository.save(Teacher.builder()
                .teacherCode("GV-ATT-01")
                .fullName("Thầy Điểm Danh")
                .email("att@test.com")
                .status("ACTIVE")
                .build());

        ClassEntity classEntity = classRepository.save(ClassEntity.builder()
                .code("CLS-ATT-01")
                .name("Lớp Điểm Danh 01")
                .course(course)
                .primaryTeacher(teacher)
                .startDate(LocalDate.now())
                .status("IN_PROGRESS")
                .build());

        savedSession = classSessionRepository.save(ClassSession.builder()
                .classEntity(classEntity)
                .teacher(teacher)
                .sessionDate(LocalDate.now())
                .startTime(LocalTime.of(18, 0))
                .endTime(LocalTime.of(19, 30))
                .topic("Bài 1: Khởi động")
                .status("SCHEDULED")
                .build());

        enrolledStudent = studentRepository.save(Student.builder()
                .studentCode("HV-ATT-01")
                .fullName("Học Viên Đã Ghi Danh")
                .targetType("ADULT")
                .status("ACTIVE")
                .build());

        unEnrolledStudent = studentRepository.save(Student.builder()
                .studentCode("HV-ATT-02")
                .fullName("Học Viên Chưa Ghi Danh")
                .targetType("ADULT")
                .status("ACTIVE")
                .build());

        enrollmentRepository.save(Enrollment.builder()
                .classEntity(classEntity)
                .student(enrolledStudent)
                .appliedTuitionFee(new BigDecimal("2000000"))
                .finalFee(new BigDecimal("2000000"))
                .status("ENROLLED")
                .build());
    }

    @Test
    @DisplayName("POST /api/v1/attendance/sessions/{id} - Điểm danh học viên thành công")
    @WithMockUser(username = "admin", roles = {"TEACHER"})
    void markAttendance_Success() throws Exception {
        BulkAttendanceRequest request = BulkAttendanceRequest.builder()
                .records(List.of(
                        MarkAttendanceRequest.builder()
                                .studentId(enrolledStudent.getId())
                                .status("PRESENT")
                                .note("Đi học đúng giờ")
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/attendance/sessions/" + savedSession.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].status").value("PRESENT"));
    }

    @Test
    @DisplayName("POST /api/v1/attendance/sessions/{id} - Từ chối điểm danh học viên không thuộc lớp")
    @WithMockUser(username = "admin", roles = {"TEACHER"})
    void markAttendance_UnEnrolledThrowsBadRequest() throws Exception {
        BulkAttendanceRequest request = BulkAttendanceRequest.builder()
                .records(List.of(
                        MarkAttendanceRequest.builder()
                                .studentId(unEnrolledStudent.getId()) // Not in class
                                .status("PRESENT")
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/attendance/sessions/" + savedSession.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("không thuộc danh sách lớp")));
    }

    @Test
    @DisplayName("GET /api/v1/attendance/students/{id}/stats - Thống kê tỷ lệ chuyên cần")
    @WithMockUser(username = "admin", roles = {"SUPER_ADMIN"})
    void getStudentStats_Success() throws Exception {
        attendanceRecordRepository.save(AttendanceRecord.builder()
                .session(savedSession)
                .student(enrolledStudent)
                .status("PRESENT")
                .build());

        mockMvc.perform(get("/api/v1/attendance/students/" + enrolledStudent.getId() + "/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalSessions").value(1))
                .andExpect(jsonPath("$.data.presentCount").value(1))
                .andExpect(jsonPath("$.data.attendanceRatePercent").value(100.0));
    }
}
