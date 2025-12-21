// =============== UTIL ===============
function getEls() {
  const btnKategori = document.getElementById("kategoriBtn");
  const gridBarang = document.getElementById("gridBarang");
  const gridFasil = document.getElementById("gridFasilitas");
  const input = document.getElementById("quickSearch");
  const form = document.getElementById("searchForm"); // lebih aman dari closest
  return { btnKategori, gridBarang, gridFasil, input, form };
}

function getActiveGrid(grids) {
  // kalau fasilitas lagi tampil (tidak d-none), berarti aktif fasilitas
  if (grids.gridFasil && !grids.gridFasil.classList.contains("d-none")) return grids.gridFasil;
  return grids.gridBarang;
}

function normalize(str) {
  return (str || "").toLowerCase().trim();
}

// cari kolom pembungkus card yang paling aman
function getCardColumn(card) {
  // struktur kamu: col-* -> card
  // jadi cukup cari parent element yang class-nya mengandung "col-"
  let el = card.parentElement;
  while (el && el !== document.body) {
    if ([...el.classList].some((c) => c.startsWith("col-"))) return el;
    el = el.parentElement;
  }
  return card.parentElement || card;
}

function setCardColumnDisplay(card, show) {
  const col = getCardColumn(card);
  if (col) col.style.display = show ? "" : "none";
}

// =============== GRID SWITCH ===============
function setActiveGrid(type, grids, keepQuery = true) {
  const isBarang = type === "barang";

  if (grids.gridBarang) grids.gridBarang.classList.toggle("d-none", !isBarang);
  if (grids.gridFasil) grids.gridFasil.classList.toggle("d-none", isBarang);

  if (grids.btnKategori) grids.btnKategori.textContent = isBarang ? "Barang" : "Ruangan";

  // ketika switch kategori, tetap apply query saat ini
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

    // cukup cari dari title + desc biar rapi (nggak terlalu “noise”)
    const blob = `${title} ${desc}`;
    const match = normalize(blob).includes(q);

    // kalau q kosong => tampilkan semua
    setCardColumnDisplay(card, q === "" ? true : match);
  });
}

// =============== BOOT ===============
(function initBeranda() {
  // ====== LOGIN CHECK (punyamu) ======
  const LOGIN_URL = "login.html?role=pengelola";

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

  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRoleLabel");

  if (userNameEl && currentUser.username) userNameEl.textContent = currentUser.username;
  if (userRoleEl) {
    userRoleEl.textContent = currentUser.role === "pengelola" ? "Pengelola Side" : "Pengurus Side";
  }

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
      e.preventDefault();
      if (!confirm("Yakin ingin keluar dari akun?")) return;
      localStorage.removeItem("msuUser");
      window.location.href = LOGIN_URL;
    });
  }

  // ====== INIT ELEMENTS ======
  const els = getEls();
  if (!els.input) return;

  // Submit search (tombol Cari / Enter)
if (els.form) {
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    filterCards(els.input.value, els);
  });
}

// Live search: ngetik, hapus (backspace), paste, dll
const runFilter = () => filterCards(els.input.value, els);

// 1) Paling utama
els.input.addEventListener("input", runFilter);

// 2) Backup (beberapa kasus backspace / autofill kadang aneh)
els.input.addEventListener("keyup", runFilter);

// 3) Kalau suatu saat kamu ganti input jadi type="search" (ada tombol X clear)
els.input.addEventListener("search", runFilter);

// 4) Kalau field kehilangan fokus, tetap sinkron
els.input.addEventListener("change", runFilter);


  // Dropdown kategori
  if (els.btnKategori) {
    const menu = els.btnKategori.parentElement?.querySelector(".dropdown-menu");
    if (menu) {
      menu.querySelectorAll("[data-switch]").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const type = item.getAttribute("data-switch"); // barang / fasilitas
          // HTML kamu pakai "fasilitas", tapi label user maunya "Ruangan"
          setActiveGrid(type === "fasilitas" ? "ruangan" : "barang", els, true);
        });
      });
    }
  }

  // default pertama kali: semua tampil
  filterCards("", els);

  /*
   * LOGIKA MODAL EDIT (punyamu, aku biarkan)
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
      } else {
        editFormGroupBarang.style.display = "none";
        editFormGroupFasilitas.style.display = "block";
        const itemStatus = button.getAttribute("data-item-status");
        editStatusSelect.value = itemStatus;
      }
    });

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

      // ✅ setelah edit, re-filter sesuai query saat ini (biar tampilan konsisten)
      filterCards(els.input.value, els);

      editModal.hide();
    });
  }

  /*
   * Titik-tiga (⋮) + Hapus (punyamu, aku biarkan)
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
          <button class="btn btn-light btn-sm rounded-circle shadow-sm" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Menu Aksi">
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
      if (!id) {
        modalHapus?.hide();
        return;
      }

      try {
        const card = document.getElementById(id);
        if (card) {
          const col = getCardColumn(card);
          (col || card).remove();
        }

        // ✅ setelah hapus, re-filter sesuai query saat ini
        filterCards(els.input.value, els);
      } catch (err) {
        console.error(err);
        alert("Gagal menghapus item. Coba lagi.");
      } finally {
        modalHapus?.hide();
      }
    });
  }
})();
