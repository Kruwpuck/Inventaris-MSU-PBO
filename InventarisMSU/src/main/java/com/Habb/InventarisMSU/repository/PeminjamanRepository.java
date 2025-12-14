package com.Habb.InventarisMSU.repository;

import com.Habb.InventarisMSU.model.Peminjaman;
import com.Habb.InventarisMSU.model.PeminjamanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PeminjamanRepository extends JpaRepository<Peminjaman, Long> {
    List<Peminjaman> findByStatus(PeminjamanStatus status);
}
