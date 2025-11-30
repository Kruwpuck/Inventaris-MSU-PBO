/* =======================
   booking-barang.js (FULL)
   ======================= */

/* ---------- Animasi ---------- */
function markRevealTargets() {
  document.querySelectorAll(`
    .navbar-masjid,
    .page-title,
    .summary-card,
    .form-card,
    .badge
  `).forEach(el => el.classList.add('reveal-up'));
}
function initRevealObserver() {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('show');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: .12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll('.reveal-up').forEach(el => io.observe(el));
}
window.addEventListener('load', () => document.querySelector('.drop-in')?.classList.add('show'));
window.addEventListener('DOMContentLoaded', () => { markRevealTargets(); initRevealObserver(); });

/* ---------- Util ---------- */
function toRupiah(n) { return new Intl.NumberFormat('id-ID').format(Number(n || 0)); }
function todayISO() {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return t.toISOString().split('T')[0];
}

/* ---------- Donasi Quick Fill ---------- */
document.querySelectorAll('.btn-donasi').forEach(btn => {
  btn.addEventListener('click', () => {
    const amt = btn.getAttribute('data-amt');
    const input = document.getElementById('donationAmount');
    if (input) input.value = amt;
  });
});

/* ---------- CART RENDER (list ke bawah) ---------- */
const listEl = document.getElementById('cartList');
function renderCartList() {
  if (listEl && window.MSUCart) {
    listEl.innerHTML = MSUCart.toListHTML();  // sudah berbentuk <ul><li> list ke bawah
  }
}
renderCartList();

/* Hapus semua cart */
document.getElementById('clearCartBtn')?.addEventListener('click', () => {
  if (!confirm("Yakin ingin menghapus semua dari keranjang?")) return;
  if (window.MSUCart) MSUCart.clear();
  renderCartList();
  buildTabsFromCart(); // refresh panel kiri
  window.MSUCart?.renderBadge();
});

/* ---------- PANEL KIRI: Tabs Horizontal Multi-Item ---------- */
const tabsUL = document.getElementById('itemTabs');
const tabsContent = document.getElementById('itemTabContent');

/* Gambar default jika tidak ada thumb */
function fallbackThumbFor(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('proyektor')) return 'proyektor.jpeg';
  if (lower.includes('sound')) return 'sound.jpeg';
  if (lower.includes('karpet')) return 'karpet.jpeg';
  if (lower.includes('terpal')) return 'terpal.jpeg';
  return 'https://placehold.co/600x400';
}

/* Booked dates berbeda per barang (contoh) */
function getBookedDaysFor(itemName, y, m) {
  // MAPPING CONTOH:
  // - Proyektor: tanggal 5,12,19
  // - Sound System: 7,14,21
  // - Karpet: 3,9,27
  const base = (itemName || '').toLowerCase();
  if (base.includes('proyektor')) return [5, 12, 19];
  if (base.includes('sound')) return [7, 14, 21];
  if (base.includes('karpet')) return [3, 9, 27];
  // default: 10 & 20
  return [10, 20];
}

function isToday(y, m, d) {
  const t = new Date();
  return y === t.getFullYear() && m === t.getMonth() && d === t.getDate();
}

/* ---------- Dummy booking list (1/3 hari) ---------- */
function getBookingsFor(itemName, y, m, day) {
  // Contoh: data dummy untuk beberapa tanggal di November 2025
  const res = [];
  if (y === 2025 && m === 10 && day === 7) {
    res.push(
      { slot: 'Pagi (1/3)', kegiatan: 'Latihan Paduan Suara', pj: 'UKM PSM' },
      { slot: 'Siang (2/3)', kegiatan: 'Lomba Cerdas Cermat', pj: 'Panitia Acara Kampus' }
    );
  } else if (y === 2025 && m === 10 && day === 12) {
    res.push(
      { slot: 'Pagi (1/3)', kegiatan: 'Briefing Panitia Kajian Akbar', pj: 'DKM MSU' },
      { slot: 'Malam (3/3)', kegiatan: 'Gladi Bersih Acara', pj: 'Panitia Acara Kampus' }
    );
  } else if (y === 2025 && m === 10 && day === 19) {
    res.push(
      { slot: 'Siang (2/3)', kegiatan: 'Latihan Tari', pj: 'UKM Seni Tari' }
    );
  }
  return res;
}

/* Mapping label → jam */
function slotTime(label) {
  const lower = (label || '').toLowerCase();
  if (lower.startsWith('pagi')) return '07.00 – 12.00';
  if (lower.startsWith('siang')) return '12.00 – 17.00';
  if (lower.startsWith('malam')) return '17.00 – 22.00';
  return '';
}

/* Render booking list di bawah kalender */
function renderBookingList(container, itemName, y, m, day) {
  const box = container.querySelector('.booking-list-body');
  const headerDate = container.querySelector('.booking-list-header .date-label');
  if (!box) return;

  const bookings = getBookingsFor(itemName, y, m, day);
  const dObj = new Date(y, m, day);
  const label = dObj.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  if (headerDate) headerDate.textContent = label;

  if (!bookings.length) {
    box.innerHTML = `<div class="booking-list-empty">
      Belum ada peminjaman tercatat pada tanggal ini.
    </div>`;
    return;
  }

  box.innerHTML = bookings.map(b => {
    const time = slotTime(b.slot);
    const slotLabel = time ? `${b.slot} • ${time}` : b.slot;

    return `
      <div class="booking-list-item">
        <div class="bli-slot">${slotLabel}</div>
        <div class="bli-main">${b.kegiatan}</div>
        <div class="bli-meta">PJ: ${b.pj}</div>
      </div>
    `;
  }).join('');
}

/* Render mini kalender spesifik barang */
function renderCalendarFor(container, itemName, refDate) {
  const calTitle = container.querySelector('.cal-title');
  const calGrid = container.querySelector('.calendar-grid');
  const y = refDate.getFullYear(), m = refDate.getMonth();

  const first = new Date(y, m, 1);
  const startDay = (first.getDay() + 6) % 7; // Senin=0
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const booked = new Set(getBookedDaysFor(itemName, y, m));

  if (calTitle) {
    calTitle.textContent = refDate.toLocaleDateString('id-ID', {
      month: 'long', year: 'numeric'
    });
  }

  let html = '';
  'S N S R K J S'.split(' ').forEach(h => html += `<span class="muted">${h}</span>`);
  for (let i = startDay; i > 0; i--) {
    html += `<span class="muted">${prevDays - i + 1}</span>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cls = [
      'day',
      isToday(y, m, d) ? 'today' : '',
      booked.has(d) ? 'booked' : ''
    ].join(' ').trim();
    html += `<span class="${cls}" data-day="${d}">${d}</span>`;
  }
  calGrid.innerHTML = html;

  const dayCells = calGrid.querySelectorAll('.day');

  dayCells.forEach(el => {
    el.addEventListener('click', () => {
      const d = Number(el.dataset.day);
      dayCells.forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      renderBookingList(container, itemName, y, m, d);
    });
  });

  // Default: pilih hari ini / hari pertama yang terbooking / tgl 1
  let defaultDay = null;
  const today = new Date();
  if (today.getFullYear() === y && today.getMonth() === m) {
    defaultDay = today.getDate();
  }
  if (!defaultDay) {
    for (let d = 1; d <= daysInMonth; d++) {
      if (booked.has(d)) { defaultDay = d; break; }
    }
  }
  if (!defaultDay) defaultDay = 1;

  const defCell = calGrid.querySelector(`.day[data-day="${defaultDay}"]`);
  if (defCell) {
    defCell.classList.add('selected');
    renderBookingList(container, itemName, y, m, defaultDay);
  } else {
    const box = container.querySelector('.booking-list-body');
    const headerDate = container.querySelector('.booking-list-header .date-label');
    if (headerDate) {
      headerDate.textContent = new Date(y, m, 1).toLocaleDateString('id-ID', {
        month: 'long', year: 'numeric'
      });
    }
    if (box) {
      box.innerHTML = `<div class="booking-list-empty">
        Belum ada peminjaman tercatat pada bulan ini.
      </div>`;
    }
  }
}

/* Build satu panel barang (isi tab) */
function buildItemPanelHTML(item) {
  const name = item.name || 'Barang';
  const thumb = item.thumb || fallbackThumbFor(name);
  const qty = Number(item.qty || 0);

  return `
    <div class="item-panel">
      <div class="summary-thumb mb-3">
        <img src="${thumb}" alt="${name}">
        <span class="badge-status">Active</span>
      </div>
      <div class="text-center">
        <div class="title h4 mb-1">${name}</div>
        <div class="text-muted">Dipinjam: <b><span class="qty-display-text">${qty}</span>x</b></div>

        <div class="d-flex justify-content-center gap-2 mt-2">
          <button class="btn btn-qty btn-qminus" type="button" aria-label="Kurangi">
            <i class="bi bi-dash-lg"></i>
          </button>
          <div class="qty-display">${qty}</div>
          <button class="btn btn-qty btn-qplus" type="button" aria-label="Tambah">
            <i class="bi bi-plus-lg"></i>
          </button>
        </div>
        <small class="text-muted d-block mt-1">Atur jumlah yang akan dipinjam</small>
      </div>

      <div class="mini-calendar mt-3">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <button class="cal-nav cal-prev" type="button" aria-label="Bulan sebelumnya"><i class="bi bi-chevron-left"></i></button>
          <strong class="cal-title">-</strong>
          <button class="cal-nav cal-next" type="button" aria-label="Bulan berikutnya"><i class="bi bi-chevron-right"></i></button>
        </div>
        <div class="calendar-legend mb-2">
          <span class="legend-box booked"></span><small class="ms-1 me-3">Terbooking/Habis</small>
          <span class="legend-box today"></span><small class="ms-1">Hari ini</small>
        </div>
        <div class="calendar-grid" aria-hidden="true"></div>
      </div>

      <div class="booking-list mt-3">
        <div class="booking-list-header">
          <span class="bl-title">Peminjaman (1/3 hari)</span>
          <span class="date-label"></span>
        </div>
        <div class="booking-list-body mt-2 small"></div>
      </div>
    </div>
  `;
}

/* ---------- Build Tabs dari Keranjang ---------- */
function buildTabsFromCart() {
  if (!tabsUL || !tabsContent) return;
  const cart = (window.MSUCart && MSUCart.get()) || [];

  // Kosongkan dulu
  tabsUL.innerHTML = '';
  tabsContent.innerHTML = '';

  if (!cart.length) {
    tabsContent.innerHTML = `
      <div class="p-3 text-center text-muted border rounded-3">
        Keranjang kosong. Silakan pilih barang/ruang dari halaman sebelumnya.
      </div>`;
    return;
  }

  cart.forEach((it, idx) => {
    const tabId = `tab-${idx}`;
    const panelId = `panel-${idx}`;

    // Tab header (horizontal)
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.innerHTML = `
      <button class="nav-link ${idx === 0 ? 'active' : ''}" id="${tabId}"
              data-bs-toggle="tab" data-bs-target="#${panelId}" type="button" role="tab"
              aria-controls="${panelId}" aria-selected="${idx === 0}">
        ${it.name}
        <span class="badge text-bg-success ms-2">${it.qty}x</span>
      </button>
    `;
    tabsUL.appendChild(li);

    // Panel body
    const pane = document.createElement('div');
    pane.className = `tab-pane fade ${idx === 0 ? 'show active' : ''}`;
    pane.id = panelId;
    pane.setAttribute('role', 'tabpanel');
    pane.setAttribute('aria-labelledby', tabId);

    // Simpan nama item & refDate sebagai state panel
    pane.dataset.itemName = it.name;
    pane.dataset.refDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    pane.innerHTML = buildItemPanelHTML(it);
    tabsContent.appendChild(pane);
  });

  // Inisialisasi kalender & handler tiap panel
  initPanels();
  // Sinkronkan validasi tanggal sesuai tab aktif
  syncDateBlockWithActiveItem();
  // Render ringkasan keranjang kanan
  renderCartList();
}

/* ---------- Helper: Panel aktif & nama item aktif ---------- */
function getActivePanel() {
  return tabsContent.querySelector('.tab-pane.active.show') ||
    tabsContent.querySelector('.tab-pane.active') || null;
}
function getActiveItemName() {
  const pane = getActivePanel();
  return pane ? (pane.dataset.itemName || '') : '';
}

/* ---------- Kalender per-panel & qty ---------- */
function initPanels() {
  tabsContent.querySelectorAll('.tab-pane').forEach(pane => {
    const name = pane.dataset.itemName || '';
    // Ref date dari dataset
    let ref = new Date(pane.dataset.refDate || (new Date().toISOString()));
    // Render pertama
    renderCalendarFor(pane, name, ref);

    // Nav prev/next
    const prevBtn = pane.querySelector('.cal-prev');
    const nextBtn = pane.querySelector('.cal-next');
    prevBtn?.addEventListener('click', () => {
      ref.setMonth(ref.getMonth() - 1);
      pane.dataset.refDate = new Date(ref.getFullYear(), ref.getMonth(), 1).toISOString();
      renderCalendarFor(pane, name, ref);
      if (pane.classList.contains('active')) syncDateBlockWithActiveItem();
    });
    nextBtn?.addEventListener('click', () => {
      ref.setMonth(ref.getMonth() + 1);
      pane.dataset.refDate = new Date(ref.getFullYear(), ref.getMonth(), 1).toISOString();
      renderCalendarFor(pane, name, ref);
      if (pane.classList.contains('active')) syncDateBlockWithActiveItem();
    });

    // Qty +/- per panel → update cart
    const minus = pane.querySelector('.btn-qminus');
    const plus = pane.querySelector('.btn-qplus');
    const qtyBox = pane.querySelector('.qty-display');
    const qtyText = pane.querySelector('.qty-display-text');

    function setQty(newQty) {
      const clean = Math.max(0, Number(newQty || 0));
      qtyBox.textContent = String(clean);
      qtyText.textContent = String(clean);

      // Update badge pada tab header
      const index = Array.from(tabsContent.children).findIndex(pp => pp === pane);
      const tabButton = document.getElementById(index >= 0 ? `tab-${index}` : '');
      if (tabButton) {
        const badge = tabButton.querySelector('.badge');
        if (badge) badge.textContent = `${clean}x`;
      }

      // Update cart
      MSUCart?.upsertItem({ type: 'barang', name: name, qty: clean, thumb: '' });
      MSUCart?.renderBadge();
      renderCartList();

      // Jika qty=0 → rebuild tabs biar panel menghilang
      if (clean === 0) {
        buildTabsFromCart();
      }
    }

    minus?.addEventListener('click', () => {
      const cur = Number(qtyBox.textContent.trim() || '0');
      setQty(cur - 1);
    });
    plus?.addEventListener('click', () => {
      const cur = Number(qtyBox.textContent.trim() || '0');
      setQty(cur + 1);
    });
  });

  // Saat ganti tab → sinkron blok tanggal sesuai item aktif
  tabsUL.querySelectorAll('[data-bs-toggle="tab"]').forEach(btn => {
    btn.addEventListener('shown.bs.tab', () => {
      syncDateBlockWithActiveItem();
    });
  });
}

/* ---------- Blocking tanggal berdasarkan item aktif ---------- */
const loanDate = document.getElementById('loanDate');

function bookedSetFor(date) {
  const pane = getActivePanel();
  if (!pane) return new Set();
  const name = pane.dataset.itemName || '';
  const y = date.getFullYear(), m = date.getMonth();
  return new Set(getBookedDaysFor(name, y, m));
}

function syncDateBlockWithActiveItem() {
  if (!loanDate) return;
  // Min hari ini
  const today = new Date(); today.setHours(0, 0, 0, 0);
  loanDate.min = today.toISOString().split('T')[0];

  // Jika nilai loanDate saat ini kebetulan termasuk merah untuk item aktif → kosongkan
  if (loanDate.value) {
    const d = new Date(loanDate.value);
    const booked = bookedSetFor(d);
    if (booked.has(d.getDate())) {
      loanDate.value = '';
    }
  }
}

// Validasi saat user memilih tanggal
loanDate?.addEventListener('change', () => {
  if (!loanDate.value) return;
  const d = new Date(loanDate.value);
  const booked = bookedSetFor(d);
  if (booked.has(d.getDate())) {
    alert('Tanggal yang dipilih terbooking untuk item aktif. Silakan pilih tanggal lain.');
    loanDate.value = '';
  }
});

/* =========================================================
   SUBMIT VIA MAILTO (Tanpa backend) — kirim ke email peminjam
   ========================================================= */

/* Konfigurasi admin untuk cc/bcc (opsional) */
const MAIL_CC_ADMIN = 'admin@msu.ac.id';   // kosongkan '' jika tidak perlu CC
const MAIL_BCC_ADMIN = '';                  // isi jika ingin BCC

/* Build mailto URL */
function buildMailtoURL({ to, subject, body, cc = '', bcc = '' }) {
  const params = [];
  if (cc) params.push('cc=' + encodeURIComponent(cc));
  if (bcc) params.push('bcc=' + encodeURIComponent(bcc));
  if (subject) params.push('subject=' + encodeURIComponent(subject));
  if (body) params.push('body=' + encodeURIComponent(body));
  const query = params.join('&');
  return `mailto:${encodeURIComponent(to)}${query ? '?' + query : ''}`;
}

/* ---------- Submit: sertakan semua item & donasi → buka draft email ---------- */
(function wrapSubmitMulti_Mailto() {
  const form = document.getElementById('bookingForm');
  const btnSubmit = document.getElementById('btnSubmit');
  const reqInput = document.getElementById('requirements');

  function getDonation() {
    const v = document.getElementById('donationAmount')?.value || '0';
    const n = Number(v); return isNaN(n) ? 0 : n;
  }

  function validateForm() {
    if (!form) return;
    const requiredValid = [...form.querySelectorAll('[required]')].every(el => el.value && el.checkValidity());
    const cartHasQty = (MSUCart?.count() || 0) > 0;
    const fileOK = !!reqInput?.files?.length;
    btnSubmit.disabled = !(requiredValid && cartHasQty && fileOK);
  }

  form?.addEventListener('input', validateForm);
  form?.addEventListener('change', validateForm);
  reqInput?.addEventListener('change', () => {
    const f = reqInput.files?.[0];
    if (!f) return validateForm();
    const max = 10 * 1024 * 1024; // 10MB
    if (f.size > max) {
      alert('Ukuran maksimum file 10 MB.');
      reqInput.value = '';
    }
    validateForm();
  });

  // tombol batal → kembali ke halaman barang
  document.getElementById('btnCancel')?.addEventListener('click', () => {
    if (confirm('Batalkan pengisian form dan kembali ke halaman sebelumnya?')) {
      window.location.href = 'barang.html';
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      validateForm();
      return;
    }

    const loanNo = document.getElementById('loanNumber')?.value?.trim() || '';
    const email = document.getElementById('email')?.value?.trim() || '';
    const pj = document.getElementById('pjName')?.value?.trim() || '';
    const nim = document.getElementById('idNumber')?.value?.trim() || '';
    const prodi = document.getElementById('studyProgram')?.value || '';
    const kep = document.getElementById('purpose')?.value?.trim() || '';
    const det = document.getElementById('longPurpose')?.value?.trim() || '';
    const tgl = document.getElementById('loanDate')?.value || '';
    const jam = document.getElementById('startTime')?.value || '';
    const dur = (document.getElementById('duration')?.value || '') + ' jam';
    const don = getDonation();

    if (email) localStorage.setItem('lastBookingEmail', email);

    const cart = (MSUCart && MSUCart.get()) || [];
    if (!cart.length) {
      alert('Keranjang kosong.');
      return;
    }
    const lines = cart
      .map(it => `- ${it.type === 'ruang' ? '[Ruang]' : '[Barang]'} ${it.name} × ${it.qty}`)
      .join('\n');

    const subject = `Konfirmasi Booking MSU — ${pj || email} — ${tgl || '-'}`;
    const body =
      `Assalamu’alaikum,

Formulir booking Anda telah kami terima dan saat ini sedang diproses pengelola.

Ringkasan Peminjaman:
Nomor Peminjaman : ${loanNo || '-'}
Penanggung jawab : ${pj || '-'}
NIM/NIP           : ${nim || '-'}
Email             : ${email || '-'}
Prodi/Unit        : ${prodi || '-'}
Keperluan         : ${kep || '-'}

Jadwal:
Tanggal : ${tgl || '-'}
Mulai   : ${jam || '-'}
Durasi  : ${dur || '-'}

Item diajukan:
${lines || '(kosong)'}

Donasi QRIS: Rp${toRupiah(don)}

Catatan:
${det || '-'}

Terima kasih.
— Masjid Syamsul Ulum`;

    const mailtoURL = buildMailtoURL({
      to: email || 'user@example.com',
      subject,
      body,
      cc: MAIL_CC_ADMIN,
      bcc: MAIL_BCC_ADMIN
    });

    // Upaya backup: salin isi email ke clipboard (jaga-jaga kalau URL mailto terlalu panjang)
    try { await navigator.clipboard?.writeText(body); } catch (_) { }

    // Buka draft email di client user
    window.open(mailtoURL, '_blank');

    // Bereskan UI → kosongkan keranjang & redirect ke success
    try { MSUCart.clear(); MSUCart.renderBadge(); } catch (_) { }
    window.location.href = 'success.html';
  });

  // initial
  validateForm();
})();

/* ---------- Bootstrap awal ---------- */
buildTabsFromCart();
window.MSUCart?.renderBadge();

window.addEventListener('msu:cart-updated', () => {
  renderCartList();
  buildTabsFromCart();
  window.MSUCart?.renderBadge();
});
