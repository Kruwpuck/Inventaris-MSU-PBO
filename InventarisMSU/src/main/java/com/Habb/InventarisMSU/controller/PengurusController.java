package com.Habb.InventarisMSU.controller;

import com.Habb.InventarisMSU.model.Laporan;
import com.Habb.InventarisMSU.model.PeminjamanStatus;
import com.Habb.InventarisMSU.repository.LaporanRepository;
import com.Habb.InventarisMSU.service.PeminjamanService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Controller
@RequestMapping("/pengurus")
public class PengurusController {

    private final PeminjamanService peminjamanService;
    private final LaporanRepository laporanRepository;

    public PengurusController(PeminjamanService peminjamanService, LaporanRepository laporanRepository) {
        this.peminjamanService = peminjamanService;
        this.laporanRepository = laporanRepository;
    }

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        // Fetch valid borrowings (e.g., APPROVED)
        // For simplicity, let's fetch all APPROVED ones for now, or filter by date if
        // needed.
        // User asked for "Peminjaman Hari Ini" (Loans Today), implying validation
        // against current date.
        // Let's filter in Java for now.
        var all = peminjamanService.getAllPeminjaman();
        var today = LocalDate.now();
        var approvedToday = all.stream()
                .filter(p -> p.getStatus() == PeminjamanStatus.APPROVED
                || p.getStatus() == PeminjamanStatus.TAKEN)
                .filter(p -> !p.getStartDate().isAfter(today) && !p.getEndDate().isBefore(today)) // Active today
                .toList();

        model.addAttribute("activeLoans", approvedToday);
        return "pengurus/dashboard";
    }

    @GetMapping("/fasilitas")
    public String fasilitas(Model model) {
        var all = peminjamanService.getAllPeminjaman();
        // Filter for APPROVED (ready to take) or TAKEN (ready to return)
        var active = all.stream()
                .filter(p -> p.getStatus() == PeminjamanStatus.APPROVED
                || p.getStatus() == PeminjamanStatus.TAKEN)
                .toList();
        model.addAttribute("activeLoans", active);
        return "pengurus/pinjamFasilitas";
    }

    @PostMapping("/fasilitas/update-status")
    public String updateStatus(@RequestParam("id") Long id,
            @RequestParam("action") String action,
            @RequestParam(value = "redirect", required = false) String redirectUrl,
            RedirectAttributes redirectAttributes) {
        var status = PeminjamanStatus.valueOf(action);
        var peminjaman = peminjamanService.getPeminjamanById(id);

        try {
            if (peminjaman != null) {
                peminjaman.setStatus(status);
                peminjamanService.save(peminjaman);

                // Handle Laporan Realtime Update
                Laporan laporan = laporanRepository.findByPeminjamanId(id);
                if (laporan == null) {
                    laporan = new Laporan();
                    laporan.setPeminjaman(peminjaman);
                }

                if (status == PeminjamanStatus.TAKEN) {
                    laporan.setPickedUpAt(LocalDateTime.now());
                    laporanRepository.save(laporan);
                    redirectAttributes.addFlashAttribute("successMessage",
                            "Fasilitas berhasil diambil. Jangan lupa mintakan kartu identitas sebagai bukti peminjaman");
                } else if (status == PeminjamanStatus.RETURNED) {
                    LocalDateTime now = LocalDateTime.now();
                    laporan.setReturnedAt(now);

                    // If skipped "Taken" step, set pickedUpAt to same time
                    if (laporan.getPickedUpAt() == null) {
                        laporan.setPickedUpAt(now);
                    }

                    laporanRepository.save(laporan);
                    redirectAttributes.addFlashAttribute("successMessage",
                            "Fasilitas berhasil dikembalikan. Silakan cek Riwayat untuk finalisasi laporan.");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("errorMessage", "Error: " + e.getMessage() + ". Coba restart aplikasi atau hubungi admin.");
        }

        return "redirect:" + (redirectUrl != null && !redirectUrl.isEmpty() ? redirectUrl : "/pengurus/fasilitas");
    }

    @GetMapping("/riwayat")
    public String riwayat(Model model) {
        var all = peminjamanService.getAllPeminjaman();
        // Filter for COMPLETED, REJECTED, TAKEN, or RETURNED
        var history = all.stream()
                .filter(p -> p.getStatus() == PeminjamanStatus.COMPLETED
                || p.getStatus() == PeminjamanStatus.TAKEN
                || p.getStatus() == PeminjamanStatus.RETURNED)
                .sorted((p1, p2) -> p2.getId().compareTo(p1.getId())) // Newest first
                .toList();
        model.addAttribute("historyLoans", history);
        return "pengurus/riwayat";
    }

    @PostMapping("/riwayat/cancel")
    public String cancelStatus(@RequestParam("id") Long id,
            RedirectAttributes redirectAttributes) {
        // Revert status to APPROVED
        var peminjaman = peminjamanService.getPeminjamanById(id);
        if (peminjaman != null) {
            peminjaman.setStatus(PeminjamanStatus.APPROVED);
            peminjamanService.save(peminjaman);

            // Remove or Reset Laporan
            var laporan = laporanRepository.findByPeminjamanId(id);
            if (laporan != null) {
                laporanRepository.delete(laporan);
            }
        }

        redirectAttributes.addFlashAttribute("successMessage",
                "Status peminjaman berhasil dibatalkan. Data dikembalikan ke Dashboard.");
        return "redirect:/pengurus/riwayat";
    }

    @PostMapping("/riwayat/submit")
    public String submitReport(@RequestParam("id") Long id,
            RedirectAttributes redirectAttributes) {

        var peminjaman = peminjamanService.getPeminjamanById(id);
        if (peminjaman != null) {
            // Update Status to COMPLETED
            peminjaman.setStatus(PeminjamanStatus.COMPLETED);
            peminjamanService.save(peminjaman);

            var laporan = laporanRepository.findByPeminjamanId(id);
            if (laporan != null) {
                laporan.setSubmitted(true);
                laporanRepository.save(laporan);
            } else {
                laporan = new Laporan();
                laporan.setPeminjaman(peminjaman);
                laporan.setSubmitted(true);
                laporanRepository.save(laporan);
            }
        }

        redirectAttributes.addFlashAttribute("successMessage", "Laporan peminjaman berhasil dikirim (Completed).");
        return "redirect:/pengurus/riwayat";
    }
}
