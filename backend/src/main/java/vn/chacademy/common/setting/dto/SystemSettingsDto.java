package vn.chacademy.common.setting.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSettingsDto {

    @NotBlank(message = "Tên trung tâm không được để trống")
    private String centerName;

    @NotBlank(message = "Tên viết tắt không được để trống")
    private String shortName;

    @NotBlank(message = "Hotline không được để trống")
    private String hotline;

    @NotBlank(message = "Email không được để trống")
    private String email;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;

    private String website;

    private Boolean notifyNewLead;
    private Boolean notifyTuitionDue;
    private Boolean notifyAbsence;

    // Technical / Environment diagnostics
    private String appVersion;
    private String dbVersion;
    private String activeProfile;
    private String timezone;
}
