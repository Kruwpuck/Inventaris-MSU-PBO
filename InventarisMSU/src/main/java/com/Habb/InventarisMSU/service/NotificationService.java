package com.Habb.InventarisMSU.service;

public interface NotificationService {
    void sendSimpleMessage(String to, String subject, String text);
    void sendHtmlMessage(String to, String subject, String htmlBody);
}
