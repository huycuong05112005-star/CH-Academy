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
import vn.chacademy.academic.entity.Enrollment;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.academic.repository.TeacherRepository;
import vn.chacademy.chat.dto.AiChatRequest;
import vn.chacademy.chat.dto.AiChatResponse;
import vn.chacademy.chat.dto.AiConversationDto;
import vn.chacademy.chat.dto.AiMessageDto;
import vn.chacademy.chat.entity.*;
import vn.chacademy.chat.repository.*;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.finance.entity.Receivable;
import vn.chacademy.finance.repository.ReceivableRepository;
import vn.chacademy.identity.entity.User;
import vn.chacademy.student.repository.StudentRepository;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GenAiChatService {

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiKbChunkRepository chunkRepository;
    private final AiStudioService aiStudioService;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ClassRepository classRepository;
    private final vn.chacademy.course.repository.CourseRepository courseRepository;
    private final ReceivableRepository receivableRepository;
    private final ObjectMapper objectMapper;
    private final PortalAgentResolver portalAgentResolver;

    @Value("${app.ai.openrouter-key:${OPENROUTER_API_KEY:}}")
    private String openRouterKey;

    @Value("${app.ai.model:google/gemini-2.5-flash}")
    private String aiModel;

    // ========================================================
    // 1. TRUY XUẤT HỘI THOẠI CÓ PHÂN TÁCH DANH TÍNH & CỔNG
    // ========================================================

    @Transactional(readOnly = true)
    public List<AiConversationDto> getUserConversations(User user, String portal) {
        if (user == null) return List.of();
        String validatedPortal = portalAgentResolver.determineEffectivePortal(portal, user);
        return conversationRepository.findByUserIdAndPortalOrderByUpdatedAtDesc(user.getId(), validatedPortal).stream()
                .map(AiConversationDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AiMessageDto> getConversationMessages(Long conversationId, User user, String portal) {
        if (user == null) {
            throw new AccessDeniedException("Chưa xác thực người dùng");
        }
        String validatedPortal = portalAgentResolver.determineEffectivePortal(portal, user);
        AiConversation conv = conversationRepository.findByIdAndUserIdAndPortal(conversationId, user.getId(), validatedPortal)
                .orElseThrow(() -> new AccessDeniedException("Hội thoại không tồn tại hoặc không thuộc cổng " + validatedPortal + " của bạn"));

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId()).stream()
                .map(AiMessageDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AiConversationDto> getPublicConversations(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) return List.of();
        return conversationRepository.findBySessionIdAndPortalOrderByUpdatedAtDesc(sessionId, "PUBLIC").stream()
                .map(AiConversationDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AiMessageDto> getPublicConversationMessages(Long conversationId, String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new AccessDeniedException("Thiếu sessionId của khách");
        }
        AiConversation conv = conversationRepository.findByIdAndSessionIdAndPortal(conversationId, sessionId, "PUBLIC")
                .orElseThrow(() -> new AccessDeniedException("Hội thoại công khai không tồn tại hoặc không khớp phiên"));

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId()).stream()
                .map(AiMessageDto::fromEntity)
                .toList();
    }

    // ========================================================
    // 2. GỬI TIN NHẮN & XỬ LÝ GEN AI ĐA VAI TRÒ
    // ========================================================

    @Transactional
    public AiChatResponse askAi(AiChatRequest request, User user) {
        long startTime = System.currentTimeMillis();
        String question = request.getQuestion() != null ? request.getQuestion().trim() : "";
        if (question.isEmpty()) {
            throw new BadRequestException("Câu hỏi không được để trống");
        }

        boolean isPublic = (user == null);
        String portal = portalAgentResolver.determineEffectivePortal(request.getPortal(), user);
        AiAgent resolvedAgent = portalAgentResolver.resolveAgent(portal, user);
        String channel = request.getChannel() != null ? request.getChannel().toUpperCase() : (isPublic ? "WEBSITE" : "PORTAL");
        String agentCode = resolvedAgent.getCode();

        // 1. Xác định hoặc tạo mới hội thoại
        AiConversation conversation;
        if (request.getConversationId() != null) {
            if (isPublic) {
                conversation = conversationRepository.findByIdAndSessionIdAndPortal(request.getConversationId(), request.getSessionId(), "PUBLIC")
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội thoại công khai phù hợp"));
            } else {
                conversation = conversationRepository.findByIdAndUserIdAndPortal(request.getConversationId(), user.getId(), portal)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội thoại phù hợp trên cổng " + portal));
            }
        } else {
            String title = question.length() > 60 ? question.substring(0, 57) + "..." : question;
            conversation = AiConversation.builder()
                    .user(user)
                    .title(title)
                    .role(portal)
                    .portal(portal)
                    .channel(channel)
                    .agentCode(agentCode)
                    .status("ACTIVE")
                    .sessionId(request.getSessionId())
                    .guestName(request.getGuestName())
                    .guestPhone(request.getGuestPhone())
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            conversation = conversationRepository.save(conversation);
        }

        // 2. Lưu tin nhắn của người dùng
        messageRepository.save(AiMessage.builder()
                .conversation(conversation)
                .role("user")
                .content(question)
                .createdAt(Instant.now())
                .build());

        // Tự động trích xuất thông tin khách hàng / Lead từ nội dung tin nhắn nếu có số điện thoại
        extractAndSaveLeadIfPresent(question, conversation, request.getGuestName(), request.getGuestPhone());

        // 3. Kiểm tra yêu cầu Human Handoff (chuyển người thật / tư vấn viên)
        List<AiChatResponse.SourceCitation> citations = new ArrayList<>();
        boolean isHandoffRequest = checkHandoffIntent(question);
        if (isHandoffRequest) {
            conversation.setStatus("WAITING_HUMAN");
            conversationRepository.save(conversation);

            String handoffReply = "Dạ, tôi đã ghi nhận yêu cầu và chuyển tiếp cuộc trò chuyện của bạn đến chuyên viên tư vấn hỗ trợ của CH Academy. " +
                    "Chuyên viên sẽ tiếp nhận và phản hồi bạn trong thời gian sớm nhất. " +
                    "Nếu cần hỗ trợ khẩn cấp, bạn có thể gọi hotline: 0987.654.321. Xin cảm ơn bạn!";

            citations.add(AiChatResponse.SourceCitation.builder()
                    .documentName("Quy trình chuyển giao nhân viên (Human Handoff)")
                    .section("Bộ phận Chăm sóc khách hàng & Tuyển sinh")
                    .snippet("Yêu cầu đã được chuyển sang trạng thái chờ nhân viên tiếp nhận.")
                    .build());

            saveAssistantMessage(conversation, handoffReply, citations, 60);

            return AiChatResponse.builder()
                    .conversationId(conversation.getId())
                    .answer(handoffReply)
                    .sources(citations)
                    .build();
        }

        // 4. Tìm kiếm tri thức trong Kho tri thức (RAG Chunks Search)
        searchKnowledgeBaseChunks(question, portal, citations);

        // 5. Xây dựng ngữ cảnh động từ cơ sở dữ liệu thời gian thực
        String dynamicContext = buildDynamicContext(user, portal);

        // 6. Lấy cấu hình System Prompt của Agent tương ứng
        String systemPrompt = (resolvedAgent.getSystemPrompt() != null && !resolvedAgent.getSystemPrompt().isBlank())
                ? resolvedAgent.getSystemPrompt()
                : "Bạn là " + resolvedAgent.getName() + " của CH Academy.";

        // Lấy lịch sử hội thoại để duy trì ngữ cảnh trao đổi nhiều lượt (Multi-turn conversational memory)
        List<AiMessage> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId());

        // 7. Sinh câu trả lời (LLM OpenRouter hoặc Engine tri thức cục bộ)
        String answer;
        if (openRouterKey != null && !openRouterKey.isBlank()) {
            answer = callOpenRouterLlm(question, systemPrompt, dynamicContext, citations, history);
        } else {
            answer = generateContextualAnswer(question, dynamicContext, portal, user, citations, history);
        }

        // 8. Lưu câu trả lời của trợ lý
        saveAssistantMessage(conversation, answer, citations, 180);

        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        long latencyMs = System.currentTimeMillis() - startTime;
        List<String> audioSentences = splitVietnameseSentences(answer);

        return AiChatResponse.builder()
                .conversationId(conversation.getId())
                .answer(answer)
                .latencyMs(latencyMs)
                .sentences(audioSentences)
                .sources(citations)
                .build();
    }

    @Transactional
    public void markHandoff(Long conversationId, User user, String portal) {
        AiConversation conv;
        if (user != null) {
            String validatedPortal = portalAgentResolver.determineEffectivePortal(portal, user);
            conv = conversationRepository.findByIdAndUserIdAndPortal(conversationId, user.getId(), validatedPortal)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội thoại"));
        } else {
            conv = conversationRepository.findById(conversationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hội thoại"));
        }
        conv.setStatus("WAITING_HUMAN");
        conv.setUpdatedAt(Instant.now());
        conversationRepository.save(conv);
    }

    // ========================================================
    // 3. TIỆN ÍCH KIỂM TRA PHÂN QUYỀN & CHỐNG RÒ RỈ DỮ LIỆU
    // ========================================================

    private boolean checkHandoffIntent(String text) {
        String lower = text.toLowerCase();
        return lower.contains("gặp nhân viên") || lower.contains("gặp người thật") ||
                lower.contains("tư vấn viên") || lower.contains("chuyển người") ||
                lower.contains("khiếu nại") || lower.contains("liên hệ người thật") ||
                lower.contains("nhân viên trực tiếp");
    }

    private void extractAndSaveLeadIfPresent(String text, AiConversation conv, String defaultName, String defaultPhone) {
        if (text == null) return;
        // Chuẩn hóa và tìm số điện thoại Việt Nam dạng 10 số (hỗ trợ khoảng trắng, dấu chấm, gạch nối hoặc tiền tố quốc tế +84)
        String phone = defaultPhone;
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(?:\\+84|0)[\\s.-]?(?:3[2-9]|5[689]|7[06-9]|8[1-9]|9[0-9])(?:[\\s.-]?[0-9]){7}").matcher(text);
        if (matcher.find()) {
            phone = matcher.group(0).replaceAll("[\\s.-]", "");
            if (phone.startsWith("+84")) {
                phone = "0" + phone.substring(3);
            }
        }

        if (phone != null && !phone.isBlank()) {
            String name = (defaultName != null && !defaultName.isBlank()) ? defaultName : null;
            if (name == null) {
                java.util.regex.Matcher nameMatcher = java.util.regex.Pattern.compile("(?:tên là|mình là|em là|tôi là)\\s+([A-Za-zÀ-ỹ\\s]{2,30})", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(text);
                if (nameMatcher.find()) {
                    name = nameMatcher.group(1).trim().replaceAll("[,.].*$", "").trim();
                }
            }
            if (name == null || name.isBlank()) {
                name = "Khách hàng Web";
            }
            try {
                // Đồng bộ xuyên suốt cả bảng ai_leads và bảng CRM leads & lead_activities
                aiStudioService.createLead(vn.chacademy.chat.dto.CreateLeadRequest.builder()
                        .conversationId(conv != null ? conv.getId() : null)
                        .fullName(name)
                        .phone(phone)
                        .courseInterest("Tư vấn Tuyển sinh từ Chat AI")
                        .note("Khách hàng cung cấp thông tin qua hội thoại #" + (conv != null ? conv.getId() : "N/A") + ": " + text)
                        .build());
                log.info("Đã tự động lưu Lead mới từ Chat AI vào CRM: {} - {}", name, phone);
            } catch (Exception e) {
                log.warn("Không thể lưu Lead tự động từ Chat AI: {}", e.getMessage());
            }
        }
    }

    private void searchKnowledgeBaseChunks(String query, String portal, List<AiChatResponse.SourceCitation> citations) {
        try {
            List<String> allowedAccess = switch (portal) {
                case "PUBLIC" -> List.of("PUBLIC");
                case "STUDENT" -> List.of("PUBLIC", "INTERNAL");
                case "TEACHER" -> List.of("PUBLIC", "INTERNAL", "TEACHER_ONLY");
                case "ADMIN" -> List.of("PUBLIC", "INTERNAL", "TEACHER_ONLY", "ADMIN_ONLY");
                default -> List.of("PUBLIC");
            };

            // Tách từ khóa đơn giản
            String[] words = query.split("\\s+");
            for (String w : words) {
                if (w.length() >= 4) {
                    List<AiKbChunk> hits = chunkRepository.searchByAccessLevels(allowedAccess, w);
                    for (AiKbChunk chunk : hits) {
                        if (citations.size() >= 4) break;
                        citations.add(AiChatResponse.SourceCitation.builder()
                                .documentName(chunk.getDocument().getName())
                                .section("Đoạn #" + chunk.getChunkIndex())
                                .snippet(chunk.getContent().length() > 200 ? chunk.getContent().substring(0, 197) + "..." : chunk.getContent())
                                .build());
                    }
                }
                if (citations.size() >= 3) break;
            }
        } catch (Exception ex) {
            log.warn("Lỗi khi tra cứu Kho tri thức chunks: {}", ex.getMessage());
        }
    }

    // ========================================================
    // 4. XÂY DỰNG NGỮ CẢNH ĐỘNG DỮ LIỆU THỰC TẾ
    // ========================================================

    private String buildDynamicContext(User user, String portal) {
        StringBuilder sb = new StringBuilder();

        if ("PUBLIC".equals(portal)) {
            sb.append("DANH MỤC KHÓA HỌC CHÍNH THỨC TẠI CH ACADEMY (Dữ liệu từ hệ thống đào tạo):\n");
            List<vn.chacademy.course.entity.Course> courses = courseRepository.findAll();
            for (var c : courses) {
                if ("ACTIVE".equalsIgnoreCase(c.getStatus())) {
                    sb.append("- ").append(c.getName()).append(" (Mã: ").append(c.getCode()).append("): ")
                      .append("Học phí niêm yết: ").append(String.format("%,.0f", c.getDefaultTuitionFee())).append(" VNĐ, ")
                      .append("thời lượng: ").append(c.getDurationHours()).append(" giờ, ")
                      .append("đối tượng: ").append(c.getTargetAudience()).append(".\n")
                      .append("  Mục tiêu đào tạo: ").append(c.getLearningOutcomes() != null ? c.getLearningOutcomes() : "Chuẩn kiến thức & kỹ năng ứng dụng").append("\n");
                }
            }

            sb.append("\nCÁC LỚP ĐANG TUYỂN SINH & LỊCH KHAI GIẢNG GẦN NHẤT:\n");
            List<ClassEntity> openClasses = classRepository.findAll();
            for (var cl : openClasses) {
                if ("OPEN_FOR_ENROLLMENT".equalsIgnoreCase(cl.getStatus()) || "ACTIVE".equalsIgnoreCase(cl.getStatus())) {
                    sb.append("- Lớp ").append(cl.getName()).append(" (").append(cl.getCode()).append("): Khai giảng ")
                      .append(cl.getStartDate()).append(" tại phòng ").append(cl.getRoom() != null ? cl.getRoom() : "Trực tiếp/Online").append("\n");
                }
            }
            sb.append("\nQUY TẮC BẮT BUỘC:\n");
            sb.append("- Chỉ tư vấn dựa trên danh mục khóa học và lớp học có thật nêu trên.\n");
            sb.append("- Nếu người dùng hỏi khóa học không có trong danh mục, PHẢI nêu rõ CH Academy hiện chưa mở khóa này và mời để lại số điện thoại để chuyên viên tư vấn hỗ trợ xếp lớp.\n");
            sb.append("- Khi khách hàng có nhu cầu đăng ký, hãy hướng dẫn khách để lại số điện thoại hoặc bấm nút 'Tư vấn ngay' trên khung chat để được ghi nhận vào hệ thống.\n");
            return sb.toString();
        }

        if (user == null) return "";

        sb.append("NGƯỜI DÙNG: ").append(user.getFullName()).append(" (@").append(user.getUsername()).append(")\n");
        sb.append("CỔNG TRUY CẬP: ").append(portal).append("\n\n");

        if ("STUDENT".equals(portal)) {
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

                sb.append("\nQUY TẮC SƯ PHẠM CỦA AI GIA SƯ (INTELLIGENT TUTORING SYSTEM):\n");
                sb.append("1. Khi học viên hỏi giải bài tập hoặc giải toán, BẮT BUỘC thực hiện quy trình hướng dẫn 6 bước sư phạm:\n");
                sb.append("   - Bước 1: Phân tích đề bài (Xác định rõ dữ kiện cho trước và mục tiêu cần tìm/chứng minh).\n");
                sb.append("   - Bước 2: Xác định phương pháp, kiến thức hoặc công thức toán học cần áp dụng.\n");
                sb.append("   - Bước 3: Trình bày từng bước giải kèm theo phép biến đổi chi tiết.\n");
                sb.append("   - Bước 4: Giải thích lý do vì sao thực hiện bước biến đổi đó để học viên hiểu bản chất.\n");
                sb.append("   - Bước 5: Đưa ra kết luận hoặc đáp án cuối cùng.\n");
                sb.append("   - Bước 6: Kiểm tra lại kết quả và lưu ý các lỗi sai thường gặp của học viên.\n");
                sb.append("2. Trình bày công thức toán học rõ ràng, sử dụng ký hiệu toán học hoặc KaTeX ($...$ và $$...$$).\n");
                sb.append("3. Khuyến khích tư duy gợi mở (Socratic tutoring), giải thích khái niệm bằng ví dụ thực tế dễ hiểu.\n");
                sb.append("4. Hỗ trợ học tiếng Anh: phân tích ngữ pháp, dịch nghĩa, phát âm theo phiên âm IPA và sửa lỗi sai.\n");
                sb.append("5. Chỉ hỗ trợ trong phạm vi chương trình và tài liệu các lớp học viên đang tham gia; tuyệt đối bảo mật thông tin các học viên khác.\n");
            });
        } else if ("TEACHER".equals(portal)) {
            teacherRepository.findByUserId(user.getId()).ifPresent(t -> {
                sb.append("HỒ SƠ GIẢNG VIÊN: ").append(t.getFullName()).append(" (Mã: ").append(t.getTeacherCode()).append(")\n");
                List<ClassEntity> classes = classRepository.findByPrimaryTeacherIdOrderByStartDateDesc(t.getId());
                sb.append("CÁC LỚP PHỤ TRÁCH: ");
                for (ClassEntity c : classes) {
                    sb.append(c.getName()).append(" (").append(c.getCode()).append("), ");
                }
                sb.append("\n");
            });
        } else if ("ADMIN".equals(portal)) {
            long totalStudents = studentRepository.count();
            long totalClasses = classRepository.count();
            sb.append("TỔNG QUAN TRUNG TÂM CH ACADEMY:\n");
            sb.append("- Tổng số học viên trong hệ thống: ").append(totalStudents).append(" học viên\n");
            sb.append("- Tổng số lớp học đang quản lý: ").append(totalClasses).append(" lớp học\n");
            sb.append("- Trạng thái kết nối cơ sở dữ liệu: Hoạt động bình thường (PostgreSQL 16)\n");
        }

        return sb.toString();
    }

    // ========================================================
    // 5. LLM CALL & LOCAL CONTEXTUAL ENGINE
    // ========================================================

    private String callOpenRouterLlm(String question, String systemPrompt, String context, List<AiChatResponse.SourceCitation> citations, List<AiMessage> history) {
        try {
            org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(3000);
            factory.setReadTimeout(8000);
            RestTemplate restTemplate = new RestTemplate(factory);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openRouterKey);
            headers.set("HTTP-Referer", "https://chacademy.vn");
            headers.set("X-Title", "CH Academy GenAI Studio");

            String fullSystem = systemPrompt + "\n\nNgữ cảnh dữ liệu thực tế hệ thống CH Academy:\n" + context +
                    "\n\nQuy tắc: Luôn trả lời bằng tiếng Việt, thân thiện, trung thực, tự nhiên và duy trì trọn vẹn mạch hội thoại của các lượt trước.";

            List<Map<String, String>> messagesList = new ArrayList<>();
            messagesList.add(Map.of("role", "system", "content", fullSystem));

            if (history != null && !history.isEmpty()) {
                int start = Math.max(0, history.size() - 8);
                for (int i = start; i < history.size(); i++) {
                    AiMessage m = history.get(i);
                    messagesList.add(Map.of("role", m.getRole(), "content", m.getContent()));
                }
            } else {
                messagesList.add(Map.of("role", "user", "content", question));
            }

            Map<String, Object> body = Map.of(
                    "model", aiModel,
                    "messages", messagesList,
                    "temperature", 0.4,
                    "max_tokens", 800
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.postForEntity(
                    "https://openrouter.ai/api/v1/chat/completions", entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object choicesObj = response.getBody().get("choices");
                if (choicesObj instanceof List<?> choices && !choices.isEmpty()) {
                    Object firstChoiceObj = choices.get(0);
                    if (firstChoiceObj instanceof Map<?, ?> firstChoice) {
                        Object messageObj = firstChoice.get("message");
                        if (messageObj instanceof Map<?, ?> message) {
                            citations.add(AiChatResponse.SourceCitation.builder()
                                     .documentName("Mô hình AI: " + aiModel)
                                    .section("OpenRouter Engine")
                                    .snippet("Sinh câu trả lời từ LLM kết hợp dữ liệu ngữ cảnh CH Academy")
                                    .build());
                            return String.valueOf(message.get("content"));
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Lỗi gọi OpenRouter API: {}. Sử dụng engine nội bộ.", ex.getMessage());
        }
        return generateContextualAnswer(question, context, "PORTAL", null, citations, history);
    }

    public List<String> splitVietnameseSentences(String text) {
        if (text == null || text.isBlank()) return List.of();
        String clean = text
                .replaceAll("https?://\\S+", "")
                .replaceAll("[*#_`>|~]+", " ")
                .replaceAll("\\s+", " ")
                .trim();

        // Tách câu thông minh theo dấu ngắt và ghép thành các phân đoạn 60-140 ký tự tự nhiên, không ngắt quãng
        String[] parts = clean.split("(?<=[.!?…;:])\\s+|\\n+");
        List<String> list = new ArrayList<>();
        StringBuilder currentClause = new StringBuilder();

        for (String p : parts) {
            String s = p.trim();
            if (s.isEmpty()) continue;

            if (currentClause.length() > 0 && (currentClause.length() + s.length() < 140)) {
                currentClause.append(" ").append(s);
            } else {
                if (currentClause.length() > 0) {
                    list.add(currentClause.toString().trim());
                    currentClause.setLength(0);
                }
                currentClause.append(s);
            }
        }
        if (currentClause.length() > 0) {
            list.add(currentClause.toString().trim());
        }

        if (list.isEmpty() && !clean.isEmpty()) {
            list.add(clean);
        }
        return list;
    }

    public Map<String, Object> getVoiceDiagnostics() {
        Map<String, Object> diag = new HashMap<>();
        diag.put("status", "UP");
        diag.put("timestamp", Instant.now().toString());
        diag.put("model", aiModel);
        diag.put("openRouterConfigured", (openRouterKey != null && !openRouterKey.isBlank()));
        diag.put("sttEngines", List.of("WEB_SPEECH_API", "MEDIA_RECORDER_VAD"));
        diag.put("ttsEngines", List.of("WEB_SPEECH_SYNTHESIS", "SENTENCE_STREAMING"));
        diag.put("language", "vi-VN");
        diag.put("fallbackEngine", "ContextualRuleEngine");
        diag.put("latencyTargetMs", 1500);
        return diag;
    }

    private String generateContextualAnswer(String question, String context, String portal, User user, List<AiChatResponse.SourceCitation> citations, List<AiMessage> history) {
        String lower = question.toLowerCase();

        // 1. Phân hệ công khai (Public Admission Agent)
        if ("PUBLIC".equals(portal)) {
            if (lower.contains("tiếng nhật") || lower.contains("tiếng hàn") || lower.contains("tiếng trung") || lower.contains("tiếng pháp") || lower.contains("nấu ăn")) {
                return "Hiện tại CH Academy chưa có chương trình này trong danh mục đào tạo chính thức (trung tâm hiện chuyên sâu các chương trình Tiếng Anh từ trẻ em đến người đi làm, Luyện thi IELTS chuẩn quốc tế và Lập trình cơ bản). Bạn có thể để lại số điện thoại hoặc nhấn 'Tư vấn ngay' nếu cần tư vấn lộ trình học phù hợp nhất nhé!";
            }

            if (lower.contains("khóa học") || lower.contains("học phí") || lower.contains("giá") || lower.contains("lớp") || lower.contains("khai giảng")) {
                List<vn.chacademy.course.entity.Course> courses = courseRepository.findAll();
                StringBuilder resp = new StringBuilder("Chào bạn! Dưới đây là danh mục các khóa học và học phí chính thức đang được đào tạo tại CH Academy:\n\n");
                for (var c : courses) {
                    if ("ACTIVE".equalsIgnoreCase(c.getStatus())) {
                        resp.append("• **").append(c.getName()).append("** (").append(c.getCode()).append("): ")
                            .append(String.format("%,.0f", c.getDefaultTuitionFee())).append(" VNĐ - ")
                            .append(c.getDurationHours()).append(" giờ học (Đối tượng: ").append(c.getTargetAudience()).append(")\n");
                    }
                }
                resp.append("\nBạn có thể nhấn vào nút **'Tư vấn ngay'** ở trên hoặc nhắn trực tiếp Số điện thoại tại đây để chuyên viên tuyển sinh của CH Academy liên hệ hỗ trợ xếp lịch kiểm tra trình độ miễn phí nhé!");
                citations.add(AiChatResponse.SourceCitation.builder()
                        .documentName("Hệ thống Đào tạo CH Academy")
                        .section("Biểu phí & Khóa học niêm yết 2026")
                        .snippet("Dữ liệu tra cứu trực tiếp từ Cơ sở dữ liệu đào tạo trung tâm")
                        .build());
                return resp.toString();
            }

            if (lower.contains("đăng ký") || lower.contains("tư vấn") || lower.contains("liên hệ") || lower.contains("sdt") || lower.contains("số điện thoại")) {
                return "Cảm ơn bạn đã quan tâm! Bạn có thể nhấn vào nút **'Tư vấn ngay'** ở góc trên khung chat hoặc nhắn trực tiếp Họ tên và Số điện thoại tại đây. Tôi sẽ chuyển thông tin ngay cho Ban Tuyển sinh CH Academy để liên hệ hỗ trợ bạn sớm nhất!";
            }

            return "Chào bạn! Tôi là Chuyên viên Tư vấn Tuyển sinh AI của CH Academy. Tôi có thể hỗ trợ bạn tra cứu khóa học chính thức, biểu phí, lịch khai giảng và tiếp nhận đăng ký tư vấn. Bạn đang quan tâm đến khóa học nào ạ?";
        }

        // 2. Kiểm tra ngữ cảnh của câu trước đó trong phiên hội thoại đa lượt
        String prevTopic = "";
        if (history != null && history.size() >= 2) {
            for (int i = history.size() - 2; i >= 0; i--) {
                AiMessage prev = history.get(i);
                if ("user".equalsIgnoreCase(prev.getRole())) {
                    prevTopic = prev.getContent().toLowerCase();
                    break;
                }
            }
        }

        // Tình huống: Học tiếng Anh
        if (lower.contains("học tiếng anh") || lower.contains("giúp tôi học tiếng anh") || lower.contains("trợ lý tiếng anh")) {
            citations.add(AiChatResponse.SourceCitation.builder()
                    .documentName("Khung năng lực Anh ngữ CH Academy")
                    .section("Giáo trình CEFR chuẩn quốc tế")
                    .snippet("Lộ trình Tiếng Anh toàn diện 4 kỹ năng Nghe - Nói - Đọc - Viết")
                    .build());
            return "Chào bạn! Tôi là AI Gia sư đồng hành học tập của CH Academy. Tôi luôn sẵn sàng hỗ trợ bạn học tiếng Anh: từ giải thích ngữ pháp, từ vựng, luyện phát âm, sửa bài tập đến hướng dẫn làm bài thi. Hôm nay bạn muốn tìm hiểu hoặc luyện tập chủ đề nào trước tiên?";
        }

        // Tình huống: Thì hiện tại đơn (Present Simple)
        if (lower.contains("thì hiện tại đơn") || lower.contains("present simple")) {
            citations.add(AiChatResponse.SourceCitation.builder()
                    .documentName("Tài liệu Ngữ pháp Căn bản — Lớp CLS-ENG-KID01 / PRO01")
                    .section("Bài 2: Các thì hiện tại trong Tiếng Anh")
                    .snippet("Quy tắc cấu trúc S + V(s/es) và dấu hiệu nhận biết always, usually, every day")
                    .build());
            return "Thì Hiện tại đơn (Present Simple) dùng để diễn tả một sự thật hiển nhiên, chân lý hoặc một thói quen lặp đi lặp lại hàng ngày.\n" +
                    "• Cấu trúc khẳng định: Chủ ngữ + Động từ (thêm 's' hoặc 'es' với he/she/it). Với động từ to be: S + am/is/are.\n" +
                    "• Cấu trúc phủ định: S + do not / does not + V nguyên mẫu.\n" +
                    "• Ví dụ: 'I study English every day' (Tôi học tiếng Anh mỗi ngày) hoặc 'The sun rises in the east' (Mặt trời mọc ở hướng Đông).\n" +
                    "Bạn có muốn tôi cho thêm ví dụ hoặc làm thử một bài tập ngắn không?";
        }

        // Tình huống: Yêu cầu cho ví dụ khác
        if (lower.contains("ví dụ khác") || lower.contains("cho tôi một ví dụ") || lower.contains("thêm ví dụ") || lower.contains("câu khác")) {
            citations.add(AiChatResponse.SourceCitation.builder()
                    .documentName("Kho bài tập thực hành CH Academy")
                    .section("Ví dụ trực quan theo ngữ cảnh")
                    .snippet("Bộ câu ví dụ thực tế chuẩn ngữ cảnh cuộc sống")
                    .build());
            if (prevTopic.contains("hiện tại đơn") || prevTopic.contains("present simple") || lower.contains("hiện tại đơn")) {
                return "Dưới đây là một ví dụ khác rất quen thuộc về thì Hiện tại đơn:\n" +
                        "• Khẳng định: 'She drinks green tea every morning.' (Cô ấy uống trà xanh vào mỗi buổi sáng — diễn tả thói quen).\n" +
                        "• Phủ định: 'He does not work on Sundays.' (Anh ấy không làm việc vào các ngày Chủ Nhật).\n" +
                        "• Câu hỏi: 'Do you live in Hanoi?' (Bạn có sống ở Hà Nội không?).\n" +
                        "Bây giờ bạn hãy thử đặt một câu ngắn sử dụng thì này để tôi kiểm tra giúp bạn nhé!";
            }
            return "Dưới đây là một ví dụ thực tế khác:\n" +
                    "• 'We practice speaking English with our teacher twice a week.' (Chúng tôi luyện nói tiếng Anh với giáo viên hai lần một tuần).\n" +
                    "Bạn thấy câu này đã rõ ràng chưa, bạn muốn phân tích ngữ pháp hay luyện đặt câu tiếp theo?";
        }

        // Tình huống: Yêu cầu giải thích chậm hơn hoặc chi tiết hơn
        if (lower.contains("chậm hơn") || lower.contains("giải thích lại") || lower.contains("nói chậm") || lower.contains("từ từ")) {
            return "Dạ vâng, tôi giải thích lại từng bước thật chậm và dễ nhớ nhé:\n" +
                    "1. Ý nghĩa: Bạn chỉ dùng thì này khi nói về thói quen hàng ngày (ngày nào cũng làm) hoặc sự thật hiển nhiên.\n" +
                    "2. Với nhóm I / You / We / They: Bạn giữ nguyên động từ, không cần biến đổi gì cả. Ví dụ: 'I speak English'.\n" +
                    "3. Với nhóm He / She / It: Bạn chỉ cần thêm chữ 's' hoặc 'es' vào sau động từ. Ví dụ: 'He speaks English'.\n" +
                    "Rất đơn giản đúng không ạ? Bạn đã nắm được quy tắc này chưa?";
        }

        // Tình huống: Lớp học
        if (lower.contains("lớp") || lower.contains("học phần") || lower.contains("môn")) {
            citations.add(AiChatResponse.SourceCitation.builder()
                    .documentName("Hồ sơ đào tạo học viên")
                    .section("Cơ sở dữ liệu Lớp học")
                    .snippet(context.contains("LỚP ĐANG HỌC:") ? context.substring(context.indexOf("LỚP ĐANG HỌC:")) : "Dữ liệu lớp học")
                    .build());
            return "Dựa trên hồ sơ của bạn tại CH Academy:\n" +
                    (context.contains("LỚP ĐANG HỌC:") ? context.substring(context.indexOf("LỚP ĐANG HỌC:")) : "Bạn hiện đang ghi danh vào các lớp học theo thời khóa biểu của trung tâm.") +
                    "\nBạn hãy chủ động vào nhóm chat của lớp để trao đổi cùng thầy cô và bạn bè nhé!";
        }

        // Tình huống: Học phí
        if (lower.contains("học phí") || lower.contains("công nợ") || lower.contains("tiền học")) {
            citations.add(AiChatResponse.SourceCitation.builder()
                    .documentName("Sổ bộ Tài chính & Học phí")
                    .section("Cơ sở dữ liệu Tài chính")
                    .snippet(context.contains("HỌC PHÍ:") ? context.substring(context.indexOf("HỌC PHÍ:")) : "Thông tin học phí")
                    .build());
            return "Thông tin học phí của bạn:\n" +
                    (context.contains("HỌC PHÍ:") ? context.substring(context.indexOf("HỌC PHÍ:")) : "Bạn đã hoàn thành các khoản học phí theo quy định.") +
                    "\nĐể tra cứu chi tiết hóa đơn hoặc nhận biên lai điện tử, bạn có thể xem tại mục 'Học phí' trên thanh điều hướng.";
        }

        // Tình huống: Chuyên cần
        if (lower.contains("chuyên cần") || lower.contains("điểm danh") || lower.contains("nghỉ học")) {
            citations.add(AiChatResponse.SourceCitation.builder()
                    .documentName("Quy_Che_Dao_Tao_Va_Noi_Quy_CH_Academy.pdf")
                    .section("Điều 4: Tỷ lệ chuyên cần")
                    .snippet("Học viên phải đạt tỷ lệ tham gia lớp tối thiểu 80% để đủ điều kiện dự thi cuối kỳ.")
                    .build());
            return "Theo quy chế đào tạo tại CH Academy: Học viên cần đảm bảo tỷ lệ chuyên cần từ 80% trở lên để đủ điều kiện tham dự bài kiểm tra đánh giá năng lực cuối kỳ. Nếu có việc bận, học viên vui lòng xin phép giáo viên chủ nhiệm trên nhóm chat của lớp trước ít nhất 2 giờ.";
        }

        return "Chào " + (user != null ? user.getFullName() : "bạn") + "! Tôi là Trợ lý AI của CH Academy. Tôi có thể hỗ trợ bạn học tập, giải thích kiến thức, tra cứu lịch học, lớp học đang tham gia, học phí và tài liệu môn học. Bạn cần tôi hỗ trợ chủ đề gì?";
    }

    private void saveAssistantMessage(AiConversation conversation, String content, List<AiChatResponse.SourceCitation> citations, int tokens) {
        String sourcesJson = null;
        try {
            sourcesJson = objectMapper.writeValueAsString(citations);
        } catch (Exception ignored) {}

        messageRepository.save(AiMessage.builder()
                .conversation(conversation)
                .role("assistant")
                .content(content)
                .sourcesJson(sourcesJson)
                .tokensUsed(tokens)
                .createdAt(Instant.now())
                .build());
    }
}
