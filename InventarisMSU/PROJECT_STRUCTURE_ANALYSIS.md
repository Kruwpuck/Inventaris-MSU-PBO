# Analisis Struktur Project: Inventaris MSU (Peminjam/Guest)

Dokumen ini menjelaskan struktur kode program Inventaris MSU, berfokus pada alur pengguna **Peminjam (Guest)**, serta detail teknis mengenai **MVC**, **Object Database**, **Session Handling**, dan **Query Database**.

## 1. Konsep Role & Akses (Peminjam a.k.a Guest)

Dalam sistem ini, tidak ada role dedicated di database untuk "Peminjam". Peminjam adalah **Guest** (pengguna tanpa login).

*   **Identifikasi**: Dilakukan secara manual saat mengisi formulir peminjaman (input Nama, NIM/NIP, dll).
*   **Hak Akses**: Diatur dalam `SecurityConfig.java` menggunakan `.permitAll()` untuk path publik.
    *   **Bisa Mengakses**: Halaman Home (`/`), Katalog Barang (`/catalogue`), Katalog Ruangan (`/ruangan`), API Cart (`/api/cart/**`), dan Submit Form (`/api/peminjaman/**`).
    *   **Tidak Bisa Mengakses**: Dashboard Pengelola/Pengurus (`/pengelola/**`, `/pengurus/**`).

---

## 2. Struktur MVC (Model - View - Controller)

Pola arsitektur yang digunakan adalah standard Spring Boot MVC.

### A. Controller (Otak Aplikasi)
Menangani request HTTP dan menghubungkan logika bisnis dengan tampilan.

1.  **`HomeController.java`** (`/`)
    *   Mengatur navigasi halaman publik.
    *   Mengambil data untuk ditampilkan di halaman depan (misal: Top 4 barang).
2.  **`CartController.java`** (`/api/cart`) - *Detail di Bagian 4*
    *   REST API controller (mengembalikan JSON, bukan HTML).
    *   Mengelola keranjang belanja sementara menggunakan HttpSession.
3.  **`PeminjamanController.java`** (`/api/peminjaman`)
    *   Menangani POST request dari formulir peminjaman.
    *   Menerima data multipart (File surat + JSON data barang).
    *   Menyimpan transaksi ke database.

### B. View (Tampilan)
Menggunakan **Thymeleaf** template engine (HTML server-side rendering). Lokasi: `src/main/resources/templates/guest`.

*   `index.html`: Halaman Utama.
*   `barang.html`: Grid katalog barang.
*   `bookingbarang.html`: Formulir checkout.
*   `booking-ruang.html`: Formulir booking ruangan (jika terpisah).

### C. Model (Data)
Representasi objek data di java yang terhubung ke database (JPA Entities).

---

## 3. Object Class & Database Structure

Berikut adalah diagram relasi objek (Entity) yang menyusun database.

### Entity: `Peminjaman` (Table: `peminjaman`)
Ini adalah tabel "Header" transaksi. Satu record mewakili satu kali submission form pengajuan.

| Field Java | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Long (PK) | Auto Increment ID |
| `borrowerName` | String | Nama Peminjam (Manual Input) |
| `nimNip` | String | Identitas Unik Akun Luar |
| `email`, `phone` | String | Kontak Peminjam |
| `status` | Enum | `PENDING`, `APPROVED`, etc. |
| `submissionDate`| DateTime | Waktu submit |
| `documentPath` | String | Path file surat yang diupload |
| `details` | List | One-to-Many ke `PeminjamanDetail` |

### Entity: `PeminjamanDetail` (Table: `peminjaman_details`)
Tabel perantara (Junction/Line Item) yang menyimpan detail barang apa saja yang dipinjam dalam satu transaksi.

| Field Java | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Long (PK) | Auto Increment ID |
| `peminjaman` | Object | Foreign Key ke `Peminjaman` |
| `item` | Object | Foreign Key ke `Item` |
| `quantity` | Integer | Jumlah barang yang dipinjam |

### Entity: `Item` (Table: `item`)
Menyimpan master data barang/ruangan.

| Field Java | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | Long (PK) | Auto Increment ID |
| `name` | String | Nama Barang |
| `type` | Enum | `BARANG` atau `RUANGAN` |
| `stock` | Integer | Stok saat ini |

---

## 4. Deep Dive: Handling Session di Cart

Fitur keranjang ("Tas Peminjaman") bekerja tanpa database persisten. Data disimpan sementara di memori server yang terikat pada browser user (Session).

**Logic Flow (`CartController.java`):**

1.  **Dependency Injection**: Controller meminta `HttpSession` dari Spring.
2.  **Get Cart**:
    ```java
    List<CartItem> cart = (List<CartItem>) session.getAttribute("cart");
    if (cart == null) {
        cart = new ArrayList<>();
        session.setAttribute("cart", cart); // Simpan list kosong baru ke session
    }
    ```
3.  **Add to Cart (`/add`)**:
    *   Sistem mencari apakah item sudah ada di list session (berdasarkan ID atau Nama).
    *   **Jika Ada**: Update quantity (tambah jumlahnya).
    *   **Jika Baru**: `cart.add(newItem)`.
    *   **Simpan Kembali**: `session.setAttribute("cart", cart)` memastikan perubahan tersimpan.
4.  **Validasi Stok (Sinkronisasi)**:
    *   Saat user membuka keranjang (`@GetMapping`), server melakukan loop pada list session.
    *   Request ke DB: `itemRepository.findByName(...)` untuk cek stok *real-time*.
    *   Jika `request_qty > real_stock`, quantity di session dipaksa turun agar tidak melebihi stok.

---

## 5. Deep Dive: Query Database (Repository)

Aplikasi ini menggunakan **Spring Data JPA**, yang memungkinkan pembuatan query database hanya dengan menulis nama method interface.

### `ItemRepository.java`

1.  **`findTop4ByType(ItemType type)`**
    *   **SQL Equivalent**: `SELECT * FROM item WHERE type = ? LIMIT 4`
    *   **Fungsi**: Digunakan di `HomeController` untuk menampilkan 4 barang/ruangan unggulan di halaman depan.
    
2.  **`findByType(ItemType type)`**
    *   **SQL Equivalent**: `SELECT * FROM item WHERE type = ?`
    *   **Fungsi**: Mengambil *seluruh* daftar untuk halaman katalog.

3.  **`findByName(String name)`**
    *   **SQL Equivalent**: `SELECT * FROM item WHERE name = ?`
    *   **Fungsi**: Mencari barang spesifik saat proses Checkout atau validasi Cart.

### `PeminjamanRepository.java`

*   **`save(Peminjaman p)`**
    *   **SQL Equivalent**: `INSERT INTO peminjaman (...) VALUES (...)`
    *   **Fungsi**: Menyimpan data booking. Karena relasi `OneToMany` dengan `cascade = CascadeType.ALL` di set pada class `Peminjaman`, method ini **otomatis** menyimpan juga baris-baris ke tabel `peminjaman_details`.

---

## Kesimpulan Alur Data (End-to-End Peminjam)

1.  **User** membuka web -> `HomeController` load items (Query: `findTop4ByType`).
2.  **User** klik "Tambah Barang" -> `CartController` simpan ke RAM (`HttpSession`).
3.  **User** klik "Submit" di Form:
    *   Browser kirim JSON barang + File Surat.
    *   `PeminjamanController` terima request.
    *   Upload file surat ke folder server.
    *   Map JSON barang ke object `PeminjamanDetail`.
    *   Set status `PENDING`.
    *   `peminjamanRepository.save()` -> Tulis ke DB (Tabel `peminjaman` + `peminjaman_details`).
