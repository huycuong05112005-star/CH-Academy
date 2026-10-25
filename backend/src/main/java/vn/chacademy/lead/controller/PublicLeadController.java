package vn.chacademy.lead.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.lead.dto.LeadDto;
import vn.chacademy.lead.dto.PublicLeadRequest;
import vn.chacademy.lead.service.LeadService;

@RestController
@RequestMapping("/api/v1/public/leads")
@RequiredArgsConstructor
public class PublicLeadController {

    private final LeadService leadService;

    @PostMapping
    public ResponseEntity<ApiResponse<LeadDto>> submitPublicLead(@Valid @RequestBody PublicLeadRequest request) {
        LeadDto lead = leadService.createPublicLead(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký nhận tư vấn thành công! Bộ phận tuyển sinh CH Academy sẽ liên hệ bạn sớm nhất.", lead));
    }
}
