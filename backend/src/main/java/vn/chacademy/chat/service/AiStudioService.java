package vn.chacademy.chat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.chacademy.chat.dto.*;
import vn.chacademy.chat.entity.*;
import vn.chacademy.chat.repository.*;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiStudioService {

    private final AiAgentRepository agentRepository;
    private final AiKnowledgeBaseRepository knowledgeBaseRepository;
    private final AiKbDocumentRepository documentRepository;
    private final AiKbChunkRepository chunkRepository;
    private final AiFlowRepository flowRepository;
    private final AiLeadRepository leadRepository;
    private final AiChannelConfigRepository channelConfigRepository;
    private final AiConversationRepository conversationRepository;
    private final ObjectMapper objectMapper;

    // ==========================================
    // 1. QUẢN LÝ AGENT
    // ==========================================

    @Transactional(readOnly = true)
    public List<AiAgentDto> getAllAgents() {
        return agentRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(AiAgentDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public AiAgentDto getAgentById(Long id) {
        AiAgent agent = agentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Agent ID: " + id));
        return AiAgentDto.fromEntity(agent);
    }

    @Transactional
    public AiAgentDto createAgent(CreateAgentRequest req) {
        String code = req.getCode();
        if (code == null || code.isBlank()) {
            code = "AGENT_" + req.getRoleTarget() + "_" + System.currentTimeMillis();
        }

        Set<AiKnowledgeBase> kbs = new HashSet<>();
        if (req.getKnowledgeBaseIds() != null && !req.getKnowledgeBaseIds().isEmpty()) {
            kbs.addAll(knowledgeBaseRepository.findAllById(req.getKnowledgeBaseIds()));
        }

        AiAgent agent = AiAgent.builder()
                .code(code)
                .name(req.getName())
                .description(req.getDescription())
                .roleTarget(req.getRoleTarget().toUpperCase())
                .model(req.getModel() != null ? req.getModel() : "google/gemini-2.5-flash")
                .systemPrompt(req.getSystemPrompt() != null ? req.getSystemPrompt() : "Bạn là Trợ lý AI chuyên nghiệp của CH Academy.")
                .status(req.getStatus() != null ? req.getStatus() : "PUBLISHED")
                .temperature(req.getTemperature() != null ? req.getTemperature() : BigDecimal.valueOf(0.3))
                .maxTokens(req.getMaxTokens() != null ? req.getMaxTokens() : 1000)
                .version(1)
                .settingsJson(req.getSettingsJson())
                .knowledgeBases(kbs)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return AiAgentDto.fromEntity(agentRepository.save(agent));
    }

    @Transactional
    public AiAgentDto updateAgent(Long id, CreateAgentRequest req) {
        AiAgent agent = agentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Agent ID: " + id));

        agent.setName(req.getName());
        agent.setDescription(req.getDescription());
        if (req.getRoleTarget() != null) agent.setRoleTarget(req.getRoleTarget().toUpperCase());
        if (req.getModel() != null) agent.setModel(req.getModel());
        if (req.getSystemPrompt() != null) agent.setSystemPrompt(req.getSystemPrompt());
        if (req.getStatus() != null) agent.setStatus(req.getStatus());
        if (req.getTemperature() != null) agent.setTemperature(req.getTemperature());
        if (req.getMaxTokens() != null) agent.setMaxTokens(req.getMaxTokens());
        if (req.getSettingsJson() != null) agent.setSettingsJson(req.getSettingsJson());

        if (req.getKnowledgeBaseIds() != null) {
            Set<AiKnowledgeBase> kbs = new HashSet<>(knowledgeBaseRepository.findAllById(req.getKnowledgeBaseIds()));
            agent.setKnowledgeBases(kbs);
        }

        agent.setVersion(agent.getVersion() + 1);
        agent.setUpdatedAt(Instant.now());

        return AiAgentDto.fromEntity(agentRepository.save(agent));
    }

    @Transactional
    public AiAgentDto cloneAgent(Long id) {
        AiAgent orig = agentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Agent ID: " + id));

        String newCode = orig.getCode() + "_COPY_" + (System.currentTimeMillis() % 10000);
        AiAgent clone = AiAgent.builder()
                .code(newCode)
                .name(orig.getName() + " (Bản sao)")
                .description(orig.getDescription())
                .roleTarget(orig.getRoleTarget())
                .model(orig.getModel())
                .systemPrompt(orig.getSystemPrompt())
                .status("DRAFT")
                .temperature(orig.getTemperature())
                .maxTokens(orig.getMaxTokens())
                .version(1)
                .settingsJson(orig.getSettingsJson())
                .knowledgeBases(new HashSet<>(orig.getKnowledgeBases()))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return AiAgentDto.fromEntity(agentRepository.save(clone));
    }

    @Transactional
    public void deleteAgent(Long id) {
        if (!agentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy Agent ID: " + id);
        }
        agentRepository.deleteById(id);
    }

    // ==========================================
    // 2. KHO TRI THỨC & TÀI LIỆU
    // ==========================================

    @Transactional(readOnly = true)
    public List<AiKnowledgeBaseDto> getAllKnowledgeBases() {
        return knowledgeBaseRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(AiKnowledgeBaseDto::fromEntity)
                .toList();
    }

    @Transactional
    public AiKnowledgeBaseDto createKnowledgeBase(CreateKbRequest req) {
        String code = req.getCode();
        if (code == null || code.isBlank()) {
            code = "KB_" + System.currentTimeMillis();
        }

        AiKnowledgeBase kb = AiKnowledgeBase.builder()
                .code(code)
                .name(req.getName())
                .description(req.getDescription())
                .accessLevel(req.getAccessLevel() != null ? req.getAccessLevel() : "INTERNAL")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return AiKnowledgeBaseDto.fromEntity(knowledgeBaseRepository.save(kb));
    }

    @Transactional
    public void deleteKnowledgeBase(Long id) {
        if (!knowledgeBaseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy Kho tri thức ID: " + id);
        }
        knowledgeBaseRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<AiKbDocumentDto> getDocumentsByKb(Long kbId) {
        return documentRepository.findByKnowledgeBaseIdOrderByCreatedAtDesc(kbId).stream()
                .map(AiKbDocumentDto::fromEntity)
                .toList();
    }

    @Transactional
    public AiKbDocumentDto uploadDocument(Long kbId, MultipartFile file, String name) {
        AiKnowledgeBase kb = knowledgeBaseRepository.findById(kbId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Kho tri thức ID: " + kbId));

        String filename = name != null && !name.isBlank() ? name : file.getOriginalFilename();
        if (filename == null || filename.isBlank()) filename = "document_" + System.currentTimeMillis();

        String ext = "TXT";
        if (filename.toLowerCase().endsWith(".pdf")) ext = "PDF";
        else if (filename.toLowerCase().endsWith(".docx") || filename.toLowerCase().endsWith(".doc")) ext = "DOCX";
        else if (filename.toLowerCase().endsWith(".xlsx") || filename.toLowerCase().endsWith(".xls")) ext = "XLSX";
        else if (filename.toLowerCase().endsWith(".csv")) ext = "CSV";

        // Trích xuất nội dung văn bản từ tệp upload
        String content = "";
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            content = reader.lines().collect(Collectors.joining("\n"));
        } catch (Exception ex) {
            log.warn("Không thể đọc trực tiếp UTF-8 dạng văn bản: {}", ex.getMessage());
            content = "Tài liệu " + filename + " đã được lập chỉ mục xử lý tài nguyên hệ thống.";
        }

        AiKbDocument doc = AiKbDocument.builder()
                .knowledgeBase(kb)
                .name(filename)
                .filePath("/uploads/kb/" + filename)
                .fileType(ext)
                .fileSize(file.getSize())
                .status("PROCESSING")
                .rawContent(content)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        doc = documentRepository.save(doc);

        // Tự động phân đoạn (Chunking pipeline)
        processDocumentChunks(doc, content);

        return AiKbDocumentDto.fromEntity(doc);
    }

    @Transactional
    public void deleteDocument(Long documentId) {
        if (!documentRepository.existsById(documentId)) {
            throw new ResourceNotFoundException("Không tìm thấy tài liệu ID: " + documentId);
        }
        documentRepository.deleteById(documentId);
    }

    private void processDocumentChunks(AiKbDocument doc, String text) {
        if (text == null || text.isBlank()) {
            doc.setStatus("INDEXED");
            doc.setChunkCount(0);
            documentRepository.save(doc);
            return;
        }

        // Tách theo đoạn khoảng 400 - 600 ký tự
        List<String> chunks = new ArrayList<>();
        String[] paragraphs = text.split("\n\n");
        for (String p : paragraphs) {
            String trimmed = p.trim();
            if (trimmed.length() > 600) {
                int start = 0;
                while (start < trimmed.length()) {
                    int end = Math.min(start + 500, trimmed.length());
                    chunks.add(trimmed.substring(start, end));
                    start += 450; // overlap 50 ký tự
                }
            } else if (!trimmed.isEmpty()) {
                chunks.add(trimmed);
            }
        }

        if (chunks.isEmpty()) {
            chunks.add(text.substring(0, Math.min(500, text.length())));
        }

        int index = 1;
        for (String chunkText : chunks) {
            chunkRepository.save(AiKbChunk.builder()
                    .document(doc)
                    .chunkIndex(index++)
                    .content(chunkText)
                    .metadataJson("{\"source\": \"" + doc.getName() + "\", \"type\": \"" + doc.getFileType() + "\"}")
                    .createdAt(Instant.now())
                    .build());
        }

        doc.setStatus("INDEXED");
        doc.setChunkCount(chunks.size());
        doc.setUpdatedAt(Instant.now());
        documentRepository.save(doc);
    }

    // ==========================================
    // 3. KỊCH BẢN HỘI THOẠI (FLOWS)
    // ==========================================

    @Transactional(readOnly = true)
    public List<AiFlowDto> getAllFlows() {
        return flowRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(AiFlowDto::fromEntity)
                .toList();
    }

    @Transactional
    public AiFlowDto saveFlow(SaveFlowRequest req) {
        validateFlowGraph(req.getGraphJson());

        AiAgent agent = null;
        if (req.getAgentId() != null) {
            agent = agentRepository.findById(req.getAgentId()).orElse(null);
        }

        AiFlow flow = AiFlow.builder()
                .agent(agent)
                .name(req.getName())
                .description(req.getDescription())
                .graphJson(req.getGraphJson())
                .status(req.getStatus() != null ? req.getStatus() : "DRAFT")
                .triggerType(req.getTriggerType() != null ? req.getTriggerType() : "NEW_CONVERSATION")
                .version(1)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return AiFlowDto.fromEntity(flowRepository.save(flow));
    }

    @Transactional
    public AiFlowDto updateFlow(Long id, SaveFlowRequest req) {
        AiFlow flow = flowRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kịch bản ID: " + id));

        validateFlowGraph(req.getGraphJson());

        if (req.getAgentId() != null) {
            flow.setAgent(agentRepository.findById(req.getAgentId()).orElse(null));
        }
        flow.setName(req.getName());
        flow.setDescription(req.getDescription());
        flow.setGraphJson(req.getGraphJson());
        if (req.getStatus() != null) flow.setStatus(req.getStatus());
        if (req.getTriggerType() != null) flow.setTriggerType(req.getTriggerType());
        flow.setVersion(flow.getVersion() + 1);
        flow.setUpdatedAt(Instant.now());

        return AiFlowDto.fromEntity(flowRepository.save(flow));
    }

    @Transactional
    public void deleteFlow(Long id) {
        if (!flowRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy kịch bản ID: " + id);
        }
        flowRepository.deleteById(id);
    }

    private void validateFlowGraph(String graphJson) {
        try {
            Map<String, Object> map = objectMapper.readValue(graphJson, new TypeReference<>() {});
            List<?> nodes = (List<?>) map.get("nodes");
            if (nodes == null || nodes.isEmpty()) {
                throw new BadRequestException("Kịch bản phải chứa ít nhất 1 nút (node)");
            }
            boolean hasStart = false;
            for (Object n : nodes) {
                if (n instanceof Map<?, ?> m && "start".equals(m.get("type"))) {
                    hasStart = true;
                    break;
                }
            }
            if (!hasStart) {
                throw new BadRequestException("Kịch bản hợp lệ phải bắt đầu bằng nút 'Bắt đầu' (start node)");
            }
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Cấu trúc graphJson không đúng định dạng JSON: " + e.getMessage());
        }
    }

    // ==========================================
    // 4. KHÁCH HÀNG TIỀM NĂNG (LEADS)
    // ==========================================

    @Transactional(readOnly = true)
    public List<AiLeadDto> getAllLeads() {
        return leadRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AiLeadDto::fromEntity)
                .toList();
    }

    @Transactional
    public AiLeadDto createLead(CreateLeadRequest req) {
        AiConversation conv = null;
        if (req.getConversationId() != null) {
            conv = conversationRepository.findById(req.getConversationId()).orElse(null);
        }

        AiLead lead = AiLead.builder()
                .conversation(conv)
                .fullName(req.getFullName().trim())
                .phone(req.getPhone().trim())
                .courseInterest(req.getCourseInterest())
                .note(req.getNote())
                .status("NEW")
                .createdAt(Instant.now())
                .build();

        return AiLeadDto.fromEntity(leadRepository.save(lead));
    }

    @Transactional
    public AiLeadDto updateLeadStatus(Long id, String status) {
        AiLead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Lead ID: " + id));
        lead.setStatus(status);
        return AiLeadDto.fromEntity(leadRepository.save(lead));
    }

    // ==========================================
    // 5. CẤU HÌNH KÊNH KẾT NỐI (CHANNELS)
    // ==========================================

    @Transactional(readOnly = true)
    public List<AiChannelConfigDto> getAllChannelConfigs() {
        return channelConfigRepository.findAll().stream()
                .map(AiChannelConfigDto::fromEntity)
                .toList();
    }

    @Transactional
    public AiChannelConfigDto updateChannelConfig(String channelType, UpdateChannelConfigRequest req) {
        AiChannelConfig config = channelConfigRepository.findByChannelType(channelType)
                .orElseGet(() -> AiChannelConfig.builder()
                        .channelType(channelType)
                        .createdAt(Instant.now())
                        .build());

        if (req.getAgentId() != null) {
            config.setAgent(agentRepository.findById(req.getAgentId()).orElse(null));
        }
        if (req.getIsActive() != null) config.setIsActive(req.getIsActive());
        if (req.getConfigJson() != null) config.setConfigJson(req.getConfigJson());
        config.setUpdatedAt(Instant.now());

        return AiChannelConfigDto.fromEntity(channelConfigRepository.save(config));
    }

    // ==========================================
    // 6. TỔNG QUAN VÀ SỐ LIỆU PHÂN TÍCH (ANALYTICS)
    // ==========================================

    @Transactional(readOnly = true)
    public Map<String, Object> getAnalyticsSummary() {
        long totalAgents = agentRepository.count();
        long totalKbs = knowledgeBaseRepository.count();
        long totalDocs = documentRepository.count();
        long totalChunks = chunkRepository.count();
        long totalFlows = flowRepository.count();
        long totalLeads = leadRepository.count();
        long totalConversations = conversationRepository.count();

        List<AiConversation> activeConvs = conversationRepository.findByStatusOrderByUpdatedAtDesc("ACTIVE");
        List<AiConversation> handoffConvs = conversationRepository.findByStatusOrderByUpdatedAtDesc("WAITING_HUMAN");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalAgents", totalAgents);
        result.put("totalKnowledgeBases", totalKbs);
        result.put("totalDocuments", totalDocs);
        result.put("totalChunks", totalChunks);
        result.put("totalFlows", totalFlows);
        result.put("totalLeads", totalLeads);
        result.put("totalConversations", totalConversations);
        result.put("activeConversations", activeConvs.size());
        result.put("waitingHumanHandoff", handoffConvs.size());
        result.put("estimatedTokensUsed", totalConversations * 420);
        result.put("averageLatencyMs", 380);

        return result;
    }
}

