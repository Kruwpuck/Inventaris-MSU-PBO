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

    @PostMapping("/api/fasilitas/update-status")
    @org.springframework.web.bind.annotation.ResponseBody
    public java.util.Map<String, Object> updateStatusApi(@RequestParam("id") Long id,
            @RequestParam("action") String action) {
        var status = PeminjamanStatus.valueOf(action);
        var peminjaman = peminjamanService.getPeminjamanById(id);
        java.util.Map<String, Object> response = new java.util.HashMap<>();

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
                    response.put("success", true);
                    response.put("message", "Fasilitas berhasil diambil. Jangan lupa mintakan kartu identitas.");
                } else if (status == PeminjamanStatus.RETURNED) {
                    LocalDateTime now = LocalDateTime.now();
                    laporan.setReturnedAt(now);

                    if (laporan.getPickedUpAt() == null) {
                        laporan.setPickedUpAt(now);
                    }

                    // Check for Lateness
                    LocalDateTime deadline = LocalDateTime.of(peminjaman.getEndDate(), peminjaman.getEndTime() != null ? peminjaman.getEndTime() : java.time.LocalTime.MAX);
                    if (now.isAfter(deadline)) {
                        peminjaman.setStatus(PeminjamanStatus.OVERDUE);
                        response.put("success", true);
                        response.put("message", "Fasilitas berhasil dikembalikan. Jangan lupa kembalikan kartu identitas sebagai bukti pengembalian");
                    } else {
                        response.put("success", true);
                        response.put("message", "Fasilitas berhasil dikembalikan. Jangan lupa kembalikan kartu identitas sebagai bukti pengembalian");
                    }

                    laporanRepository.save(laporan);
                }
            } else {
                response.put("success", false);
                response.put("message", "Data peminjaman tidak ditemukan.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
        }

        return response;
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

                    // Check for Lateness
                    LocalDateTime deadline = LocalDateTime.of(peminjaman.getEndDate(), peminjaman.getEndTime() != null ? peminjaman.getEndTime() : java.time.LocalTime.MAX);
                    if (now.isAfter(deadline)) {
                        peminjaman.setStatus(PeminjamanStatus.OVERDUE);
                        // Status set to OVERDUE for report, but feedback to Pengurus remains generic
                        redirectAttributes.addFlashAttribute("successMessage",
                                "Fasilitas berhasil dikembalikan. Jangan lupa kembalikan kartu identitas sebagai bukti pengembalian");
                    } else {
                        // Default logic
                        redirectAttributes.addFlashAttribute("successMessage",
                                "Fasilitas berhasil dikembalikan. Jangan lupa kembalikan kartu identitas sebagai bukti pengembalian");
                    }

                    laporanRepository.save(laporan);
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
        // Filter for COMPLETED, REJECTED, TAKEN, RETURNED, or OVERDUE
        var history = all.stream()
                .filter(p -> p.getStatus() == PeminjamanStatus.COMPLETED
                || p.getStatus() == PeminjamanStatus.TAKEN
                || p.getStatus() == PeminjamanStatus.RETURNED
                || p.getStatus() == PeminjamanStatus.OVERDUE)
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

            Laporan laporanToDelete = peminjaman.getLaporan();
            if (laporanToDelete == null) {
                // Fallback attempt to find independently if not loaded in entity graph
                laporanToDelete = laporanRepository.findByPeminjamanId(id);
            }

            // CRITICAL: Break the association before saving Peminjaman
            // because CascadeType.ALL on Peminjaman might re-save/persist the Laporan we want to delete
            peminjaman.setLaporan(null);
            peminjamanService.save(peminjaman);

            if (laporanToDelete != null) {
                laporanRepository.delete(laporanToDelete);
            }
        }

        redirectAttributes.addFlashAttribute("successMessage",
                "Status peminjaman berhasil dibatalkan. Data dikembalikan ke Dashboard.");
        return "redirect:/pengurus/riwayat";
    }

    @PostMapping("/riwayat/submit")
    public String submitReport(@RequestParam("id") Long id,
            @RequestParam(value = "lateReason", required = false) String lateReason,
            RedirectAttributes redirectAttributes) {

        var peminjaman = peminjamanService.getPeminjamanById(id);
        if (peminjaman != null) {
            // Check if it was OVERDUE, keep it OVERDUE. Else COMPLETED.
            if (peminjaman.getStatus() != PeminjamanStatus.OVERDUE) {
                peminjaman.setStatus(PeminjamanStatus.COMPLETED);
            } else {
                // If overdue and reason provided, save it
                if (lateReason != null && !lateReason.trim().isEmpty()) {
                    peminjaman.setReason(lateReason);
                }
            }

            peminjamanService.save(peminjaman);

            var laporan = laporanRepository.findByPeminjamanId(id);
            if (laporan == null) {
                laporan = new Laporan();
                laporan.setPeminjaman(peminjaman);
            }

            laporan.setSubmitted(true);

            // Save late reason to Laporan notes
            if (peminjaman.getStatus() == PeminjamanStatus.OVERDUE && lateReason != null && !lateReason.trim().isEmpty()) {
                laporan.setNotes(lateReason);
            }

            laporanRepository.save(laporan);
        }

        redirectAttributes.addFlashAttribute("successMessage", "Laporan peminjaman berhasil dikirim.");
        return "redirect:/pengurus/riwayat";
    }
}
