package vn.chacademy.chat.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import vn.chacademy.chat.dto.PortalConfigDto;
import vn.chacademy.chat.entity.AiAgent;
import vn.chacademy.chat.repository.AiAgentRepository;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortalAgentResolver {

    private final AiAgentRepository agentRepository;

    public static final String PORTAL_PUBLIC = "PUBLIC";
    public static final String PORTAL_STUDENT = "STUDENT";
    public static final String PORTAL_TEACHER = "TEACHER";
    public static final String PORTAL_ADMIN = "ADMIN";

    public static final String SCOPE_PUBLIC = "PUBLIC_ADMISSION";
    public static final String SCOPE_STUDENT = "STUDENT_TUTOR";
    public static final String SCOPE_TEACHER = "TEACHER_ASSISTANT";
    public static final String SCOPE_ADMIN = "ADMIN_ASSISTANT";

    /**
     * Xác định và kiểm tra tính hợp lệ của Portal dựa trên phiên người dùng thực tế.
     * Tuyệt đối không tin tưởng portal do client tự ý gửi lên.
     */
    public String determineEffectivePortal(String requestedPortal, User user) {
        if (user == null) {
            // Khách chưa đăng nhập bắt buộc chỉ thuộc cổng PUBLIC
            return PORTAL_PUBLIC;
        }

        String p = (requestedPortal != null && !requestedPortal.isBlank())
                ? requestedPortal.toUpperCase().trim()
                : resolvePrimaryPortalByUser(user);

        validateUserPortalAccess(p, user);
        return p;
    }

    /**
     * Kiểm tra phân quyền truy cập không gian hội thoại theo vai trò tài khoản.
     */
    public void validateUserPortalAccess(String portal, User user) {
        if (PORTAL_PUBLIC.equalsIgnoreCase(portal)) {
            // Bất kỳ ai cũng có thể truy cập thông tin tư vấn công khai
            return;
        }

        if (user == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập để truy cập không gian hội thoại nội bộ " + portal);
        }

        String p = portal.toUpperCase().trim();
        switch (p) {
            case PORTAL_ADMIN -> {
                if (!hasRole(user, "ADMIN") && !hasRole(user, "SUPER_ADMIN") && !hasRole(user, "CENTER_ADMIN")) {
                    throw new AccessDeniedException("Tài khoản của bạn không có quyền truy cập Trợ lý Quản trị");
                }
            }
            case PORTAL_TEACHER -> {
                if (!hasRole(user, "TEACHER") && !hasRole(user, "ADMIN") && !hasRole(user, "SUPER_ADMIN")) {
                    throw new AccessDeniedException("Tài khoản của bạn không có quyền truy cập Trợ lý Giảng dạy");
                }
            }
            case PORTAL_STUDENT -> {
                // Mọi tài khoản học viên hoặc quản trị/giáo vụ đều có thể truy cập không gian học tập
                if (user.getRoles() == null || user.getRoles().isEmpty()) {
                    throw new AccessDeniedException("Tài khoản của bạn không có vai trò hợp lệ trong hệ thống");
                }
            }
            default -> throw new AccessDeniedException("Khu vực hội thoại không hợp lệ: " + portal);
        }
    }

    /**
     * Resolve AI Agent chuẩn xác theo Scope và Portal.
     * Tuyệt đối không fallback sang Agent tuyển sinh nếu không tìm thấy.
     */
    public AiAgent resolveAgent(String requestedPortal, User user) {
        String effectivePortal = determineEffectivePortal(requestedPortal, user);
        String targetScope = switch (effectivePortal) {
            case PORTAL_ADMIN -> SCOPE_ADMIN;
            case PORTAL_TEACHER -> SCOPE_TEACHER;
            case PORTAL_STUDENT -> SCOPE_STUDENT;
            default -> SCOPE_PUBLIC;
        };

        return agentRepository.findAll().stream()
                .filter(a -> targetScope.equalsIgnoreCase(a.getScope()) && "PUBLISHED".equalsIgnoreCase(a.getStatus()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Hệ thống chưa cấu hình AI Agent hoạt động cho phạm vi: " + targetScope + " (Khu vực: " + effectivePortal + ")"
                ));
    }

    /**
     * Lấy cấu hình giao diện & tính năng tương ứng với từng Portal.
     */
    public PortalConfigDto getPortalConfig(String requestedPortal, User user) {
        String effectivePortal = determineEffectivePortal(requestedPortal, user);
        AiAgent agent = resolveAgent(requestedPortal, user);

        return switch (effectivePortal) {
            case PORTAL_STUDENT -> PortalConfigDto.builder()
                    .portal(PORTAL_STUDENT)
                    .agentCode(agent.getCode())
                    .agentName("AI Gia sư")
                    .roleName("Trợ lý Học tập")
                    .badge("Học viên")
                    .badgeColor("bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300")
                    .welcomeMessage("Chào bạn! Tôi là AI Gia sư đồng hành học tập. Tôi có thể hỗ trợ giải thích bài học, hướng dẫn giải bài tập theo 6 bước sư phạm hoặc luyện tập kiến thức.")
                    .features(PortalConfigDto.PortalFeatures.builder()
                            .hasGroupChat(true)
                            .hasVoiceCall(true)
                            .hasTutoringMode(true)
                            .hasLeadCapture(false)
                            .hasDirectHandoff(false)
                            .build())
                    .suggestedPrompts(List.of(
                            "📐 Hướng dẫn giải bài tập theo 6 bước sư phạm",
                            "✍️ Sửa lỗi phát âm & ngữ pháp tiếng Anh",
                            "📝 Tóm tắt kiến thức bài học vừa qua",
                            "🎯 Tạo 3 câu hỏi trắc nghiệm tự luyện"
                    ))
                    .build();

            case PORTAL_TEACHER -> PortalConfigDto.builder()
                    .portal(PORTAL_TEACHER)
                    .agentCode(agent.getCode())
                    .agentName("Trợ lý Giảng dạy & Soạn bài")
                    .roleName("Trợ lý Giảng dạy")
                    .badge("Giảng viên")
                    .badgeColor("bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300")
                    .welcomeMessage("Chào thầy cô! Tôi là Trợ lý Giảng dạy. Tôi có thể hỗ trợ soạn giáo án, gợi ý đề thi, tóm tắt tài liệu môn học và phân tích điểm số học viên.")
                    .features(PortalConfigDto.PortalFeatures.builder()
                            .hasGroupChat(true)
                            .hasVoiceCall(true)
                            .hasTutoringMode(false)
                            .hasLeadCapture(false)
                            .hasDirectHandoff(false)
                            .build())
                    .suggestedPrompts(List.of(
                            "📋 Gợi ý giáo án cho buổi học tới",
                            "❓ Tạo 5 câu hỏi trắc nghiệm kiểm tra nhanh",
                            "📊 Phân tích kết quả học tập của lớp",
                            "💡 Đề xuất bài tập bổ trợ cho học viên yếu"
                    ))
                    .build();

            case PORTAL_ADMIN -> PortalConfigDto.builder()
                    .portal(PORTAL_ADMIN)
                    .agentCode(agent.getCode())
                    .agentName("Trợ lý Quản trị & Vận hành")
                    .roleName("Trợ lý Quản trị")
                    .badge("Quản trị viên")
                    .badgeColor("bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300")
                    .welcomeMessage("Chào Quản trị viên! Tôi có thể hỗ trợ tra cứu số liệu học viên, doanh thu, lớp học và báo cáo toàn trung tâm.")
                    .features(PortalConfigDto.PortalFeatures.builder()
                            .hasGroupChat(true)
                            .hasVoiceCall(false)
                            .hasTutoringMode(false)
                            .hasLeadCapture(false)
                            .hasDirectHandoff(false)
                            .build())
                    .suggestedPrompts(List.of(
                            "📈 Báo cáo chỉ số tuyển sinh tuần này",
                            "👥 Tỷ lệ chuyên cần các lớp đang diễn ra",
                            "💰 Tổng quan học phí đã thu và công nợ",
                            "⚡ Trạng thái các dịch vụ hệ thống"
                    ))
                    .build();

            default -> PortalConfigDto.builder()
                    .portal(PORTAL_PUBLIC)
                    .agentCode(agent.getCode())
                    .agentName("Chuyên viên Tư vấn Tuyển sinh AI")
                    .roleName("Tư vấn Tuyển sinh")
                    .badge("Tư vấn Tuyển sinh")
                    .badgeColor("bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300")
                    .welcomeMessage("Xin chào! Tôi là Chuyên viên Tư vấn Tuyển sinh AI của CH Academy. Tôi có thể hỗ trợ bạn tìm hiểu các khóa học, học phí niêm yết, lịch khai giảng và chính sách ưu đãi.")
                    .features(PortalConfigDto.PortalFeatures.builder()
                            .hasGroupChat(false)
                            .hasVoiceCall(true)
                            .hasTutoringMode(false)
                            .hasLeadCapture(true)
                            .hasDirectHandoff(true)
                            .build())
                    .suggestedPrompts(List.of(
                            "🎓 Các khóa học đang tuyển sinh",
                            "💰 Biểu phí & học bổng 2026",
                            "📅 Lịch khai giảng gần nhất",
                            "📞 Đăng ký kiểm tra đầu vào"
                    ))
                    .build();
        };
    }

    private String resolvePrimaryPortalByUser(User user) {
        if (user == null) return PORTAL_PUBLIC;
        if (hasRole(user, "ADMIN") || hasRole(user, "SUPER_ADMIN") || hasRole(user, "CENTER_ADMIN")) return PORTAL_ADMIN;
        if (hasRole(user, "TEACHER")) return PORTAL_TEACHER;
        return PORTAL_STUDENT;
    }

    private boolean hasRole(User user, String roleName) {
        if (user == null || user.getRoles() == null) return false;
        return user.getRoles().stream().anyMatch(r -> r.getId() != null && r.getId().contains(roleName));
    }
}

