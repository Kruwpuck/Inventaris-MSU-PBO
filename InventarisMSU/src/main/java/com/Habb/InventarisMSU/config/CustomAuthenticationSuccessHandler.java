package com.Habb.InventarisMSU.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;

@Component
public class CustomAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        Set<String> roles = AuthorityUtils.authorityListToSet(authentication.getAuthorities());
        String ctx = request.getContextPath(); // penting kalau ada context path / reverse proxy

        if (roles.contains("ROLE_PENGELOLA")) {
            response.sendRedirect(ctx + "/pengelola/beranda");
            return;
        }
        if (roles.contains("ROLE_PENGURUS")) {
            response.sendRedirect(ctx + "/pengurus/dashboard");
            return;
        }

        response.sendRedirect(ctx + "/");
    }
}
