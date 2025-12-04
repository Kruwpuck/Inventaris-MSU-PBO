/*
 * approval.js (FIX ROUTE TANPA .html)
 * UI/interaction saja. Logic bisnis bisa dipindah ke Java nanti.
 */

(function () {
	const RIWAYAT_KEY = "riwayatPeminjamanMSU";

	// GANTI INI kalau route login kamu beda
	const LOGIN_URL = "/login?role=pengelola";

	// 1. DAFTAR FASILITAS
	const daftarFasilitas = new Set([
		"Ruang Utama",
		"Ruang Tamu VIP",
		"Pelataran Masjid",
		"Selasar / Teras Selatan Masjid",
		"Selasar / Teras Utara Masjid",
		"Selasar / Teras Timur Masjid",
		"Plaza Masjid",
		"Lantai 2 TImur Masjid",
		"Lantai 2 Selatan Masjid",
		"Lantai 2 Utara Masjid",
		"Halaman Masjid",
	]);

	// 2. DATA (Mockup)
	let defaultSubmissions = [
		{
			id: "P001",
			user: "Jamaludin",
			item: "Proyektor",
			tglPinjam: "2025-11-10",
			tglSelesai: "2025-11-11",
			status: "Pending",
			proposalUrl: null,
		},
		{
			id: "P002",
			user: "Siti Aminah",
			item: "Ruang Utama",
			tglPinjam: "2025-11-12",
			tglSelesai: "2025-11-12",
			status: "Pending",
			proposalUrl: "/assets/pengelola/aset/contoh-proposal.pdf",
		},
		{
			id: "P003",
			user: "Budi Santoso",
			item: "Speaker (2 unit)",
			tglPinjam: "2025-11-10",
			tglSelesai: "2025-11-10",
			status: "Pending",
			proposalUrl: null,
		},
		{
			id: "P004",
			user: "Lina M.",
			item: "Plaza Masjid",
			tglPinjam: "2025-11-13",
			tglSelesai: "2025-11-14",
			status: "Pending",
			proposalUrl: "/assets/pengelola/aset/contoh-proposal-2.pdf",
		},
	];

	let defaultHistory = [
		{
			id: "P000",
			namaPenerima: "Pengurus Lama",
			namaBarang: "Karpet",
			quantity: 1,
			tglPakai: "2025-10-01",
			tglSelesai: "2025-10-01",
			status: "Approved",
			processedBy: "Admin",
			reason: "-",
			tglAmbil: null,
			tglKembali: null,
			beri: false,
			kembali: false,
		},
		{
			id: "P00X",
			namaPenerima: "Ahmad",
			namaBarang: "Ruang Tamu VIP",
			quantity: 1,
			tglPakai: "2025-10-05",
			tglSelesai: "2025-10-06",
			status: "Rejected",
			processedBy: "Arina",
			reason: "Bentrok dengan jadwal internal.",
			tglAmbil: null,
			tglKembali: null,
			beri: false,
			kembali: false,
		},
	];

	let mockHistory = JSON.parse(localStorage.getItem(RIWAYAT_KEY)) || defaultHistory;
	let mockSubmissions = defaultSubmissions;

	// 3. ELEMEN DOM
	const submissionTableBody = document.getElementById("submissionTableBody");
	const historyTableBody = document.getElementById("historyTableBody");
	const modalElement = document.getElementById("rejectionModal");
	const rejectionForm = document.getElementById("rejectionForm");
	const rejectionReasonInput = document.getElementById("rejectionReason");
	const rejectionSubmissionIdInput = document.getElementById("rejectionSubmissionId");
	const userNameSpan = document.getElementById("userName");
	const userRoleLabel = document.getElementById("userRoleLabel");
	const btnExportCSV = document.getElementById("btnExportCSV");
	const btnLogout = document.getElementById("btnLogout");

	// ====== CEK LOGIN / SESSION ======
	let currentUser = null;
	try {
		const raw = localStorage.getItem("msuUser");
		if (!raw) {
			window.location.href = LOGIN_URL;
			return;
		}
		currentUser = JSON.parse(raw);
	} catch (err) {
		console.error("Gagal membaca data user:", err);
		window.location.href = LOGIN_URL;
		return;
	}

	// Set nama & role di navbar
	if (userNameSpan && currentUser.username) {
		userNameSpan.textContent = currentUser.username;
	}
	if (userRoleLabel) {
		userRoleLabel.textContent =
			currentUser.role === "pengelola" ? "Pengelola Side" : "Pengurus Side";
	}

	// Tombol logout (route tanpa .html)
	if (btnLogout) {
		btnLogout.addEventListener("click", (e) => {
			e.preventDefault();
			if (!confirm("Yakin ingin keluar dari akun?")) return;
			localStorage.removeItem("msuUser");
			window.location.href = LOGIN_URL;
		});
	}

	if (!submissionTableBody || !historyTableBody || !modalElement || !btnExportCSV) {
		console.error("Elemen tabel/modal/tombol ekspor tidak ditemukan.");
		return;
	}

	const rejectionModal = new bootstrap.Modal(modalElement);

	// 4. FUNGSI UTAMA

	function saveHistoryToStorage() {
		localStorage.setItem(RIWAYAT_KEY, JSON.stringify(mockHistory));
	}

	function parseItem(itemString) {
		const match = itemString.match(/\(([^)]+)\)/);
		let quantity = 1;
		let itemName = itemString;

		if (match) {
			const parts = match[1].split(" ");
			const num = parseInt(parts[0], 10);
			if (!isNaN(num)) {
				quantity = num;
				itemName = itemString.replace(match[0], "").trim();
			}
		}
		return { namaBarang: itemName, quantity: quantity };
	}

	function kirimEmail(tipe, submission) {
		const subjek =
			tipe === "approve"
				? `Disetujui: Peminjaman ${submission.item}`
				: `Ditolak: Peminjaman ${submission.item}`;

		console.log("--- SIMULASI EMAIL ---");
		console.log(`Kepada: ${submission.user}`);
		console.log(`Subjek: ${subjek}`);
		console.log(
			`Pengajuan ${submission.id} diproses oleh ${userNameSpan.textContent}.`
		);
		console.log("----------------------");
	}

	// RENDER PENDING
	function renderSubmissions() {
		submissionTableBody.innerHTML = "";
		const pendingSubmissions = mockSubmissions.filter((s) => s.status === "Pending");

		if (pendingSubmissions.length === 0) {
			submissionTableBody.innerHTML = `
				<tr>
					<td colspan="7" class="p-5 text-muted">Tidak ada pengajuan pending saat ini.</td>
				</tr>`;
			return;
		}

		pendingSubmissions.forEach((sub) => {
			const row = document.createElement("tr");
			row.setAttribute("data-id", sub.id);
			const isFasilitas = daftarFasilitas.has(sub.item);

			const proposalButton = isFasilitas
				? `<a href="${sub.proposalUrl || "#"}" target="_blank"
						class="btn btn-outline-primary btn-sm">
						<i class="bi bi-file-earmark-text"></i> Tinjau Proposal
				   </a>`
				: " - ";

			row.innerHTML = `
                <td><strong>${sub.id}</strong></td>
                <td>${sub.user}</td>
                <td>${sub.item}</td>
                <td>${sub.tglPinjam}</td>
                <td><span class="badge bg-warning text-dark">${sub.status}</span></td>
                <td>
                    <div class="d-flex align-items-center" style="gap: 0.25rem;">
                        <button class="btn btn-success btn-sm btn-approve" data-id="${sub.id}">
                            <i class="bi bi-check-lg"></i> Setuju
                        </button>
                        <button class="btn btn-danger btn-sm btn-reject" data-id="${sub.id}">
                            <i class="bi bi-x-lg"></i> Tolak
                        </button>
                    </div>
                </td>
                <td>${proposalButton}</td>
            `;
			submissionTableBody.appendChild(row);
		});
	}

	// RENDER HISTORY
	function renderHistory() {
		historyTableBody.innerHTML = "";

		if (mockHistory.length === 0) {
			historyTableBody.innerHTML = `
				<tr>
					<td colspan="7" class="p-5 text-muted">Belum ada riwayat keputusan.</td>
				</tr>`;
			return;
		}

		const sortedHistory = [...mockHistory].reverse();

		sortedHistory.forEach((sub) => {
			const row = document.createElement("tr");

			const statusBadge =
				sub.status === "Approved"
					? `<span class="badge bg-success">${sub.status}</span>`
					: `<span class="badge bg-danger">${sub.status}</span>`;

			const reasonText = sub.reason || "-";
			const peminjam = sub.namaPenerima || sub.user;
			const item = sub.namaBarang || sub.item;

			// route cetak TANPA .html
			const cetakButton =
				sub.status === "Approved"
					? `<a href="/pengelola/cetak?id=${sub.id}"
						 class="btn btn-outline-secondary btn-sm" target="_blank">
							<i class="bi bi-printer"></i>
					   </a>`
					: "";

			row.innerHTML = `
                <td><strong>${sub.id}</strong></td>
                <td>${peminjam}</td>
                <td>${item} (x${sub.quantity || 1})</td>
                <td>${statusBadge}</td>
                <td>${sub.processedBy}</td>
                <td>${reasonText}</td>
                <td class="text-center">${cetakButton}</td>
            `;
			historyTableBody.appendChild(row);
		});
	}

	// PROSES PENGAJUAN (masih mockup)
	function processSubmission(id, newStatus, reason = "-") {
		const submissionIndex = mockSubmissions.findIndex((s) => s.id === id);
		if (submissionIndex === -1) return;

		const processedBy = userNameSpan ? userNameSpan.textContent : "Admin";
		const originalSubmission = mockSubmissions.splice(submissionIndex, 1)[0];

		let processedData;
		const { namaBarang, quantity } = parseItem(originalSubmission.item);

		if (newStatus === "Approved") {
			processedData = {
				id: originalSubmission.id,
				namaPenerima: originalSubmission.user,
				namaBarang,
				quantity,
				tglPakai: originalSubmission.tglPinjam,
				tglSelesai: originalSubmission.tglSelesai,
				tglAmbil: null,
				tglKembali: null,
				beri: false,
				kembali: false,
				status: "Approved",
				processedBy,
				reason: "-",
			};

			kirimEmail("approve", originalSubmission);
			alert(`Pengajuan ${id} telah disetujui.`);
		} else {
			processedData = {
				id: originalSubmission.id,
				namaPenerima: originalSubmission.user,
				namaBarang,
				quantity,
				tglPakai: originalSubmission.tglPinjam,
				tglSelesai: originalSubmission.tglSelesai,
				tglAmbil: null,
				tglKembali: null,
				beri: false,
				kembali: false,
				status: "Rejected",
				processedBy,
				reason,
			};

			kirimEmail("reject", originalSubmission);
			alert(`Pengajuan ${id} telah ditolak.`);
		}

		mockHistory.push(processedData);
		saveHistoryToStorage();
		renderSubmissions();
		renderHistory();
	}

	// EVENT LISTENERS
	document.addEventListener("DOMContentLoaded", () => {
		renderSubmissions();
		renderHistory();
		if (!localStorage.getItem(RIWAYAT_KEY)) {
			saveHistoryToStorage();
		}
	});

	submissionTableBody.addEventListener("click", (e) => {
		const target = e.target.closest("button");
		if (!target) return;

		const id = target.dataset.id;

		if (target.classList.contains("btn-approve")) {
			if (confirm(`Apakah Anda yakin ingin menyetujui pengajuan ${id}?`)) {
				processSubmission(id, "Approved");
			}
		} else if (target.classList.contains("btn-reject")) {
			rejectionSubmissionIdInput.value = id;
			rejectionModal.show();
		}
	});

	rejectionForm.addEventListener("submit", (e) => {
		e.preventDefault();
		const id = rejectionSubmissionIdInput.value;
		const reason = rejectionReasonInput.value.trim();
		if (reason) {
			processSubmission(id, "Rejected", reason);
			rejectionModal.hide();
		} else {
			alert("Alasan tidak boleh kosong.");
		}
	});

	modalElement.addEventListener("hidden.bs.modal", () => {
		rejectionForm.reset();
		rejectionSubmissionIdInput.value = "";
	});

	// EKSPOR CSV
	function sanitizeCSVValue(value) {
		const stringValue = String(value || "");
		if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
			return `"${stringValue.replace(/"/g, '""')}"`;
		}
		return stringValue;
	}

	function exportToCSV() {
		const data = mockHistory;
		if (data.length === 0) {
			alert("Tidak ada data riwayat untuk diekspor.");
			return;
		}

		const headers = [
			"ID","Status","NamaPenerima","NamaBarang","Quantity",
			"TglPakai","TglSelesai","TglAmbil","TglKembali",
			"SudahDiberi","SudahKembali","DiprosesOleh","CatatanAlasan",
		];

		const csvRows = [];
		csvRows.push(headers.join(","));

		for (const item of data) {
			const values = [
				item.id, item.status, item.namaPenerima, item.namaBarang, item.quantity,
				item.tglPakai, item.tglSelesai, item.tglAmbil, item.tglKembali,
				item.beri, item.kembali, item.processedBy, item.reason,
			];
			csvRows.push(values.map(sanitizeCSVValue).join(","));
		}

		const csvString = "\uFEFF" + csvRows.join("\n");
		const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);

		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", "riwayat_peminjaman_msu.csv");

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		alert("Riwayat telah berhasil diekspor!");
	}

	btnExportCSV.addEventListener("click", exportToCSV);
})();
