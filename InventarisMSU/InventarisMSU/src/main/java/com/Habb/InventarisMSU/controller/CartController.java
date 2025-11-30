package com.Habb.InventarisMSU.controller;

import com.Habb.InventarisMSU.dto.CartItem;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @PostMapping("/add")
    public List<CartItem> addToCart(@RequestBody CartItem item, HttpSession session) {
        List<CartItem> cart = getCartFromSession(session);

        Optional<CartItem> existingItem = cart.stream()
                .filter(i -> {
                    if (i.getId() != null && item.getId() != null) {
                        return i.getId().equals(item.getId());
                    }
                    return i.getName().equals(item.getName()) && i.getType().equals(item.getType());
                })
                .findFirst();

        if (existingItem.isPresent()) {
            existingItem.get().setQuantity(item.getQuantity()); // Update quantity
        } else {
            cart.add(item);
        }

        session.setAttribute("cart", cart);
        return cart;
    }

    @GetMapping
    public List<CartItem> getCart(HttpSession session) {
        return getCartFromSession(session);
    }

    @PostMapping("/clear")
    public void clearCart(HttpSession session) {
        session.removeAttribute("cart");
    }

    @SuppressWarnings("unchecked")
    private List<CartItem> getCartFromSession(HttpSession session) {
        List<CartItem> cart = (List<CartItem>) session.getAttribute("cart");
        if (cart == null) {
            cart = new ArrayList<>();
            session.setAttribute("cart", cart);
        }
        return cart;
    }
}
