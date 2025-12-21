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
            @RequestParam(value = "capacity", required = false) Integer capacity,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "imageFile", required = false) org.springframework.web.multipart.MultipartFile imageFile) {
        Item item = new Item();
        item.setName(name.trim());
        item.setType(type);
        item.setStock(stock == null ? 0 : stock);
        item.setCapacity(capacity == null ? 0 : capacity);
        item.setDescription(description);

        // DEFAULT IMAGE
        String fileName = "default.png";

        // Handle file upload
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                // Create uploads dir if not exists
                java.nio.file.Path uploadPath = java.nio.file.Paths.get("uploads");
                if (!java.nio.file.Files.exists(uploadPath)) {
                    java.nio.file.Files.createDirectories(uploadPath);
                }

                // Generate unique filename
                String originalName = imageFile.getOriginalFilename();
                String ext = "";
                if (originalName != null && originalName.contains(".")) {
                    ext = originalName.substring(originalName.lastIndexOf("."));
                }
                fileName = java.util.UUID.randomUUID().toString() + ext;

                // Save file
                java.nio.file.Files.copy(imageFile.getInputStream(), uploadPath.resolve(fileName),
                        java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            } catch (java.io.IOException e) {
                e.printStackTrace();
                // Fallback to default if error
                fileName = "default.png";
            }
        }

        item.setImageUrl(fileName);

        // status
        if (type == ItemType.RUANGAN) {
            item.setStatus(
                    (status == null || status.isBlank()) ? "Tersedia" : status);
        } else {
            item.setStatus("Tersedia");
        }

        itemService.saveItem(item);

        return "redirect:/pengelola/beranda";
    }
}
