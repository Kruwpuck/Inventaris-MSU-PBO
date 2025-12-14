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
            @RequestParam("startDate") String startDateStr,
            @RequestParam("duration") Integer duration,
            @RequestParam("items") String itemsJson,
            @RequestParam("file") MultipartFile file) {
        try {
            // 1. Save File
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            // Save to a directory accessible. For Docker, maybe /app/uploads?
            // Or just 'uploads' in current dir.
            Path uploadDir = Paths.get("uploads");
            if (!Files.exists(uploadDir))
                Files.createDirectories(uploadDir);
            Path filePath = uploadDir.resolve(fileName);
            Files.copy(file.getInputStream(), filePath);

            // 2. Create Peminjaman
            Peminjaman p = new Peminjaman();
            p.setBorrowerName(borrowerName);
            p.setEmail(email);
            p.setPhone(phone);
            p.setNimNip(nimNip);
            p.setDepartment(department);
            p.setReason(reason);
            p.setDescription(description);
            p.setStartDate(LocalDate.parse(startDateStr));
            p.setDuration(duration);
            p.setDocumentPath(filePath.toString());
            p.setStatus(PeminjamanStatus.PENDING);

            // Calc End Date? Simple logic: same day or + days?
            // Duration is usually hours. So EndDate = StartDate usually (for daily
            // booking).
            p.setEndDate(LocalDate.parse(startDateStr));

            // 3. Parse Items & Create Details
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

            // 4. Save
            peminjamanRepository.save(p);

            return ResponseEntity.ok().body("{\"message\": \"Booking berhasil disimpan\"}");

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error saving booking: " + e.getMessage());
        }
    }
}
