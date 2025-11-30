package com.Habb.InventarisMSU.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/pengelola")
public class PengelolaController {

    @GetMapping("/dashboard")
    public String dashboard() {
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
