package com.Habb.InventarisMSU.config;

import com.Habb.InventarisMSU.model.User;
import com.Habb.InventarisMSU.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@Configuration
public class DatabaseSeeder {

    @Bean
    public CommandLineRunner seedUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            updateUserPasswordIfPlainText(userRepository, passwordEncoder, "pengelola", "password");
            updateUserPasswordIfPlainText(userRepository, passwordEncoder, "pengurus", "password");
        };
    }

    private void updateUserPasswordIfPlainText(UserRepository userRepository, PasswordEncoder passwordEncoder, String username, String plainPassword) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Check if password stored is exactly the plain text one (meaning it hasn't been hashed yet)
            // Note: In a real scenario, detecting if a string is a BCrypt hash is better, 
            // but here we know the specific problem is "password" stored as "password".
            if (!user.getPassword().startsWith("$2a$") && user.getPassword().equals(plainPassword)) {
                String encodedPassword = passwordEncoder.encode(plainPassword);
                user.setPassword(encodedPassword);
                userRepository.save(user);
                System.out.println("UPDATED password for user: " + username);
            } else {
                 System.out.println("Password for user " + username + " already seems hashed or different.");
            }
        }
    }
}
