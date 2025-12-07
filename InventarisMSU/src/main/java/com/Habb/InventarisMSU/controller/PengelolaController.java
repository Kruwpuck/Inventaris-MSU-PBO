package com.Habb.InventarisMSU.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/pengelola")
public class PengelolaController {

    @GetMapping("/beranda")
    public String beranda() {
        return "pengelola/beranda";
    }

    @GetMapping("/approval")
    public String approval() {
        return "pengelola/approval";
    }

    @GetMapping("/tambah")
    public String tambah() {
        return "pengelola/tambah";
    }

    @GetMapping("/laporan")
    public String laporan() {
        return "pengelola/laporan";
    }
}
