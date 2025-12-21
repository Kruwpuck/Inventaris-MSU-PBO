# Dokumentasi Lengkap Inventaris MSU (Full Guided)

Dokumen ini merupakan panduan teknis komprehensif yang mencakup **Cara Deployment**, **Alur Sistem (Website Logic)**, dan **Struktur Backend** dengan detail referensi kode (File & Baris).

---

## BAGIAN 1: CARA DEPLOYMENT (DOCKER)

Langkah-langkah untuk menjalankan aplikasi dari nol menggunakan Docker Compose.

### 1. Persiapan
Pastikan **Docker Desktop** atau **Docker Engine** sudah aktif.
Clone repository:
```bash
git clone https://github.com/Kruwpuck/Inventaris-MSU-PBO.git
cd Inventaris-MSU-PBO/InventarisMSU
```

### 2. Jalankan Aplikasi
Aplikasi menggunakan **Docker Compose** yang mendefinisikan 4 container (App, DB, PhpMyAdmin, Nginx).
**File Referensi**: `compose.yaml`

Jalankan perintah ini di terminal:
```bash
docker compose up -d --build
```
*   `--build`: Membuild ulang file `.jar` dan image docker jika ada perubahan kode.

### 3. Akses
*   **Web Utama**: [http://localhost](http://localhost) (via Nginx Port 80)
*   **Database GUI**: [http://localhost:8081](http://localhost:8081) (PhpMyAdmin)

---

## BAGIAN 2: ALUR WEBSITE & LOGIKA KODE (CODE MAPPING)

Bagian ini menjelaskan setiap langkah interaksi pengguna dan kode backend/frontend yang mengeksekusinya.

### A. Pengecekan Stok & Cart (Guest)

**1. Cek Ketersediaan Stok Real-time**
Saat user memilih tanggal di halaman katalog, sistem mengecek stok yang tersedia di database.
*   **User Action**: Input Tanggal Mulai/Selesai -> Klik "Cek".
*   **Frontend Logic**:
    *   **File**: `src/main/resources/static/assets/guest/main.js`
    *   **Fungsi**: `window.checkRealTimeStock` (Line 80).
    *   **Proses**: Mengirim request fetch ke `/api/peminjaman/check`.
*   **Backend Logic**:
    *   **File**: `com.Habb.InventarisMSU.service.GuestBookingService.java`
    *   **Method**: `checkAvailability` (Line 263).
    *   **Logika Kritis** (Line 280): Stok hanya berkurang jika ada peminjaman lain dengan status **APPROVED** atau **TAKEN**. Status *PENDING* tidak mengurangi stok.

**2. Menambah Item ke Keranjang (Add to Cart)**
*   **User Action**: Klik tombol `+` pada item.
*   **Frontend Logic**:
    *   **File**: `src/main/resources/static/assets/guest/cart.js`
    *   **Fungsi**: `add(name, type, ...)` (Line 56).
    *   **Proses**: Menyimpan item ke `localStorage` browser dan sinkronisasi ke server jika perlu.

---

### B. Proses Peminjaman (Guest Submit)

**1. Mengisi Form & Upload File**
*   **User Action**: Mengisi form di `/form`, upload KTM dan surat. Klik "Kirim".
*   **Backend Logic**:
    *   **Controller**: `com.Habb.InventarisMSU.controller.PeminjamanController` (Line 24 `submitBooking`).
    *   **Service**: `com.Habb.InventarisMSU.service.GuestBookingService.java`
    *   **Method**: `submitBooking` (Line 36).
        *   **Langkah 1 (Line 41-49)**: File KTM dan Surat disimpan ke folder `uploads/`.
        *   **Langkah 2 (Line 52-77)**: Data peminjam (Nama, NIM, dll) diset ke objek `Peminjaman`. Status awal diset ke **PENDING** (Line 76).
        *   **Langkah 3 (Line 97)**: Data disimpan ke database (`peminjamanRepository.save`).
        *   **Langkah 4 (Line 100)**: Mengirim email konfirmasi (`sendBookingConfirmationEmail`).

---

### C. Persetujuan (Role: Pengelola)

**1. Validasi Permohonan**
Pengelola login dan membuka menu daftar permohonan.
*   **User Action**: Klik "Approve" atau "Reject".
*   **Backend Logic**:
    *   **File**: `com.Habb.InventarisMSU.service.PeminjamanService.java`
    *   **Method**: `updateStatus` (Line 46).
    *   **Logika Approval (Line 67)**: Jika disetujui, email konfirmasi dikirim (`sendApprovalEmail`). Stok barang otomatis terkunci karena status berubah jadi APPROVED.
    *   **Logika Rejection (Line 69)**: Jika ditolak, wajib menyertakan alasan (`reason`). Email penolakan dikirim (`sendRejectionEmail`).

---

### D. Serah Terima (Role: Pengurus)

Setelah di-approve, barang berpindah tangan di lapangan. Ini ranah **Pengurus**.

**1. Penyerahan Barang (Checklist Ambil)**
*   **Tampilan**: `src/main/resources/templates/pengurus/pinjamFasilitas.html`
*   **User Action**: Pengurus mencentang checkbox "Sudah Ambil".
*   **Backend Logic**:
    *   **Controller**: `com.Habb.InventarisMSU.controller.PengurusController`
    *   **Method**: `updateStatus` (Line 62).
    *   **Proses**: Menerima request POST dengan action `TAKEN`. Mencatat waktu pengambilan (`pickedUpAt`) di tabel `Laporan` (Line 83).

**2. Pengembalian Barang (Checklist Kembali - Penyelesaian)**
*   **User Action**: Pengurus mencentang checkbox "Sudah Kembali".
*   **Backend Logic**:
    *   **Controller**: `PengurusController` (Line 62).
    *   **Logika (Line 87)**: Status diubah menjadi `RETURNED`. Sistem mencatat waktu kembali (`returnedAt`).
    *   **Penyelesaian**: Jika tidak terlambat, transaksi dianggap selesai (COMPLETED) atau perlu submit manual di halaman Riwayat untuk finalisasi.

---

## BAGIAN 3: DETAIL TEKNIS & KEAMANAN

### 1. Struktur Database & Model
Lokasi: `com.Habb.InventarisMSU.model`
*   **Peminjaman**: Tabel utama transaksi.
*   **PeminjamanDetail**: Tabel relasi many-to-many (Satu peminjaman bisa banyak barang).
*   **Laporan**: Tabel log untuk mencatat waktu fisik pengambilan dan pengembalian.

### 2. Keamanan (Security Analysis)

**A. SQL Injection**
Aplikasi menggunakan **JPA Repository** yang aman secara default.
*   **Named Parameters**: Pada `PeminjamanRepository.java` (Line 16), query custom menggunakan parameter binding `:startOfMonth`.
    ```java
    @Query("SELECT p ... WHERE p.startDate <= :endOfMonth")
    ```
    Ini mencegah injeksi karena input user dikirim sebagai data terpisah ke database, bukan string SQL.

**B. XSS (Cross Site Scripting)**
*   Frontend menggunakan **Thymeleaf**. Semua output variabel (`th:text`) otomatis di-*escape*. Script berbahaya `<script>` akan dirender aman menjadi teks biasa `&lt;script&gt;`.

**C. Authentication & Password**
*   **File**: `com.Habb.InventarisMSU.config.SecurityConfig.java`
*   **Hashing**: Password user dihash menggunakan **BCrypt** (Line 68). Ini menjamin jika database bocor, password asli user tetap aman.
*   **Roles**: Akses endpoint dibatasi berdasarkan Role (`hasRole("PENGELOLA")`) pada Line 36.

### 3. Error Handling
Setiap controller dilindungi blok `try-catch`.
*   Contoh: `PengurusController.java` (Line 112). Jika terjadi error saat update status, sistem menangkap exception dan mengirim pesan error yang terbaca manusia ("Error: ... Hubungi admin") tanpa mematikan server.
