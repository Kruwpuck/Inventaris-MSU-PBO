package com.Habb.InventarisMSU.service;

import com.Habb.InventarisMSU.dto.*;
import com.Habb.InventarisMSU.model.*;
import com.Habb.InventarisMSU.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GuestBookingService {

    private final PeminjamanRepository peminjamanRepository;
    private final ItemRepository itemRepository;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;
    private static final String UPLOAD_DIR = "uploads";

    public GuestBookingService(PeminjamanRepository peminjamanRepository, ItemRepository itemRepository,
            ObjectMapper objectMapper, EmailService emailService) {
        this.peminjamanRepository = peminjamanRepository;
        this.itemRepository = itemRepository;
        this.objectMapper = objectMapper;
        this.emailService = emailService;
    }

    @Transactional
    public void submitBooking(BookingRequestDTO req, MultipartFile file, MultipartFile identityFile) throws Exception {
        Path uploadDir = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadDir))
            Files.createDirectories(uploadDir);

        // 1. Save Proposal File
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = uploadDir.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        // 2. Save Identity File
        String identityFileName = UUID.randomUUID().toString() + "_" + identityFile.getOriginalFilename();
        Path identityFilePath = uploadDir.resolve(identityFileName);
        Files.copy(identityFile.getInputStream(), identityFilePath);

        // 3. Create Peminjaman
        Peminjaman p = new Peminjaman();
        p.setBorrowerName(req.getBorrowerName());
        p.setEmail(req.getEmail());
        p.setPhone(req.getPhone());
        p.setNimNip(req.getNimNip());
        p.setDepartment(req.getDepartment());
        p.setReason(req.getReason());
        p.setDescription(req.getDescription());
        p.setLocation(req.getLocation());

        String session = req.getSession();
        if (session == null) {
            session = String.format("%s %s -> %s %s", req.getStartDate(), req.getStartTime(), req.getEndDate(),
                    req.getEndTime());
        }
        p.setSession(session);

        p.setStartDate(LocalDate.parse(req.getStartDate()));
        p.setStartTime(java.time.LocalTime.parse(req.getStartTime()));
        p.setEndDate(LocalDate.parse(req.getEndDate()));
        p.setEndTime(java.time.LocalTime.parse(req.getEndTime()));

        p.setDocumentPath(filePath.toString());
        p.setIdentityCardPath(identityFilePath.toString());
        p.setStatus(PeminjamanStatus.PENDING);
        p.setDuration(req.getDuration());

        // 4. Parse Items & Create Details
        List<CartItem> cartItems = objectMapper.readValue(req.getItemsJson(), new TypeReference<List<CartItem>>() {
        });
        List<PeminjamanDetail> details = new ArrayList<>();

        for (CartItem ci : cartItems) {
            Item item = itemRepository.findByName(ci.getName());
            if (item != null) {
                PeminjamanDetail pd = new PeminjamanDetail();
                pd.setPeminjaman(p);
                pd.setItem(item);
                pd.setQuantity(ci.getQuantity());
                details.add(pd);
            }
        }
        p.setDetails(details);

        // 5. Save
        peminjamanRepository.save(p);

        // 6. Send Email Notification
        sendBookingConfirmationEmail(p);
    }

    private void sendBookingConfirmationEmail(Peminjaman p) {
        String subject = "Konfirmasi Peminjaman Fasilitas - Masjid Syamsul Ulum";

        // Formatted dates/times for email
        String tanggalStr = p.getStartDate().toString(); // You might want to format this nicely
        String waktuStr = p.getStartTime() + " s/d " + p.getEndTime() + " WIB";

        String htmlBody = """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
                        .header { margin-bottom: 20px; }
                        .header img { max-height: 60px; float: left; margin-right: 15px; }
                        .header-text { overflow: hidden; }
                        .header-text h2 { margin: 0; color: #000; font-size: 18px; font-weight: bold; }
                        .header-text p { margin: 2px 0; font-size: 12px; color: #555; }
                        .divider { border-top: 3px solid #d32f2f; margin: 15px 0; }
                        .content { padding: 0 10px; }
                        .summary-box { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .summary-item { margin-bottom: 8px; display: flex; }
                        .label { font-weight: bold; width: 120px; }
                        .value { flex: 1; }
                        .footer { margin-top: 30px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <!-- Placeholder for Logo if needed, or just text -->
                        <div style="font-weight: bold; font-size: 20px; color: #004d40;">MASJID SYAMSUL ULUM</div>
                        <div style="font-size: 12px;">Jl. Telekomunikasi No.1, Bandung • Jawa Barat, Indonesia</div>
                        <div style="font-size: 12px;">Telp: +62 882-7982-9071 • Email: msu.telyu@gmail.com</div>
                    </div>

                    <div class="divider"></div>

                    <div class="content">
                        <p><strong>Halo, %s</strong></p>

                        <p>Terima kasih telah melakukan peminjaman fasilitas di Masjid Syamsul Ulum. Permohonan Anda telah kami terima dan saat ini sedang dalam proses peninjauan oleh pengelola.</p>

                        <p>Berikut adalah ringkasan permohonan Anda:</p>

                        <div class="summary-box">
                            <div class="summary-item">
                                <span class="label">Keperluan</span>
                                <span class="value">: %s</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">Tanggal</span>
                                <span class="value">: %s</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">Waktu</span>
                                <span class="value">: %s</span>
                            </div>
                            <div class="summary-item">
                                <span class="label">Status</span>
                                <span class="value" style="font-weight: bold;">: Menunggu Persetujuan</span>
                            </div>
                        </div>

                        <p>Kami akan memberitahukan status selanjutnya melalui email ini setelah permohonan Anda ditinjau.</p>

                        <p>Terima kasih atas perhatian dan kerjasamanya.</p>

                        <br>
                        <p>Salam hangat,<br><strong>Pengelola MSU</strong></p>
                    </div>

                    <div class="footer">
                        &copy; 2025 Masjid Syamsul Ulum Telkom University. All rights reserved.<br>
                        Email ini dibuat secara otomatis, mohon tidak membalas email ini.
                    </div>
                </body>
                </html>
                """
                .formatted(p.getBorrowerName(), p.getReason(), tanggalStr, waktuStr);

        emailService.sendHtmlMessage(p.getEmail(), subject, htmlBody);
    }

    public List<PublicBookingDTO> getPublicBookings(String dateStr) {
        List<Peminjaman> list;
        if (dateStr != null && !dateStr.isEmpty()) {
            LocalDate date = LocalDate.parse(dateStr);
            list = peminjamanRepository.findByStartDate(date);
        } else {
            return Collections.emptyList();
        }

        List<PublicBookingDTO> dtos = new ArrayList<>();
        for (Peminjaman p : list) {
            if (p.getStatus() == PeminjamanStatus.REJECTED)
                continue;

            PublicBookingDTO dto = new PublicBookingDTO();
            dto.setId(p.getId());
            dto.setBorrowerName(maskName(p.getBorrowerName()));
            dto.setDepartment(p.getDepartment());
            dto.setDescription(p.getDescription());
            dto.setStatus(p.getStatus().name());
            dto.setStartDate(p.getStartDate().toString());

            List<String> itemSummaries = new ArrayList<>();
            if (p.getDetails() != null) {
                for (PeminjamanDetail pd : p.getDetails()) {
                    itemSummaries.add(pd.getItem().getName() + " (" + pd.getQuantity() + ")");
                }
            }
            dto.setItems(itemSummaries);
            dtos.add(dto);
        }
        return dtos;
    }

    public List<Integer> getBookedDays(String itemName, int year, int month) {
        // Assume month is 1-based from Controller or adjusted there.
        // Logic: Controller receives 1-based or 0-based.
        // Previously: I saw user query about month.
        // Let's assume input is 1-based (Jan=1).

        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.withDayOfMonth(startOfMonth.lengthOfMonth());

        List<Peminjaman> list = peminjamanRepository.findBookingsInDataRange(startOfMonth, endOfMonth);
        Set<Integer> days = new HashSet<>();

        for (Peminjaman p : list) {
            if (p.getStatus() == PeminjamanStatus.REJECTED)
                continue;

            boolean match = false;
            if (p.getDetails() != null) {
                for (PeminjamanDetail pd : p.getDetails()) {
                    if (pd.getItem().getName().toLowerCase().contains(itemName.toLowerCase())) {
                        match = true;
                        break;
                    }
                }
            }

            if (match) {
                LocalDate s = p.getStartDate();
                LocalDate e = p.getEndDate();

                if (s.isBefore(startOfMonth))
                    s = startOfMonth;
                if (e.isAfter(endOfMonth))
                    e = endOfMonth;

                for (LocalDate d = s; !d.isAfter(e); d = d.plusDays(1)) {
                    days.add(d.getDayOfMonth());
                }
            }
        }
        return new ArrayList<>(days);
    }

    public List<AvailabilityDTO> checkAvailability(String startDateStr, String startTimeStr, String endDateStr,
            String endTimeStr) {
        LocalDate reqStartDate = LocalDate.parse(startDateStr);
        LocalDate reqEndDate = LocalDate.parse(endDateStr);
        java.time.LocalDateTime reqStart = reqStartDate.atTime(java.time.LocalTime.parse(startTimeStr));
        java.time.LocalDateTime reqEnd = reqEndDate.atTime(java.time.LocalTime.parse(endTimeStr));

        List<Item> allItems = itemRepository.findAll();
        List<Peminjaman> overlapping = peminjamanRepository.findOverlappingRange(reqStartDate, reqEndDate);
        List<AvailabilityDTO> result = new ArrayList<>();

        for (Item item : allItems) {
            int currentDbStock = item.getStock();
            int projectedStock = currentDbStock;

            for (Peminjaman p : overlapping) {
                if (isTimeOverlapping(reqStart, reqEnd, p)) {
                    if (p.getDetails() != null) {
                        for (PeminjamanDetail pd : p.getDetails()) {
                            if (pd.getItem().getId().equals(item.getId())) {
                                projectedStock -= pd.getQuantity();
                            }
                        }
                    }
                }
            }
            if (projectedStock < 0)
                projectedStock = 0;
            result.add(new AvailabilityDTO(item.getId(), item.getName(), projectedStock));
        }
        return result;
    }

    private String maskName(String name) {
        if (name == null || name.length() < 2)
            return name;
        return name.substring(0, 1) + "***";
    }

    private boolean isTimeOverlapping(java.time.LocalDateTime reqStart, java.time.LocalDateTime reqEnd, Peminjaman p) {
        java.time.LocalDateTime pStart;
        java.time.LocalDateTime pEnd;

        if (p.getStartTime() != null && p.getEndTime() != null) {
            pStart = p.getStartDate().atTime(p.getStartTime());
            pEnd = p.getEndDate().atTime(p.getEndTime());
        } else {
            pStart = p.getStartDate().atTime(6, 0);
            pEnd = p.getEndDate().atTime(22, 0);
        }
        return reqStart.isBefore(pEnd) && reqEnd.isAfter(pStart);
    }
}
