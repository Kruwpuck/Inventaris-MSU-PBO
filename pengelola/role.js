/* File: pilih-role.js */

document.addEventListener("DOMContentLoaded", () => {
	const btnSelesai = document.getElementById("btnSelesai");
	const roleCarouselEl = document.getElementById("roleCarousel");
	const pengelolaDesc = document.getElementById("pengelola-desc");
	const pengurusDesc = document.getElementById("pengurus-desc");

	// Default role adalah yang pertama (pengelola), tapi tombol disabled
	let selectedRole = "pengelola";
	
	// Inisialisasi Carousel Bootstrap
	// interval: false (tidak geser otomatis)
	// wrap: false (tidak berputar di akhir)
	const bsCarousel = new bootstrap.Carousel(roleCarouselEl, {
		interval: false,
		wrap: false,
	});

	// Dengarkan event 'slid.bs.carousel'
	// Ini akan berjalan SETELAH animasi geser selesai
	roleCarouselEl.addEventListener("slid.bs.carousel", function (e) {
		// Dapatkan index slide yang baru aktif (0 atau 1)
		const activeIndex = e.to;

		if (activeIndex === 0) {
			// Slide 0 = Pengelola
			selectedRole = "pengelola";
			// Tampilkan deskripsi pengelola, sembunyikan pengurus
			pengelolaDesc.classList.remove("d-none");
			pengurusDesc.classList.add("d-none");
		} else {
			// Slide 1 = Pengurus
			selectedRole = "pengurus";
			// Sembunyikan deskripsi pengelola, tampilkan pengurus
			pengelolaDesc.classList.add("d-none");
			pengurusDesc.classList.remove("d-none");
		}
		
		// Aktifkan tombol "Selesai" setelah interaksi pertama
		btnSelesai.disabled = false;
	});

	// Event untuk tombol Selesai
	btnSelesai.addEventListener("click", () => {
		// Cek sekali lagi jika role sudah dipilih (seharusnya sudah)
		if (selectedRole) {
			// Arahkan ke login.html dengan role yang dipilih
			window.location.href = `login.html?role=${selectedRole}`;
		}
		// Tombol tidak akan bisa diklik jika 'disabled',
		// jadi kita tidak perlu 'else'
	});
});