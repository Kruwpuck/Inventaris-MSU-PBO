package com.Habb.InventarisMSU.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "laporan")
@Entity
@Table(name = "laporan")
public class Laporan extends BaseEntity {

    // ID removed (Inherited)

    @OneToOne
    @JoinColumn(name = "id_peminjaman", nullable = false)
    private Peminjaman peminjaman;

    @Column(name = "picked_up_at")
    private LocalDateTime pickedUpAt;

    @Column(name = "returned_at")
    private LocalDateTime returnedAt;

    @Column(name = "is_submitted", nullable = false)
    private boolean isSubmitted = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // Getters and Setters
    // ID methods removed (inherited)

    public Peminjaman getPeminjaman() {
        return peminjaman;
    }

    public void setPeminjaman(Peminjaman peminjaman) {
        this.peminjaman = peminjaman;
    }

    public LocalDateTime getPickedUpAt() {
        return pickedUpAt;
    }

    public void setPickedUpAt(LocalDateTime pickedUpAt) {
        this.pickedUpAt = pickedUpAt;
    }

    public LocalDateTime getReturnedAt() {
        return returnedAt;
    }

    public void setReturnedAt(LocalDateTime returnedAt) {
        this.returnedAt = returnedAt;
    }

    public boolean isSubmitted() {
        return isSubmitted;
    }

    public void setSubmitted(boolean submitted) {
        isSubmitted = submitted;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

}
