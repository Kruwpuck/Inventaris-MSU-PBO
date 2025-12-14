// ==== Reveal on scroll & drop-in ====
window.addEventListener('load', () => {
  document.querySelector('.drop-in')?.classList.add('show');
});
const io = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); obs.unobserve(e.target); } });
}, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll('.reveal-up').forEach(el => io.observe(el));

// Tap animation (mobile)
function addTapAnimation(el) {
  el.addEventListener('touchstart', () => el.classList.add('tap-active'), { passive: true });
  el.addEventListener('touchend', () => setTimeout(() => el.classList.remove('tap-active'), 150));
  el.addEventListener('touchcancel', () => el.classList.remove('tap-active'));
}
document.querySelectorAll('.tap-anim').forEach(addTapAnimation);

// ==== Inisialisasi setiap kartu ruang (max 1) ====
// ==== Inisialisasi setiap kartu ruang (max 1) ====
function initCards() {
  document.querySelectorAll('.item-card').forEach(card => {
    const sisaEl = card.querySelector('.sisa');
    const titleEl = card.querySelector('.item-title');
    if (!sisaEl) return;

    // 1. Tentukan Max Stock (untuk ruang selalu 1 atau 0 dari server)
    let max = Number(card.dataset.max);
    if (isNaN(max) || !card.hasAttribute('data-max')) {
      let val = Number(sisaEl.textContent.trim() || '1');
      if (Number.isNaN(val)) val = 1;
      // Clamp between 0 and 1 for rooms
      max = Math.min(1, Math.max(0, val));
      card.dataset.max = max;
    }

    // 2. Cek apakah item ini ada di keranjang local
    let inCart = 0;
    if (window.MSUCart) {
      const name = titleEl ? titleEl.textContent.trim() : '';
      // Note: type 'ruang'
      const found = window.MSUCart.get().find(it => it.name === name && it.type === 'ruang');
      if (found) inCart = Number(found.quantity || 0);
    }

    // 3. Hitung sisa efektif
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
  const badge = card.querySelector('.badge-status');
  const minusBtn = card.querySelector('.qty-btn[data-action="inc"]'); // − batal
  const plusBtn = card.querySelector('.qty-btn[data-action="dec"]'); // ＋ pilih

  if (badge) {
    if (sisa === 0) { badge.textContent = 'Habis'; badge.style.background = '#a94442'; }
    else { badge.textContent = 'Active'; badge.style.background = '#167c73'; }
  }
  if (minusBtn) minusBtn.disabled = (sisa >= 1);
  if (plusBtn) plusBtn.disabled = (sisa <= 0);
}

// ==== Search ====
const q = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearSearch');
const gridEl = document.getElementById('itemsGrid');
const emptyState = document.getElementById('emptyState');

function applyFilter() {
  const term = (q?.value || '').trim().toLowerCase();
  let visible = 0;
  gridEl.querySelectorAll('.col').forEach(col => {
    const title = col.querySelector('.item-title')?.textContent?.toLowerCase() || '';
    const match = title.includes(term);
    col.style.display = match ? '' : 'none';
    if (match) visible++;
  });
  emptyState?.classList.toggle('d-none', visible > 0);
}
q?.addEventListener('input', applyFilter);
clearBtn?.addEventListener('click', () => { if (q) { q.value = ''; applyFilter(); } });

// ==== Toast util ====
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

// ==== Modal konfirmasi tambah ====
let pendingCard = null;
const confirmModalEl = document.getElementById('confirmAddModal');
const confirmModal = confirmModalEl ? new bootstrap.Modal(confirmModalEl) : null;
const confirmNameEl = document.getElementById('confirmName');
const confirmTypeEl = document.getElementById('confirmType');
const confirmThumbEl = document.getElementById('confirmThumb');

function openConfirm(card) {
  pendingCard = card;
  const name = card.querySelector('.item-title')?.textContent?.trim() || 'Ruang';
  const thumb = card.querySelector('.item-thumb img')?.getAttribute('src') || '';
  if (confirmNameEl) confirmNameEl.textContent = name;
  if (confirmTypeEl) confirmTypeEl.textContent = 'Ruang';
  if (confirmThumbEl) confirmThumbEl.src = thumb;
  if (confirmModal) confirmModal.show();
  else if (window.confirm(`Pilih "${name}"?`)) confirmAddNoRedirect();
}

document.getElementById('confirmAddBtn')?.addEventListener('click', () => {
  confirmAddNoRedirect();
  if (confirmModal) confirmModal.hide();
});

function confirmAddNoRedirect() {
  if (!pendingCard) return;
  const card = pendingCard; pendingCard = null;

  // pilih ruang (sisa -> 0)
  const sisaEl = card.querySelector('.sisa');
  let sisa = Number(sisaEl.textContent.trim() || '1');
  sisa = Math.max(0, sisa - 1);
  sisaEl.textContent = String(sisa);
  updateBadgeAndButtons(card, sisa);

  // masuk ke keranjang
  const name = card.querySelector('.item-title')?.textContent?.trim() || 'Ruang';
  const thumb = card.querySelector('.item-thumb img')?.getAttribute('src') || '';
  try {
    if (window.MSUCart) {
      MSUCart.add(name, 'ruang', thumb, 1, 1); // Pass max 1
      MSUCart.renderBadge();
    }
  } catch (e) { }
  showToastSuccess(`${name} ditambahkan ke keranjang.`);
}

// Klik tombol qty
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.qty-btn'); if (!btn) return;
  const card = btn.closest('.item-card'); if (!card) return;

  const sisaEl = card.querySelector('.sisa');
  let sisa = Number(sisaEl.textContent.trim() || '1');
  const action = btn.dataset.action;

  if (action === 'dec') { // ＋ → pilih (konfirmasi)
    openConfirm(card);
    return;
  }

  // − : batalkan (kembalikan ketersediaan ke 1)
  sisa = Math.min(1, sisa + 1);
  sisaEl.textContent = String(sisa);
  updateBadgeAndButtons(card, sisa);
});

// Expand visual saat klik kartu (kecuali tombol qty)
document.addEventListener('click', (e) => {
  const card = e.target.closest('.item-card'); if (!card) return;
  if (e.target.closest('.qty-btn')) return;
  const grid = card.closest('.items-grid');
  const already = card.classList.contains('is-expanded');
  grid.classList.remove('has-expanded');
  grid.querySelectorAll('.item-card').forEach(c => c.classList.remove('is-expanded'));
  if (!already) { card.classList.add('is-expanded'); grid.classList.add('has-expanded'); }
});

// FAB → ke halaman booking (jika ada isi keranjang)
document.getElementById('fabCheckout')?.addEventListener('click', () => {
  const c = (window.MSUCart ? MSUCart.count() : 0);
  if (c <= 0) return;
  window.location.href = '/form?from=fab';
});

// Inisialisasi badge saat load
window.addEventListener('load', () => {
  if (window.MSUCart) MSUCart.renderBadge();
});

// ==== Schedule Filter & Interaction Lock ====
let isScheduleFixed = false;

function initScheduleFilter() {
  const dateStart = document.getElementById('filterDateStart');
  const dateEnd = document.getElementById('filterDateEnd');
  const timeStart = document.getElementById('filterTime');
  const duration = document.getElementById('filterDuration');
  const btnCheck = document.getElementById('btnCheckAvailability');
  const resultText = document.getElementById('filterResultText');

  if (!dateStart || !btnCheck) return;

  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  dateStart.min = today;
  dateStart.value = today;

  // Auto-set end date based on start date (simple logic for now)
  dateStart.addEventListener('change', () => {
    if (dateStart.value) dateEnd.value = dateStart.value;
  });

  // Load saved meta if any
  const saved = JSON.parse(localStorage.getItem('msu_dates_v1') || '{}');
  if (saved.start) {
    dateStart.value = saved.start;
    dateEnd.value = saved.end || saved.start;
  }
  if (saved.time) timeStart.value = saved.time;
  if (saved.duration) duration.value = saved.duration;

  // Initial state: Disable all item buttons
  toggleItemButtons(false);

  btnCheck.addEventListener('click', () => {
    if (!dateStart.value || !timeStart.value || !duration.value) {
      alert('Mohon lengkapi tanggal, jam mulai, dan durasi peminjaman.');
      return;
    }

    // "Check" logic (simulation)
    isScheduleFixed = true;
    toggleItemButtons(true);

    // Update UI text
    const d = new Date(dateStart.value).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    resultText.innerHTML = `<span class="text-success fw-bold"><i class="bi bi-check-circle me-1"></i>Jadwal dipilih:</span> ${d} (Jam ${timeStart.value}, ${duration.value} jam)`;
    resultText.classList.remove('text-muted');

    // Save meta
    const meta = {
      start: dateStart.value,
      end: dateEnd.value,
      time: timeStart.value,
      duration: duration.value
    };
    localStorage.setItem('msu_dates_v1', JSON.stringify(meta));

    // Scroll to items
    document.getElementById('itemsGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // AUTO-CHECK if data exists
  if (dateStart.value && timeStart.value && duration.value) {
    // Gunakan timeout kecil agar UI stabil dulu
    setTimeout(() => btnCheck.click(), 50);
  }
}

function toggleItemButtons(enable) {
  const btns = document.querySelectorAll('.qty-btn');
  btns.forEach(btn => {
    btn.disabled = !enable;
    // Visual feedback
    if (!enable) {
      btn.closest('.item-card').style.opacity = '0.6';
      btn.closest('.item-card').style.pointerEvents = 'none';
    } else {
      btn.closest('.item-card').style.opacity = '1';
      btn.closest('.item-card').style.pointerEvents = 'auto';
    }
  });

  // Re-run updateBadgeAndButtons to ensure correct state (e.g. if already selected)
  if (enable) {
    document.querySelectorAll('.item-card').forEach(card => {
      const sisaEl = card.querySelector('.sisa');
      const sisa = Number(sisaEl.textContent.trim() || '1');
      updateBadgeAndButtons(card, sisa);
    });
  }
}

// Helper to save/load meta (copied from barang.js for consistency)
function saveBookingMeta(meta) {
  try { localStorage.setItem('msu_booking_meta', JSON.stringify(meta)); } catch (e) { }
}
function loadBookingMeta() {
  try { return JSON.parse(localStorage.getItem('msu_booking_meta') || '{}'); } catch (e) { return {}; }
}

// Initialize filter on load
window.addEventListener('DOMContentLoaded', initScheduleFilter);

// Search awal
applyFilter();
