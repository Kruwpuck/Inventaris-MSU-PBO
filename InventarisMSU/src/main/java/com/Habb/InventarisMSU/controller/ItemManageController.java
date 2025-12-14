package com.Habb.InventarisMSU.controller;

import com.Habb.InventarisMSU.model.Item;
import com.Habb.InventarisMSU.model.ItemType;
import com.Habb.InventarisMSU.service.ItemService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/pengelola/items")
public class ItemManageController {

    private final ItemService itemService;

    public ItemManageController(ItemService itemService) {
        this.itemService = itemService;
    }

    // UPDATE BARANG
    @PostMapping("/{id}/update-barang")
    @ResponseBody
    public String updateBarang(
            @PathVariable Long id,
            @RequestParam String description,
            @RequestParam Integer stock
    ) {
        Item item = itemService.getItemById(id);
        if (item == null || item.getType() != ItemType.BARANG) return "ERROR";

        item.setDescription(description);
        item.setStock(stock);
        itemService.saveItem(item);
        return "OK";
    }

    // UPDATE RUANGAN
    @PostMapping("/{id}/update-ruangan")
    @ResponseBody
    public String updateRuangan(
            @PathVariable Long id,
            @RequestParam String description,
            @RequestParam String status
    ) {
        Item item = itemService.getItemById(id);
        if (item == null || item.getType() != ItemType.RUANGAN) return "ERROR";

        item.setDescription(description);
        item.setStatus(status);
        itemService.saveItem(item);
        return "OK";
    }

    // DELETE
    @PostMapping("/{id}/delete")
    @ResponseBody
    public String deleteItem(@PathVariable Long id) {
        Item item = itemService.getItemById(id);
        if (item == null) return "ERROR";

        itemService.deleteItem(id);
        return "OK";
    }
}
