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
window.MSUDates = (function () {
  const KEY = 'msu_dates_v1';

  function get() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch (e) { return {}; }
  }

  function set({ start, end, time, duration }) {
    const d = {};
    if (start) d.start = start;
    if (end) d.end = end;
    if (time) d.time = time;
    if (duration) d.duration = duration;
    localStorage.setItem(KEY, JSON.stringify(d));
  }

  function clear() { localStorage.removeItem(KEY); }

  function isSet() {
    const d = get();
    return Boolean(d.start && d.end);
  }

  function formatRange() {
    const d = get();
    if (!d.start || !d.end) return '';
    const extra = [];
    if (d.time) extra.push(`Jam ${d.time}`);
    if (d.duration) extra.push(`${d.duration} jam`);
    const extraStr = extra.length ? ` (${extra.join(', ')})` : '';
    return `${d.start} → ${d.end}${extraStr}`;
  }

  return { get, set, clear, isSet, formatRange };
})();

// ====== Render & set DateBar ======
(function initDateBar() {
  const inpStart = document.getElementById('dateStart');
  const inpEnd = document.getElementById('dateEnd');
  const inpTime = document.getElementById('timeStart');
  const selDur = document.getElementById('durationSel');
  const btnSet = document.getElementById('btnSetDates');
  const lbl = document.querySelector('.js-daterange');

  // Prefill dari storage
  const saved = window.MSUDates.get();
  if (inpStart && saved.start) inpStart.value = saved.start;
  if (inpEnd && saved.end) inpEnd.value = saved.end;
  if (inpTime && saved.time) inpTime.value = saved.time;
  if (selDur && saved.duration) selDur.value = saved.duration;

  if (lbl) {
    lbl.textContent = (saved.start && saved.end)
      ? `Tanggal dipilih: ${window.MSUDates.formatRange()}`
      : 'Belum memilih tanggal.';
  }

  btnSet?.addEventListener('click', () => {
    const s = inpStart?.value || '';
    const e = inpEnd?.value || '';
    const t = inpTime?.value || '';
    const dur = selDur?.value || '';

    if (!s || !e) {
      showToastInfo('Pilih tanggal pakai & kembali terlebih dahulu.');
      return;
    }
    if (e < s) {
      showToastInfo('Tanggal kembali tidak boleh lebih awal dari tanggal pakai.');
      return;
    }

    window.MSUDates.set({ start: s, end: e, time: t, duration: dur });

    if (lbl) {
      lbl.textContent = `Tanggal dipilih: ${window.MSUDates.formatRange()}`;
    }

    showToastSuccess('Tanggal pemakaian tersimpan. Gunakan tombol ＋ untuk tambah ke keranjang.');
  });
})();

// ====== Setup stok awal ======
function initCards() {
  document.querySelectorAll('.item-card').forEach(card => {
    const sisaEl = card.querySelector('.sisa');
    if (!sisaEl) return;
    const initial = Number(sisaEl.textContent.trim() || '0');
    const type = card.dataset.type || 'barang';
    card.dataset.max = (type === 'ruang') ? 1 : (Number.isNaN(initial) ? 0 : initial);
    sisaEl.textContent = String(type === 'ruang' ? Math.min(1, initial || 1) : initial);
    updateBadgeAndButtons(card, Number(sisaEl.textContent));
  });
}
initCards();

function updateBadgeAndButtons(card, sisa) {
  const type = card.dataset.type || 'barang';
  const max = Number(card.dataset.max || 0);
  const badge = card.querySelector('.badge-status');
  const minusBtn = card.querySelector('.qty-btn[data-action="inc"]'); // − batal / tambah sisa
  const plusBtn = card.querySelector('.qty-btn[data-action="dec"]'); // ＋ pilih

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
