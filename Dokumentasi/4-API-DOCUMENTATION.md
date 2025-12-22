# 📡 Dokumentasi API Lengkap - Inventaris MSU

Dokumen ini berisi spesifikasi teknis lengkap untuk setiap endpoint API, mencakup URL, method HTTP, format Request, format Response, dan lokasi kode implementasi di backend.

---

## 📦 Peminjaman Pubik (Guest Endpoints)

Endpoint ini digunakan oleh halaman publik (frontend guest) untuk mengecek stok dan mengajukan peminjaman.

### 1. Cek Ketersediaan Stok (Real-time)
Mengecek sisa stok setiap barang berdasarkan rentang tanggal yang dipilih.

*   **URL**: `/api/peminjaman/check`
*   **Method**: `GET`
*   **Access**: Public (No Auth)
*   **Implementasi**: Method `checkAvailability()` di `PeminjamanController.java`

**Request Param:**
*   `startDate` (YYYY-MM-DD): Tanggal mulai
*   `startTime` (HH:mm): Jam mulai
*   `endDate` (YYYY-MM-DD): Tanggal selesai
*   `endTime` (HH:mm): Jam selesai

**Response Sukses (200 OK):**
```json
[
    {
        "itemId": 1,
        "itemName": "Kursi Lipat",
        "available": 45 // Sisa stok setelah dikurangi yang approved/taken
    },
    {
        "itemId": 2,
        "itemName": "Sound System",
        "available": 0 // Habis
    }
]
```

### 2. Submit Peminjaman (Booking)
Mengirim formulir peminjaman beserta file upload.

*   **URL**: `/api/peminjaman`
*   **Method**: `POST` (Multipart/Form-Data)
*   **Access**: Public (No Auth)
*   **Implementasi**: Method `submitBooking()` di `PeminjamanController.java`

**Request Body (Form Data):**
*   `borrowerName`: String
*   `email`: String
*   `phone`: String
*   `items`: JSON String (contoh: `[{"name":"Kursi","quantity":5}]`)
*   `file`: File (PDF/Image) - Surat Peminjaman
*   `identityFile`: File (PDF/Image) - KTP/KTM
*   `startDate`, `startTime`, `endDate`, `endTime`: String

**Response Sukses (200 OK):**
```json
{
    "message": "Booking berhasil disimpan"
}
```

**Response Error (500 Server Error):**
```json
"Error saving booking: [Detail Error]"
```

---

## 🛒 Cart Endpoints (Keranjang Belanja)

Endpoint untuk mengelola state keranjang belanja sementara (Sesi).

### 1. Add to Cart
*   **URL**: `/api/cart/add`
*   **Method**: `POST`
*   **Implementasi**: `CartController.java`

**Request Body (JSON):**
```json
{
    "name": "Kursi Lipat",
    "type": "barang",
    "quantity": 5,
    "maxQty": 100
}
```

### 2. Get Cart
Mengambil isi keranjang saat ini (disinkronkan dengan stok DB).
*   **URL**: `/api/cart`
*   **Method**: `GET`

---

## 🔐 Pengelola & Pengurus (Web Views & Actions)

Endpoint ini mengembalikan halaman HTML (Thymeleaf) atau melakukan redirect, bukan JSON murni.

### 1. Update Status (Approval/Rejection)
*   **User**: Pengelola (Admin)
*   **URL**: `/pengelola/approval/update`
*   **Method**: `POST`
*   **Auth**: Role `PENGELOLA`

**Request Param:**
*   `id`: ID Peminjaman
*   `action`: `APPROVED` atau `REJECTED`
*   `reason`: Alasan penolakan (Wajib jika REJECTED)

### 2. Update Status (Handover - Lapangan)
*   **User**: Pengurus (Lapangan)
*   **URL**: `/pengurus/fasilitas/update-status`
*   **Method**: `POST`
*   **Auth**: Role `PENGURUS`

**Request Param:**
*   `id`: ID Peminjaman
*   `action`: `TAKEN` (Sudah Ambil) atau `RETURNED` (Sudah Kembali)

**Dampak:**
*   `TAKEN`: Mengisi kolom `picked_up_at` di laporan.
*   `RETURNED`: Mengisi kolom `returned_at` di laporan dan **mengembalikan stok** ke sistem.
