package com.Habb.InventarisMSU.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("/pengurus")
public class PengurusController {

    private final com.Habb.InventarisMSU.service.PeminjamanService peminjamanService;

    public PengurusController(com.Habb.InventarisMSU.service.PeminjamanService peminjamanService) {
        this.peminjamanService = peminjamanService;
    }

    @GetMapping("/dashboard")
    public String dashboard(org.springframework.ui.Model model) {
        // Fetch valid borrowings (e.g., APPROVED)
        // For simplicity, let's fetch all APPROVED ones for now, or filter by date if
        // needed.
        // User asked for "Peminjaman Hari Ini" (Loans Today), implying validation
        // against current date.
        // Let's filter in Java for now.
        var all = peminjamanService.getAllPeminjaman();
        var today = java.time.LocalDate.now();
        var approvedToday = all.stream()
                .filter(p -> p.getStatus() == com.Habb.InventarisMSU.model.PeminjamanStatus.APPROVED ||
                        p.getStatus() == com.Habb.InventarisMSU.model.PeminjamanStatus.TAKEN)
                .filter(p -> !p.getStartDate().isAfter(today) && !p.getEndDate().isBefore(today)) // Active today
                .toList();

        model.addAttribute("activeLoans", approvedToday);
        return "pengurus/dashboard";
    }

    @GetMapping("/fasilitas")
    public String fasilitas(org.springframework.ui.Model model) {
        var all = peminjamanService.getAllPeminjaman();
        // Filter for APPROVED (ready to take) or TAKEN (ready to return)
        var active = all.stream()
                .filter(p -> p.getStatus() == com.Habb.InventarisMSU.model.PeminjamanStatus.APPROVED ||
                        p.getStatus() == com.Habb.InventarisMSU.model.PeminjamanStatus.TAKEN)
                .toList();
        model.addAttribute("activeLoans", active);
        return "pengurus/pinjamFasilitas";
    }

    @PostMapping("/fasilitas/update-status")
    public String updateStatus(@RequestParam("id") Long id,
            @RequestParam("action") String action) {
        System.out.println("DEBUG: Received update request for ID: " + id + ", Action: " + action);
        var status = com.Habb.InventarisMSU.model.PeminjamanStatus.valueOf(action);
        // Action should be TAKEN or COMPLETED
        peminjamanService.updateStatus(id, status);
        return "redirect:/pengurus/fasilitas";
    }

    @GetMapping("/riwayat")
    public String riwayat(org.springframework.ui.Model model) {
        var all = peminjamanService.getAllPeminjaman();
        // Filter for COMPLETED or REJECTED
        var history = all.stream()
                .filter(p -> p.getStatus() == com.Habb.InventarisMSU.model.PeminjamanStatus.COMPLETED ||
                        p.getStatus() == com.Habb.InventarisMSU.model.PeminjamanStatus.REJECTED)
                .sorted((p1, p2) -> p2.getId().compareTo(p1.getId())) // Newest first
                .toList();
        model.addAttribute("historyLoans", history);
        return "pengurus/riwayat";
    }

    @PostMapping("/riwayat/cancel")
    public String cancelStatus(@RequestParam("id") Long id) {
        // Only revert if status is COMPLETED -> TAKEN (logic: undone return)
        peminjamanService.updateStatus(id, com.Habb.InventarisMSU.model.PeminjamanStatus.TAKEN);
        return "redirect:/pengurus/riwayat";
    }
}
