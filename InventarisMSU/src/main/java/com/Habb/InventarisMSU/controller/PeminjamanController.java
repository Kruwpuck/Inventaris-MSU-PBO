package com.Habb.InventarisMSU.controller;

import com.Habb.InventarisMSU.dto.CartItem;
import com.Habb.InventarisMSU.model.Item;
import com.Habb.InventarisMSU.model.Peminjaman;
import com.Habb.InventarisMSU.model.PeminjamanDetail;
import com.Habb.InventarisMSU.model.PeminjamanStatus;
import com.Habb.InventarisMSU.repository.ItemRepository;
import com.Habb.InventarisMSU.repository.PeminjamanDetailRepository;
import com.Habb.InventarisMSU.repository.PeminjamanRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/peminjaman")
public class PeminjamanController {

    private final PeminjamanRepository peminjamanRepository;
    private final ItemRepository itemRepository;
    private final PeminjamanDetailRepository peminjamanDetailRepository;
    private final ObjectMapper objectMapper;

    // Separate repository needed for details? Yes if not cascading properly,
    // but Peminjaman has cascade=ALL. So saving Peminjaman should save details
    // IF we add them to the list.
    // However, PeminjamanDetailRepository might not exist yet?
    // Check Step 265: It exists? No, list_dir only showed models.
    // Step 277 summary said I checked repos? No I checked PeminjamanRepository.
    // I didn't check PeminjamanDetailRepository. I will assume Cascade works or
    // create repo later if needed.
    // Actually, good practice is to save via Cascade.

    public PeminjamanController(PeminjamanRepository peminjamanRepository, ItemRepository itemRepository,
            ObjectMapper objectMapper) {
        this.peminjamanRepository = peminjamanRepository;
        this.itemRepository = itemRepository;
        this.objectMapper = objectMapper;
        this.peminjamanDetailRepository = null; // cascade approach
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitBooking(
            @RequestParam("borrowerName") String borrowerName,
            @RequestParam("email") String email,
            @RequestParam("phone") String phone,
            @RequestParam("nimNip") String nimNip,
            @RequestParam("department") String department,
            @RequestParam("reason") String reason,
            @RequestParam("description") String description,
            @RequestParam("location") String location,
            @RequestParam("startDate") String startDateStr,
            @RequestParam("startTime") String startTimeStr,
            @RequestParam("endDate") String endDateStr,
            @RequestParam("endTime") String endTimeStr,
            @RequestParam("duration") Integer duration,
            @RequestParam("items") String itemsJson,
            @RequestParam("file") MultipartFile file,
            @RequestParam("identityFile") MultipartFile identityFile,
            @RequestParam(value = "session", required = false) String session) {
        try {
            Path uploadDir = Paths.get("uploads");
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
            p.setBorrowerName(borrowerName);
            p.setEmail(email);
            p.setPhone(phone);
            p.setNimNip(nimNip);
            p.setDepartment(department);
            p.setReason(reason);
            p.setDescription(description);
            p.setLocation(location);

            // If session is not provided, try to extract from description or leave null
            if (session == null) {
                session = String.format("%s %s -> %s %s", startDateStr, startTimeStr, endDateStr, endTimeStr);
            }
            p.setSession(session);

            p.setStartDate(LocalDate.parse(startDateStr));
            p.setStartTime(java.time.LocalTime.parse(startTimeStr));
            p.setEndDate(LocalDate.parse(endDateStr));
            p.setEndTime(java.time.LocalTime.parse(endTimeStr));

            p.setDocumentPath(filePath.toString());
            p.setIdentityCardPath(identityFilePath.toString());
            p.setStatus(PeminjamanStatus.PENDING);

            p.setDuration(duration);

            // 4. Parse Items & Create Details
            List<CartItem> cartItems = objectMapper.readValue(itemsJson, new TypeReference<List<CartItem>>() {
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

            return ResponseEntity.ok().body("{\"message\": \"Booking berhasil disimpan\"}");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error saving booking: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<PublicBookingDTO>> getBookings(
            @RequestParam(value = "date", required = false) String dateStr) {
        List<Peminjaman> list;
        if (dateStr != null && !dateStr.isEmpty()) {
            LocalDate date = LocalDate.parse(dateStr);
            list = peminjamanRepository.findByStartDate(date);
        } else {
            // If no date, maybe return nothing or today's?
            // For security/performance, let's require date or return empty
            return ResponseEntity.ok(List.of());
        }

        List<PublicBookingDTO> dtos = new ArrayList<>();
        for (Peminjaman p : list) {
            if (p.getStatus() == PeminjamanStatus.REJECTED)
                continue;

            PublicBookingDTO dto = new PublicBookingDTO();
            dto.setId(p.getId());
            dto.setBorrowerName(maskName(p.getBorrowerName()));
            dto.setDepartment(p.getDepartment());
            dto.setDescription(p.getDescription()); // Contains session info
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
        return ResponseEntity.ok(dtos);
    }

    private String maskName(String name) {
        if (name == null || name.length() < 2)
            return name;
        return name.substring(0, 1) + "***";
    }

    // Inner DTO
    public static class PublicBookingDTO {
        private Long id;
        // ... (existing fields)
        private String borrowerName;
        private String department;
        private String description;
        private String status;
        private String startDate;
        private List<String> items;

        // Getters Setters
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

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getStartDate() {
            return startDate;
        }

        public void setStartDate(String startDate) {
            this.startDate = startDate;
        }

        public List<String> getItems() {
            return items;
        }

        public void setItems(List<String> items) {
            this.items = items;
        }
    }

    private boolean isTimeOverlapping(java.time.LocalDateTime reqStart, java.time.LocalDateTime reqEnd, Peminjaman p) {
        java.time.LocalDateTime pStart;
        java.time.LocalDateTime pEnd;

        if (p.getStartTime() != null && p.getEndTime() != null) {
            pStart = p.getStartDate().atTime(p.getStartTime());
            pEnd = p.getEndDate().atTime(p.getEndTime());
        } else {
            // Legacy fallback: Assume full day active if exact time not present
            pStart = p.getStartDate().atTime(6, 0);
            pEnd = p.getEndDate().atTime(20, 0);
        }

        return reqStart.isBefore(pEnd) && reqEnd.isAfter(pStart);
    }

    private boolean isOverlapping(String s1, String s2) {
        if (s1 == null || s2 == null)
            return true; // Safety: if unknown, assume overlap
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();

        // Define scopes
        // Scope 1: Morning (06-12)
        // Scope 2: Afternoon (12-18)
        // Scope 3: Evening (18-20)

        // s1 scopes
        boolean[] scopes1 = getScopes(s1);
        boolean[] scopes2 = getScopes(s2);

        for (int i = 0; i < 3; i++) {
            if (scopes1[i] && scopes2[i])
                return true;
        }
        return false;
    }

    private boolean[] getScopes(String s) {
        // [morn, noon, eve]
        boolean[] r = { false, false, false };

        if (s.contains("seharian")) {
            r[0] = true;
            r[1] = true;
            r[2] = true;
        } else if (s.contains("pagisiang")) {
            r[0] = true;
            r[1] = true;
        } else if (s.contains("siangmalam")) {
            r[1] = true;
            r[2] = true;
        } else if (s.contains("pagi")) {
            r[0] = true;
        } else if (s.contains("siang")) {
            r[1] = true;
        } else if (s.contains("malam")) {
            r[2] = true;
        }

        return r;
    }

    @GetMapping("/check")
    public ResponseEntity<List<AvailabilityDTO>> checkAvailability(
            @RequestParam("startDate") String startDateStr,
            @RequestParam("startTime") String startTimeStr,
            @RequestParam("endDate") String endDateStr,
            @RequestParam("endTime") String endTimeStr) {

        LocalDate reqStartDate = LocalDate.parse(startDateStr);
        LocalDate reqEndDate = LocalDate.parse(endDateStr);
        java.time.LocalDateTime reqStart = reqStartDate.atTime(java.time.LocalTime.parse(startTimeStr));
        java.time.LocalDateTime reqEnd = reqEndDate.atTime(java.time.LocalTime.parse(endTimeStr));

        List<Item> allItems = itemRepository.findAll();

        // 1. Calculate 'Total Real Stock' (Asset Count) using Aggregate Query
        // NO LONGER NEEDED: item.getStock() should represent the TOTAL asset count.
        // We do NOT add borrowed items to it.
        // List<PeminjamanStatus> activeStatuses =
        // Arrays.asList(PeminjamanStatus.APPROVED, PeminjamanStatus.TAKEN,
        // PeminjamanStatus.PENDING);
        // List<Object[]> borrowedCountsList =
        // peminjamanRepository.countBorrowedItems(activeStatuses);

        // java.util.Map<Long, Integer> borrowedCounts = new java.util.HashMap<>();
        // for (Object[] row : borrowedCountsList) {
        // Long itemId = (Long) row[0];
        // Long qty = (Long) row[1]; // SUM returns Long in JPQL
        // borrowedCounts.put(itemId, qty.intValue());
        // }

        // 2. Find overlapping bookings (Date Range Overlap)
        List<Peminjaman> overlapping = peminjamanRepository.findOverlappingRange(reqStartDate, reqEndDate);

        List<AvailabilityDTO> result = new ArrayList<>();

        for (Item item : allItems) {
            int currentDbStock = item.getStock();
            // Total Asset Stock is simply what's in the DB (Total Inventory)
            int totalAssetStock = currentDbStock;

            int projectedStock = totalAssetStock;

            // Deduct usage by overlapping bookings
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

        return ResponseEntity.ok(result);
    }

    public static class AvailabilityDTO {
        public Long itemId;
        public String itemName;
        public int available; // Sisa

        public AvailabilityDTO(Long id, String name, int av) {
            this.itemId = id;
            this.itemName = name;
            this.available = av;
        }
    }
}
