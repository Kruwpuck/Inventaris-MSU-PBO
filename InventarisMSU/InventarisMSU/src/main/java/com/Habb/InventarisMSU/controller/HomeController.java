package com.Habb.InventarisMSU.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String index() {
        return "guest/index";
    }

    @GetMapping("/catalogue")
    public String catalogue() {
        return "guest/barang";
    }

    @GetMapping("/ruangan")
    public String ruangan() {
        return "guest/ruangan";
    }

    @GetMapping("/form")
    public String form() {
        return "guest/bookingbarang";
    }

    @GetMapping("/login")
    public String login() {
        return "login"; // This should be a shared login page or specific one
    }
}
