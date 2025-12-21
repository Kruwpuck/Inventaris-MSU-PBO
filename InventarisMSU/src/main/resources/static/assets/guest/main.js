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
  const plusBtn = card.querySelector('.qty-btn[data-action="dec"]');

  if (badge) {
    if (sisa === 0) {
      badge.textContent = 'Habis';
      badge.style.background = '#a94442';
    } else {
      badge.textContent = 'Active';
      badge.style.background = '#167c73';
    }
  }
  if (type === 'ruang') {
    if (minusBtn) { minusBtn.disabled = (sisa >= 1); minusBtn.style.opacity = minusBtn.disabled ? .6 : 1; }
    if (plusBtn) { plusBtn.disabled = (sisa <= 0); plusBtn.style.opacity = plusBtn.disabled ? .6 : 1; }
  } else {
    if (minusBtn) { minusBtn.disabled = (sisa >= max); minusBtn.style.opacity = minusBtn.disabled ? .6 : 1; }
    if (plusBtn) { plusBtn.disabled = (sisa <= 0); plusBtn.style.opacity = plusBtn.disabled ? .6 : 1; }
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
    // Sebelum tambah, sarankan pilih tanggal (opsional)
    if (!window.MSUDates.isSet()) {
      showToastInfo('Pilih tanggal pakai & kembali untuk cek ketersediaan.');
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

    // Use local time for date string to avoid timezone shifts
    // But ISO string is UTC. We want YYYY-MM-DD in local time.
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

      contentBox.innerHTML = bookings.map(b => {
        // b: id, borrowerName, department, description, status, items (List<String>)
        // Parse description for time info? Description: "[Sesi: Pagi...]"
        let timeLabel = "Waktu tidak spesifik";
        const sessionMatch = b.description.match(/\[Sesi:\s*([^\]]+)\]/);
        if (sessionMatch) timeLabel = sessionMatch[1];

        const statusColor = (b.status === 'APPROVED' || b.status === 'COMPLETED') ? '#198754' : '#ffc107';
        const bgStatus = (b.status === 'APPROVED' || b.status === 'COMPLETED') ? '#e8f5e9' : '#fff3cd';
        const textStatus = (b.status === 'APPROVED' || b.status === 'COMPLETED') ? '#198754' : '#856404';

        // Items styling
        const itemsHTML = (b.items || []).map(it => `
            <div class="d-flex align-items-center bg-white border px-3 py-2 rounded-3 shadow-sm" style="min-width: fit-content;">
                <i class="bi bi-check-circle-fill me-2" style="color: ${statusColor}"></i>
                <span class="fw-semibold text-dark">${it}</span>
            </div>
        `).join('');

        return `
        <div class="card border-0 mb-3 shadow-sm" style="border-radius: 16px; overflow:hidden; transition: transform 0.2s;">
          <div class="card-header border-0 d-flex justify-content-between align-items-center px-4 py-3" style="background-color: ${bgStatus};">
             <div class="d-flex align-items-center gap-2">
                <span class="badge rounded-pill border border-1" style="background-color: #fff; color: ${textStatus}; border-color: ${statusColor} !important;">
                   ${b.status}
                </span>
                <span class="fw-bold fs-6" style="color: ${textStatus}">${b.department || 'Peminjam'}</span>
             </div>
             <div class="small" style="color: ${textStatus}; opacity: 0.8;">
                <i class="bi bi-person-fill"></i> ${b.borrowerName}
             </div>
          </div>
          
          <div class="card-body px-4 py-4">
               <!-- Time Section -->
               <div class="d-flex align-items-center mb-4">
                  <div class="d-flex align-items-center justify-content-center rounded-circle me-3" style="width:48px;height:48px; background-color: #f1f3f5;">
                     <i class="bi bi-clock-history fs-4 text-secondary"></i>
                  </div>
                  <div>
                     <div class="small text-muted text-uppercase fw-bold" style="letter-spacing:0.5px; font-size: 0.7rem;">Waktu Peminjaman</div>
                     <div class="fw-bold text-dark fs-5">${timeLabel}</div>
                  </div>
               </div>

               <!-- Items Section -->
               <div>
                  <div class="small text-muted mb-2 fw-bold text-uppercase" style="font-size: 0.7rem; letter-spacing:0.5px;">Barang / Fasilitas Dipinjam</div>
                  <div class="d-flex flex-wrap gap-2">
                     ${itemsHTML || '<div class="text-muted small fst-italic px-2">Tidak ada detail barang</div>'}
                  </div>
               </div>
          </div>
        </div>`;
      }).join('');

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
