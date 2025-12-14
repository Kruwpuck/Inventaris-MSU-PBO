package com.Habb.InventarisMSU.dto;

public class CartItem {
    private Long id;
    private String name;
    private String type; // "barang" or "ruang"
    private int quantity;
    private String imageUrl;
    private Integer maxQty;

    public CartItem() {
    }

    public CartItem(Long id, String name, String type, int quantity, String imageUrl, Integer maxQty) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.quantity = quantity;
        this.imageUrl = imageUrl;
        this.maxQty = maxQty;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getMaxQty() {
        return maxQty;
    }

    public void setMaxQty(Integer maxQty) {
        this.maxQty = maxQty;
    }
}
