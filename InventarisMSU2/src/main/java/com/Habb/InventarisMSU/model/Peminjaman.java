package com.Habb.InventarisMSU.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "peminjaman")
public class Peminjaman {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String borrowerName;
    private String email;
    private String phone;
    private String reason;
    private String nimNip;
    private String department;
    private String description;
    private String documentPath;
    private Integer duration;

    private LocalDate startDate;
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private PeminjamanStatus status;

    private LocalDateTime submissionDate;

    private boolean handedOver;
    private boolean returned;

    @OneToMany(mappedBy = "peminjaman", cascade = CascadeType.ALL)
    private List<PeminjamanDetail> details;

    @PrePersist
    protected void onCreate() {
        submissionDate = LocalDateTime.now();
        if (status == null) {
            status = PeminjamanStatus.PENDING;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBorrowerName() {
        return borrowerName;
    }

    public void setBorrowerName(String borrowerName) {
        this.borrowerName = borrowerName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getNimNip() {
        return nimNip;
    }

    public void setNimNip(String nimNip) {
        this.nimNip = nimNip;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDocumentPath() {
        return documentPath;
    }

    public void setDocumentPath(String documentPath) {
        this.documentPath = documentPath;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public PeminjamanStatus getStatus() {
        return status;
    }

    public void setStatus(PeminjamanStatus status) {
        this.status = status;
    }

    public LocalDateTime getSubmissionDate() {
        return submissionDate;
    }

    public void setSubmissionDate(LocalDateTime submissionDate) {
        this.submissionDate = submissionDate;
    }

    public boolean isHandedOver() {
        return handedOver;
    }

    public void setHandedOver(boolean handedOver) {
        this.handedOver = handedOver;
    }

    public boolean isReturned() {
        return returned;
    }

    public void setReturned(boolean returned) {
        this.returned = returned;
    }

    public List<PeminjamanDetail> getDetails() {
        return details;
    }

    public void setDetails(List<PeminjamanDetail> details) {
        this.details = details;
    }
}
