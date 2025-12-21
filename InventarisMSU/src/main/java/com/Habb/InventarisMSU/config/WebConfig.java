package com.Habb.InventarisMSU.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map /assets/guest/** to both classpath and file system uploads
        registry.addResourceHandler("/assets/guest/**")
                .addResourceLocations("classpath:/static/assets/guest/", "file:uploads/", "file:/app/uploads/");

        // Map /uploads/** directly to file system uploads for PDF proposals
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/", "file:./uploads/", "file:/app/uploads/");
    }
}
