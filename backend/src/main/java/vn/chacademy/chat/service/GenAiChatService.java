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
import vn.chacademy.chat.entity.*;
import vn.chacademy.chat.repository.*;
import vn.chacademy.common.exception.BadRequestException;
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
    private final AiAgentRepository agentRepository;
    private final AiKnowledgeBaseRepository knowledgeBaseRepository;
    private final AiKbChunkRepository chunkRepository;
    private final AiLeadRepository leadRepository;
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

    // ========================================================
    // 1. TRUY XUẤT HỘI THOẠI CÓ PHÂN TÁCH DANH TÍNH & CỔNG
    // ========================================================

    @Transactional(readOnly = true)
    public List<AiConversationDto> getUserConversations(User user, String portal) {
        if (user == null) return List.of();
        String validatedPortal = normalizeAndValidatePortal(portal, user);
        return conversationRepository.findByUserIdAndPortalOrderByUpdatedAtDesc(user.getId(), validatedPortal).stream()
                .map(AiConversationDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AiMessageDto> getConversationMessages(Long conversationId, User user, String portal) {
        if (user == null) {
            throw new AccessDeniedException("Chưa xác thực người dùng");
        }
        String validatedPortal = normalizeAndValidatePortal(portal, user);
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
        String question = request.getQuestion() != null ? request.getQuestion().trim() : "";
        if (question.isEmpty()) {
            throw new BadRequestException("Câu hỏi không được để trống");
        }

        boolean isPublic = (user == null);
        String portal = isPublic ? "PUBLIC" : normalizeAndValidatePortal(request.getPortal(), user);
        String channel = request.getChannel() != null ? request.getChannel().toUpperCase() : (isPublic ? "WEBSITE" : "PORTAL");
        String agentCode = resolveAgentCodeForPortal(portal);

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

        // 3. Kiểm tra yêu cầu Human Handoff (chuyển người thật / tư vấn viên)
        List<AiChatResponse.SourceCitation> citations = new ArrayList<>();
        boolean isHandoffRequest = checkHandoffIntent(question);
        if (isHandoffRequest) {
            conversation.setStatus("WAITING_HUMAN");
            conversationRepository.save(conversation);

            // Tự động thu thập Lead nếu có số điện thoại
            extractAndSaveLeadIfPresent(question, conversation, request.getGuestName(), request.getGuestPhone());

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
        String systemPrompt = getAgentSystemPrompt(agentCode, portal);

        // 7. Sinh câu trả lời (LLM OpenRouter hoặc Engine tri thức cục bộ)
        String answer;
        if (openRouterKey != null && !openRouterKey.isBlank()) {
            answer = callOpenRouterLlm(question, systemPrompt, dynamicContext, citations);
        } else {
            answer = generateContextualAnswer(question, dynamicContext, portal, user, citations);
        }

        // 8. Lưu câu trả lời của trợ lý
        saveAssistantMessage(conversation, answer, citations, 180);

        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        return AiChatResponse.builder()
                .conversationId(conversation.getId())
                .answer(answer)
                .sources(citations)
                .build();
    }

    @Transactional
    public void markHandoff(Long conversationId, User user, String portal) {
        AiConversation conv;
        if (user != null) {
            conv = conversationRepository.findByIdAndUserIdAndPortal(conversationId, user.getId(), portal)
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

    private String normalizeAndValidatePortal(String portal, User user) {
        if (portal == null || portal.isBlank()) {
            return resolvePrimaryPortal(user);
        }
        String p = portal.toUpperCase().trim();
        if ("ADMIN".equals(p)) {
            if (!hasRole(user, "ADMIN") && !hasRole(user, "SUPER_ADMIN")) {
                throw new AccessDeniedException("Tài khoản của bạn không có quyền truy cập không gian hội thoại Admin");
            }
            return "ADMIN";
        } else if ("TEACHER".equals(p)) {
            if (!hasRole(user, "TEACHER") && !hasRole(user, "ADMIN") && !hasRole(user, "SUPER_ADMIN")) {
                throw new AccessDeniedException("Tài khoản của bạn không có quyền truy cập không gian hội thoại Giảng viên");
            }
            return "TEACHER";
        } else if ("STUDENT".equals(p)) {
            return "STUDENT";
        } else if ("PUBLIC".equals(p)) {
            return "PUBLIC";
        }
        return resolvePrimaryPortal(user);
    }

    private boolean hasRole(User user, String roleName) {
        if (user == null || user.getRoles() == null) return false;
        return user.getRoles().stream().anyMatch(r -> r.getId() != null && r.getId().contains(roleName));
    }

    private String resolvePrimaryPortal(User user) {
        if (user == null) return "PUBLIC";
        if (hasRole(user, "ADMIN") || hasRole(user, "SUPER_ADMIN")) return "ADMIN";
        if (hasRole(user, "TEACHER")) return "TEACHER";
        return "STUDENT";
    }

    private String resolveAgentCodeForPortal(String portal) {
        return switch (portal) {
            case "ADMIN" -> "AGENT_ADMIN_ASSISTANT";
            case "TEACHER" -> "AGENT_TEACHER_ASSISTANT";
            case "PUBLIC" -> "AGENT_ADMISSIONS";
            default -> "AGENT_STUDENT_TUTOR";
        };
    }

    private String getAgentSystemPrompt(String agentCode, String portal) {
        return agentRepository.findByCode(agentCode)
                .map(AiAgent::getSystemPrompt)
                .orElse("Bạn là Trợ lý AI chuyên nghiệp của CH Academy.");
    }

    private boolean checkHandoffIntent(String text) {
        String lower = text.toLowerCase();
        return lower.contains("gặp nhân viên") || lower.contains("gặp người thật") ||
                lower.contains("tư vấn viên") || lower.contains("chuyển người") ||
                lower.contains("khiếu nại") || lower.contains("liên hệ người thật") ||
                lower.contains("nhân viên trực tiếp");
    }

    private void extractAndSaveLeadIfPresent(String text, AiConversation conv, String defaultName, String defaultPhone) {
        // Tìm số điện thoại dạng 10 số (09x, 08x, 03x, 07x, 05x)
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(0[3|5|7|8|9][0-9]{8})").matcher(text);
        String phone = defaultPhone;
        if (matcher.find()) {
            phone = matcher.group(1);
        }

        if (phone != null && !phone.isBlank()) {
            String name = (defaultName != null && !defaultName.isBlank()) ? defaultName : "Khách hàng Web";
            if (!leadRepository.existsByPhoneAndCourseInterest(phone, "Tư vấn từ Chat AI")) {
                leadRepository.save(AiLead.builder()
                        .conversation(conv)
                        .fullName(name)
                        .phone(phone)
                        .courseInterest("Tư vấn từ Chat AI")
                        .note("Khách hàng để lại thông tin qua hội thoại #" + conv.getId() + ": " + text)
                        .status("NEW")
                        .createdAt(Instant.now())
                        .build());
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
            sb.append("CÁC KHÓA HỌC HIỆN TẠI TẠI CH ACADEMY:\n");
            sb.append("- Khóa Tiếng Anh Trẻ em Toàn diện (KID-ENG-01): Dành cho bé từ 6-12 tuổi, học phí 3.500.000 VNĐ (3 tháng, 24 buổi).\n");
            sb.append("- Khóa Tiếng Anh Giao tiếp Doanh nghiệp & Công sở (PRO-ENG-02): Dành cho người đi làm, học phí 4.800.000 VNĐ (4 tháng, 32 buổi).\n");
            sb.append("- Luyện thi IELTS Cấp tốc mục tiêu 6.5+: Học phí 6.500.000 VNĐ, cam kết chuẩn đầu ra.\n");
            sb.append("ƯU ĐÃI: Giảm 10% khi đăng ký nhóm từ 2 học viên.\n");
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

    private String callOpenRouterLlm(String question, String systemPrompt, String context, List<AiChatResponse.SourceCitation> citations) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openRouterKey);
            headers.set("HTTP-Referer", "https://chacademy.vn");
            headers.set("X-Title", "CH Academy GenAI Studio");

            String fullSystem = systemPrompt + "\n\nNgữ cảnh dữ liệu thực tế hệ thống CH Academy:\n" + context +
                    "\n\nQuy tắc: Luôn trả lời bằng tiếng Việt, thân thiện, trung thực và không bịa đặt số liệu.";

            Map<String, Object> body = Map.of(
                    "model", aiModel,
                    "messages", List.of(
                            Map.of("role", "system", "content", fullSystem),
                            Map.of("role", "user", "content", question)
                    ),
                    "temperature", 0.3,
                    "max_tokens", 800
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
            log.warn("Lỗi gọi OpenRouter API: {}. Sử dụng engine nội bộ.", ex.getMessage());
        }
        return generateContextualAnswer(question, context, "PORTAL", null, citations);
    }

    private String generateContextualAnswer(String question, String context, String portal, User user, List<AiChatResponse.SourceCitation> citations) {
        String lower = question.toLowerCase();

        if ("PUBLIC".equals(portal)) {
            if (lower.contains("khóa học") || lower.contains("học phí") || lower.contains("giá")) {
                citations.add(AiChatResponse.SourceCitation.builder()
                        .documentName("Bang_Gia_Va_Chuong_Trinh_Dao_Tao_2026.pdf")
                        .section("Biểu phí tiêu chuẩn năm 2026")
                        .snippet("Khóa Tiếng Anh Trẻ em: 3.500.000 VNĐ; Khóa Giao tiếp Công sở: 4.800.000 VNĐ; IELTS: 6.500.000 VNĐ.")
                        .build());
                return "Chào bạn! Hiện tại CH Academy đang đào tạo các khóa học trọng điểm sau:\n\n" +
                        "1. **Tiếng Anh Trẻ em Toàn diện (KID-ENG-01)**: Học phí 3.500.000 VNĐ (3 tháng, 24 buổi).\n" +
                        "2. **Tiếng Anh Giao tiếp Doanh nghiệp & Công sở (PRO-ENG-02)**: Học phí 4.800.000 VNĐ (4 tháng, 32 buổi).\n" +
                        "3. **Luyện thi IELTS Cấp tốc 6.5+**: Học phí 6.500.000 VNĐ (cam kết đầu ra).\n\n" +
                        "Trung tâm đang có ưu đãi giảm 10% khi đăng ký theo nhóm. Bạn muốn đăng ký tìm hiểu khóa học nào để mình hỗ trợ xếp lịch kiểm tra đầu vào miễn phí nhé?";
            }
            return "Chào bạn! Tôi là Chuyên viên Tư vấn Tuyển sinh AI của CH Academy. Tôi có thể hỗ trợ bạn tìm hiểu về các khóa học tiếng Anh, lịch khai giảng, học phí và chính sách ưu đãi. Bạn đang quan tâm đến chương trình học nào ạ?";
        }

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

        if (lower.contains("chuyên cần") || lower.contains("điểm danh") || lower.contains("nghỉ học")) {
            citations.add(AiChatResponse.SourceCitation.builder()
                    .documentName("Quy_Che_Dao_Tao_Va_Noi_Quy_CH_Academy.pdf")
                    .section("Điều 4: Tỷ lệ chuyên cần")
                    .snippet("Học viên phải đạt tỷ lệ tham gia lớp tối thiểu 80% để đủ điều kiện dự thi cuối kỳ.")
                    .build());
            return "Theo quy chế đào tạo tại CH Academy: Học viên cần đảm bảo tỷ lệ chuyên cần từ 80% trở lên để đủ điều kiện tham dự bài kiểm tra đánh giá năng lực cuối kỳ. Nếu có việc bận, học viên vui lòng xin phép giáo viên chủ nhiệm trên nhóm chat của lớp trước ít nhất 2 giờ.";
        }

        return "Chào " + (user != null ? user.getFullName() : "bạn") + "! Tôi là Trợ lý AI của CH Academy. Tôi có thể hỗ trợ bạn tra cứu lịch học, lớp học đang tham gia, tình trạng học phí, tài liệu môn học và nội quy của trung tâm. Bạn cần tôi hỗ trợ thông tin gì hôm nay?";
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
