package com.ahadanimates.backend.auth;

import com.ahadanimates.backend.auth.dto.AuthUserDto;
import com.ahadanimates.backend.auth.dto.LoginRequest;
import com.ahadanimates.backend.auth.dto.LoginResponse;
import com.ahadanimates.backend.security.CustomUserDetails;
import com.ahadanimates.backend.security.JwtAuthenticationFilter;
import com.ahadanimates.backend.security.JwtService;
import com.ahadanimates.backend.users.User;
import com.ahadanimates.backend.users.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final boolean cookieSecure;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserRepository userRepository,
            @Value("${jwt.cookie.secure:false}") boolean cookieSecure
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.cookieSecure = cookieSecure;
    }

    public static class LoginResult {
        private final ResponseCookie cookie;
        private final LoginResponse response;

        public LoginResult(ResponseCookie cookie, LoginResponse response) {
            this.cookie = cookie;
            this.response = response;
        }

        public ResponseCookie getCookie() {
            return cookie;
        }

        public LoginResponse getResponse() {
            return response;
        }
    }

    @Transactional(readOnly = true)
    public LoginResult login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        // 1. Authenticate against UserDetails with BCrypt
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        // 2. Generate signed, expiring JWT
        String token = jwtService.generateToken(userDetails);
        long expirationMs = jwtService.getExpirationMs();

        // 3. Build HttpOnly, SameSite, Secure Cookie
        ResponseCookie cookie = ResponseCookie.from(JwtAuthenticationFilter.ACCESS_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(Duration.ofMillis(expirationMs))
                .sameSite("Lax")
                .build();

        AuthUserDto userDto = toDto(user);
        LoginResponse responseBody = new LoginResponse("Login successful", userDto, token);

        return new LoginResult(cookie, responseBody);
    }

    public ResponseCookie logout() {
        return ResponseCookie.from(JwtAuthenticationFilter.ACCESS_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }

    @Transactional(readOnly = true)
    public AuthUserDto getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BadCredentialsException("Not authenticated");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        return toDto(user);
    }

    private AuthUserDto toDto(User user) {
        return new AuthUserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(),
                user.getCreatedAt()
        );
    }
}
