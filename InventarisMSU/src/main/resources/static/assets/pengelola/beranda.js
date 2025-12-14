document.addEventListener("DOMContentLoaded", () => {
  // ===== Switch grid barang/ruangan =====
  const gridBarang = document.getElementById("gridBarang");
  const gridFasilitas = document.getElementById("gridFasilitas");
  const kategoriBtn = document.getElementById("kategoriBtn");

  document.querySelectorAll("[data-switch]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const target = a.getAttribute("data-switch");

      if (target === "barang") {
        gridBarang.classList.remove("d-none");
        gridFasilitas.classList.add("d-none");
        kategoriBtn.textContent = "Barang";
      } else {
        gridBarang.classList.add("d-none");
        gridFasilitas.classList.remove("d-none");
        kategoriBtn.textContent = "Ruangan";
      }
    });
  });

  // ===== Modal Edit =====
  const editForm = document.getElementById("editForm");

  const editItemId = document.getElementById("editItemId");
  const editNamaItem = document.getElementById("editNamaItem");
  const editDeskripsiItem = document.getElementById("editDeskripsiItem");
  const editStokInput = document.getElementById("editStokInput");
  const editStatusSelect = document.getElementById("editStatusSelect");

  const groupBarang = document.getElementById("editFormGroupBarang");
  const groupFasilitas = document.getElementById("editFormGroupFasilitas");

  // klik tombol edit pada card
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const tipe = btn.dataset.tipe; // BARANG / RUANGAN
      const nama = btn.dataset.nama || "";
      const deskripsi = btn.dataset.deskripsi || "";
      const stok = btn.dataset.stok || 0;
      const status = btn.dataset.status || "Tersedia";

      editItemId.value = id;
      editNamaItem.value = nama;
      editDeskripsiItem.value = deskripsi;

      // mode barang / ruangan
      if (tipe === "BARANG") {
        groupBarang.style.display = "block";
        groupFasilitas.style.display = "none";
        editStokInput.value = stok;
      } else if (tipe === "RUANGAN") {
        groupBarang.style.display = "none";
        groupFasilitas.style.display = "block";
        editStatusSelect.value = status;
      } else {
        // kalau ternyata tipe bukan BARANG/RUANGAN
        groupBarang.style.display = "none";
        groupFasilitas.style.display = "none";
        alert("Tipe item tidak dikenali: " + tipe);
      }

      // simpan tipe aktif di form
      editForm.dataset.tipe = tipe;
    });
  });

  // submit edit
  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = editItemId.value;
    const tipe = editForm.dataset.tipe;

    let url = "";
    const body = new URLSearchParams();
    body.append("description", editDeskripsiItem.value);

    if (tipe === "BARANG") {
      url = `/pengelola/items/${id}/update-barang`;
      body.append("stock", editStokInput.value);
    } else if (tipe === "RUANGAN") {
      url = `/pengelola/items/${id}/update-ruangan`;
      body.append("status", editStatusSelect.value);
    } else {
      alert("Tipe item tidak dikenali: " + tipe);
      return;
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      // HTTP error
      if (!res.ok) throw new Error("Gagal menyimpan perubahan (HTTP " + res.status + ")");

      // cek isi response (OK / ERROR)
      const text = (await res.text()).trim();
      if (text !== "OK") throw new Error("Gagal menyimpan perubahan");

      window.location.reload();
    } catch (err) {
      alert(err.message || "Error saat update");
    }
  });

  // ===== Modal Hapus =====
  const hapusNama = document.getElementById("hapusNama");
  const hapusId = document.getElementById("hapusId");
  const btnKonfirmasiHapus = document.getElementById("btnKonfirmasiHapus");

  document.querySelectorAll(".btn-hapus").forEach((btn) => {
    btn.addEventListener("click", () => {
      hapusId.value = btn.dataset.id;
      hapusNama.textContent = btn.dataset.nama || "item ini";
    });
  });

  btnKonfirmasiHapus.addEventListener("click", async () => {
    const id = hapusId.value;
    try {
      const res = await fetch(`/pengelola/items/${id}/delete`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Gagal menghapus item (HTTP " + res.status + ")");

      const text = (await res.text()).trim();
      if (text !== "OK") throw new Error("Gagal menghapus item");

      window.location.reload();
    } catch (err) {
      alert(err.message || "Error saat hapus");
    }
  });

  // ===== Search =====
  const searchForm = document.getElementById("searchForm");
  const quickSearch = document.getElementById("quickSearch");

  if (searchForm && quickSearch) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = quickSearch.value.trim().toLowerCase();
      const activeGrid = gridBarang.classList.contains("d-none")
        ? gridFasilitas
        : gridBarang;

      activeGrid.querySelectorAll(".card").forEach((card) => {
        const name = (card.querySelector(".card-title")?.textContent || "").toLowerCase();
        const desc = (card.querySelector(".card-text")?.textContent || "").toLowerCase();
        const show = name.includes(q) || desc.includes(q);
        card.parentElement.style.display = show ? "" : "none";
      });
    });
  }
});
