package com.Habb.InventarisMSU.service;

import com.Habb.InventarisMSU.model.Peminjaman;
import com.Habb.InventarisMSU.model.PeminjamanStatus;
import com.Habb.InventarisMSU.repository.PeminjamanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PeminjamanService {

    @Autowired
    private PeminjamanRepository peminjamanRepository;

    // @Autowired
    // private EmailService emailService;
    @Autowired
    private com.Habb.InventarisMSU.repository.ItemRepository itemRepository;

    public Peminjaman createPeminjaman(Peminjaman peminjaman) {
        Peminjaman saved = peminjamanRepository.save(peminjaman);
        // Email removed as per request
        // emailService.sendSimpleMessage(...)
        return saved;
    }

    public void save(Peminjaman peminjaman) {
        peminjamanRepository.save(peminjaman);
    }

    public List<Peminjaman> getAllPeminjaman() {
        return peminjamanRepository.findAll();
    }

    public Peminjaman getPeminjamanById(Long id) {
        return peminjamanRepository.findById(id).orElse(null);
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateStatus(Long id, PeminjamanStatus status) {
        System.out.println("DEBUG: Updating status for ID " + id + " to " + status);
        Peminjaman p = getPeminjamanById(id);
        if (p != null) {
            System.out.println("DEBUG: Found peminjaman. Current status: " + p.getStatus());
            // Logic for stock deduction/restoration based on status transition
            // Logic for stock deduction/restoration REMOVED.
            // Stock in 'items' table represents Total Assets and should not change with
            // bookings.
            // Availability is calculated dynamically in PeminjamanController.

            if (status == PeminjamanStatus.TAKEN) {
                p.setHandedOver(true);
            } else if (status == PeminjamanStatus.COMPLETED) {
                p.setReturned(true);
            }

            p.setStatus(status);
            peminjamanRepository.save(p);
            System.out.println("DEBUG: Status updated successfully.");
        } else {
            System.out.println("DEBUG: Peminjaman ID " + id + " not found.");
        }
    }

    public void updateHandover(Long id, boolean handedOver) {
        Peminjaman p = getPeminjamanById(id);
        if (p != null) {
            p.setHandedOver(handedOver);
            peminjamanRepository.save(p);
        }
    }

    public void updateReturn(Long id, boolean returned) {
        Peminjaman p = getPeminjamanById(id);
        if (p != null) {
            p.setReturned(returned);
            if (returned && p.isHandedOver()) {
                p.setStatus(PeminjamanStatus.COMPLETED);
            }
            peminjamanRepository.save(p);
        }
    }
}
