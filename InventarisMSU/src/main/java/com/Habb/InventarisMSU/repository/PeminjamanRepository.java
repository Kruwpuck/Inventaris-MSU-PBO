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

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Peminjaman p WHERE p.startDate <= :endOfMonth AND p.endDate >= :startOfMonth")
    List<Peminjaman> findBookingsInDataRange(@Param("startOfMonth") java.time.LocalDate startOfMonth,
            @Param("endOfMonth") java.time.LocalDate endOfMonth);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Peminjaman p WHERE (p.startDate BETWEEN :start AND :end) OR (p.endDate BETWEEN :start AND :end) OR (p.startDate <= :start AND p.endDate >= :end)")
    List<Peminjaman> findOverlappingRange(@Param("start") java.time.LocalDate start,
            @Param("end") java.time.LocalDate end);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Peminjaman p LEFT JOIN FETCH p.details pd LEFT JOIN FETCH pd.item WHERE p.status <> 'REJECTED' AND p.status <> 'COMPLETED' AND p.status <> 'CANCELLED' AND :date >= p.startDate AND :date <= p.endDate")
    List<Peminjaman> findOverlappingBookings(@Param("date") java.time.LocalDate date);

    // New query to sum active borrowed items (Approved/Taken) to reconstruct real
    // total
    @org.springframework.data.jpa.repository.Query("SELECT pd.item.id, SUM(pd.quantity) FROM PeminjamanDetail pd WHERE pd.peminjaman.status IN :statuses GROUP BY pd.item.id")
    List<Object[]> countBorrowedItems(@Param("statuses") List<PeminjamanStatus> statuses);
}
