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

    @Autowired
    private EmailService emailService;

    public Peminjaman createPeminjaman(Peminjaman peminjaman) {
        Peminjaman saved = peminjamanRepository.save(peminjaman);
        // Send email to borrower
        emailService.sendSimpleMessage(saved.getEmail(), "Konfirmasi Peminjaman MSU",
                "Halo " + saved.getBorrowerName() + ",\n\n" +
                        "Permohonan peminjaman Anda telah diterima dan sedang menunggu persetujuan Pengelola.\n" +
                        "ID Peminjaman: " + saved.getId());

        // Send email to Pengelola (Assuming a fixed email or just notification logic)
        // For now just logging or sending to a dummy admin email
        // emailService.sendSimpleMessage("admin@msu.com", "New Peminjaman Request",
        // "New request from " + saved.getBorrowerName());

        return saved;
    }

    public List<Peminjaman> getAllPeminjaman() {
        return peminjamanRepository.findAll();
    }

    public Peminjaman getPeminjamanById(Long id) {
        return peminjamanRepository.findById(id).orElse(null);
    }

    public void updateStatus(Long id, PeminjamanStatus status) {
        Peminjaman p = getPeminjamanById(id);
        if (p != null) {
            p.setStatus(status);
            peminjamanRepository.save(p);

            String subject = "Update Status Peminjaman MSU";
            String text = "Halo " + p.getBorrowerName() + ",\n\n" +
                    "Status peminjaman Anda telah diperbarui menjadi: " + status;
            emailService.sendSimpleMessage(p.getEmail(), subject, text);
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
