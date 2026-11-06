package vn.chacademy.identity.dto;

import java.time.Instant;

public class ResetPasswordResponse {
    private Long userId;
    private String username;
    private String resetToken;
    private Instant expiryTime;
    private String instructions;

    public ResetPasswordResponse() {}

    public ResetPasswordResponse(Long userId, String username, String resetToken, Instant expiryTime, String instructions) {
        this.userId = userId;
        this.username = username;
        this.resetToken = resetToken;
        this.expiryTime = expiryTime;
        this.instructions = instructions;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long userId;
        private String username;
        private String resetToken;
        private Instant expiryTime;
        private String instructions;

        public Builder userId(Long userId) { this.userId = userId; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder resetToken(String resetToken) { this.resetToken = resetToken; return this; }
        public Builder expiryTime(Instant expiryTime) { this.expiryTime = expiryTime; return this; }
        public Builder instructions(String instructions) { this.instructions = instructions; return this; }

        public ResetPasswordResponse build() {
            return new ResetPasswordResponse(userId, username, resetToken, expiryTime, instructions);
        }
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getResetToken() { return resetToken; }
    public void setResetToken(String resetToken) { this.resetToken = resetToken; }

    public Instant getExpiryTime() { return expiryTime; }
    public void setExpiryTime(Instant expiryTime) { this.expiryTime = expiryTime; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
}
