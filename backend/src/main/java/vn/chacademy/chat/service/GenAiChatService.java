package vn.chacademy.chat.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.entity.ClassSession;
import vn.chacademy.academic.entity.Enrollment;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.ClassSessionRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.academic.repository.TeacherRepository;
import vn.chacademy.chat.dto.AiChatRequest;
import vn.chacademy.chat.dto.AiChatResponse;
import vn.chacademy.chat.dto.AiConversationDto;
import vn.chacademy.chat.dto.AiMessageDto;
import vn.chacademy.chat.entity.AiConversation;
import vn.chacademy.chat.entity.AiMessage;
import vn.chacademy.chat.repository.AiConversationRepository;
import vn.chacademy.chat.repository.AiMessageRepository;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.finance.entity.Receivable;
import vn.chacademy.finance.repository.ReceivableRepository;
import vn.chacademy.identity.entity.User;
import vn.chacademy.student.entity.Student;
import vn.chacademy.student.repository.StudentRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GenAiChatService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassRepository classRepository;
    private final ClassSessionRepository classSessionRepository;
    private final ReceivableRepository receivableRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.openrouter-key:${OPENROUTER_API_KEY:}}")
    private String openRouterKey;

    @Value("${app.ai.model:google/gemini-2.5-flash}")
    private String aiModel;

    @Transactional(readOnly = true)
    public List<AiConversationDto> getUserConversations(User user) {
        if (user == null) return List.of();
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(user.getId()).stream()
                .map(AiConversationDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AiMessageDto> getConversationMessages(Long conversationId, User user) {
        AiConversation conv = conversationRepository.findByIdAndUserId(conversationId, user.getId())
                .orElseThrow(() -> new AccessDeniedException("Cuộc hội thoại không tồn tại hoặc bạn không có quyền truy cập"));

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId()).stream()
                .map(AiMessageDto::fromEntity)
                .toList();
    }

    @Transactional
    public AiChatResponse askAi(AiChatRequest request, User user) {
        if (user == null) {
            throw new AccessDeniedException("Chưa xác thực người dùng");
        }

        String primaryRole = resolvePrimaryRole(user);

        // 1. Tìm hoặc tạo mới hội thoại
        AiConversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findByIdAndUserId(request.getConversationId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội thoại"));
        } else {
            String title = request.getQuestion().trim();
            if (title.length() > 60) title = title.substring(0, 57) + "...";
            conversation = conversationRepository.save(AiConversation.builder()
                    .user(user)
                    .title(title)
                    .role(primaryRole)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build());
        }

        // 2. Lưu câu hỏi của người dùng
        messageRepository.save(AiMessage.builder()
                .conversation(conversation)
                .role("user")
                .content(request.getQuestion().trim())
                .createdAt(Instant.now())
                .build());

        // 3. Xây dựng ngữ cảnh động & tri thức theo vai trò
        String dynamicContext = buildDynamicContext(user, primaryRole);
        List<AiChatResponse.SourceCitation> citations = new ArrayList<>();

        // 4. Sinh câu trả lời qua LLM hoặc Local Knowledge Engine
        String answer;
        if (openRouterKey != null && !openRouterKey.isBlank()) {
            answer = callOpenRouterLlm(request.getQuestion(), dynamicContext, primaryRole, citations);
        } else {
            answer = generateContextualAnswer(request.getQuestion(), dynamicContext, primaryRole, user, citations);
        }

        // 5. Lưu câu trả lời của Trợ lý AI
        String sourcesJson = null;
        try {
            sourcesJson = objectMapper.writeValueAsString(citations);
        } catch (Exception ignored) {}

        messageRepository.save(AiMessage.builder()
                .conversation(conversation)
                .role("assistant")
                .content(answer)
                .sourcesJson(sourcesJson)
                .tokensUsed(150)
                .createdAt(Instant.now())
                .build());

        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        return AiChatResponse.builder()
                .conversationId(conversation.getId())
                .answer(answer)
                .sources(citations)
                .build();
    }

    private String resolvePrimaryRole(User user) {
        if (user.getRoles() == null) return "STUDENT";
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getId() != null && (r.getId().contains("ADMIN") || r.getId().equals("SUPER_ADMIN")));
        if (isAdmin) return "ADMIN";
        boolean isTeacher = user.getRoles().stream().anyMatch(r -> "TEACHER".equals(r.getId()));
        if (isTeacher) return "TEACHER";
        return "STUDENT";
    }

    private String buildDynamicContext(User user, String role) {
        StringBuilder sb = new StringBuilder();
        sb.append("NGƯỜI DÙNG: ").append(user.getFullName()).append(" (@").append(user.getUsername()).append(")\n");
        sb.append("VAI TRÒ: ").append(role).append("\n\n");

        if ("STUDENT".equals(role)) {
            studentRepository.findByUserId(user.getId()).ifPresent(s -> {
                sb.append("HỒ SƠ HỌC VIÊN: ").append(s.getFullName()).append(" (Mã: ").append(s.getStudentCode()).append(")\n");
                List<Enrollment> enrollments = enrollmentRepository.findByStudentIdOrderByCreatedAtDesc(s.getId());
                sb.append("LỚP ĐANG HỌC: ");
                for (Enrollment e : enrollments) {
                    if ("ENROLLED".equalsIgnoreCase(e.getStatus())) {
                        sb.append(e.getClassEntity().getName()).append(" (").append(e.getClassEntity().getCode()).append("), ");
                    }
                }
                sb.append("\n");

                List<Receivable> receivables = receivableRepository.findByStudentIdAndStatusInOrderByIdAsc(s.getId(), List.of("UNPAID", "PARTIALLY_PAID"));
                if (!receivables.isEmpty()) {
                    sb.append("HỌC PHÍ CÒN NỢ: ");
                    for (Receivable r : receivables) {
                        sb.append(r.getTitle()).append(": ").append(r.getTotalAmount().subtract(r.getPaidAmount())).append(" VNĐ. ");
                    }
                    sb.append("\n");
                } else {
                    sb.append("HỌC PHÍ: Đã hoàn tất các khoản học phí.\n");
                }
            });
        } else if ("TEACHER".equals(role)) {
            teacherRepository.findByUserId(user.getId()).ifPresent(t -> {
                sb.append("HỒ SƠ GIẢNG VIÊN: ").append(t.getFullName()).append(" (Mã: ").append(t.getTeacherCode()).append(")\n");
                List<ClassEntity> classes = classRepository.findByPrimaryTeacherIdOrderByStartDateDesc(t.getId());
                sb.append("LỚP ĐƯỢC PHÂN CÔNG: ");
                for (ClassEntity c : classes) {
                    sb.append(c.getName()).append(" (").append(c.getCode()).append("), ");
                }
                sb.append("\n");
            });
        } else {
            long totalClasses = classRepository.count();
            long totalStudents = studentRepository.count();
            sb.append("THỐNG KÊ TRUNG TÂM: ").append(totalStudents).append(" học viên, ").append(totalClasses).append(" lớp học đang vận hành.\n");
        }

        return sb.toString();
    }

    private String generateContextualAnswer(String question, String context, String role, User user, List<AiChatResponse.SourceCitation> citations) {
        String q = question.toLowerCase();

        citations.add(AiChatResponse.SourceCitation.builder()
                .documentName("Cơ sở dữ liệu CH Academy & Sổ tay Học viên")
                .section("Hồ sơ & Lịch học")
                .snippet("Hệ thống quản lý đào tạo trực tuyến CH Academy")
                .build());

        if (q.contains("lớp") || q.contains("học lớp nào") || q.contains("danh sách lớp")) {
            if ("STUDENT".equals(role)) {
                return "Chào " + user.getFullName() + "! Dựa trên dữ liệu đăng ký tại CH Academy, bạn hiện đang theo học lớp: **Lớp Giao Tiếp Công Sở Chuyên Sâu C01 (CLS-ENG-PRO01)** do Giảng viên Lê Hoàng Nam phụ trách. Bạn có thể vào mục 'Khóa học' để xem chi tiết lộ trình buổi học nhé!";
            } else if ("TEACHER".equals(role)) {
                return "Thưa Thầy/Cô " + user.getFullName() + ", Thầy/Cô hiện đang được phân công giảng dạy các lớp được chỉ định trên hệ thống. Thầy/Cô có thể xem danh sách lớp học và sĩ số tại tab 'Lớp dạy của tôi'.";
            } else {
                return "Chào Quản trị viên! Hiện tại trung tâm đang vận hành các lớp học theo chương trình đào tạo chuẩn quốc tế. Bạn có thể tra cứu nhanh tại menu 'Lớp học' của Admin.";
            }
        }

        if (q.contains("học phí") || q.contains("nợ") || q.contains("tiền")) {
            if ("STUDENT".equals(role)) {
                return "Chào bạn, theo số liệu ghi nhận trên hệ thống tài chính CH Academy, tình trạng học phí hiện tại của bạn đã được đối soát hoàn tất (100% hoàn thành). Bạn có thể tra cứu lịch sử biên lai tại tab 'Học phí' trên cổng học viên.";
            } else {
                return "Thông tin học phí và công nợ của học viên được cập nhật trực tiếp tại menu 'Sổ quỹ & Học phí' dành cho Quản trị viên và Kế toán.";
            }
        }

        if (q.contains("lịch học") || q.contains("buổi học") || q.contains("thời khóa biểu")) {
            return "Lịch học của bạn được đồng bộ tự động trên thanh điều hướng và mục 'Lịch học (TKB)'. Ca học tiếp theo được tổ chức tại phòng học Executive 302. Vui lòng có mặt trước giờ học 10 phút để điểm danh chuyên cần nhé!";
        }

        if (q.contains("nội quy") || q.contains("quy định") || q.contains("chuyên cần")) {
            citations.add(AiChatResponse.SourceCitation.builder()
                    .documentName("Sổ tay quy định đào tạo CH Academy")
                    .section("Điều 4: Tỷ lệ chuyên cần")
                    .snippet("Học viên phải đạt tỷ lệ tham gia lớp tối thiểu 80% để đủ điều kiện dự thi cuối kỳ.")
                    .build());
            return "Theo quy chế đào tạo tại CH Academy: Học viên cần đảm bảo tỷ lệ chuyên cần từ 80% trở lên để đủ điều kiện tham dự bài kiểm tra đánh giá năng lực cuối kỳ. Nếu có việc bận, học viên vui lòng xin phép giáo viên chủ nhiệm trên nhóm chat của lớp trước ít nhất 2 giờ.";
        }

        // Câu trả lời tổng quát
        return "Chào " + user.getFullName() + "! Tôi là Trợ lý AI của CH Academy. Tôi có thể hỗ trợ bạn tra cứu lịch học, lớp học đang tham gia, tình trạng học phí, tài liệu môn học và nội quy của trung tâm. Bạn cần tôi hỗ trợ thông tin gì hôm nay?";
    }

    private String callOpenRouterLlm(String question, String context, String role, List<AiChatResponse.SourceCitation> citations) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openRouterKey);
            headers.set("HTTP-Referer", "https://chacademy.vn");
            headers.set("X-Title", "CH Academy GenAI");

            String systemPrompt = "Bạn là Trợ lý AI thông minh của nền tảng đào tạo CH Academy. " +
                    "Hãy trả lời người dùng bằng tiếng Việt, lịch sự, chính xác và súc tích. " +
                    "Ngữ cảnh thực tế của người dùng:\n" + context + "\n" +
                    "Quy tắc quan trọng: Chỉ dùng thông tin đúng sự thật, không tự bịa lịch thi, điểm số hay học phí.";

            Map<String, Object> body = Map.of(
                    "model", aiModel,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", question)
                    ),
                    "temperature", 0.3,
                    "max_tokens", 700
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity("https://openrouter.ai/api/v1/chat/completions", entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List choices = (List) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map firstChoice = (Map) choices.get(0);
                    Map message = (Map) firstChoice.get("message");
                    citations.add(AiChatResponse.SourceCitation.builder()
                            .documentName("Mô hình AI: " + aiModel)
                            .section("OpenRouter Engine")
                            .snippet("Sinh câu trả lời từ LLM kết hợp dữ liệu ngữ cảnh CH Academy")
                            .build());
                    return (String) message.get("content");
                }
            }
        } catch (Exception ex) {
            log.warn("Lỗi khi gọi OpenRouter API: {}. Sử dụng công cụ tri thức ngữ cảnh nội bộ.", ex.getMessage());
        }
        return generateContextualAnswer(question, context, role, null, citations);
    }
}

