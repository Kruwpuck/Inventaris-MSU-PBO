package com.Habb.InventarisMSU.controller;

import com.Habb.InventarisMSU.model.Item;
import com.Habb.InventarisMSU.model.ItemType;
import com.Habb.InventarisMSU.service.ItemService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/pengelola")
public class TambahController {

    private final ItemService itemService;

    public TambahController(ItemService itemService) {
        this.itemService = itemService;
    }

    // tampilkan halaman tambah
    @GetMapping("/tambah")
    public String showTambah(Model model) {
        return "pengelola/tambah";
    }

    // terima submit form tambah -> simpan ke DB
    @PostMapping("/tambah")
    public String submitTambah(
            @RequestParam("name") String name,
            @RequestParam("type") ItemType type,
            @RequestParam("stock") Integer stock,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "status", required = false) String status
    ) {
        Item item = new Item();
        item.setName(name.trim());
        item.setType(type);
        item.setStock(stock == null ? 0 : stock);
        item.setDescription(description);

        // ✅ DEFAULT IMAGE (WAJIB BIAR BERANDA AMAN)
        item.setImageUrl("default.png");

        // status
        if (type == ItemType.RUANGAN) {
            item.setStatus(
                    (status == null || status.isBlank()) ? "Tersedia" : status
            );
        } else {
            item.setStatus("Tersedia");
        }

        itemService.saveItem(item);

        return "redirect:/pengelola/beranda";
    }
}
