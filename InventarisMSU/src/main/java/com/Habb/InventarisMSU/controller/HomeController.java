package com.Habb.InventarisMSU.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    private final com.Habb.InventarisMSU.repository.ItemRepository itemRepository;

    public HomeController(com.Habb.InventarisMSU.repository.ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    @GetMapping("/")
    public String index(org.springframework.ui.Model model) {
        model.addAttribute("topBarangs", itemRepository.findTop4ByType(com.Habb.InventarisMSU.model.ItemType.BARANG));
        model.addAttribute("topRuangans", itemRepository.findTop4ByType(com.Habb.InventarisMSU.model.ItemType.RUANGAN));
        return "guest/index";
    }

    @GetMapping("/catalogue")
    public String catalogue(org.springframework.ui.Model model) {
        model.addAttribute("items", itemRepository.findByType(com.Habb.InventarisMSU.model.ItemType.BARANG));
        return "guest/barang";
    }

    @GetMapping("/ruangan")
    public String ruangan(org.springframework.ui.Model model) {
        model.addAttribute("items", itemRepository.findByType(com.Habb.InventarisMSU.model.ItemType.RUANGAN));
        return "guest/ruangan";
    }

    @GetMapping("/booking-ruang")
    public String bookingRuang() {
        return "guest/booking-ruang";
    }

    @GetMapping("/form")
    public String form() {
        return "guest/bookingbarang";
    }

    @GetMapping("/success")
    public String success() {
        return "guest/success";
    }

    @GetMapping("/login")
    public String login() {
        return "login";
    }
}
