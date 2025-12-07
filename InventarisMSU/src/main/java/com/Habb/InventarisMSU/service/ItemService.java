package com.Habb.InventarisMSU.service;

import com.Habb.InventarisMSU.model.Item;
import com.Habb.InventarisMSU.model.Peminjaman;
import com.Habb.InventarisMSU.model.PeminjamanDetail;
import com.Habb.InventarisMSU.model.PeminjamanStatus;
import com.Habb.InventarisMSU.repository.ItemRepository;
import com.Habb.InventarisMSU.repository.PeminjamanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private PeminjamanRepository peminjamanRepository;

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    public Item getItemById(Long id) {
        return itemRepository.findById(id).orElse(null);
    }

    public Item saveItem(Item item) {
        return itemRepository.save(item);
    }

    public void deleteItem(Long id) {
        itemRepository.deleteById(id);
    }

    public int getAvailableStock(Item item, LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return item.getStock();
        }

        List<Peminjaman> activePeminjaman = peminjamanRepository.findAll().stream()
                .filter(p -> p.getStatus() == PeminjamanStatus.APPROVED || p.getStatus() == PeminjamanStatus.PENDING) // Include
                                                                                                                      // Pending?
                                                                                                                      // User
                                                                                                                      // said
                                                                                                                      // "acc
                                                                                                                      // oleh
                                                                                                                      // pengurus"
                                                                                                                      // (which
                                                                                                                      // implies
                                                                                                                      // approved
                                                                                                                      // by
                                                                                                                      // pengelola
                                                                                                                      // first).
                                                                                                                      // Let's
                                                                                                                      // assume
                                                                                                                      // Approved
                                                                                                                      // by
                                                                                                                      // Pengelola
                                                                                                                      // reduces
                                                                                                                      // stock
                                                                                                                      // availability
                                                                                                                      // for
                                                                                                                      // future
                                                                                                                      // checks?
                                                                                                                      // Or
                                                                                                                      // maybe
                                                                                                                      // only
                                                                                                                      // confirmed
                                                                                                                      // ones.
                                                                                                                      // User
                                                                                                                      // said
                                                                                                                      // "acc
                                                                                                                      // oleh
                                                                                                                      // pengurus"
                                                                                                                      // but
                                                                                                                      // Pengurus
                                                                                                                      // receives
                                                                                                                      // list
                                                                                                                      // AFTER
                                                                                                                      // Pengelola
                                                                                                                      // approves.
                                                                                                                      // So
                                                                                                                      // Approved
                                                                                                                      // by
                                                                                                                      // Pengelola
                                                                                                                      // is
                                                                                                                      // the
                                                                                                                      // trigger.
                // Actually user said: "range Waktu dari permohonan yang telah di acc oleh
                // pengurus".
                // But Pengurus checklist is for handover.
                // Logic: If I want to borrow for tomorrow, and someone else is approved for
                // tomorrow, I can't borrow.
                // So "Approved" status should block stock.
                .filter(p -> isOverlapping(startDate, endDate, p.getStartDate(), p.getEndDate()))
                .collect(Collectors.toList());

        int usedStock = 0;
        for (Peminjaman p : activePeminjaman) {
            for (PeminjamanDetail d : p.getDetails()) {
                if (d.getItem().getId().equals(item.getId())) {
                    usedStock += d.getQuantity();
                }
            }
        }

        return Math.max(0, item.getStock() - usedStock);
    }

    private boolean isOverlapping(LocalDate start1, LocalDate end1, LocalDate start2, LocalDate end2) {
        return !start1.isAfter(end2) && !start2.isAfter(end1);
    }
}
