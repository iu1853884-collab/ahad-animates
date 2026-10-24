package com.ahadanimates.backend.config;

import com.ahadanimates.backend.users.Role;
import com.ahadanimates.backend.users.User;
import com.ahadanimates.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.initial.email:}")
    private String initialAdminEmail;

    @Value("${admin.initial.password:}")
    private String initialAdminPassword;

    @Value("${admin.initial.name:Ahad Admin}")
    private String initialAdminName;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (initialAdminEmail != null && !initialAdminEmail.isBlank() &&
            initialAdminPassword != null && !initialAdminPassword.isBlank()) {

            String normalizedEmail = initialAdminEmail.trim().toLowerCase();
            if (!userRepository.existsByEmail(normalizedEmail)) {
                User admin = new User(
                        normalizedEmail,
                        passwordEncoder.encode(initialAdminPassword),
                        initialAdminName != null && !initialAdminName.isBlank() ? initialAdminName.trim() : "Ahad Admin",
                        Role.ROLE_ADMIN
                );
                userRepository.save(admin);
                log.info("Safe admin provisioning: Initial administrator created for email [{}]", normalizedEmail);
            } else {
                log.info("Safe admin provisioning: Administrator account already exists for [{}]", normalizedEmail);
            }
        } else {
            long adminCount = userRepository.count();
            if (adminCount == 0) {
                log.warn("Safe admin provisioning: No administrator account exists in database. " +
                        "Configure ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD environment variables to provision one.");
            }
        }
    }
}
