document.addEventListener("DOMContentLoaded", () => {
  // ===== ELEMEN UTAMA =====
  const gridBarang = document.getElementById("gridBarang");
  const gridFasilitas = document.getElementById("gridFasilitas");
  const kategoriBtn = document.getElementById("kategoriBtn");

  const searchForm = document.getElementById("searchForm");
  const quickSearch = document.getElementById("quickSearch");

  // ===== UTIL =====
  const normalize = (s) => (s || "").toString().toLowerCase().trim();

  function getActiveGrid() {
    // kalau barang disembunyikan berarti yang aktif ruangan
    return gridBarang && gridBarang.classList.contains("d-none")
      ? gridFasilitas
      : gridBarang;
  }

  function filterActiveGrid() {
    const q = normalize(quickSearch?.value);
    const activeGrid = getActiveGrid();
    if (!activeGrid) return;

    // filter card di grid aktif
    activeGrid.querySelectorAll(".card").forEach((card) => {
      const name = normalize(card.querySelector(".card-title")?.textContent);
      const desc = normalize(card.querySelector(".card-text")?.textContent);
      const blob = `${name} ${desc} ${normalize(card.textContent)}`;

      const show = q === "" ? true : blob.includes(q);

      // card ada di dalam col-*
      const col = card.closest(".col-12, .col-sm-6, .col-md-4, .col-lg-3") || card.parentElement;
      if (col) col.style.display = show ? "" : "none";
    });
  }

  // ===== Switch grid barang/ruangan =====
  document.querySelectorAll("[data-switch]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const target = a.getAttribute("data-switch");

      if (target === "barang") {
        gridBarang?.classList.remove("d-none");
        gridFasilitas?.classList.add("d-none");
        if (kategoriBtn) kategoriBtn.textContent = "Barang";
      } else {
        gridBarang?.classList.add("d-none");
        gridFasilitas?.classList.remove("d-none");
        if (kategoriBtn) kategoriBtn.textContent = "Ruangan";
      }

      // penting: setelah switch, apply filter berdasarkan input sekarang
      filterActiveGrid();
    });
  });

  // ===== Search =====
  if (searchForm && quickSearch) {
    // submit tetap ada (kalau user klik tombol Cari)
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      filterActiveGrid();
    });

    // ✅ ini yang kamu butuhin: saat ketik / hapus huruf, langsung refresh tampilan
    quickSearch.addEventListener("input", filterActiveGrid);
    quickSearch.addEventListener("keyup", filterActiveGrid);
    quickSearch.addEventListener("change", filterActiveGrid);

    // event khusus kalau user klik tombol "x" bawaan input search (browser tertentu)
    quickSearch.addEventListener("search", filterActiveGrid);
  }

  // ===== Modal Edit =====
  const editForm = document.getElementById("editForm");

  const editItemId = document.getElementById("editItemId");
  const editNamaItem = document.getElementById("editNamaItem");
  const editDeskripsiItem = document.getElementById("editDeskripsiItem");
  const editStokInput = document.getElementById("editStokInput");
  const editStatusSelect = document.getElementById("editStatusSelect");
  const editCapacityInput = document.getElementById("editCapacityInput");

  const groupBarang = document.getElementById("editFormGroupBarang");
  const groupFasilitas = document.getElementById("editFormGroupFasilitas");
  const groupCapacity = document.getElementById("editFormGroupCapacity");

  // klik tombol edit pada card
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const tipeRaw = btn.dataset.tipe; // bisa BARANG/RUANGAN atau barang/ruangan tergantung backend
      const tipe = (tipeRaw || "").toString().toUpperCase();

      const nama = btn.dataset.nama || "";
      const deskripsi = btn.dataset.deskripsi || "";
      const stok = btn.dataset.stok || 0;
      const status = btn.dataset.status || "Tersedia";
      const capacity = btn.dataset.capacity || 0;

      editItemId.value = id || "";
      editNamaItem.value = nama;
      editDeskripsiItem.value = deskripsi;

      // mode barang / ruangan
      if (tipe === "BARANG") {
        if (groupBarang) groupBarang.style.display = "block";
        if (groupFasilitas) groupFasilitas.style.display = "none";
        if (groupCapacity) groupCapacity.style.display = "none";
        if (editStokInput) {
          editStokInput.value = stok;
          editStokInput.disabled = false;
        }
        if (editStatusSelect) editStatusSelect.disabled = true;

      } else if (tipe === "RUANGAN") {
        if (groupBarang) groupBarang.style.display = "none";
        if (groupFasilitas) groupFasilitas.style.display = "block";
        if (groupCapacity) {
          groupCapacity.style.display = "block";
          editCapacityInput.value = capacity;
        }
        if (editStatusSelect) {
          editStatusSelect.value = status;
          editStatusSelect.disabled = false;
        }
        if (editStokInput) editStokInput.disabled = true;
      } else {
        if (groupBarang) groupBarang.style.display = "none";
        if (groupFasilitas) groupFasilitas.style.display = "none";
        alert("Tipe item tidak dikenali: " + tipeRaw);
      }

      // simpan tipe aktif di form
      editForm.dataset.tipe = tipe;
    });
  });

  // submit edit
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = editItemId.value;
      const tipe = (editForm.dataset.tipe || "").toUpperCase();

      let url = "";
      const body = new URLSearchParams();
      body.append("name", editNamaItem.value);
      body.append("description", editDeskripsiItem.value);

      if (tipe === "BARANG") {
        url = `/pengelola/items/${id}/update-barang`;
        body.append("stock", editStokInput.value);
      } else if (tipe === "RUANGAN") {
        url = `/pengelola/items/${id}/update-ruangan`;
        body.append("status", editStatusSelect.value);
        if (editCapacityInput) body.append("capacity", editCapacityInput.value);
      } else {
        Swal.fire("Error", "Tipe item tidak dikenali: " + tipe, "error");
        return;
      }

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });

        if (!res.ok) throw new Error("Gagal menyimpan perubahan (HTTP " + res.status + ")");

        const text = (await res.text()).trim();
        if (text !== "OK") throw new Error("Gagal menyimpan perubahan");

        // ===== SUCCESS UI UPDATE (Tanpa Reload) =====

        // 1. Tutup Modal
        const modalEl = document.getElementById("editModal");
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();

        // 2. SweetAlert Sukses
        Swal.fire({
          icon: 'success',
          title: 'Berhasil!',
          text: (tipe === "BARANG" ? "Barang" : "Ruangan") + " berhasil diupdate.",
          timer: 1500,
          showConfirmButton: false
        });

        // 3. Update DOM Card secara manual
        // Cari tombol edit yang punya data-id ini, karena tombol ada di dalam card
        const btnEdit = document.querySelector(`.btn-edit[data-id="${id}"]`);
        if (btnEdit) {
          const card = btnEdit.closest(".card");

          if (card) {
            // Update Teks Judul & Deskripsi
            const titleEl = card.querySelector(".card-title");
            const descEl = card.querySelector(".card-text");
            if (titleEl) titleEl.textContent = editNamaItem.value;
            if (descEl) descEl.textContent = editDeskripsiItem.value;

            // Update Stok / Kapasitas / Status Tampilan
            // Struktur HTML item-stok agak variatif, kita rebuild atau cari elemen spesifik
            const stokEls = card.querySelectorAll(".item-stok b");

            if (tipe === "BARANG") {
              // Barang cuma punya 1 line stok biasanya: Stok: <b>...</b>
              if (stokEls[0]) stokEls[0].textContent = editStokInput.value + " unit";

              // Update data attributes di tombol edit biar kalau dibuka lagi datanya baru
              btnEdit.dataset.nama = editNamaItem.value;
              btnEdit.dataset.deskripsi = editDeskripsiItem.value;
              btnEdit.dataset.stok = editStokInput.value;

            } else {
              // Ruangan punya Stok & Kapasitas
              // Asumsi urutan: [0] = Stok, [1] = Kapasitas
              // Tapi Ruangan juga punya Status (item-disabled class)

              // Update Visual Status
              const statusVal = editStatusSelect.value;
              if (statusVal === "Tersedia") {
                card.classList.remove("item-disabled");
              } else {
                card.classList.add("item-disabled");
              }

              // Update Kapasitas (jika ada elemennya)
              // Note: Stok ruangan biasanya static 1, tapi kalau mau diupdate visualnya:
              // Kita cek elemen 'b' ke-2 biasanya kapasitas
              if (stokEls.length > 1) {
                stokEls[1].textContent = editCapacityInput.value + " orang";
              }

              // Update data attributes
              btnEdit.dataset.nama = editNamaItem.value;
              btnEdit.dataset.deskripsi = editDeskripsiItem.value;
              btnEdit.dataset.status = statusVal;
              btnEdit.dataset.capacity = editCapacityInput.value;
            }
          }
        }

      } catch (err) {
        Swal.fire("Gagal", err.message || "Error saat update", "error");
      }
    });
  }

  // ===== Modal Hapus =====
  const hapusNama = document.getElementById("hapusNama");
  const hapusId = document.getElementById("hapusId");
  const btnKonfirmasiHapus = document.getElementById("btnKonfirmasiHapus");

  document.querySelectorAll(".btn-hapus").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (hapusId) hapusId.value = btn.dataset.id || "";
      if (hapusNama) hapusNama.textContent = btn.dataset.nama || "item ini";
    });
  });

  if (btnKonfirmasiHapus) {
    btnKonfirmasiHapus.addEventListener("click", async () => {
      const id = hapusId?.value;
      if (!id) return;

      try {
        const res = await fetch(`/pengelola/items/${id}/delete`, { method: "POST" });
        if (!res.ok) throw new Error("Gagal menghapus item (HTTP " + res.status + ")");

        const text = (await res.text()).trim();
        if (text !== "OK") throw new Error("Gagal menghapus item");

        // ✅ tanpa reload pun bisa: langsung hilangkan card dari DOM lalu re-filter
        const btnHapus = document.querySelector(`.btn-hapus[data-id="${CSS.escape(id)}"]`);
        const card = btnHapus?.closest(".card");
        const col = card?.closest(".col-12, .col-sm-6, .col-md-4, .col-lg-3") || card?.parentElement;

        if (col) col.remove();

        // setelah delete, tampilan tetap konsisten dengan search query
        filterActiveGrid();

        // tutup modal (kalau bootstrap tersedia)
        const modalEl = document.getElementById("modalHapus");
        if (modalEl && window.bootstrap) {
          const instance = bootstrap.Modal.getInstance(modalEl);
          if (instance) instance.hide();
        }

        // SWAL SUKSES
        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Item berhasil dihapus.',
          timer: 1500,
          showConfirmButton: false
        });

      } catch (err) {
        Swal.fire("Gagal", err.message || "Error saat hapus", "error");
      }
    });
  }

  // apply filter awal (kalau ada isi input karena autofill)
  filterActiveGrid();
});
