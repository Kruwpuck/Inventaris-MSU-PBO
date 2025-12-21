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

        String targetRole = request.getParameter("target_role");

        // --- 1) VALIDASI PENGELOLA ---
        if ("PENGELOLA".equalsIgnoreCase(targetRole)) {
            if (roles.contains("ROLE_PENGELOLA")) {
                response.sendRedirect(ctx + "/pengelola/beranda");
                return;
            } else {
                // Login sukses tapi role salah -> invalidate login
                request.getSession().invalidate();
                response.sendRedirect(ctx + "/login?error=role_mismatch");
                return;
            }
        }

        // --- 2) VALIDASI PENGURUS ---
        if ("PENGURUS".equalsIgnoreCase(targetRole)) {
            if (roles.contains("ROLE_PENGURUS")) {
                response.sendRedirect(ctx + "/pengurus/dashboard");
                return;
            } else {
                request.getSession().invalidate();
                response.sendRedirect(ctx + "/login?error=role_mismatch");
                return;
            }
        }

        // Fallback jika tidak ada target_role (misal login lama) -> arahkan sesuai role
        if (roles.contains("ROLE_PENGELOLA")) {
            response.sendRedirect(ctx + "/pengelola/beranda");
        } else if (roles.contains("ROLE_PENGURUS")) {
            response.sendRedirect(ctx + "/pengurus/dashboard");
        } else {
            response.sendRedirect(ctx + "/");
        }
    }
}
