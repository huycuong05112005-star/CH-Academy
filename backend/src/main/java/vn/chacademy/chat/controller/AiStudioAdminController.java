package vn.chacademy.chat.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.chacademy.chat.dto.*;
import vn.chacademy.chat.entity.AiConversation;
import vn.chacademy.chat.repository.AiConversationRepository;
import vn.chacademy.chat.repository.AiMessageRepository;
import vn.chacademy.chat.service.AiStudioService;
import vn.chacademy.chat.service.GenAiChatService;
import vn.chacademy.common.dto.ApiResponse;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/ai")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AiStudioAdminController {

    private final AiStudioService aiStudioService;
    private final GenAiChatService genAiChatService;
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;

    // ==========================================
    // 1. QUẢN LÝ AGENTS
    // ==========================================

    @GetMapping("/agents")
    public ResponseEntity<ApiResponse<List<AiAgentDto>>> getAllAgents() {
        return ResponseEntity.ok(ApiResponse.success(aiStudioService.getAllAgents()));
    }

    @GetMapping("/agents/{id}")
    public ResponseEntity<ApiResponse<AiAgentDto>> getAgentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(aiStudioService.getAgentById(id)));
    }

    @PostMapping("/agents")
    public ResponseEntity<ApiResponse<AiAgentDto>> createAgent(@Valid @RequestBody CreateAgentRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Tạo AI Agent thành công", aiStudioService.createAgent(req)));
    }

    @PutMapping("/agents/{id}")
    public ResponseEntity<ApiResponse<AiAgentDto>> updateAgent(@PathVariable Long id, @Valid @RequestBody CreateAgentRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật AI Agent thành công", aiStudioService.updateAgent(id, req)));
    }

    @PostMapping("/agents/{id}/clone")
    public ResponseEntity<ApiResponse<AiAgentDto>> cloneAgent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Nhân bản AI Agent thành công", aiStudioService.cloneAgent(id)));
    }

    @DeleteMapping("/agents/{id}")
    public ResponseEntity<ApiResponse<String>> deleteAgent(@PathVariable Long id) {
        aiStudioService.deleteAgent(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa AI Agent thành công", "DELETED"));
    }

    // ==========================================
    // 2. KHO TRI THỨC & TÀI LIỆU
    // ==========================================

    @GetMapping("/knowledge-bases")
    public ResponseEntity<ApiResponse<List<AiKnowledgeBaseDto>>> getAllKnowledgeBases() {
        return ResponseEntity.ok(ApiResponse.success(aiStudioService.getAllKnowledgeBases()));
    }

    @PostMapping("/knowledge-bases")
    public ResponseEntity<ApiResponse<AiKnowledgeBaseDto>> createKnowledgeBase(@Valid @RequestBody CreateKbRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Tạo Kho tri thức thành công", aiStudioService.createKnowledgeBase(req)));
    }

    @DeleteMapping("/knowledge-bases/{id}")
    public ResponseEntity<ApiResponse<String>> deleteKnowledgeBase(@PathVariable Long id) {
        aiStudioService.deleteKnowledgeBase(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa Kho tri thức", "DELETED"));
    }

    @GetMapping("/knowledge-bases/{id}/documents")
    public ResponseEntity<ApiResponse<List<AiKbDocumentDto>>> getDocumentsByKb(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(aiStudioService.getDocumentsByKb(id)));
    }

    @PostMapping(value = "/knowledge-bases/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AiKbDocumentDto>> uploadDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "name", required = false) String name) {
        AiKbDocumentDto doc = aiStudioService.uploadDocument(id, file, name);
        return ResponseEntity.ok(ApiResponse.success("Tải lên và lập chỉ mục tài liệu thành công", doc));
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<ApiResponse<String>> deleteDocument(@PathVariable Long id) {
        aiStudioService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tài liệu", "DELETED"));
    }

    // ==========================================
    // 3. KỊCH BẢN HỘI THOẠI (FLOWS)
    // ==========================================

    @GetMapping("/flows")
    public ResponseEntity<ApiResponse<List<AiFlowDto>>> getAllFlows() {
        return ResponseEntity.ok(ApiResponse.success(aiStudioService.getAllFlows()));
    }

    @PostMapping("/flows")
    public ResponseEntity<ApiResponse<AiFlowDto>> saveFlow(@Valid @RequestBody SaveFlowRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Lưu kịch bản thành công", aiStudioService.saveFlow(req)));
    }

    @PutMapping("/flows/{id}")
    public ResponseEntity<ApiResponse<AiFlowDto>> updateFlow(@PathVariable Long id, @Valid @RequestBody SaveFlowRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật kịch bản thành công", aiStudioService.updateFlow(id, req)));
    }

    @DeleteMapping("/flows/{id}")
    public ResponseEntity<ApiResponse<String>> deleteFlow(@PathVariable Long id) {
        aiStudioService.deleteFlow(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa kịch bản", "DELETED"));
    }

    // ==========================================
    // 4. LEADS & HỘI THOẠI TOÀN HỆ THỐNG
    // ==========================================

    @GetMapping("/leads")
    public ResponseEntity<ApiResponse<List<AiLeadDto>>> getAllLeads() {
        return ResponseEntity.ok(ApiResponse.success(aiStudioService.getAllLeads()));
    }

    @PutMapping("/leads/{id}/status")
    public ResponseEntity<ApiResponse<AiLeadDto>> updateLeadStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái lead thành công", aiStudioService.updateLeadStatus(id, status)));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<AiConversationDto>>> getAllConversations(
            @RequestParam(required = false) String portal,
            @RequestParam(required = false) String status) {
        List<AiConversation> list;
        if (portal != null && !portal.isBlank()) {
            list = conversationRepository.findByPortalOrderByUpdatedAtDesc(portal.toUpperCase());
        } else if (status != null && !status.isBlank()) {
            list = conversationRepository.findByStatusOrderByUpdatedAtDesc(status.toUpperCase());
        } else {
            list = conversationRepository.findAllByOrderByUpdatedAtDesc();
        }
        return ResponseEntity.ok(ApiResponse.success(list.stream().map(AiConversationDto::fromEntity).toList()));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<List<AiMessageDto>>> getConversationMessages(@PathVariable Long id) {
        List<AiMessageDto> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(id).stream()
                .map(AiMessageDto::fromEntity)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    // ==========================================
    // 5. CẤU HÌNH KÊNH & THỐNG KÊ
    // ==========================================

    @GetMapping("/channels")
    public ResponseEntity<ApiResponse<List<AiChannelConfigDto>>> getAllChannels() {
        return ResponseEntity.ok(ApiResponse.success(aiStudioService.getAllChannelConfigs()));
    }

    @PutMapping("/channels/{channelType}")
    public ResponseEntity<ApiResponse<AiChannelConfigDto>> updateChannel(
            @PathVariable String channelType,
            @RequestBody UpdateChannelConfigRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cấu hình kênh thành công",
                aiStudioService.updateChannelConfig(channelType.toUpperCase(), req)));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(aiStudioService.getAnalyticsSummary()));
    }
}
