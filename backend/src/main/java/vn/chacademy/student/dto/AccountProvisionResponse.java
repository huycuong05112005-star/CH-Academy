package vn.chacademy.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountProvisionResponse {
    private String username;
    private String plainPassword;
    private Boolean emailSent;
    private String message;
    private Long userId;
}
