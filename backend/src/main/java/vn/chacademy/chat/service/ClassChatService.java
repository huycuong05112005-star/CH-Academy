package vn.chacademy.chat.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.entity.ClassEntity;
import vn.chacademy.academic.entity.Enrollment;
import vn.chacademy.academic.entity.TeacherAssignment;
import vn.chacademy.academic.repository.ClassRepository;
import vn.chacademy.academic.repository.EnrollmentRepository;
import vn.chacademy.academic.repository.TeacherAssignmentRepository;
import vn.chacademy.chat.dto.ChatConversationDto;
import vn.chacademy.chat.dto.ChatMemberDto;
import vn.chacademy.chat.dto.ChatMessageDto;
import vn.chacademy.chat.dto.SendMessageRequest;
import vn.chacademy.chat.entity.ChatConversation;
import vn.chacademy.chat.entity.ChatMember;
import vn.chacademy.chat.entity.ChatMessage;
import vn.chacademy.chat.repository.ChatConversationRepository;
import vn.chacademy.chat.repository.ChatMemberRepository;
import vn.chacademy.chat.repository.ChatMessageRepository;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.entity.User;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClassChatService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMemberRepository memberRepository;
    private final ChatMessageRepository messageRepository;
    private final ClassRepository classRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TeacherAssignmentRepository teacherAssignmentRepository;

    @Transactional(readOnly = true)
    public List<ChatConversationDto> getUserConversations(User user) {
        return getUserConversations(user, null);
    }

    @Transactional(readOnly = true)
    public List<ChatConversationDto> getUserConversations(User user, String portal) {
        if (user == null) return List.of();

        boolean isAdminRole = user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getId() != null && (r.getId().contains("ADMIN") || r.getId().equals("SUPER_ADMIN")));

        String effectivePortal = portal != null ? portal.trim().toUpperCase() : null;
        if (effectivePortal == null) {
            if (isAdminRole) {
                effectivePortal = "ADMIN";
            } else if (user.getRoles() != null && user.getRoles().stream().anyMatch(r -> "TEACHER".equals(r.getId()))) {
                effectivePortal = "TEACHER";
            } else {
                effectivePortal = "STUDENT";
            }
        }

        List<ChatConversation> conversations;

        if ("ADMIN".equals(effectivePortal)) {
            if (!isAdminRole) {
                throw new AccessDeniedException("Bạn không có quyền quản trị để giám sát toàn bộ nhóm chat");
            }
            conversations = conversationRepository.findAll();
        } else if ("TEACHER".equals(effectivePortal)) {
            // Giảng viên: chỉ lấy những lớp được phân công giảng dạy (primary hoặc active assignment)
            Set<Long> teacherClassIds = new HashSet<>();
            classRepository.findByPrimaryTeacherUserId(user.getId())
                    .forEach(c -> teacherClassIds.add(c.getId()));
            teacherAssignmentRepository.findByTeacherUserIdAndStatus(user.getId(), "ACTIVE")
                    .forEach(ta -> {
                        if (ta.getClassEntity() != null) {
                            teacherClassIds.add(ta.getClassEntity().getId());
                        }
                    });

            if (teacherClassIds.isEmpty()) {
                conversations = List.of();
            } else {
                conversations = teacherClassIds.stream()
                        .map(conversationRepository::findByClassEntityId)
                        .filter(Optional::isPresent)
                        .map(Optional::get)
                        .sorted(Comparator.comparing(ChatConversation::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                        .toList();
            }
        } else {
            // Học viên (STUDENT): Chỉ lấy những lớp có Enrollment đang hoạt động (status = 'ENROLLED')
            List<Enrollment> activeEnrollments = enrollmentRepository.findByStudentUserIdAndStatus(user.getId(), "ENROLLED");
            Set<Long> enrolledClassIds = activeEnrollments.stream()
                    .filter(e -> e.getClassEntity() != null && !"CANCELLED".equalsIgnoreCase(e.getClassEntity().getStatus()))
                    .map(e -> e.getClassEntity().getId())
                    .collect(Collectors.toSet());

            if (enrolledClassIds.isEmpty()) {
                conversations = List.of();
            } else {
                conversations = enrolledClassIds.stream()
                        .map(conversationRepository::findByClassEntityId)
                        .filter(Optional::isPresent)
                        .map(Optional::get)
                        .sorted(Comparator.comparing(ChatConversation::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                        .toList();
            }
        }

        List<ChatConversationDto> result = new ArrayList<>();
        for (ChatConversation c : conversations) {
            int members = memberRepository.countByConversationId(c.getId());
            Optional<ChatMember> myMember = memberRepository.findByConversationIdAndUserId(c.getId(), user.getId());
            long unread = 0;
            if (myMember.isPresent()) {
                Long lastRead = myMember.get().getLastReadMessageId();
                unread = messageRepository.countUnreadMessagesExcludingSender(c.getId(), lastRead, user.getId());
            } else if (isAdminRole) {
                unread = 0;
            }

            Optional<ChatMessage> lastMsgOpt = messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(c.getId());
            String lastMsg = lastMsgOpt.map(m -> m.getSender().getFullName() + ": " + m.getContent()).orElse("Chưa có tin nhắn nào");
            Instant lastTime = lastMsgOpt.map(ChatMessage::getCreatedAt).orElse(c.getCreatedAt());

            result.add(ChatConversationDto.fromEntity(c, unread, lastMsg, lastTime, members));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public long getTotalUnreadCount(User user) {
        return getTotalUnreadCount(user, null);
    }

    @Transactional(readOnly = true)
    public long getTotalUnreadCount(User user, String portal) {
        if (user == null) return 0;
        List<ChatConversationDto> list = getUserConversations(user, portal);
        return list.stream().mapToLong(ChatConversationDto::getUnreadCount).sum();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getConversationMessages(Long conversationId, User user) {
        verifyMembership(conversationId, user);
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(ChatMessageDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMemberDto> getConversationMembers(Long conversationId, User user) {
        verifyMembership(conversationId, user);
        return memberRepository.findByConversationId(conversationId).stream()
                .map(ChatMemberDto::fromEntity)
                .toList();
    }

    @Transactional
    public ChatMessageDto sendMessage(Long conversationId, SendMessageRequest request, User sender) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện"));

        verifyMembership(conversationId, sender);

        // Chống gửi tin nhắn trùng lặp (Idempotent deduplication)
        if (request.getClientMsgId() != null && !request.getClientMsgId().isBlank()) {
            Optional<ChatMessage> existing = messageRepository.findByConversationIdAndClientMsgId(conversationId, request.getClientMsgId().trim());
            if (existing.isPresent()) {
                return ChatMessageDto.fromEntity(existing.get());
            }
        }

        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .messageType(request.getMessageType() != null ? request.getMessageType() : "TEXT")
                .content(request.getContent().trim())
                .attachmentUrl(request.getAttachmentUrl())
                .attachmentName(request.getAttachmentName())
                .clientMsgId(request.getClientMsgId() != null ? request.getClientMsgId().trim() : null)
                .isPinned(false)
                .createdAt(Instant.now())
                .build();

        ChatMessage saved = messageRepository.save(message);

        // Cập nhật lastReadMessageId và lastReadAt cho người gửi
        boolean isAdmin = sender.getRoles() != null && sender.getRoles().stream()
                .anyMatch(r -> r.getId() != null && (r.getId().contains("ADMIN") || r.getId().equals("SUPER_ADMIN")));

        ChatMember member = memberRepository.findByConversationIdAndUserId(conversationId, sender.getId())
                .orElseGet(() -> memberRepository.save(ChatMember.builder()
                        .conversation(conversation)
                        .user(sender)
                        .role(isAdmin ? "ADMIN" : "MEMBER")
                        .joinedAt(Instant.now())
                        .build()));
        member.setLastReadMessageId(saved.getId());
        member.setLastReadAt(Instant.now());
        memberRepository.save(member);

        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        return ChatMessageDto.fromEntity(saved);
    }

    @Transactional
    public void markAsRead(Long conversationId, User user) {
        if (user == null) return;
        ChatConversation conversation = conversationRepository.findById(conversationId).orElse(null);
        if (conversation == null) return;

        verifyMembership(conversationId, user);

        messageRepository.findFirstByConversationIdOrderByCreatedAtDesc(conversationId)
                .ifPresent(lastMsg -> {
                    boolean isAdmin = user.getRoles() != null && user.getRoles().stream()
                            .anyMatch(r -> r.getId() != null && (r.getId().contains("ADMIN") || r.getId().equals("SUPER_ADMIN")));
                    ChatMember member = memberRepository.findByConversationIdAndUserId(conversationId, user.getId())
                            .orElseGet(() -> memberRepository.save(ChatMember.builder()
                                    .conversation(conversation)
                                    .user(user)
                                    .role(isAdmin ? "ADMIN" : "MEMBER")
                                    .joinedAt(Instant.now())
                                    .build()));
                    member.setLastReadMessageId(lastMsg.getId());
                    member.setLastReadAt(Instant.now());
                    memberRepository.save(member);
                });
    }

    /**
     * Tự động đồng bộ thành viên nhóm chat theo lớp học (Idempotent & Self-Cleaning).
     * Được gọi khi: ghi danh học viên, phân công giảng viên, hủy ghi danh, chuyển lớp.
     */
    @Transactional
    public void syncClassGroup(Long classId) {
        if (classId == null) return;
        ClassEntity classEntity = classRepository.findById(classId).orElse(null);
        if (classEntity == null) return;

        ChatConversation conv = conversationRepository.findByClassEntityId(classId)
                .orElseGet(() -> conversationRepository.save(ChatConversation.builder()
                        .classEntity(classEntity)
                        .title("Nhóm học tập: " + classEntity.getName())
                        .type("CLASS_GROUP")
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build()));

        Set<Long> validUserIds = new HashSet<>();

        // 1. Đồng bộ Giảng viên chính
        if (classEntity.getPrimaryTeacher() != null && classEntity.getPrimaryTeacher().getUser() != null) {
            User primaryUser = classEntity.getPrimaryTeacher().getUser();
            validUserIds.add(primaryUser.getId());
            addMemberIfNotExists(conv, primaryUser, "TEACHER");
        }

        // 2. Đồng bộ Giảng viên từ bảng phân công active
        List<TeacherAssignment> assignments = teacherAssignmentRepository.findByClassEntityIdOrderByCreatedAtDesc(classId);
        for (TeacherAssignment ta : assignments) {
            if ("ACTIVE".equalsIgnoreCase(ta.getStatus()) && ta.getTeacher() != null && ta.getTeacher().getUser() != null) {
                User teacherUser = ta.getTeacher().getUser();
                validUserIds.add(teacherUser.getId());
                addMemberIfNotExists(conv, teacherUser, "TEACHER");
            }
        }

        // 3. Đồng bộ Học viên đã ghi danh ENROLLED
        List<Enrollment> enrollments = enrollmentRepository.findByClassEntityIdOrderByCreatedAtDesc(classId);
        for (Enrollment e : enrollments) {
            if ("ENROLLED".equalsIgnoreCase(e.getStatus()) && e.getStudent() != null && e.getStudent().getUser() != null) {
                User studentUser = e.getStudent().getUser();
                validUserIds.add(studentUser.getId());
                addMemberIfNotExists(conv, studentUser, "STUDENT");
            }
        }

        // 4. Thu hồi quyền (Revocation): Xóa thành viên không còn hợp lệ khỏi nhóm (ví dụ đã thôi học, chuyển lớp hoặc hết phân công)
        List<ChatMember> currentMembers = memberRepository.findByConversationId(conv.getId());
        for (ChatMember member : currentMembers) {
            if ("ADMIN".equals(member.getRole())) {
                continue; // Giữ lại tài khoản quản trị
            }
            if (!validUserIds.contains(member.getUser().getId())) {
                memberRepository.deleteByConversationIdAndUserId(conv.getId(), member.getUser().getId());
                log.info("Đã thu hồi quyền tham gia nhóm chat lớp {} ({}) của người dùng {}", 
                        classEntity.getName(), classEntity.getCode(), member.getUser().getUsername());
            }
        }

        log.info("Đã đồng bộ thành công nhóm chat cho lớp: {} ({}), sĩ số hợp lệ: {}", 
                classEntity.getName(), classEntity.getCode(), validUserIds.size());
    }

    private void addMemberIfNotExists(ChatConversation conv, User user, String role) {
        if (memberRepository.findByConversationIdAndUserId(conv.getId(), user.getId()).isEmpty()) {
            memberRepository.save(ChatMember.builder()
                    .conversation(conv)
                    .user(user)
                    .role(role)
                    .joinedAt(Instant.now())
                    .build());
        }
    }

    public void verifyMembership(Long conversationId, User user) {
        if (user == null) {
            throw new AccessDeniedException("Chưa xác thực người dùng");
        }
        boolean isAdmin = user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getId() != null && (r.getId().contains("ADMIN") || r.getId().equals("SUPER_ADMIN")));
        if (isAdmin) {
            return; // Quản trị viên có toàn quyền kiểm soát & hỗ trợ nhóm
        }

        ChatConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm học tập"));
        ClassEntity classEntity = conv.getClassEntity();
        if (classEntity == null) {
            throw new ResourceNotFoundException("Nhóm chat không liên kết với lớp học hợp lệ");
        }
        Long classId = classEntity.getId();

        boolean isTeacherRole = user.getRoles() != null && user.getRoles().stream().anyMatch(r -> "TEACHER".equals(r.getId()));
        if (isTeacherRole) {
            boolean isAssigned = (classEntity.getPrimaryTeacher() != null && classEntity.getPrimaryTeacher().getUser() != null && classEntity.getPrimaryTeacher().getUser().getId().equals(user.getId()))
                    || teacherAssignmentRepository.existsByClassEntityIdAndTeacherUserIdAndStatus(classId, user.getId(), "ACTIVE");
            if (!isAssigned) {
                throw new AccessDeniedException("Bạn không được phân công giảng dạy lớp học này");
            }
            return;
        }

        // Học viên
        boolean isEnrolled = enrollmentRepository.existsByClassEntityIdAndStudentUserIdAndStatus(classId, user.getId(), "ENROLLED");
        if (!isEnrolled) {
            throw new AccessDeniedException("Bạn không phải thành viên của lớp học này (ghi danh không còn hiệu lực)");
        }
    }
}
