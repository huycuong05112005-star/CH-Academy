package vn.chacademy.lead.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConvertLeadRequest {

    @NotBlank(message = "Loại học viên không được để trống")
    @Pattern(regexp = "^(KID|ADULT)$", message = "Loại học viên phải là KID hoặc ADULT")
    private String studentType;

    private LocalDate dob;

    private String gender;

    private String address;

    // For KID
    private Long existingGuardianId;
    private String guardianFullName;
    private String guardianPhone;
    private String guardianEmail;
    private String guardianRelationship; // FATHER, MOTHER, OTHER

    // Automated enrollment & tuition fields
    private Long classId;
    private java.math.BigDecimal paidAmount;
    @Builder.Default
    private String paymentMethod = "BANK_TRANSFER";
    private String referenceNumber;
    @Builder.Default
    private Boolean provisionAccount = true;
}
