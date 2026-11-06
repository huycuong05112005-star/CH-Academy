package vn.chacademy.identity.dto;

import java.time.Instant;

public class UserSecurityDto {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private String roleName;
    private String status;
    private Instant lastLoginAt;
    private Instant lastPasswordChangedAt;
    private Boolean mustChangePassword;
    private String passwordResetSource;
    private Integer failedLoginAttempts;
    private Instant lockedAt;

    public UserSecurityDto() {}

    public UserSecurityDto(Long id, String username, String fullName, String email, String phone,
                           String role, String roleName, String status, Instant lastLoginAt,
                           Instant lastPasswordChangedAt, Boolean mustChangePassword,
                           String passwordResetSource, Integer failedLoginAttempts, Instant lockedAt) {
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.roleName = roleName;
        this.status = status;
        this.lastLoginAt = lastLoginAt;
        this.lastPasswordChangedAt = lastPasswordChangedAt;
        this.mustChangePassword = mustChangePassword;
        this.passwordResetSource = passwordResetSource;
        this.failedLoginAttempts = failedLoginAttempts;
        this.lockedAt = lockedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String phone;
        private String role;
        private String roleName;
        private String status;
        private Instant lastLoginAt;
        private Instant lastPasswordChangedAt;
        private Boolean mustChangePassword;
        private String passwordResetSource;
        private Integer failedLoginAttempts;
        private Instant lockedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder username(String username) { this.username = username; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder phone(String phone) { this.phone = phone; return this; }
        public Builder role(String role) { this.role = role; return this; }
        public Builder roleName(String roleName) { this.roleName = roleName; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder lastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; return this; }
        public Builder lastPasswordChangedAt(Instant lastPasswordChangedAt) { this.lastPasswordChangedAt = lastPasswordChangedAt; return this; }
        public Builder mustChangePassword(Boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; return this; }
        public Builder passwordResetSource(String passwordResetSource) { this.passwordResetSource = passwordResetSource; return this; }
        public Builder failedLoginAttempts(Integer failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; return this; }
        public Builder lockedAt(Instant lockedAt) { this.lockedAt = lockedAt; return this; }

        public UserSecurityDto build() {
            return new UserSecurityDto(id, username, fullName, email, phone, role, roleName, status,
                    lastLoginAt, lastPasswordChangedAt, mustChangePassword, passwordResetSource, failedLoginAttempts, lockedAt);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public Instant getLastPasswordChangedAt() { return lastPasswordChangedAt; }
    public void setLastPasswordChangedAt(Instant lastPasswordChangedAt) { this.lastPasswordChangedAt = lastPasswordChangedAt; }

    public Boolean getMustChangePassword() { return mustChangePassword; }
    public void setMustChangePassword(Boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }

    public String getPasswordResetSource() { return passwordResetSource; }
    public void setPasswordResetSource(String passwordResetSource) { this.passwordResetSource = passwordResetSource; }

    public Integer getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(Integer failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }

    public Instant getLockedAt() { return lockedAt; }
    public void setLockedAt(Instant lockedAt) { this.lockedAt = lockedAt; }
}
