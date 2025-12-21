// =============== UTIL TANGGAL ===============
function parseMDY(s) {
  // Format di tabel: MM/DD/YYYY atau "-"
  if (!s || s.trim() === "-") return null;
  const [m, d, y] = s.split("/").map((n) => parseInt(n, 10));
  if (!m || !d || !y) return null;
  return new Date(y, m - 1, d);
}

function startOfToday() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

/*  DROPDOWN HOOK  */
function hookupFilterDropdown(btnId, onChange) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  const menu = btn.nextElementSibling;
  if (!menu) return;

  menu.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      menu
        .querySelectorAll(".dropdown-item")
        .forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      btn.textContent = item.textContent.trim();
      const value = item.getAttribute("data-value");
      onChange && onChange(value);
      filterTable();
    });
  });
}

/* STATE FILTER */
let vKategori = "all",
  vStatus = "all";
const inputSearch = document.getElementById("fSearch");
const tbody = document.getElementById("tbodyLaporan");

/*  FILTER CORE  */
function filterTable() {
  if (!tbody) return;

  /* DATE FILTER LOGIC */
  const dStart = document.getElementById("dateStart")?.valueAsDate;
  const dEnd = document.getElementById("dateEnd")?.valueAsDate;
  
  let from = null;
  let to = null;

  if (dStart) from = dStart;
  if (dEnd) to = dEnd;

  // set time to start/end of day for accurate comparison
  if (from) from.setHours(0, 0, 0, 0);
  if (to) to.setHours(23, 59, 59, 999);

  const q = (inputSearch?.value || "").toLowerCase().trim();

  let rowIdx = 0;
  Array.from(tbody.querySelectorAll("tr")).forEach((tr) => {
    const kategori = tr.getAttribute("data-kategori");
    const status = tr.getAttribute("data-status");

    const cellsText = Array.from(tr.children)
      .map((td) => td.textContent)
      .join(" ")
      .toLowerCase();

    const tglPinjam = parseMDY(tr.children[4].textContent);

    // cek periode
    let okPeriode = true;
    if (from && to) {
      okPeriode = !!tglPinjam && tglPinjam >= from && tglPinjam <= to;
    }

    const okKategori = vKategori === "all" || kategori === vKategori;
    const okStatus = vStatus === "all" || status === vStatus;
    const okSearch = q === "" || cellsText.includes(q);

    const visible = okPeriode && okKategori && okStatus && okSearch;

    tr.style.display = visible ? "" : "none";
    if (visible) {
      rowIdx += 1;
      // renumber kolom "No" (index 0)
      tr.children[0].textContent = rowIdx;
    }
  });
}

/*  WIDTH SYNC */
function syncMenuWidth() {
  document.querySelectorAll(".toolbar .dropdown").forEach((d) => {
    const btn = d.querySelector("button");
    const menu = d.querySelector(".dropdown-menu");
    if (btn && menu) menu.style.minWidth = btn.offsetWidth + "px";
  });
  document.querySelectorAll(".btn-group .dropdown-menu").forEach((menu) => {
    const group = menu.closest(".btn-group");
    if (group) {
      const totalWidth = Array.from(group.querySelectorAll("button")).reduce(
        (w, b) => w + b.offsetWidth,
        0
      );
      menu.style.minWidth = totalWidth + "px";
    }
  });
}

/*  BOOT  */
window.addEventListener("load", () => {
  // ====== LOGIN / SESSION CHECK (SAMA DENGAN BERANDA) ======
  // Client-side session check removed - using Server-side Spring Security


  // Set nama & role di navbar
  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRoleLabel");

  // User name/role update removed as it relied on localStorage


  // Tombol logout
  // Tombol logout
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
      e.preventDefault();
      if (!confirm("Yakin ingin keluar dari akun?")) return;
      window.location.href = "/logout";
    });
  }

  // ====== LOGIKA FILTER LAPORAN (PUNYAMU) ======
  // Hook dropdowns
  // Date inputs & Apply Button
  const dateStart = document.getElementById("dateStart");
  const dateEnd = document.getElementById("dateEnd");
  const btnApplyDate = document.getElementById("btnApplyDate"); // Tombol Terapkan baru

  // Jangan filter saat input berubah (tunggu tombol Terapkan)
  // if (dateStart) dateStart.addEventListener("change", filterTable); 
  // if (dateEnd) dateEnd.addEventListener("change", filterTable);

  if (btnApplyDate) {
    btnApplyDate.addEventListener("click", (e) => {
      e.preventDefault(); // Mencegah form submit jika ada dalam form (meski type=button aman)
      filterTable();
      
      // Opsional: Tutup dropdown setelah apply (kalau pakai Bootstrap vanilla)
      // const dropdownEl = btnApplyDate.closest('.dropdown-menu');
      // if(dropdownEl) dropdownEl.classList.remove('show'); 
      // Tapi biasanya user menutup sendiri melaui klik luar.
    });
  }

  // Hook dropdowns (Kategori & Status only)
  hookupFilterDropdown("btnKategori", (v) => (vKategori = v));
  hookupFilterDropdown("btnStatus", (v) => (vStatus = v));

  // Search
  if (inputSearch) {
    inputSearch.addEventListener("input", filterTable);
  }

  // Width sync
  syncMenuWidth();
  window.addEventListener("resize", syncMenuWidth);

  // First render
  filterTable();

  // Chart dummy
  const ctx = document.getElementById("chartTop");
  if (ctx && window.Chart) {
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "Proyektor",
          "Meja",
          "Speaker",
          "Terpal",
          "Sofa",
          "Hijab",
          "Ruang Utama",
          "Selasar",
          "Zoom",
          "Ruang VIP",
        ],
        datasets: [
          {
            label: "Dipinjam",
            data: [12, 10, 9, 8, 7, 6, 5, 4, 3, 2],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
      },
    });
  }
});
