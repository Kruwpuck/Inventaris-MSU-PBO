/* File: login.js */

document.addEventListener("DOMContentLoaded", () => {
	const loginForm = document.getElementById("loginForm");
	const loginRoleInput = document.getElementById("loginRole");
	const loginSubtitle = document.getElementById("login-subtitle");

	// Ambil role dari URL
	const params = new URLSearchParams(window.location.search);
	const role = params.get("role");

	if (!role) {
		alert("Anda harus memilih role terlebih dahulu.");
		window.location.href = "index.html";
		return;
	}

	// Set subtitle
	if (role === "pengelola") {
		loginSubtitle.textContent = "Masuk sebagai Pengelola untuk melanjutkan.";
	} else if (role === "pengurus") {
		loginSubtitle.textContent = "Role Pengurus belum tersedia.";
	} else {
		loginSubtitle.textContent = "Role tidak dikenal.";
	}

	loginRoleInput.value = role;

	// Submit form
	loginForm.addEventListener("submit", (e) => {
		e.preventDefault();

		const username = document.getElementById("username").value.trim();
		const password = document.getElementById("password").value;

		// === Role Pengelola (AKTIF) ===
		if (role === "pengelola") {
			if (username === "pengelola" && password === "admin123") {
				// Simpan data login
				localStorage.setItem(
					"msuUser",
					JSON.stringify({
						username: "pengelola",
						role: "pengelola",
					})
				);

				alert("Login berhasil!");
				window.location.href = "beranda.html";
				return;
			} else {
				alert("Username atau password salah!");
				return;
			}
		}

		// === Role Pengurus (BELUM ADA PAGE) ===
		if (role === "pengurus") {
			alert("Halaman Pengurus belum dibuat. Silakan login sebagai Pengelola.");
			return;
		}

		// Role lain (nggak mungkin tapi jaga-jaga)
		alert("Role tidak valid.");
	});
});
