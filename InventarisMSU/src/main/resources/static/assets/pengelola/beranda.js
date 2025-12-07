// =============== UTIL ===============
function getEls() {
  const btnKategori = document.getElementById("kategoriBtn");
  const gridBarang = document.getElementById("gridBarang");
  const gridFasil = document.getElementById("gridFasilitas");
  const input = document.getElementById("quickSearch");
  const form = input ? input.closest("form") : null;
  return { btnKategori, gridBarang, gridFasil, input, form };
}

function getActiveGrid(grids) {
  if (grids.gridFasil && !grids.gridFasil.classList.contains("d-none"))
    return grids.gridFasil;
  return grids.gridBarang;
}

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

// Sembunyikan/lihat kolom card
function setCardColumnDisplay(card, show) {
  const col =
    card.closest(".col-12, .col-sm-6, .col-md-4, .col-lg-3") ||
    card.parentElement;
  if (col) col.style.display = show ? "" : "none";
}

// =============== GRID SWITCH ===============
function setActiveGrid(type, grids, keepQuery = true) {
  const isBarang = type === "barang";
  if (grids.gridBarang) grids.gridBarang.classList.toggle("d-none", !isBarang);
  if (grids.gridFasil) grids.gridFasil.classList.toggle("d-none", isBarang);

  if (grids.btnKategori) {
    grids.btnKategori.textContent = isBarang ? "Barang" : "Fasilitas";
  }

  if (keepQuery && grids.input) {
    filterCards(grids.input.value, grids);
  }
}

// =============== FILTER ===============
function filterCards(query, grids) {
  const grid = getActiveGrid(grids);
  if (!grid) return;

  const q = normalize(query);
  const cards = grid.querySelectorAll(".card");

  cards.forEach((card) => {
    const title = card.querySelector(".card-title")?.innerText || "";
    const desc = card.querySelector(".card-text")?.innerText || "";
    const blob = title + " " + desc + " " + card.innerText;
    const match = normalize(blob).includes(q);
    setCardColumnDisplay(card, q === "" ? true : match);
  });
}

// =============== BOOT ===============
(function initBeranda() {
  // ROUTE login TANPA .html
  // GANTI ini kalau route login kamu beda
  const LOGIN_URL = "/login?role=pengelola";

  // ====== CEK LOGIN / SESSION SEDERHANA ======
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
  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRoleLabel");

  if (userNameEl && currentUser.username) {
    userNameEl.textContent = currentUser.username;
  }

  if (userRoleEl) {
    userRoleEl.textContent =
      currentUser.role === "pengelola" ? "Pengelola Side" : "Pengurus Side";
  }

  // Tombol logout → hapus localStorage & balik ke login (tanpa .html)
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
      e.preventDefault();
      if (!confirm("Yakin ingin keluar dari akun?")) return;

      localStorage.removeItem("msuUser");
      window.location.href = LOGIN_URL;
    });
  }

  // ====== KODE BERANDA ======
  const els = getEls();
  if (!els.input) return;

  // Submit search
  if (els.form) {
    els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      filterCards(els.input.value, els);
    });
  }

  // Live search saat mengetik
  els.input.addEventListener("input", () => filterCards(els.input.value, els));

  // Dropdown kategori: ganti grid
  if (els.btnKategori) {
    const menu = els.btnKategori.parentElement?.querySelector(".dropdown-menu");
    if (menu) {
      menu.querySelectorAll("[data-switch]").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const type = item.getAttribute("data-switch");
          setActiveGrid(type, els, true);
        });
      });
    }
  }

  filterCards("", els);

  /*
   * LOGIKA MODAL EDIT
   */
  const editModalEl = document.getElementById("editModal");
  if (editModalEl) {
    const editModal = new bootstrap.Modal(editModalEl);
    const editForm = document.getElementById("editForm");
    const editItemId = document.getElementById("editItemId");
    const editNamaItem = document.getElementById("editNamaItem");
    const editDeskripsiItem = document.getElementById("editDeskripsiItem");
    const editFormGroupBarang = document.getElementById("editFormGroupBarang");
    const editStokInput = document.getElementById("editStokInput");
    const editFormGroupFasilitas = document.getElementById("editFormGroupFasilitas");
    const editStatusSelect = document.getElementById("editStatusSelect");

    // Saat modal akan ditampilkan
    editModalEl.addEventListener("show.bs.modal", (event) => {
      const button = event.relatedTarget;

      const itemId = button.getAttribute("data-item-id");
      const itemTipe = button.getAttribute("data-item-tipe");
      const itemNama = button.getAttribute("data-item-nama");
      const itemDeskripsi = button.getAttribute("data-item-deskripsi");

      editItemId.value = itemId;
      editNamaItem.value = itemNama;
      editDeskripsiItem.value = itemDeskripsi;

      if (itemTipe === "barang") {
        editFormGroupBarang.style.display = "block";
        editFormGroupFasilitas.style.display = "none";
        const itemStok = button.getAttribute("data-item-stok");
        editStokInput.value = itemStok;
      } else if (itemTipe === "ruangan") {
        editFormGroupBarang.style.display = "none";
        editFormGroupFasilitas.style.display = "block";
        const itemStatus = button.getAttribute("data-item-status");
        editStatusSelect.value = itemStatus;
      }
    });

    // Submit edit
    editForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const itemId = editItemId.value;
      const newDeskripsi = editDeskripsiItem.value;

      const cardToUpdate = document.getElementById(itemId);
      if (!cardToUpdate) return;

      cardToUpdate.querySelector(".card-text").innerText = newDeskripsi;

      const editButton = cardToUpdate.querySelector(".btn-edit");

      if (editFormGroupBarang.style.display === "block") {
        const newStok = editStokInput.value;
        const unitLabel = editNamaItem.value.includes("Zoom") ? "akun" : "unit";
        cardToUpdate.querySelector(".item-stok b").innerText = `${newStok} ${unitLabel}`;
        editButton.setAttribute("data-item-stok", newStok);
      } else {
        const newStatus = editStatusSelect.value;
        cardToUpdate.querySelector(".item-stok b").innerText = newStatus;
        editButton.setAttribute("data-item-status", newStatus);
        cardToUpdate.classList.toggle("item-disabled", newStatus === "Tidak Tersedia");
      }

      editButton.setAttribute("data-item-deskripsi", newDeskripsi);
      editModal.hide();
    });
  }

  /*
   * Titik-tiga (⋮) + Hapus
   */
  function injectMenuToCards(root) {
    const cards = root.querySelectorAll(".card");
    cards.forEach((card) => {
      card.classList.add("position-relative");

      if (card.querySelector(".msu-action-menu")) return;

      const wrap = document.createElement("div");
      wrap.className = "msu-action-menu position-absolute top-0 end-0 p-2";
      wrap.innerHTML = `
        <div class="dropdown">
          <button class="btn btn-light btn-sm rounded-circle shadow-sm"
                  data-bs-toggle="dropdown" aria-expanded="false" aria-label="Menu Aksi">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li>
              <button class="dropdown-item text-danger" data-action="delete">
                <i class="bi bi-trash me-2"></i>Hapus
              </button>
            </li>
          </ul>
        </div>
      `;
      card.prepend(wrap);
    });
  }

  if (els.gridBarang) injectMenuToCards(els.gridBarang);
  if (els.gridFasil) injectMenuToCards(els.gridFasil);

  const modalHapusEl = document.getElementById("modalHapus");
  const hapusNamaEl = document.getElementById("hapusNama");
  const hapusIdEl = document.getElementById("hapusId");
  const btnHapusKonfirm = document.getElementById("btnKonfirmasiHapus");
  const modalHapus = modalHapusEl ? new bootstrap.Modal(modalHapusEl) : null;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action='delete']");
    if (!btn) return;

    const card = btn.closest(".card");
    if (!card) return;

    const itemId = card.id || card.getAttribute("data-item-id");
    const nama =
      card.querySelector(".btn-edit")?.getAttribute("data-item-nama") ||
      card.querySelector(".card-title")?.innerText ||
      itemId ||
      "Item";

    if (hapusIdEl) hapusIdEl.value = itemId || "";
    if (hapusNamaEl) hapusNamaEl.textContent = nama;
    if (modalHapus) modalHapus.show();
  });

  if (btnHapusKonfirm) {
    btnHapusKonfirm.addEventListener("click", async () => {
      const id = hapusIdEl?.value;
      if (!id) { modalHapus?.hide(); return; }

      try {
        const card =
          document.getElementById(id) ||
          document.querySelector(`[data-item-id="${CSS.escape(id)}"]`);
        if (card) {
          const col =
            card.closest(".col-12, .col-sm-6, .col-md-4, .col-lg-3") ||
            card.parentElement;
          (col || card).remove();
        }
      } catch (err) {
        console.error(err);
        alert("Gagal menghapus item. Coba lagi.");
      } finally {
        modalHapus?.hide();
      }
    });
  }
})();
