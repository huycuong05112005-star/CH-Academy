package vn.chacademy.identity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordResponse {
    private Long userId;
    private String username;
    private String resetToken;
    private Instant expiryTime;
    private String instructions;
}

