package com.Habb.InventarisMSU.service;

import com.Habb.InventarisMSU.model.User;
import com.Habb.InventarisMSU.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User u = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // Role di entity kamu: enum Role (misal: PENGELOLA / PENGURUS)
        // Spring Security butuh authority: ROLE_PENGELOLA / ROLE_PENGURUS
        String roleText = (u.getRole() == null) ? "" : u.getRole().name(); // enum -> String
        roleText = roleText.trim().toUpperCase();

        String authority = roleText.startsWith("ROLE_") ? roleText : "ROLE_" + roleText;

        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(authority));

        return org.springframework.security.core.userdetails.User
                .withUsername(u.getUsername())
                .password(u.getPassword())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(false)
                .credentialsExpired(false)
                .disabled(false)
                .build();
    }
}
