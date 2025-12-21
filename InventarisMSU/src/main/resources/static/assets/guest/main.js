// ====== Animasi judul hero & reveal on scroll ======
window.addEventListener('load', () => {
  document.querySelector('.drop-in')?.classList.add('show');
});
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('show');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal-up').forEach(el => io.observe(el));

// Tap animation (mobile)
function addTapAnimation(el) {
  el.addEventListener('touchstart', () => el.classList.add('tap-active'), { passive: true });
  el.addEventListener('touchend', () => setTimeout(() => el.classList.remove('tap-active'), 150));
  el.addEventListener('touchcancel', () => el.classList.remove('tap-active'));
}
document.querySelectorAll('.tap-anim').forEach(addTapAnimation);

// ====== Module: MSU Dates (disimpan di localStorage) ======
// ====== Module: MSU Dates (disimpan di localStorage) ======
// Version 2: Supports start/end date AND time
window.MSUDates = (function () {
  const KEY = 'msu_dates_v2';

  function get() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (e) { return {}; }
  }

  // Accepts: { startDate, startTime, endDate, endTime }
  function set({ startDate, startTime, endDate, endTime }) {
    const d = { startDate, startTime, endDate, endTime };
    localStorage.setItem(KEY, JSON.stringify(d));
  }

  function clear() { localStorage.removeItem(KEY); }

  function isSet() {
    const d = get();
    return Boolean(d.startDate && d.startTime && d.endDate && d.endTime);
  }

  function formatRange() {
    const d = get();
    if (!d.startDate || !d.endDate) return '';
    return `${d.startDate} ${d.startTime || ''} s/d ${d.endDate} ${d.endTime || ''}`;
  }

  return { get, set, clear, isSet, formatRange };
})();

// ====== Render & set DateBar ======
(function initDateBar() {
  const dateStartEl = document.getElementById('dateStart');
  const timeStartEl = document.getElementById('timeStart');
  const dateEndEl = document.getElementById('dateEnd');
  const timeEndEl = document.getElementById('timeEnd');

  const btnSet = document.getElementById('btnSetDates') || document.getElementById('btnCheckAvailability');
  const lbl = document.querySelector('.js-daterange');

  // Prefill dari storage
  const saved = window.MSUDates.get();
  if (dateStartEl && saved.startDate) dateStartEl.value = saved.startDate;
  if (timeStartEl && saved.startTime) timeStartEl.value = saved.startTime;
  if (dateEndEl && saved.endDate) dateEndEl.value = saved.endDate;
  if (timeEndEl && saved.endTime) timeEndEl.value = saved.endTime;

  if (lbl) {
    lbl.textContent = window.MSUDates.isSet()
      ? `Tanggal dipilih: ${window.MSUDates.formatRange()}`
      : 'Belum memilih jadwal.';
  }

  // New Global Function for Checking Stock
  window.checkRealTimeStock = async function (isAuto = false) {
    const saved = window.MSUDates.get();
    if (!saved.startDate || !saved.startTime || !saved.endDate || !saved.endTime) return;

    const btn = document.getElementById('btnSetDates') || document.getElementById('btnCheckAvailability');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Cek...';
    }

    try {
      const url = `/api/peminjaman/check?startDate=${saved.startDate}&startTime=${encodeURIComponent(saved.startTime)}&endDate=${saved.endDate}&endTime=${encodeURIComponent(saved.endTime)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json(); // [{itemId, itemName, available}]

      // Update UI Cards
      document.querySelectorAll('.item-card').forEach(card => {
        const titleEl = card.querySelector('.item-title');
        const name = titleEl ? titleEl.textContent.trim().toLowerCase() : '';

        // Find availability info
        const info = data.find(d => (d.itemName || '').trim().toLowerCase() === name);
        if (info) {
          card.dataset.max = info.available;
        }
      });

      // Refresh UI with new max values
      if (typeof initCards === 'function') initCards();

      if (!isAuto) {
        showToastSuccess('Ketersediaan diperbarui. Silakan pilih item.');
      }
    } catch (e) {
      console.error(e);
      if (!isAuto) showToastInfo('Gagal mengecek ketersediaan terkini.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  };

  btnSet?.addEventListener('click', () => {
    const sd = dateStartEl?.value || '';
    const st = timeStartEl?.value || '';
    const ed = dateEndEl?.value || '';
    const et = timeEndEl?.value || '';

    if (!sd || !st || !ed || !et) {
      showToastInfo('Lengkapi semua input tanggal dan jam.');
      return;
    }

    // Optional: add date validation (end > start)
    const startDT = new Date(`${sd}T${st}`);
    const endDT = new Date(`${ed}T${et}`);
    if (endDT <= startDT) {
      showToastInfo('Waktu kembali harus setelah waktu mulai.');
      return;
    }

    window.MSUDates.set({ startDate: sd, startTime: st, endDate: ed, endTime: et });
    if (lbl) {
      lbl.textContent = `Tanggal dipilih: ${window.MSUDates.formatRange()}`;
    }

    // Call API to check availability
    window.checkRealTimeStock();
  });

  // Auto-save logic
  function saveState() {
    const sd = dateStartEl?.value || '';
    const st = timeStartEl?.value || '';
    const ed = dateEndEl?.value || '';
    const et = timeEndEl?.value || '';
    window.MSUDates.set({ startDate: sd, startTime: st, endDate: ed, endTime: et });
  }

  [dateStartEl, timeStartEl, dateEndEl, timeEndEl].forEach(el => {
    el?.addEventListener('change', saveState);
    el?.addEventListener('input', saveState);
  });

  // Initial label update
  if (lbl) {
    lbl.textContent = window.MSUDates.isSet()
      ? `Tanggal dipilih: ${window.MSUDates.formatRange()}`
      : 'Belum memilih jadwal.';
  }

  // Auto-run check on load if dates are set
  if (window.MSUDates.isSet()) {
    // Run after a short delay to ensure DOM and other scripts are ready
    setTimeout(() => window.checkRealTimeStock(true), 300);
  }

  // ====== Date Validation Logic ======
  function getFormattedDateTime() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time: `${hh}:${min}`,
      fullDate: now
    };
  }

  function validateInputs() {
    if (!dateStartEl || !timeStartEl || !dateEndEl || !timeEndEl) return true;

    const current = getFormattedDateTime();
    const now = new Date();

    // 1. Validate Start Date vs Today
    if (dateStartEl.value && dateStartEl.value < current.date) {
      showToastInfo("Tanggal sudah lewat. Diganti ke hari ini.");
      dateStartEl.value = current.date;
    }

    // 2. Validate Start Time vs Now (if today)
    if (dateStartEl.value === current.date && timeStartEl.value) {
      const selectedStart = new Date(`${dateStartEl.value}T${timeStartEl.value}`);
      // Allow 1 minute buffer or strict? Strict.
      if (selectedStart < now) {
        showToastInfo("Waktu sudah lewat. Harap pilih waktu yang akan datang.");
        timeStartEl.value = current.time;
      }
    }

    // 3. Validate End Date vs Start Date
    if (dateEndEl.value && dateStartEl.value && dateEndEl.value < dateStartEl.value) {
      showToastInfo("Tanggal kembali tidak boleh sebelum tanggal pakai.");
      dateEndEl.value = dateStartEl.value;
    }

    // 4. Validate End Time vs Start Time
    if (dateStartEl.value && timeStartEl.value && dateEndEl.value && timeEndEl.value) {
      const startDT = new Date(`${dateStartEl.value}T${timeStartEl.value}`);
      const endDT = new Date(`${dateEndEl.value}T${timeEndEl.value}`);

      if (endDT <= startDT) {
        showToastInfo("Waktu selesai harus setelah waktu mulai.");
        // Reset end time to start time + 1 hour? Or just clear?
        // Let's just clear or set to start + 1h
        // Simple: clear it to force user to pick again
        timeEndEl.value = '';
        return false;
      }
    }
    return true;
  }

  function setupDateTimeValidation() {
    if (!dateStartEl || !timeStartEl || !dateEndEl || !timeEndEl) return;

    const current = getFormattedDateTime();

    // 1. Set Min Date for Start Date (Today)
    dateStartEl.min = current.date;

    function onStartChange() {
      // Enforce Min Date
      if (dateStartEl.value < current.date) dateStartEl.value = current.date;

      // If Today, Enforce Min Time
      if (dateStartEl.value === current.date) {
        const fresh = getFormattedDateTime();
        timeStartEl.min = fresh.time;

        // If cur val < min
        if (timeStartEl.value && timeStartEl.value < fresh.time) {
          timeStartEl.value = fresh.time;
        }
      } else {
        timeStartEl.removeAttribute('min');
      }

      // Update End Date Min
      if (dateStartEl.value) {
        dateEndEl.min = dateStartEl.value;
        if (dateEndEl.value < dateStartEl.value) dateEndEl.value = dateStartEl.value;
      }
      validateInputs();
    }

    function onTimeStartChange() {
      validateInputs();
      // Update End Time Min if same day
      if (dateEndEl.value === dateStartEl.value && timeStartEl.value) {
        timeEndEl.min = timeStartEl.value;
      }
    }

    // Listener for Start Date
    dateStartEl.addEventListener('change', onStartChange);
    dateStartEl.addEventListener('blur', onStartChange);

    // Listener for End Date
    dateEndEl.addEventListener('change', () => {
      if (dateStartEl.value && dateEndEl.value < dateStartEl.value) {
        dateEndEl.value = dateStartEl.value;
      }
      validateInputs();
    });

    // Listener for Start Time
    timeStartEl.addEventListener('change', onTimeStartChange);
    timeStartEl.addEventListener('blur', onTimeStartChange);

    // Listener for End Time
    timeEndEl.addEventListener('change', validateInputs);
    timeEndEl.addEventListener('blur', validateInputs);

    // Initial check
    if (dateStartEl.value === current.date) {
      timeStartEl.min = current.time;
    }
    if (dateStartEl.value) {
      dateEndEl.min = dateStartEl.value;
    }
  }

  // Run validation setup
  setupDateTimeValidation();

  // Override checkRealTimeStock to validate first
  const originalCheck = window.checkRealTimeStock;
  window.checkRealTimeStock = async function (isAuto) {
    if (!validateInputs()) return;
    if (typeof originalCheck === 'function') await originalCheck(isAuto);
  };


})();

// ====== Setup stok awal ======
// ====== Setup stok awal ======
function initCards() {
  document.querySelectorAll('.item-card').forEach(card => {
    const sisaEl = card.querySelector('.sisa');
    const titleEl = card.querySelector('.item-title');
    if (!sisaEl) return;

    const type = card.dataset.type || 'barang'; // 'barang' or 'ruang'

    // 1. Tentukan Max Stock
    let max = Number(card.dataset.max);
    const name = titleEl ? titleEl.textContent.trim() : '';

    // Check Availability Override (REMOVED: User requested revert)
    /* 
    if (window.MSUStockOverride && window.MSUStockOverride.has(name)) {
       ...
    } else { ... }
    */

    if (isNaN(max) || !card.hasAttribute('data-max')) {
      let initial = Number(sisaEl.textContent.trim() || '0');
      if (Number.isNaN(initial)) initial = 0;

      if (type === 'ruang') {
        max = 1;
      } else {
        max = initial;
      }
      card.dataset.max = max;
    }

    // 2. Cek cart
    let inCart = 0;
    if (window.MSUCart) {
      const name = titleEl ? titleEl.textContent.trim() : '';
      const found = window.MSUCart.get().find(it => it.name === name && it.type === type);
      if (found) inCart = Number(found.quantity || 0);
    }

    // 3. Sisa efektif
    let currentSisa = max - inCart;
    if (currentSisa < 0) currentSisa = 0;

    // 4. Update UI
    sisaEl.textContent = String(currentSisa);
    updateBadgeAndButtons(card, currentSisa);
  });
}
initCards();
window.addEventListener('msu:cart-updated', initCards);

function updateBadgeAndButtons(card, sisa) {
  const type = card.dataset.type || 'barang';
  const max = Number(card.dataset.max || 0);
  const badge = card.querySelector('.badge-status');
  const minusBtn = card.querySelector('.qty-btn[data-action="inc"]');
  const plusBtn = card.querySelector('.qty-btn[data-action="dec"]'); // Button "+" (Decrease Stock / Add to Cart)

  if (badge) {
    if (sisa === 0) {
      badge.textContent = 'Habis';
      badge.style.background = '#a94442';
    } else {
      badge.textContent = 'Active';
      badge.style.background = '#167c73';
    }
  }

  // Logic Disable tombol "+"
  // Disable HANYA jika Stok habis (sisa <= 0). Tanggal dicek saat klik.
  const disableAdd = (sisa <= 0);

  if (type === 'ruang') {
    if (minusBtn) { minusBtn.disabled = (sisa >= 1); minusBtn.style.opacity = minusBtn.disabled ? .6 : 1; }
    if (plusBtn) {
      plusBtn.disabled = disableAdd;
      plusBtn.style.opacity = plusBtn.disabled ? .6 : 1;
      plusBtn.title = "Tambah ke keranjang";
    }
  } else {
    if (minusBtn) { minusBtn.disabled = (sisa >= max); minusBtn.style.opacity = minusBtn.disabled ? .6 : 1; }
    if (plusBtn) {
      plusBtn.disabled = disableAdd;
      plusBtn.style.opacity = plusBtn.disabled ? .6 : 1;
      plusBtn.title = "Tambah ke keranjang";
    }
  }
}

// ... existing toast and modal ... 
// ... keep valid code ...


// ====== Toast util ======
function showToastSuccess(text) {
  const wrap = document.getElementById('toastStack');
  if (!wrap) return alert(text);
  const id = 't' + Date.now();
  wrap.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center text-bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body"><i class="bi bi-check2-circle me-1"></i>${text}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>`);
  const el = document.getElementById(id);
  const t = new bootstrap.Toast(el, { delay: 2200 });
  t.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}
function showToastInfo(text) {
  const wrap = document.getElementById('toastStack');
  if (!wrap) return alert(text);
  const id = 'i' + Date.now();
  wrap.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center text-bg-primary border-0" role="alert" aria-live="polite" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body"><i class="bi bi-info-circle me-1"></i>${text}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>`);
  const el = document.getElementById(id);
  const t = new bootstrap.Toast(el, { delay: 2400 });
  t.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

// ====== Modal Konfirmasi Tambah ======
let pendingCard = null;
const confirmModalEl = document.getElementById('confirmAddModal');
const confirmModal = confirmModalEl ? new bootstrap.Modal(confirmModalEl) : null;
const confirmNameEl = document.getElementById('confirmName');
const confirmTypeEl = document.getElementById('confirmType');
const confirmThumbEl = document.getElementById('confirmThumb');

function openConfirm(card) {
  // Jika item SUDAH ada di cart → langsung tambah tanpa modal
  const name = card.querySelector('.item-title')?.textContent?.trim() || 'Item';
  const typeKey = (card.dataset.type || 'barang');
  if (window.MSUCart?.has(name, typeKey)) {
    // Pastikan tanggal dipilih (beri info saja, tidak diblok)
    if (!window.MSUDates.isSet()) {
      showToastInfo('Pilih tanggal pakai & kembali untuk cek ketersediaan.');
    }
    confirmAddNoRedirect(card); // langsung eksekusi tambah
    return;
  }

  // Jika belum ada, tampilkan modal konfirmasi
  pendingCard = card;
  const type = (typeKey === 'ruang') ? 'Fasilitas / Ruangan' : 'Barang';
  const thumb = card.querySelector('.item-thumb img')?.getAttribute('src') || '';
  if (confirmNameEl) confirmNameEl.textContent = name;
  if (confirmTypeEl) confirmTypeEl.textContent = type;
  if (confirmThumbEl) confirmThumbEl.src = thumb;
  if (confirmModal) confirmModal.show();
  else if (window.confirm(`Tambah "${name}" ke keranjang?`)) confirmAddNoRedirect(card);
}

document.getElementById('confirmAddBtn')?.addEventListener('click', () => {
  if (pendingCard) {
    confirmAddNoRedirect(pendingCard);
    pendingCard = null;
  }
  if (confirmModal) confirmModal.hide();
});

// Tambah ke keranjang TANPA redirect (bisa dipanggil langsung/dari modal)
function confirmAddNoRedirect(card) {
  if (!card) return;
  const type = card.dataset.type || 'barang';
  const sisaEl = card.querySelector('.sisa');
  let sisa = Number(sisaEl?.textContent.trim() || (type === 'ruang' ? 1 : 0));

  // Kurangi stok tampilan 1
  sisa = Math.max(0, sisa - 1);
  if (sisaEl) sisaEl.textContent = String(sisa);
  updateBadgeAndButtons(card, sisa);

  const name = card.querySelector('.item-title')?.textContent?.trim() || (type === 'ruang' ? 'Ruang' : 'Item');
  const thumb = card.querySelector('.item-thumb img')?.getAttribute('src') || '';

  try {
    if (window.MSUCart) {
      MSUCart.add(name, type, thumb, 1);
      MSUCart.renderBadge();
    }
  } catch (e) { /* ignore */ }

  // Info tanggal (hanya informasi; cek real ke backend nanti)
  if (!window.MSUDates.isSet()) {
    showToastInfo('Belum memilih tanggal. Kamu tetap bisa melanjutkan, tapi disarankan pilih tanggal untuk cek ketersediaan.');
  } else {
    showToastSuccess(`${name} ditambahkan (periode ${window.MSUDates.formatRange()}).`);
    return;
  }
  showToastSuccess(`${name} ditambahkan ke keranjang.`);
}

// ====== Expand visual saat klik kartu (kecuali tombol qty) ======
document.addEventListener('click', (e) => {
  const card = e.target.closest('.item-card'); if (!card) return;
  if (e.target.closest('.qty-btn')) return;
  const grid = card.closest('.items-grid');
  const already = card.classList.contains('is-expanded');
  grid.classList.remove('has-expanded');
  grid.querySelectorAll('.item-card').forEach(c => c.classList.remove('is-expanded'));
  if (!already) {
    card.classList.add('is-expanded');
    grid.classList.add('has-expanded');
  }
});

// ====== Klik tombol qty ======
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.qty-btn');
  if (!btn) return;
  const card = btn.closest('.item-card'); if (!card) return;

  const type = card.dataset.type || 'barang';
  const sisaEl = card.querySelector('.sisa');
  let sisa = Number(sisaEl.textContent.trim() || '0');
  const max = Number(card.dataset.max || 0);
  const action = btn.dataset.action; // "dec" (pilih) | "inc" (batal/restore)

  if (action === 'dec') {
    // WAJIB: Cek tanggal dulu
    if (!window.MSUDates.isSet()) {
      showToastInfo('Harap masukkan waktu peminjaman terlebih dahulu.');
      return; // Stop execution
    }
    openConfirm(card);
    return;
  }

  // − : kembalikan stok tampilan (tidak mempengaruhi cart)
  if (type === 'ruang') {
    sisa = Math.min(1, sisa + 1);
  } else {
    sisa = Math.min(max, sisa + 1);
  }
  sisaEl.textContent = String(sisa);
  updateBadgeAndButtons(card, sisa);
});

// Link to specific page if cart not empty
document.getElementById('fabCheckout')?.addEventListener('click', () => {
  const c = (window.MSUCart ? MSUCart.count() : 0);
  if (c <= 0) return;
  window.location.href = '/form?from=fab';
});

// Inisialisasi badge saat load
window.addEventListener('load', () => {
  if (window.MSUCart) MSUCart.renderBadge();
});

// ====== Search realtime (from barang.js) ======
(function initSearch() {
  const q = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  const gridEl = document.getElementById('itemsGrid');
  const emptyState = document.getElementById('emptyState');

  function applyFilter() {
    const term = (q?.value || '').trim().toLowerCase();
    if (!gridEl) return;
    let visible = 0;
    gridEl.querySelectorAll('.col').forEach(col => {
      // Find title locally within the card
      const title = col.querySelector('.item-title')?.textContent?.toLowerCase() || '';
      const match = title.includes(term);
      // Toggle visibility of the COLUMN (parent of card)
      if (col.classList.contains('col')) { // Safe check
        col.style.display = match ? '' : 'none';
      }
      if (match) visible++;
    });
    if (emptyState) emptyState.classList.toggle('d-none', visible > 0);
  }

  if (q) q.addEventListener('input', applyFilter);
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (q) { q.value = ''; applyFilter(); }
  });
})();

/* ====== Live Schedule / Transparency Feature ====== */
// Inject Modal HTML if missing
(function injectScheduleModal() {
  if (document.getElementById('scheduleModal')) return;
  const modalHTML = `
  <div class="modal fade" id="scheduleModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg" style="border-radius: 20px; overflow: hidden;">
        <div class="modal-header border-0 text-white" style="background: linear-gradient(135deg, #167c73, #125c56);">
          <h5 class="modal-title fw-bold"><i class="bi bi-calendar-event me-2"></i>Jadwal Peminjaman</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body p-0">
          <div class="d-flex align-items-center justify-content-between px-4 py-3 bg-light border-bottom">
            <button class="btn btn-sm btn-outline-secondary rounded-circle" id="schedPrevDay"><i class="bi bi-chevron-left"></i></button>
            <div class="fw-bold fs-5 text-dark" id="schedDateDisplay">-</div>
            <button class="btn btn-sm btn-outline-secondary rounded-circle" id="schedNextDay"><i class="bi bi-chevron-right"></i></button>
          </div>
          <div class="p-4" style="min-height: 200px; max-height: 60vh; overflow-y: auto;">
            <div id="schedContent" class="d-flex flex-column gap-3">
              <!-- Content injected here -->
              <div class="text-center text-muted py-5"><span class="spinner-border text-success"></span> Memuat data...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
})();

// Logic
(function initScheduleLogic() {
  const modalEl = document.getElementById('scheduleModal');
  const dateDisplay = document.getElementById('schedDateDisplay');
  const contentBox = document.getElementById('schedContent');
  let currentTargetDate = new Date(); // default today

  let myModal = null; // initialized on first open

  async function loadScheduleFor(dateObj) {
    if (!contentBox) return;
    contentBox.innerHTML = '<div class="text-center text-muted py-5"><span class="spinner-border text-success spinner-border-sm"></span> Memuat data...</div>';

    // Update display
    const dateStr = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (dateDisplay) dateDisplay.textContent = dateStr;

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;

    try {
      const res = await fetch(`/api/peminjaman?date=${isoDate}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const bookings = await res.json(); // Array of PublicBookingDTO

      if (bookings.length === 0) {
        contentBox.innerHTML = `
          <div class="text-center py-5 text-muted opacity-75">
            <i class="bi bi-calendar-check fs-1 d-block mb-3 text-success"></i>
            <div>Tidak ada peminjaman tercatat pada tanggal ini.</div>
            <small>Fasilitas dan barang tersedia untuk dipinjam.</small>
          </div>`;
        return;
      }

      // 1. Group by Session
      const sessions = {
        pagi: [],     // 06.00 - 12.00
        siang: [],    // 12.00 - 18.00
        malam: [],    // 18.00 - 22.00
        seharian: []  // 24 Jam
      };

      bookings.forEach(b => {
        let startHour = 8;
        let timeLabel = "Waktu ditentukan";
        let isFullDay = false;

        // Parse times
        // [Waktu: 2025-12-21 08:00 s/d 2025-12-21 17:00]
        const timeMatch = b.description.match(/\[Waktu:\s*(\d{4}-\d{2}-\d{2}\s+(\d{2}):(\d{2}))\s+s\/d\s+(\d{4}-\d{2}-\d{2}\s+(\d{2}):(\d{2}))/);

        if (timeMatch) {
          // Group 2: Start HH
          startHour = parseInt(timeMatch[2], 10);

          const startFull = timeMatch[1]; // yyyy-mm-dd hh:mm
          const endFull = timeMatch[4];

          // Check for "Seharian" logic (> 20 hours duration)
          let startD = new Date(startFull.replace(' ', 'T'));
          let endD = new Date(endFull.replace(' ', 'T'));
          let diffMs = endD - startD;
          let diffHours = diffMs / (1000 * 60 * 60);

          if (diffHours >= 20) isFullDay = true;

          // Time Label logic (12:32 - 21:32)
          const fullStr = b.description.match(/\[Waktu:\s*([^\]]+)\]/)[1];
          timeLabel = fullStr.replace(/\d{4}-\d{2}-\d{2}\s/g, '');
        } else {
          // Legacy
          const sessionMatch = b.description.match(/\[Sesi:\s*([^\]]+)\]/);
          if (sessionMatch) {
            const s = sessionMatch[1].toLowerCase();
            if (s.includes('siang')) startHour = 13;
            if (s.includes('malam')) startHour = 19;
            if (s.includes('pagi')) startHour = 8;
            timeLabel = sessionMatch[1];
          }
        }

        b.displayTime = timeLabel;

        // Categorize
        if (isFullDay) {
          sessions.seharian.push(b);
        } else {
          // Standard Logic
          if (startHour >= 6 && startHour < 12) sessions.pagi.push(b);
          else if (startHour >= 12 && startHour < 18) sessions.siang.push(b);
          else if (startHour >= 18) sessions.malam.push(b); // Extended Malam > 18
          else sessions.pagi.push(b); // Default fallback
        }
      });

      // 2. Render Groups
      let html = '';

      // Custom Card Style (Updated)
      const renderCard = (b) => {
        // Colors
        let color = '#ffc107'; // Default Yellow (PENDING)
        let badgeBg = '#ffc107';
        let badgeText = '#000';

        if (b.status === 'APPROVED') { color = '#198754'; badgeBg = '#198754'; badgeText = '#fff'; }
        else if (b.status === 'TAKEN') { color = '#0dcaf0'; badgeBg = '#0dcaf0'; badgeText = '#000'; }
        else if (b.status === 'COMPLETED') { color = '#6c757d'; badgeBg = '#6c757d'; badgeText = '#fff'; }
        else if (b.status === 'REJECTED') { color = '#dc3545'; badgeBg = '#dc3545'; badgeText = '#fff'; }

        // Items styling: Gray pill badges with borders
        const itemsHTML = (b.items || []).map(it => {
          return `<span class="badge bg-light text-dark border fw-normal me-2 mb-1" style="font-size: 0.8rem;">
                <i class="bi bi-box-seam me-1 text-secondary"></i>${it}
              </span>`;
        }).join('');

        const maskName = (n) => {
          if (!n || n.length < 3) return n;
          return n[0] + '*'.repeat(20);
        };

        return `
            <div class="card mb-3 border-0 shadow-sm" style="border-radius: 8px; border-left: 5px solid ${color} !important;">
                <div class="card-body py-3">
                    <!-- Top Row: Title + Status -->
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="fw-bold mb-0 text-dark fs-5">${b.department || b.borrowerName}</h6>
                        <span class="badge rounded-pill" style="background-color: ${badgeBg}; color: ${badgeText}; font-size: 0.75rem;">${b.status}</span>
                    </div>

                    <!-- Time Row -->
                    <div class="text-muted small mb-3">
                        <i class="bi bi-clock me-1"></i> ${b.displayTime}
                    </div>
                    
                    <!-- Items Row -->
                    <div class="mb-3 d-flex flex-wrap">
                         ${itemsHTML}
                    </div>

                    <!-- Bottom Row: Footer -->
                    <div class="d-flex justify-content-between align-items-center border-top pt-2">
                         <div class="text-muted small" style="letter-spacing: 1px; font-family: monospace;">
                            <i class="bi bi-person me-2"></i>|${maskName(b.borrowerName)}
                         </div>
                         <div class="small fw-bold text-secondary text-uppercase">${b.department || 'UMUM'}</div>
                    </div>
                </div>
            </div>
         `;
      };

      const renderSection = (label, list) => {
        const content = list.length ? list.map(renderCard).join('') : `<div class="text-muted fst-italic small border-bottom pb-3 mb-3">- Kosong -</div>`;
        return `
            <div class="mb-4">
                <h6 class="fw-bold text-secondary mb-2" style="font-size: 0.95rem;">${label}</h6>
                ${content}
            </div>
          `;
      };

      html += renderSection('Pagi (06.00 - 12.00)', sessions.pagi);
      html += renderSection('Siang (12.00 - 18.00)', sessions.siang);
      html += renderSection('Malam (18.00 - 22.00)', sessions.malam);
      html += renderSection('Seharian (24 Jam)', sessions.seharian);

      contentBox.innerHTML = html;

      if (!html) {
        contentBox.innerHTML = `
          <div class="text-center py-5 text-muted opacity-75">
            <i class="bi bi-calendar-x fs-1 d-block mb-3"></i>
            <div>Tidak ada peminjaman pada sesi Pagi/Siang/Malam.</div>
          </div>`;
      } else {
        contentBox.innerHTML = html;
      }

    } catch (err) {
      console.error(err);
      contentBox.innerHTML = `<div class="text-center text-danger py-4"><i class="bi bi-exclamation-circle me-2"></i> Gagal memuat data jadwal.</div>`;
    }
  }

  // Global global method to open
  window.openScheduleModal = function () {
    // Try to get date from MSUDates if set
    let d = new Date();
    const saved = window.MSUDates?.get();
    if (saved && saved.startDate) {
      d = new Date(saved.startDate);
    }
    currentTargetDate = d;

    if (!myModal && modalEl) myModal = new bootstrap.Modal(modalEl);
    if (myModal) myModal.show();

    loadScheduleFor(currentTargetDate);
  }
  // Prev/Next handlers
  document.getElementById('schedPrevDay')?.addEventListener('click', () => {
    currentTargetDate.setDate(currentTargetDate.getDate() - 1);
    loadScheduleFor(currentTargetDate);
  });
  document.getElementById('schedNextDay')?.addEventListener('click', () => {
    currentTargetDate.setDate(currentTargetDate.getDate() + 1);
    loadScheduleFor(currentTargetDate);
  });

  // Attach to button if exists (auto init)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#btnShowCalendar');
    if (btn) {
      window.openScheduleModal();
    }
  });

})();

// End of main.js
