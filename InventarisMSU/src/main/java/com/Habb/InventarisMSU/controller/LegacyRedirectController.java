package com.Habb.InventarisMSU.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LegacyRedirectController {

    @GetMapping("/pengelola/tambah.html")
    public String redirectTambah() {
        return "redirect:/pengelola/tambah";
    }

    @GetMapping("/pengelola/beranda.html")
    public String redirectBeranda() {
        return "redirect:/pengelola/beranda";
    }

    @GetMapping("/pengelola/laporan.html")
    public String redirectLaporan() {
        return "redirect:/pengelola/laporan";
    }

    @GetMapping("/pengelola/approval.html")
    public String redirectApproval() {
        return "redirect:/pengelola/approval";
    }

    @GetMapping("/pengurus/dashboard.html")
    public String redirectPengurusDashboard() {
        return "redirect:/pengurus/dashboard";
    }
}
