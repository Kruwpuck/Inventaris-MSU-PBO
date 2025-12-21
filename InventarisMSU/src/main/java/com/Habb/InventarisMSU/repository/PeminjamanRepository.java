package com.Habb.InventarisMSU.repository;

import com.Habb.InventarisMSU.model.Peminjaman;
import com.Habb.InventarisMSU.model.PeminjamanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PeminjamanRepository extends JpaRepository<Peminjaman, Long> {
    List<Peminjaman> findByStatus(PeminjamanStatus status);

    List<Peminjaman> findByStatusNot(PeminjamanStatus status);

    List<Peminjaman> findByStartDate(java.time.LocalDate startDate);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Peminjaman p LEFT JOIN FETCH p.details pd LEFT JOIN FETCH pd.item WHERE p.status <> 'REJECTED' AND p.status <> 'COMPLETED' AND p.status <> 'CANCELLED' AND :date >= p.startDate AND :date <= p.endDate")
    List<Peminjaman> findOverlappingBookings(@Param("date") java.time.LocalDate date);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Peminjaman p LEFT JOIN FETCH p.details pd LEFT JOIN FETCH pd.item WHERE p.status <> 'REJECTED' AND p.status <> 'COMPLETED' AND p.status <> 'CANCELLED' AND p.startDate <= :reqEndDate AND p.endDate >= :reqStartDate")
    List<Peminjaman> findOverlappingRange(@Param("reqStartDate") java.time.LocalDate reqStartDate,
            @Param("reqEndDate") java.time.LocalDate reqEndDate);

    // New query to sum active borrowed items (Approved/Taken) to reconstruct real
    // total
    @org.springframework.data.jpa.repository.Query("SELECT pd.item.id, SUM(pd.quantity) FROM PeminjamanDetail pd WHERE pd.peminjaman.status IN :statuses GROUP BY pd.item.id")
    List<Object[]> countBorrowedItems(@Param("statuses") List<PeminjamanStatus> statuses);
}
