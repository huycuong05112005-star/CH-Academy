package vn.chacademy.identity.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.academic.repository.TeacherRepository;
import vn.chacademy.common.audit.service.AuditService;
import vn.chacademy.common.exception.BadRequestException;
import vn.chacademy.common.exception.ResourceNotFoundException;
import vn.chacademy.identity.dto.ChangePasswordRequest;
import vn.chacademy.identity.dto.LoginRequest;
import vn.chacademy.identity.dto.LoginResponse;
import vn.chacademy.identity.dto.OAuthLoginRequest;
import vn.chacademy.identity.dto.UpdateProfileRequest;
import vn.chacademy.identity.dto.UserDto;
import vn.chacademy.identity.entity.Role;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.RoleRepository;
import vn.chacademy.identity.repository.UserRepository;
import vn.chacademy.security.JwtTokenProvider;
import vn.chacademy.student.repository.StudentRepository;

import java.time.Instant;
import java.util.Collections;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;

    @Value("${chacademy.oauth.google.client-id:}")
    private String googleClientId;

    @Value("${chacademy.oauth.facebook.app-id:}")
    private String facebookAppId;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       AuditService auditService,
                       TeacherRepository teacherRepository,
                       StudentRepository studentRepository) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", request.getUsername()));

        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            auditService.recordAction(user, "LOGIN_LOCKED_ATTEMPT", "USER", user.getId().toString(),
                    "Thử đăng nhập vào tài khoản đang bị khóa bảo mật", null);
            throw new BadRequestException("Tài khoản của bạn đã bị khóa bảo mật. Vui lòng liên hệ Quản trị viên để được hỗ trợ.", "ACCOUNT_LOCKED");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        user.setLastLoginAt(Instant.now());
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        log.info("Người dùng '{}' đăng nhập thành công", user.getUsername());
        return new LoginResponse(jwt, UserDto.fromEntity(user));
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", username));
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto updateProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", username));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getPhone() != null) {
            String trimmedPhone = request.getPhone().trim();
            if (!trimmedPhone.isEmpty() && !trimmedPhone.equals(user.getPhone())) {
                userRepository.findByPhone(trimmedPhone).ifPresent(existing -> {
                    if (!existing.getId().equals(user.getId())) {
                        throw new BadRequestException("Số điện thoại này đã được sử dụng bởi tài khoản khác", "PHONE_ALREADY_EXISTS");
                    }
                });
                user.setPhone(trimmedPhone);
            } else if (trimmedPhone.isEmpty()) {
                user.setPhone(null);
            }
        }

        if (request.getAvatarUrl() != null) {
            String trimmedAvatar = request.getAvatarUrl().trim();
            user.setAvatarUrl(trimmedAvatar.isEmpty() ? null : trimmedAvatar);
        }

        User savedUser = userRepository.save(user);

        // Sync to Teacher if user has a teacher record
        if (teacherRepository != null) {
            teacherRepository.findByUserId(savedUser.getId()).ifPresent(teacher -> {
                teacher.setFullName(savedUser.getFullName());
                teacher.setPhone(savedUser.getPhone());
                if (request.getSpecialization() != null && !request.getSpecialization().trim().isEmpty()) {
                    teacher.setSpecialization(request.getSpecialization().trim());
                }
                if (request.getBio() != null) {
                    teacher.setBio(request.getBio().trim());
                }
                teacherRepository.save(teacher);
            });
        }

        // Sync to Student if user has a student record
        if (studentRepository != null) {
            studentRepository.findByUserId(savedUser.getId()).ifPresent(student -> {
                student.setFullName(savedUser.getFullName());
                student.setPhone(savedUser.getPhone());
                studentRepository.save(student);
            });
        }

        log.info("Người dùng '{}' đã cập nhật thông tin cá nhân thành công", username);
        return UserDto.fromEntity(savedUser);
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", "username", username));

        // 1. Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            auditService.recordAction(user, "PASSWORD_CHANGE_FAIL", "USER", user.getId().toString(),
                    "Thao tác đổi mật khẩu thất bại: Mật khẩu hiện tại không chính xác", null);
            throw new BadRequestException("Mật khẩu hiện tại không chính xác", "INVALID_CURRENT_PASSWORD");
        }

        // 2. Validate password policy (min 8 chars, uppercase, lowercase, digit)
        String newPassword = request.getNewPassword();
        if (newPassword == null || newPassword.length() < 8) {
            throw new BadRequestException("Mật khẩu mới phải có độ dài tối thiểu 8 ký tự", "PASSWORD_TOO_SHORT");
        }

        boolean hasUpper = newPassword.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = newPassword.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = newPassword.chars().anyMatch(Character::isDigit);

        if (!hasUpper || !hasLower || !hasDigit) {
            throw new BadRequestException("Mật khẩu mới phải bao gồm cả chữ hoa, chữ thường và chữ số", "PASSWORD_WEAK");
        }

        // 3. Prevent reusing current password
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu hiện tại", "PASSWORD_REUSED");
        }

        // 4. Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setRawPassword(null);
        user.setLastPasswordChangedAt(Instant.now());
        user.setMustChangePassword(false);
        user.setPasswordResetSource("USER_SELF");
        userRepository.save(user);

        auditService.recordAction(user, "PASSWORD_CHANGE_SUCCESS", "USER", user.getId().toString(),
                "Người dùng đã đổi mật khẩu thành công", null);

        log.info("Người dùng '{}' đã đổi mật khẩu thành công (an toàn)", username);
    }

    @Transactional
    public LoginResponse loginWithOAuth(String provider, OAuthLoginRequest request) {
        if ("GOOGLE".equalsIgnoreCase(provider)) {
            if (googleClientId == null || googleClientId.isBlank()) {
                throw new BadRequestException("Cấu hình đăng nhập Google (GOOGLE_CLIENT_ID) chưa được kích hoạt trên hệ thống. Vui lòng liên hệ Quản trị viên.", "OAUTH_GOOGLE_NOT_CONFIGURED");
            }
            // In production, verify Google id_token cryptographically against googleClientId
            return processOAuthUser(request.getEmail(), request.getFullName(), "GOOGLE");
        } else if ("FACEBOOK".equalsIgnoreCase(provider)) {
            if (facebookAppId == null || facebookAppId.isBlank()) {
                throw new BadRequestException("Cấu hình đăng nhập Facebook (FACEBOOK_APP_ID) chưa được kích hoạt trên hệ thống. Vui lòng liên hệ Quản trị viên.", "OAUTH_FACEBOOK_NOT_CONFIGURED");
            }
            // In production, verify Facebook access_token with graph API
            return processOAuthUser(request.getEmail(), request.getFullName(), "FACEBOOK");
        } else {
            throw new BadRequestException("Nhà cung cấp đăng nhập không được hỗ trợ: " + provider, "UNSUPPORTED_OAUTH_PROVIDER");
        }
    }

    private LoginResponse processOAuthUser(String email, String fullName, String provider) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Không tìm thấy địa chỉ email từ nhà cung cấp " + provider, "OAUTH_EMAIL_MISSING");
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            // Provision new Student user (NEVER Admin or Teacher)
            User newUser = new User();
            newUser.setUsername(email.toLowerCase());
            newUser.setEmail(email.toLowerCase());
            newUser.setFullName(fullName != null && !fullName.isBlank() ? fullName : email.split("@")[0]);
            newUser.setPasswordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            newUser.setStatus("ACTIVE");
            newUser.setLastPasswordChangedAt(Instant.now());

            Role studentRole = roleRepository.findById("STUDENT").orElse(null);
            if (studentRole != null) {
                newUser.setRoles(Collections.singleton(studentRole));
            }

            User saved = userRepository.save(newUser);
            auditService.recordAction(saved, "OAUTH_REGISTER_" + provider, "USER", saved.getId().toString(),
                    "Đăng ký tài khoản học viên mới qua " + provider, null);
            return saved;
        });

        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new BadRequestException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.", "ACCOUNT_LOCKED");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        // Generate JWT for OAuth user
        Authentication auth = new UsernamePasswordAuthenticationToken(user.getUsername(), null, Collections.emptyList());
        String jwt = tokenProvider.generateToken(auth);

        auditService.recordAction(user, "OAUTH_LOGIN_" + provider, "USER", user.getId().toString(),
                "Đăng nhập thành công qua " + provider, null);

        return new LoginResponse(jwt, UserDto.fromEntity(user));
    }
}
