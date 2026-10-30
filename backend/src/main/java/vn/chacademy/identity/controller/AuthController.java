package vn.chacademy.identity.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import vn.chacademy.common.dto.ApiResponse;
import vn.chacademy.identity.dto.ChangePasswordRequest;
import vn.chacademy.identity.dto.LoginRequest;
import vn.chacademy.identity.dto.LoginResponse;
import vn.chacademy.identity.dto.UpdateProfileRequest;
import vn.chacademy.identity.dto.UserDto;
import vn.chacademy.identity.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final vn.chacademy.common.audit.service.AuditService auditService;

    public AuthController(AuthService authService, vn.chacademy.common.audit.service.AuditService auditService) {
        this.authService = authService;
        this.auditService = auditService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request, jakarta.servlet.http.HttpServletRequest httpRequest) {
        LoginResponse response = authService.login(request);
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        String role = (response.getUser() != null && response.getUser().getRoles() != null && !response.getUser().getRoles().isEmpty())
                ? response.getUser().getRoles().iterator().next()
                : "USER";
        auditService.recordAction(
                response.getUser() != null ? response.getUser().getUsername() : request.getUsername(),
                role, "LOGIN", "AUTH",
                response.getUser() != null && response.getUser().getId() != null ? response.getUser().getId().toString() : "-",
                "Đăng nhập thành công vào hệ thống", ip);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", response));
    }

    @PostMapping("/oauth/google")
    public ResponseEntity<ApiResponse<LoginResponse>> loginGoogle(@RequestBody vn.chacademy.identity.dto.OAuthLoginRequest request) {
        LoginResponse response = authService.loginWithOAuth("GOOGLE", request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập Google thành công", response));
    }

    @PostMapping("/oauth/facebook")
    public ResponseEntity<ApiResponse<LoginResponse>> loginFacebook(@RequestBody vn.chacademy.identity.dto.OAuthLoginRequest request) {
        LoginResponse response = authService.loginWithOAuth("FACEBOOK", request);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập Facebook thành công", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        UserDto userDto = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin tài khoản thành công", userDto));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        UserDto updated = authService.updateProfile(userDetails.getUsername(), request);
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(userDetails.getUsername(), "MEMBER", "PROFILE_UPDATE", "USER",
                updated.getId() != null ? updated.getId().toString() : "-", "Cập nhật thông tin cá nhân", ip);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin cá nhân thành công", updated));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        authService.changePassword(userDetails.getUsername(), request);
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(userDetails.getUsername(), "MEMBER", "PASSWORD_CHANGE", "AUTH", "-",
                "Đổi mật khẩu tài khoản thành công", ip);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công", null));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal UserDetails userDetails,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String username = userDetails != null ? userDetails.getUsername() : "ANONYMOUS";
        String ip = httpRequest != null ? httpRequest.getRemoteAddr() : "127.0.0.1";
        auditService.recordAction(username, "MEMBER", "LOGOUT", "AUTH", "-", "Đăng xuất khỏi hệ thống", ip);
        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }
}
