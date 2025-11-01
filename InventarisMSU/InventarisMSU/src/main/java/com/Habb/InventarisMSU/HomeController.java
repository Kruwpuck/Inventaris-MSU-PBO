package com.Habb.InventarisMSU;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class HomeController {
    @RequestMapping("/home")
    public String index() {
        return "redirect:/index.html";
    }
}
