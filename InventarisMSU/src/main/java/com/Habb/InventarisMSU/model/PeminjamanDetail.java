package com.Habb.InventarisMSU.model;

import jakarta.persistence.*;

@Entity
@Table(name = "peminjaman_details")
@Entity
@Table(name = "peminjaman_details")
public class PeminjamanDetail extends BaseEntity {
    // ID removed (Inherited)

    @ManyToOne
    @JoinColumn(name = "peminjaman_id", nullable = false)
    private Peminjaman peminjaman;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    private Integer quantity;

    private Integer quantity;

    // ID methods removed (inherited)

    public Peminjaman getPeminjaman() {
        return peminjaman;
    }

    public void setPeminjaman(Peminjaman peminjaman) {
        this.peminjaman = peminjaman;
    }

    public Item getItem() {
        return item;
    }

    public void setItem(Item item) {
        this.item = item;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
