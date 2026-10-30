package vn.chacademy.assessment.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.chacademy.assessment.dto.QuestionBankDto;
import vn.chacademy.assessment.dto.QuestionDto;
import vn.chacademy.assessment.dto.QuestionImportConfirmRequest;
import vn.chacademy.assessment.dto.QuestionImportPreviewDto;
import vn.chacademy.assessment.service.QuestionImportService;
import vn.chacademy.assessment.service.QuestionService;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/v1/assessment")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;
    private final UserRepository userRepository;
    private final QuestionImportService questionImportService;

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findByUsername(userDetails.getUsername()).orElse(null);
    }

    @GetMapping("/questions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<QuestionDto>>> searchQuestions(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long bankId,
            @RequestParam(required = false) Long sessionId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<QuestionDto> result = questionService.searchQuestions(courseId, bankId, sessionId, classId, type, difficulty, topic, search, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách câu hỏi thành công", result));
    }

    @GetMapping("/questions/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<QuestionDto>> getQuestion(@PathVariable Long id) {
        QuestionDto dto = questionService.getQuestionById(id);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping("/questions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<QuestionDto>> createQuestion(
            @Valid @RequestBody QuestionDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        User creator = getAuthenticatedUser(userDetails);
        QuestionDto created = questionService.createQuestion(dto, creator);
        return ResponseEntity.ok(ApiResponse.success("Tạo câu hỏi thành công", created));
    }

    @PutMapping("/questions/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<QuestionDto>> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody QuestionDto dto) {
        QuestionDto updated = questionService.updateQuestion(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật câu hỏi thành công", updated));
    }

    @DeleteMapping("/questions/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa câu hỏi thành công", null));
    }

    @GetMapping("/banks")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<QuestionBankDto>>> getQuestionBanks() {
        List<QuestionBankDto> banks = questionService.getAllQuestionBanks();
        return ResponseEntity.ok(ApiResponse.success(banks));
    }

    @PostMapping("/banks")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<QuestionBankDto>> createQuestionBank(
            @Valid @RequestBody QuestionBankDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        User creator = getAuthenticatedUser(userDetails);
        QuestionBankDto bank = questionService.createQuestionBank(dto, creator);
        return ResponseEntity.ok(ApiResponse.success("Tạo ngân hàng câu hỏi thành công", bank));
    }

    @GetMapping("/questions/import/template")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<byte[]> downloadImportTemplate() {
        byte[] excelBytes = questionImportService.generateTemplateExcel();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=mau_cau_hoi_ch_academy.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    @PostMapping(value = "/questions/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<QuestionImportPreviewDto>> previewImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long bankId,
            @RequestParam(required = false) Long sessionId) {
        QuestionImportPreviewDto preview = questionImportService.parseAndValidate(file, bankId, sessionId);
        return ResponseEntity.ok(ApiResponse.success("Kiểm tra file thành công", preview));
    }

    @PostMapping("/questions/import/confirm")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CENTER_ADMIN', 'ACADEMIC_STAFF', 'TEACHER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Integer>> confirmImport(
            @RequestBody QuestionImportConfirmRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest servletRequest) {
        User creator = getAuthenticatedUser(userDetails);
        String ip = servletRequest != null ? servletRequest.getRemoteAddr() : "127.0.0.1";
        int importedCount = questionImportService.confirmImport(request, creator, ip);
        return ResponseEntity.ok(ApiResponse.success(String.format("Đã nhập thành công %d câu hỏi vào ngân hàng", importedCount), importedCount));
    }
}

