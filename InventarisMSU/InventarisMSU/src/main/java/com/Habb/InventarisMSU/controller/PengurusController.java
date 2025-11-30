package com.Habb.InventarisMSU.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/pengurus")
public class PengurusController {

    @GetMapping("/dashboard")
    public String dashboard() {
        return "pengurus/dashboard";
    }

    @GetMapping("/fasilitas")
    public String fasilitas() {
        return "pengurus/pinjamFasilitas";
    }

    @GetMapping("/riwayat")
    public String riwayat() {
        return "pengurus/riwayat";
    }
}
