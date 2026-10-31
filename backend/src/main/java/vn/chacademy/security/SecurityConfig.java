package vn.chacademy.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(CustomUserDetailsService userDetailsService,
                          JwtAuthenticationFilter jwtAuthenticationFilter,
                          CorsConfigurationSource corsConfigurationSource) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                        .frameOptions(org.springframework.security.config.annotation.web.configurers.HeadersConfigurer.FrameOptionsConfig::deny)
                        .contentTypeOptions(org.springframework.security.config.Customizer.withDefaults())
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'self'; " +
                                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                                "font-src 'self' https://fonts.gstatic.com data:; " +
                                "img-src 'self' data: https: blob:; " +
                                "connect-src 'self' http://localhost:* https://openrouter.ai https://generativelanguage.googleapis.com; " +
                                "media-src 'self' blob:; " +
                                "object-src 'none'; " +
                                "base-uri 'self'; " +
                                "form-action 'self'; " +
                                "frame-ancestors 'none'"
                        ))
                        .referrerPolicy(ref -> ref.policy(org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .permissionsPolicy(perms -> perms.policy("camera=(), microphone=(self), geolocation=(), payment=()"))
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write("{\"success\":false,\"message\":\"Phiên đăng nhập đã hết hạn hoặc chưa xác thực\",\"errorCode\":\"UNAUTHORIZED\"}");
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/v1/health", "/api/v1/actuator/health").permitAll()
                        .requestMatchers("/api/v1/auth/login", "/api/v1/auth/oauth/**").permitAll()
                        .requestMatchers("/api/v1/public/**").permitAll()
                        .requestMatchers("/api/v1/chat/ai/public/**").permitAll()
                        .requestMatchers("/api/v1/chat/ai/portal-config").permitAll()
                        .requestMatchers("/api/v1/chat/ai/voice/diagnostics").permitAll()
                        .requestMatchers("/api/v1/webhooks/**").permitAll()
                        .requestMatchers("/api/v1/files/download/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/course-categories/active").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/academic-years/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        // Actuator quản trị mở rộng yêu cầu quyền SUPER_ADMIN
                        .requestMatchers("/api/v1/actuator/**").hasRole("SUPER_ADMIN")
                        // Mọi endpoint khác đều yêu cầu xác thực
                        .anyRequest().authenticated()
                );

        org.springframework.web.filter.CharacterEncodingFilter encodingFilter = new org.springframework.web.filter.CharacterEncodingFilter();
        encodingFilter.setEncoding("UTF-8");
        encodingFilter.setForceEncoding(true);
        http.addFilterBefore(encodingFilter, org.springframework.security.web.context.SecurityContextHolderFilter.class);

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
