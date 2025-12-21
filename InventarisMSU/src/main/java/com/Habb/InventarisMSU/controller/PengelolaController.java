package com.Habb.InventarisMSU.controller;

import com.Habb.InventarisMSU.model.ItemType;
import com.Habb.InventarisMSU.service.ItemService;
import com.Habb.InventarisMSU.service.PeminjamanService;
import com.Habb.InventarisMSU.repository.PeminjamanRepository;
import com.Habb.InventarisMSU.model.PeminjamanStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import com.Habb.InventarisMSU.service.ReportService;
import java.util.List;
import com.Habb.InventarisMSU.model.Peminjaman;

@Controller
@RequestMapping("/pengelola")
public class PengelolaController {

    private final ItemService itemService;
    private final PeminjamanRepository peminjamanRepository;
    private final PeminjamanService peminjamanService;
    private final ReportService reportService;

    public PengelolaController(ItemService itemService, PeminjamanRepository peminjamanRepository,
            PeminjamanService peminjamanService, ReportService reportService) {
        this.itemService = itemService;
        this.peminjamanRepository = peminjamanRepository;
        this.peminjamanService = peminjamanService;
        this.reportService = reportService;
    }

    @GetMapping("/beranda")
    public String beranda(Model model) {
        var all = itemService.getAllItems();
        var barangList = all.stream().filter(it -> it.getType() == ItemType.BARANG).toList();
        var ruanganList = all.stream().filter(it -> it.getType() == ItemType.RUANGAN).toList();
        model.addAttribute("barangList", barangList);
        model.addAttribute("ruanganList", ruanganList);
        return "pengelola/beranda";
    }

    @GetMapping("/approval-check")
    @ResponseBody
    public String testApproval() {
        return "Controller /pengelola/approval-check is reachable!";
    }

    @GetMapping("/approval")
    public String approval(Model model) {
        System.out.println("=== DEBUG: Entering approval method ===");
        try {
            var pendingList = peminjamanRepository.findByStatus(PeminjamanStatus.PENDING);
            System.out.println("Pending list size: " + (pendingList == null ? "null" : pendingList.size()));

            var historyList = peminjamanRepository.findByStatusNot(PeminjamanStatus.PENDING);
            System.out.println("History list size: " + (historyList == null ? "null" : historyList.size()));

            model.addAttribute("pendingList", pendingList);
            model.addAttribute("historyList", historyList);
            return "pengelola/approval_list";
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    @PostMapping("/approval/update")
    public String updateStatus(@RequestParam("id") Long id, @RequestParam("status") String statusStr,
            @RequestParam(value = "reason", required = false) String reason) {
        PeminjamanStatus status = PeminjamanStatus.valueOf(statusStr);
        peminjamanService.updateStatus(id, status);
        return "redirect:/pengelola/approval";
    }

    @GetMapping("/laporan")
    public String laporan(Model model) {
        // Fetch all data for the table
        List<Peminjaman> list = peminjamanRepository.findAll();
        // Sort specifically if needed, but for now findAll matches seeder order if
        // inserted sequentially
        model.addAttribute("listPeminjaman", list);
        return "pengelola/laporan";
    }

    // --- REPORT DOWNLOAD ENDPOINTS ---

    @GetMapping("/laporan/download/csv")
    public org.springframework.http.ResponseEntity<byte[]> downloadCsv() {
        byte[] data = reportService.generateCsv();
        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=laporan.csv")
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv"))
                .body(data);
    }

    @GetMapping("/laporan/download/xlsx")
    public org.springframework.http.ResponseEntity<byte[]> downloadXlsx() throws java.io.IOException {
        byte[] data = reportService.generateXlsx();
        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=laporan.xlsx")
                .contentType(org.springframework.http.MediaType
                        .parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/laporan/download/pdf")
    public org.springframework.http.ResponseEntity<byte[]> downloadPdf() {
        byte[] data = reportService.generatePdf();
        return org.springframework.http.ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=laporan.pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(data);
    }
}
