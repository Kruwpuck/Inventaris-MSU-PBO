# 📘 Dokumentasi Teknis Backend - Inventaris MSU

Dokumen ini disusun sebagai laporan teknis mendalam mengenai implementasi backend sistem Inventaris MSU, mencakup arsitektur kode, keamanan, efisiensi database, dan kualitas kode yang selaras dengan standar industri.

---

## 1. Implementasi Fungsionalitas Utama

### ✅ Fitur Utama Berfungsi dengan Baik
Backend telah berhasil mengimplementasikan seluruh alur bisnis utama aplikasi peminjaman aset masjid:
*   **Peminjaman Publik (Guest)**: Pengguna dapat mengecek stok *real-time*, menambahkan item ke cart, dan mengajukan peminjaman dengan upload dokumen.
*   **Manajemen Peminjaman (Pengelola)**: Admin dapat memvalidasi (Approve/Reject) permohonan yang masuk dengan notifikasi email otomatis.
*   **Serah Terima (Pengurus)**: Petugas lapangan memiliki akses khusus untuk checklist pengambilan dan pengembalian barang.
*   **Laporan**: Sistem mencatat waktu fisik pengambilan (`pickedUpAt`) dan pengembalian (`returnedAt`) secara akurat.

### 🧩 Kode Modular & Clean Code (OOP)
Aplikasi dibangun di atas framework **Spring Boot 3** dengan menerapkan prinsip **Object-Oriented Programming (OOP)** dan **MVC (Model-View-Controller)** yang ketat:

*   **Pemisahan Tanggung Jawab (Separation of Concerns)**:
    *   **Model** (`com.Habb.InventarisMSU.model`): Hanya bertanggung jawab atas struktur data entity (POJO) dan relasi JPA (OneToMany, OneToOne).
    *   **Repository** (`com.Habb.InventarisMSU.repository`): Layer abstraksi akses data (DAO) menggunakan Spring Data JPA. Tidak ada query SQL di dalam Controller.
    *   **Service** (`com.Habb.InventarisMSU.service`): Berisi logika bisnis kompleks (misal: validasi stok overlapping di `GuestBookingService`).
    *   **Controller** (`com.Habb.InventarisMSU.controller`): Hanya menangani request HTTP, validasi input dasar, dan routing response.

---

## 2. Penggunaan Teknologi Backend

### 🛠️ Framework & Teknologi
*   **Core**: Java 17 + Spring Boot 3.5.7
*   **Build Tool**: Maven
*   **Security**: Spring Security 6 (BCrypt, Role-Based Access Control)
*   **Database**: MySQL 8.0 (via Docker)
*   **Template Engine**: Thymeleaf (Server-Side Rendering)
*   **Mail Service**: Mailtrap

---

## 3. Integrasi dengan Database

### 💾 Operasi CRUD & Transaksi
Operasi database ditangani sepenuhnya oleh Hibernate/JPA:
*   **Transactional**: Method vital seperti `submitBooking` dan `updateStatus` dianotasi dengan `@Transactional` untuk menjamin atomisitas data (All-or-Nothing).

### 🔒 Query Aman & Efisien (SQL Injection Protection)
Keamanan database menjadi prioritas utama. Aplikasi ini **KEBAL** terhadap SQL Injection berkat:
1.  **Prepared Statements**: Derived Query Method (seperti `findByStatus`) otomatis dikompilasi menjadi prepared statements oleh Hibernate.
2.  **Named Parameters**: Query kustom menggunakan parameter binding (`:paramName`) sehingga input user tidak pernah dieksekusi sebagai perintah SQL.
    *   *Kode*: `PeminjamanRepository.java`
    *   `@Query("SELECT p FROM Peminjaman p WHERE p.startDate <= :endOfMonth ...")`

---

## 4. Handling Error dan Keamanan

### 🛡️ Aspek Keamanan (Security)
Penerapan standar keamanan modern:
1.  **Authentication**: Menggunakan `DaoAuthenticationProvider` dengan UserDetailsService kustom yang memuat user dari database.
2.  **Authorization (Role-Based)**: Hak akses dipisahkan secara tegas di `SecurityConfig`:
    *   `/pengelola/**` -> Role **PENGELOLA**
    *   `/pengurus/**` -> Role **PENGURUS**
    *   `/api/**` -> **PermitAll** (Public)
3.  **Hashing Password**: Password disimpan dalam format hash **BCrypt** (`$2a$10$...`) yang dilengkapi salt otomatis. Password teks biasa tidak pernah disimpan.
4.  **XSS Protection**: Output data ke HTML otomatis di-escape oleh Thymeleaf untuk mencegah Cross-Site Scripting.

### ⚠️ Error Handling & Logging
*   **Graceful Degradation**: Controller API menggunakan blok `try-catch` (contoh: `PeminjamanController`) untuk menangkap exception runtime dan mengembalikan pesan error JSON yang ramah (`500 Internal Server Error`) daripada stacktrace mentah.
*   **Logging**: Menggunakan SLF4J/Logback bawaan Spring Boot untuk mencatat aktivitas penting ke konsol server.

---

## 5. Kualitas Dokumentasi
Dokumentasi ini mencerminkan struktur kode yang rapi. Untuk detail spesifikasi setiap endpoint (Request/Response), silakan lihat dokumen **[4-API-DOCUMENTATION.md](./4-API-DOCUMENTATION.md)**.
