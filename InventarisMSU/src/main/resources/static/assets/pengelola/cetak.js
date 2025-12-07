/*
 * File: cetak.js
 * Diperbarui untuk membaca data 'ApprovedRequest'
 */

(function () {
	// Ambil elemen DOM
	const loadingState = document.getElementById("loadingState");
	const dataContent = document.getElementById("dataContent");

	// Fungsi untuk mengisi data ke template
	function populateData(item) {
		// --- PERUBAHAN DI SINI ---
		// Gunakan field baru dari diagram 'ApprovedRequest'
		// Tambahkan fallback (||) untuk data lama jika ada
		const peminjam = item.namaPenerima || item.user;
		const barang = item.namaBarang || item.item;
		const tglPinjam = item.tglPakai || item.tglPinjam; // 'tglPakai' adalah yg baru
		const tglSelesai = item.tglSelesai;
		const admin = item.processedBy;
		const qty = item.quantity || 1; // 'quantity' adalah yg baru
		// --- AKHIR PERUBAHAN ---

		document.getElementById("printId").innerText = item.id;
		document.getElementById("printUser").innerText = peminjam;
		document.getElementById("printItem").innerText = barang;
		document.getElementById("printQty").innerText = `${qty} unit`; // Mengisi field baru
		document.getElementById("printTglPinjam").innerText = tglPinjam;
		document.getElementById("printTglSelesai").innerText = tglSelesai;
		document.getElementById("printAdmin").innerText = admin;
		
		// Untuk bagian tanda tangan
		document.getElementById("printUserSign").innerText = `( ${peminjam} )`;
		document.getElementById("printAdminSign").innerText = `( ${admin} )`;

		// Tampilkan konten dan sembunyikan loading
		loadingState.classList.add("d-none");
		dataContent.classList.remove("d-none");
	}

	// Fungsi untuk menampilkan error
	function showError() {
		loadingState.innerHTML = `
            <div class="alert alert-danger">
                <strong>Error:</strong> Data pengajuan tidak ditemukan.
                Silakan kembali dan coba lagi.
            </div>
        `;
	}

	// Mulai logika saat halaman dimuat
	document.addEventListener("DOMContentLoaded", () => {
		// 1. Dapatkan ID dari URL
		const params = new URLSearchParams(window.location.search);
		const submissionId = params.get("id");

		if (!submissionId) {
			showError();
			return;
		}

		// 2. Ambil data riwayat dari localStorage
		// (Data ini disimpan oleh approval.js)
		const allHistory = JSON.parse(
			localStorage.getItem("riwayatPeminjamanMSU") || "[]"
		);

		// 3. Cari data yang sesuai
		const itemData = allHistory.find((sub) => sub.id === submissionId);

		if (itemData && itemData.status === "Approved") {
			// 4. Jika data ditemukan, isi ke halaman
			populateData(itemData);

			// 5. Tunda print dialog agar konten sempat ter-render
			setTimeout(() => {
				window.print();
			}, 500); // Tunda 0.5 detik
		} else {
			// 5. Jika data tidak ditemukan atau statusnya bukan 'Approved'
			showError();
		}
	});
})();