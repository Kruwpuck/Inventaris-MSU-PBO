package com.Habb.InventarisMSU.controller;

import com.Habb.InventarisMSU.model.ItemType;
import com.Habb.InventarisMSU.service.ItemService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/pengelola")
public class PengelolaController {

    private final ItemService itemService;

    public PengelolaController(ItemService itemService) {
        this.itemService = itemService;
    }

    @GetMapping("/beranda")
    public String beranda(Model model) {
        var all = itemService.getAllItems();

        var barangList = all.stream()
                .filter(it -> it.getType() == ItemType.BARANG)
                .toList();

        var ruanganList = all.stream()
                .filter(it -> it.getType() == ItemType.RUANGAN)
                .toList();

        model.addAttribute("barangList", barangList);
        model.addAttribute("ruanganList", ruanganList);
        return "pengelola/beranda";
    }

    @GetMapping("/approval")
    public String approval() { return "pengelola/approval"; }

    @GetMapping("/laporan")
    public String laporan() { return "pengelola/laporan"; }
}
