package vn.chacademy.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import vn.chacademy.identity.dto.LoginRequest;
import vn.chacademy.identity.entity.Role;
import vn.chacademy.identity.entity.User;
import vn.chacademy.identity.repository.RoleRepository;
import vn.chacademy.identity.repository.UserRepository;

import java.util.HashSet;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("AuthController Integration Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findById("SUPER_ADMIN")
                .orElseGet(() -> roleRepository.save(new Role("SUPER_ADMIN", "Quản trị viên tối cao", "Toàn quyền")));

        if (!userRepository.existsByUsername("testadmin")) {
            User user = new User();
            user.setUsername("testadmin");
            user.setPasswordHash(passwordEncoder.encode("Test@123456"));
            user.setFullName("Test Administrator");
            user.setEmail("testadmin@chacademy.vn");
            user.setPhone("0987654321");
            user.setStatus("ACTIVE");
            user.setRoles(new HashSet<>(Set.of(adminRole)));
            userRepository.save(user);
        }
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Đăng nhập thành công trả về JWT token")
    void login_Success() throws Exception {
        LoginRequest request = new LoginRequest("testadmin", "Test@123456");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.username").value("testadmin"))
                .andExpect(jsonPath("$.data.user.fullName").value("Test Administrator"))
                .andExpect(jsonPath("$.data.user.roles[0]").value("SUPER_ADMIN"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Đăng nhập thất bại khi sai mật khẩu")
    void login_Failure_WrongPassword() throws Exception {
        LoginRequest request = new LoginRequest("testadmin", "WrongPassword123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("BAD_CREDENTIALS"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Chống dò quét tài khoản: user không tồn tại cũng trả về 401 BAD_CREDENTIALS")
    void login_Failure_NonExistentUser_ReturnsSame401() throws Exception {
        LoginRequest request = new LoginRequest("completely_nonexistent_user", "AnyPassword123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("BAD_CREDENTIALS"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me - Truy cap that bai khi chua gui JWT")
    void getMe_WithoutToken_ReturnsUnauthorizedOrForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
