package vn.chacademy.common.audit.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.common.audit.dto.AuditLogDto;
import vn.chacademy.common.audit.entity.AuditLog;
import vn.chacademy.common.audit.repository.AuditLogRepository;
import vn.chacademy.identity.entity.User;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void recordAction(User actor, String action, String resourceType, String resourceId, String details, String ipAddress) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .actor(actor)
                    .actorUsername(actor != null ? actor.getUsername() : "ANONYMOUS")
                    .actorRole(actor != null && !actor.getRoles().isEmpty() ? actor.getRoles().iterator().next().getId() : "GUEST")
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .details(details)
                    .ipAddress(ipAddress)
                    .createdAt(Instant.now())
                    .build();

            auditLogRepository.save(auditLog);
            log.info("Audit log recorded: {} by {} on {}:{}", action, auditLog.getActorUsername(), resourceType, resourceId);
        } catch (Exception e) {
            log.error("Failed to record audit log: {}", e.getMessage(), e);
        }
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void recordAction(String username, String role, String action, String resourceType, String resourceId, String details, String ipAddress) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .actor(null)
                    .actorUsername(username != null && !username.isBlank() ? username : "ANONYMOUS")
                    .actorRole(role != null && !role.isBlank() ? role : "GUEST")
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .details(details)
                    .ipAddress(ipAddress)
                    .createdAt(Instant.now())
                    .build();

            auditLogRepository.save(auditLog);
            log.info("Audit log recorded: {} by {} on {}:{}", action, username, resourceType, resourceId);
        } catch (Exception e) {
            log.error("Failed to record audit log: {}", e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAuditLogs(String actor, String action, String resourceType, int page, int size) {
        String cleanActor = (actor != null && !actor.trim().isEmpty()) ? actor.trim() : null;
        String cleanAction = (action != null && !action.trim().isEmpty()) ? action.trim() : null;
        String cleanResource = (resourceType != null && !resourceType.trim().isEmpty()) ? resourceType.trim() : null;

        Pageable pageable = PageRequest.of(page, size);
        if (cleanActor == null && cleanAction == null && cleanResource == null) {
            return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                    .map(AuditLogDto::fromEntity);
        }
        return auditLogRepository.searchLogs(cleanActor, cleanAction, cleanResource, pageable)
                .map(AuditLogDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getRecentLogs() {
        return auditLogRepository.findTop20ByOrderByCreatedAtDesc()
                .stream()
                .map(AuditLogDto::fromEntity)
                .toList();
    }
}
