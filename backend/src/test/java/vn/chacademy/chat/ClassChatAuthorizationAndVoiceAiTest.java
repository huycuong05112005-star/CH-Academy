package vn.chacademy.chat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.entity.Enrollment;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.chat.dto.AiChatRequest;
import vn.chacademy.chat.dto.AiChatResponse;
import vn.chacademy.chat.dto.ChatConversationDto;
import vn.chacademy.chat.entity.AiAgent;
import vn.chacademy.chat.repository.AiAgentRepository;
import vn.chacademy.chat.service.ClassChatService;
import vn.chacademy.chat.service.GenAiChatService;
import vn.chacademy.course.entity.Course;
import vn.chacademy.course.entity.CourseCategory;
import vn.chacademy.course.repository.CourseCategoryRepository;
import vn.chacademy.course.repository.CourseRepository;
import vn.chacademy.identity.entity.Role;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.RoleRepository;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.repository.StudentRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class ClassChatAuthorizationAndVoiceAiTest {

    @Autowired
    private ClassChatService classChatService;

    @Autowired
    private GenAiChatService genAiChatService;

    @Autowired
    private AiAgentRepository agentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CourseCategoryRepository courseCategoryRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ClassRepository classRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    private User studentUser;

    @BeforeEach
    void setUp() {
        // 1. Seed Roles
        Role studentRole = roleRepository.findById("STUDENT").orElseGet(() ->
                roleRepository.save(new Role("STUDENT", "Student", "Học viên"))
        );

        // 2. Seed User
        studentUser = userRepository.findByUsername("test_student_voice").orElseGet(() -> {
            User u = new User();
            u.setUsername("test_student_voice");
            u.setFullName("Nguyễn Văn Học Viên");
            u.setEmail("student_voice@chacademy.vn");
            u.setPasswordHash("secret");
            u.setStatus("ACTIVE");
            u.setRoles(new HashSet<>(Set.of(studentRole)));
            return userRepository.save(u);
        });

        // 3. Seed AI Agents for Portals
        if (agentRepository.findAll().stream().noneMatch(a -> "STUDENT_TUTOR".equalsIgnoreCase(a.getScope()))) {
            agentRepository.save(AiAgent.builder()
                    .code("AGENT_STUDENT_TUTOR")
                    .name("AI Gia sư")
                    .roleTarget("STUDENT")
                    .scope("STUDENT_TUTOR")
                    .model("google/gemini-2.5-flash")
                    .systemPrompt("Bạn là AI Gia sư đồng hành học tập của CH Academy.")
                    .status("PUBLISHED")
                    .temperature(BigDecimal.valueOf(0.3))
                    .maxTokens(1000)
                    .version(1)
                    .build());
        }

        if (agentRepository.findAll().stream().noneMatch(a -> "PUBLIC_ADMISSION".equalsIgnoreCase(a.getScope()))) {
            agentRepository.save(AiAgent.builder()
                    .code("AGENT_PUBLIC_ADMISSION")
                    .name("Chuyên viên Tư vấn Tuyển sinh AI")
                    .roleTarget("PUBLIC")
                    .scope("PUBLIC_ADMISSION")
                    .model("google/gemini-2.5-flash")
                    .systemPrompt("Bạn là chuyên viên tư vấn tuyển sinh CH Academy.")
                    .status("PUBLISHED")
                    .temperature(BigDecimal.valueOf(0.3))
                    .maxTokens(1000)
                    .version(1)
                    .build());
        }
    }

    @Test
    @DisplayName("GenAiChatService should return structured sentences for Vietnamese TTS")
    void testSentenceSplittingForVietnameseTts() {
        AiChatRequest request = AiChatRequest.builder()
                .question("Chào bạn, thì hiện tại đơn trong tiếng Anh dùng khi nào?")
                .portal("STUDENT")
                .channel("VOICE")
                .agentCode("AGENT_STUDENT_TUTOR")
                .build();

        AiChatResponse response = genAiChatService.askAi(request, studentUser);

        assertThat(response).isNotNull();
        assertThat(response.getAnswer()).isNotEmpty();
        assertThat(response.getSentences()).isNotEmpty();

        for (String s : response.getSentences()) {
            assertThat(s.trim().length()).isLessThanOrEqualTo(350);
        }
    }

    @Test
    @DisplayName("GenAiChatService multi-turn conversation maintains context across turns")
    void testMultiTurnConversationRetention() {
        // Lượt 1
        AiChatRequest turn1 = AiChatRequest.builder()
                .question("Thì hiện tại đơn công thức là gì?")
                .portal("STUDENT")
                .channel("VOICE")
                .agentCode("AGENT_STUDENT_TUTOR")
                .build();

        AiChatResponse res1 = genAiChatService.askAi(turn1, studentUser);
        assertThat(res1).isNotNull();
        Long convId = res1.getConversationId();
        assertThat(convId).isNotNull();

        // Lượt 2 gửi kèm conversationId
        AiChatRequest turn2 = AiChatRequest.builder()
                .question("Cho mình thêm một ví dụ khác dễ hiểu hơn đi bạn")
                .portal("STUDENT")
                .channel("VOICE")
                .agentCode("AGENT_STUDENT_TUTOR")
                .conversationId(convId)
                .build();

        AiChatResponse res2 = genAiChatService.askAi(turn2, studentUser);
        assertThat(res2).isNotNull();
        assertThat(res2.getConversationId()).isEqualTo(convId);
        assertThat(res2.getAnswer()).isNotEmpty();
    }

    @Test
    @DisplayName("ClassChatService enforces strict ENROLLED membership: only enrolled class is returned")
    void testClassChatAuthorizationStrictEnrollment() {
        // Tạo Student Entity
        Student student = studentRepository.findByUserId(studentUser.getId()).orElseGet(() ->
                studentRepository.save(Student.builder()
                        .user(studentUser)
                        .studentCode("STU_TEST_01")
                        .fullName("Nguyễn Văn Học Viên")
                        .targetType("ADULT")
                        .status("ACTIVE")
                        .build())
        );

        CourseCategory category = courseCategoryRepository.save(CourseCategory.builder()
                .code("CAT-CHAT-TEST")
                .name("Tiếng Anh Test")
                .build());

        Course course1 = courseRepository.save(Course.builder()
                .code("CRS_CHAT_01")
                .name("Khóa Học Tiếng Anh 1")
                .category(category)
                .build());

        Course course2 = courseRepository.save(Course.builder()
                .code("CRS_CHAT_02")
                .name("Khóa Học Tiếng Anh 2")
                .category(category)
                .build());

        ClassEntity class1 = classRepository.save(ClassEntity.builder()
                .code("CLS_CHAT_01")
                .name("Lớp Giao Tiếp Cơ Bản")
                .course(course1)
                .startDate(LocalDate.now())
                .status("IN_PROGRESS")
                .build());

        ClassEntity class2 = classRepository.save(ClassEntity.builder()
                .code("CLS_CHAT_02")
                .name("Lớp Luyện Thi Nâng Cao")
                .course(course2)
                .startDate(LocalDate.now())
                .status("IN_PROGRESS")
                .build());

        // Đồng bộ tạo Chat Conversation cho cả 2 lớp
        classChatService.syncClassGroup(class1.getId());
        classChatService.syncClassGroup(class2.getId());

        // Học viên CHỈ đăng ký và học 1 lớp duy nhất (class1) với status ENROLLED
        enrollmentRepository.save(Enrollment.builder()
                .classEntity(class1)
                .student(student)
                .enrollmentDate(LocalDate.now())
                .appliedTuitionFee(BigDecimal.valueOf(1000000))
                .finalFee(BigDecimal.valueOf(1000000))
                .status("ENROLLED")
                .build());

        // Đồng bộ lại membership
        classChatService.syncClassGroup(class1.getId());
        classChatService.syncClassGroup(class2.getId());

        // Khi học viên truy cập cổng STUDENT, hệ thống CHỈ ĐƯỢC PHÉP trả về đúng 1 nhóm lớp class1!
        List<ChatConversationDto> convs = classChatService.getUserConversations(studentUser, "STUDENT");

        assertThat(convs).isNotNull();
        assertThat(convs).hasSize(1);
        assertThat(convs.get(0).getClassId()).isEqualTo(class1.getId());
        assertThat(convs.get(0).getClassName()).isEqualTo("Lớp Giao Tiếp Cơ Bản");
    }
}
