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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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
        if (user == null) return List.of();

        boolean isAdmin = user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getId() != null && (r.getId().contains("ADMIN") || r.getId().equals("SUPER_ADMIN")));

        List<ChatConversation> conversations;
        if (isAdmin) {
            conversations = conversationRepository.findAll();
        } else {
            conversations = conversationRepository.findConversationsByUserId(user.getId());
        }

        List<ChatConversationDto> result = new ArrayList<>();
        for (ChatConversation c : conversations) {
            int members = memberRepository.countByConversationId(c.getId());
            Optional<ChatMember> myMember = memberRepository.findByConversationIdAndUserId(c.getId(), user.getId());
            long unread = 0;
            if (myMember.isPresent()) {
                Long lastRead = myMember.get().getLastReadMessageId();
                unread = messageRepository.countUnreadMessagesExcludingSender(c.getId(), lastRead, user.getId());
            } else if (isAdmin) {
                unread = 0; // Quản trị viên chưa gia nhập nhóm hiển thị 0 để không bị rác
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
        if (user == null) return 0;
        List<ChatConversationDto> list = getUserConversations(user);
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
     * Tự động đồng bộ thành viên nhóm chat theo lớp học (Idempotent).
     * Được gọi khi: ghi danh học viên, phân công giảng viên, hủy ghi danh.
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

        // 1. Đồng bộ Giảng viên chính
        if (classEntity.getPrimaryTeacher() != null && classEntity.getPrimaryTeacher().getUser() != null) {
            addMemberIfNotExists(conv, classEntity.getPrimaryTeacher().getUser(), "TEACHER");
        }

        // 2. Đồng bộ Giảng viên từ bảng phân công active
        List<TeacherAssignment> assignments = teacherAssignmentRepository.findByClassEntityIdOrderByCreatedAtDesc(classId);
        for (TeacherAssignment ta : assignments) {
            if ("ACTIVE".equalsIgnoreCase(ta.getStatus()) && ta.getTeacher() != null && ta.getTeacher().getUser() != null) {
                addMemberIfNotExists(conv, ta.getTeacher().getUser(), "TEACHER");
            }
        }

        // 3. Đồng bộ Học viên đã ghi danh ENROLLED
        List<Enrollment> enrollments = enrollmentRepository.findByClassEntityIdOrderByCreatedAtDesc(classId);
        for (Enrollment e : enrollments) {
            if ("ENROLLED".equalsIgnoreCase(e.getStatus()) && e.getStudent() != null && e.getStudent().getUser() != null) {
                addMemberIfNotExists(conv, e.getStudent().getUser(), "STUDENT");
            }
        }

        log.info("Đã đồng bộ thành công nhóm chat cho lớp: {} ({})", classEntity.getName(), classEntity.getCode());
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

    private void verifyMembership(Long conversationId, User user) {
        if (user == null) {
            throw new AccessDeniedException("Chưa xác thực người dùng");
        }
        boolean isAdmin = user.getRoles() != null && user.getRoles().stream()
                .anyMatch(r -> r.getId() != null && (r.getId().contains("ADMIN") || r.getId().equals("SUPER_ADMIN")));
        if (isAdmin) {
            return; // Quản trị viên có toàn quyền kiểm soát & hỗ trợ nhóm
        }
        boolean isMember = memberRepository.findByConversationIdAndUserId(conversationId, user.getId()).isPresent();
        if (!isMember) {
            throw new AccessDeniedException("Bạn không phải thành viên của nhóm học tập này");
        }
    }
}

