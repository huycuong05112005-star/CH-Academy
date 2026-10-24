package vn.chacademy.dashboard;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/v1/dashboard/stats - Thành công khi đã xác thực ADMIN")
    @WithMockUser(username = "admin@chacademy.edu.vn", roles = {"SUPER_ADMIN"})
    void getDashboardStats_Success() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/stats")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalStudents").isNumber())
                .andExpect(jsonPath("$.data.totalCourses").isNumber())
                .andExpect(jsonPath("$.data.totalLeads").isNumber())
                .andExpect(jsonPath("$.data.totalReceivable").isNumber())
                .andExpect(jsonPath("$.data.totalPaid").isNumber())
                .andExpect(jsonPath("$.data.totalDebt").isNumber())
                .andExpect(jsonPath("$.data.upcomingSessions").isArray());
    }

    @Test
    @DisplayName("GET /api/v1/dashboard/stats - Từ chối khi chưa đăng nhập")
    void getDashboardStats_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/stats")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/dashboard/stats - Từ chối 403 khi role không đủ quyền (STUDENT)")
    @WithMockUser(username = "student@chacademy.edu.vn", roles = {"STUDENT"})
    void getDashboardStats_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/stats")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }
}
