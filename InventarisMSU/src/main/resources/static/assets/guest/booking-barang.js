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
window.addEventListener('DOMContentLoaded', () => {
    markRevealTargets();
    initRevealObserver();
    initUI(); // Initialize UI elements

    /* Setup Modal Konfirmasi Hapus */
    const delModalEl = document.getElementById('confirmDeleteModal');
    let delModalFn = null; // callback action
    let delModalInst = null;
    if (delModalEl) {
        delModalInst = new bootstrap.Modal(delModalEl);
        document.getElementById('btnConfirmDelAction')?.addEventListener('click', () => {
            if (delModalFn) delModalFn();
            delModalInst.hide();
        });
    }
    // Global helper agar bisa dipanggil di mana saja
    window.openDelConfirm = function (title, msg, onConfirm) {
        if (!delModalInst) {
            if (confirm(msg)) onConfirm(); // Fallback
            return;
        }
        document.getElementById('confirmDelTitle').textContent = title;
        document.getElementById('confirmDelMsg').textContent = msg;
        delModalFn = onConfirm;
        delModalInst.show();
    };

    /* Hapus semua cart */
    document.getElementById('clearCartBtn')?.addEventListener('click', () => {
        window.openDelConfirm(
            'Hapus Semua?',
            'Apakah anda ingin menghapus semua barang dari keranjang?',
            () => {
                if (window.MSUCart) MSUCart.clear();
                renderCartList();
                buildTabsFromCart();
                window.MSUCart?.renderBadge();
            }
        );
    });
});

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

/* ---------- PANEL KIRI: Tabs Horizontal Multi-Item ---------- */
let tabsUL, tabsContent, listEl;

function initUI() {
    if (!tabsUL) tabsUL = document.getElementById('itemTabs');
    if (!tabsContent) tabsContent = document.getElementById('itemTabContent');
    if (!listEl) listEl = document.getElementById('cartList');
}

/* ---------- CART RENDER (list ke bawah) ---------- */
function renderCartList() {
    initUI();
    if (listEl && window.MSUCart) {
        listEl.innerHTML = MSUCart.toListHTML();  // sudah berbentuk <ul><li> list ke bawah
    }
}

/* Gambar default jika tidak ada thumb */
function fallbackThumbFor(name) {
    const lower = (name || '').toLowerCase();
    if (lower.includes('proyektor')) return 'proyektor.jpeg';
    if (lower.includes('sound')) return 'sound.jpeg';
    if (lower.includes('karpet')) return 'karpet.jpeg';
    if (lower.includes('terpal')) return 'terpal.jpeg';
    return 'https://placehold.co/600x400';
}

/* Fetch booked days from API */
async function fetchBookedDays(itemName, y, m) {
    // API expects month 1-12
    const apiMonth = m + 1;
    try {
        const url = `/api/peminjaman/month?itemName=${encodeURIComponent(itemName)}&year=${y}&month=${apiMonth}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        return await res.json(); // Array of integers [1, 2, 23, ...]
    } catch (e) {
        return [];
    }
}

function isToday(y, m, d) {
    const t = new Date();
    return y === t.getFullYear() && m === t.getMonth() && d === t.getDate();
}

/* Render mini kalender spesifik barang */
async function renderCalendarFor(container, itemName, refDate) {
    const calTitle = container.querySelector('.cal-title');
    const calGrid = container.querySelector('.calendar-grid');
    const y = refDate.getFullYear(), m = refDate.getMonth();

    if (calTitle) {
        calTitle.textContent = refDate.toLocaleDateString('id-ID', {
            month: 'long', year: 'numeric'
        });
    }

    // Render skeleton/loading state first? Or just render days and then update dots?
    // Let's fetch first.
    let bookedList = [];
    try {
        bookedList = await fetchBookedDays(itemName, y, m);
    } catch (e) { }

    const booked = new Set(bookedList);

    const first = new Date(y, m, 1);
    const startDay = (first.getDay() + 6) % 7; // Senin=0
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();

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

    // Default selection logic: Today if in month, else first booked day, else 1
    let defaultDay = 1;
    const today = new Date();
    if (today.getFullYear() === y && today.getMonth() === m) {
        defaultDay = today.getDate();
    } else {
        // If not today, find first booked day
        if (booked.size > 0) {
            const sorted = Array.from(booked).sort((a, b) => a - b);
            defaultDay = sorted[0];
        }
    }

    // Highlight default
    const defCell = calGrid.querySelector(`.day[data-day="${defaultDay}"]`);
    if (defCell) {
        defCell.classList.add('selected');
        // If we are auto-selecting today or a booked day, load the list
        renderBookingList(container, itemName, y, m, defaultDay);
    } else {
        // Fallback manual trigger if cell logic fails
        renderBookingList(container, itemName, y, m, defaultDay);
    }
}
/* Render booking list di bawah kalender */
async function renderBookingList(container, itemName, y, m, day) {
    const box = container.querySelector('.booking-list-body');
    const headerEl = container.querySelector('.booking-list-header');
    if (!box) return;

    // Format Date: "Minggu, 21 Desember 2025"
    const dObj = new Date(y, m, day);
    const label = dObj.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Update Header Style to match image
    if (headerEl) {
        headerEl.innerHTML = `
            <div class="d-flex justify-content-between align-items-end border-bottom pb-2 mb-2">
                <span class="fw-bold" style="color: #1a535c; font-size: 1.1rem;">Peminjaman</span>
                <span class="text-muted small">${label}</span>
            </div>
        `;
    }

    box.innerHTML = '<div class="text-center text-muted py-3"><span class="spinner-border spinner-border-sm text-success"></span> Memuat...</div>';

    try {
        const mon = String(m + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        const iso = `${y}-${mon}-${dd}`;

        const res = await fetch(`/api/peminjaman?date=${iso}`);
        if (!res.ok) throw new Error('Network err');
        const allBookings = await res.json();

        // Filter
        const relevant = allBookings.filter(b => {
            if (!b.items) return false;
            return b.items.some(it => it.toLowerCase().includes((itemName || '').toLowerCase()));
        });

        if (!relevant.length) {
            box.innerHTML = `<div class="p-3 text-muted fst-italic text-center small bg-light rounded">
                Belum ada peminjaman tercatat untuk item ini pada tanggal ini.
            </div>`;
            return;
        }

        // Grouping
        const sessions = { pagi: [], siang: [], malam: [], seharian: [] };
        relevant.forEach(b => {
            let startHour = 8;
            let timeLabel = "Waktu ditentukan";
            let isFullDay = false;

            // Time Parse
            const timeMatch = b.description.match(/\[Waktu:\s*(\d{4}-\d{2}-\d{2}\s+(\d{2}):(\d{2}))\s+s\/d\s+(\d{4}-\d{2}-\d{2}\s+(\d{2}):(\d{2}))/);
            if (timeMatch) {
                startHour = parseInt(timeMatch[2], 10);
                const startFull = timeMatch[1].replace(' ', 'T');
                const endFull = timeMatch[4].replace(' ', 'T');
                const dur = (new Date(endFull) - new Date(startFull)) / 36e5;
                if (dur >= 20) isFullDay = true;
                const fullStr = b.description.match(/\[Waktu:\s*([^\]]+)\]/)[1];
                timeLabel = fullStr.replace(/\d{4}-\d{2}-\d{2}\s/g, '');
            } else {
                const sm = b.description.match(/\[Sesi:\s*([^\]]+)\]/);
                if (sm) {
                    const s = sm[1].toLowerCase();
                    if (s.includes('siang')) startHour = 13;
                    if (s.includes('malam')) startHour = 19;
                    if (s.includes('pagi')) startHour = 8;
                    timeLabel = sm[1];
                }
            }
            b._displayTime = timeLabel;

            if (isFullDay) sessions.seharian.push(b);
            else {
                if (startHour >= 6 && startHour < 12) sessions.pagi.push(b);
                else if (startHour >= 12 && startHour < 18) sessions.siang.push(b);
                else if (startHour >= 18) sessions.malam.push(b);
                else sessions.pagi.push(b);
            }
        });

        const renderCard = (b) => {
            const maskName = (n) => (!n || n.length < 3) ? n : '|' + '*'.repeat(15);
            // Name display: use department if avail, else borrowerName
            const mainName = b.department || b.borrowerName;

            const matchedItem = (b.items || []).find(it => it.toLowerCase().includes((itemName || '').toLowerCase())) || (b.items?.[0] || 'Item');

            return `
            <div class="card mb-3 border-0 shadow-sm" style="border-left: 5px solid #198754 !important; background: #fff;">
                <div class="card-body py-3 px-3">
                    <div class="d-flex justify-content-between mb-2">
                        <div class="fw-bold text-dark fs-6">${mainName}</div>
                        <div class="fw-bold text-dark fs-6">${b._displayTime}</div>
                    </div>
                    <div class="d-flex justify-content-between align-items-end">
                        <div class="text-muted small" style="font-family: monospace;">
                            ${maskName(b.borrowerName)} 
                            <span class="fw-bold ms-2 text-success">
                               <i class="bi bi-box-seam me-1"></i>${matchedItem}
                            </span>
                        </div>
                        <div class="text-uppercase fw-bold text-secondary small" style="font-size: 0.75rem;">
                            ${b.status}
                        </div>
                    </div>
                </div>
            </div>
            `;
        };

        const renderSection = (title, list) => {
            if (!list.length) return `
               <div class="mb-4">
                  <h6 class="fw-bold text-secondary mb-2" style="font-size: 1rem;">${title}</h6>
                  <div class="text-muted fst-italic small mb-2">- Kosong -</div>
               </div>
            `;

            return `
               <div class="mb-4">
                  <h6 class="fw-bold text-secondary mb-2" style="font-size: 1rem;">${title}</h6>
                  ${list.map(renderCard).join('')}
               </div>
            `;
        };

        let html = '';
        html += renderSection('Pagi (06.00 - 12.00)', sessions.pagi);
        html += renderSection('Siang (12.00 - 18.00)', sessions.siang);
        html += renderSection('Malam (18.00 - 22.00)', sessions.malam);
        if (sessions.seharian.length > 0) {
            html += renderSection('Seharian (24 Jam)', sessions.seharian);
        }

        box.innerHTML = html;

    } catch (e) {
        console.error(e);
        box.innerHTML = `<div class="text-danger small text-center">Gagal memuat data.</div>`;
    }
}



/* Build satu panel barang (isi tab) */
/* Build satu panel barang (isi tab) */
function buildItemPanelHTML(item) {
    const name = item.name || 'Barang';
    const thumb = item.imageUrl || item.thumb || fallbackThumbFor(name);
    const qty = Number(item.quantity || item.qty || 0);

    // Logic: Treat 999 or 9999 as "Default/Unlimited" regarding display
    let hasMax = (item.maxQty !== undefined && item.maxQty !== null);
    let max = hasMax ? Number(item.maxQty) : 999;

    // If max is default (999 or 9999), treat as not set for display
    // This fixes the "Stok: 999" initial flicker
    if (max >= 999) {
        hasMax = false;
        max = 999;
    }

    const isRuang = (item.type === 'ruang');
    const effectiveMax = isRuang ? 1 : max;
    const disablePlus = (qty >= effectiveMax);

    // Text logic: if max is default/unset and not Room, show placeholder
    let stockDisplay = `(Stok tersedia: ${effectiveMax})`;
    if (!hasMax && !isRuang) {
        stockDisplay = `<small class="text-muted opacity-75">(Pilih tanggal untuk cek stok)</small>`;
    }

    return `
    <div class="item-panel">
      <div class="summary-thumb mb-3">
        <img src="${thumb}" alt="${name}">
        <span class="badge-status">Active</span>
      </div>
      <div class="text-center">
        <div class="title h4 mb-1">${name}</div>
        <div class="text-muted small mb-3">${isRuang ? 'Fasilitas / Ruangan' : 'Barang Inventaris'}</div>

        <div class="d-flex justify-content-center align-items-center gap-3 mb-3">
           <button class="btn btn-sm btn-outline-secondary rounded-circle btn-qminus" 
                   style="width:32px;height:32px"><i class="bi bi-dash"></i></button>
           <span class="fw-bold fs-5 qty-display qty-display-text" style="min-width:40px">${qty}</span>
           <button class="btn btn-sm btn-outline-secondary rounded-circle btn-qplus" 
                   style="width:32px;height:32px" ${disablePlus ? 'disabled' : ''}><i class="bi bi-plus"></i></button>
        </div>
        <div class="text-muted small mb-3 stock-limit-text">
             ${isRuang ? '(Maks 1)' : stockDisplay}
        </div>
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
    initUI();
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
        <span class="badge text-bg-success ms-2">${it.quantity || it.qty || 0}x</span>
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
        pane.dataset.itemType = it.type;
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

    // TRIGGER CHECK NOW that elements exist
    if (typeof checkRealtimeAvailability === 'function') {
        checkRealtimeAvailability();
    }
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
        const type = pane.dataset.itemType || 'barang';
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
            const cart = (window.MSUCart && MSUCart.get()) || [];
            const item = cart.find(it => it.name === name);
            const max = item ? (item.maxQty || 999) : 999;
            const isRuang = (type === 'ruang');
            let effectiveMax = isRuang ? 1 : max;

            // Check Dynamic Max from real-time API
            if (pane.dataset.dynamicMax) {
                const dm = Number(pane.dataset.dynamicMax);
                if (!isNaN(dm)) effectiveMax = dm;
            }

            let clean = Number(newQty || 0);
            if (clean < 0) clean = 0;
            if (clean > effectiveMax) clean = effectiveMax;

            qtyBox.textContent = String(clean);
            qtyText.textContent = String(clean);

            // Update disabled state of plus button
            if (plus) plus.disabled = (clean >= effectiveMax);

            // Update badge pada tab header
            const index = Array.from(tabsContent.children).findIndex(pp => pp === pane);
            const tabButton = document.getElementById(index >= 0 ? `tab-${index}` : '');
            if (tabButton) {
                const badge = tabButton.querySelector('.badge');
                if (badge) badge.textContent = `${clean}x`;
            }

            // Update cart
            MSUCart?.update(name, type, clean);
            MSUCart?.renderBadge();
            renderCartList();

            // Jika qty=0 → rebuild tabs biar panel menghilang
            if (clean === 0) {
                buildTabsFromCart();
            }
        }

        minus?.addEventListener('click', () => {
            const current = Number(qtyBox.textContent || 0);
            if (current <= 1) {
                // Konfirmasi dulu sebelum jadi 0 (hapus)
                window.openDelConfirm(
                    'Hapus Item?',
                    `Apakah anda ingin menghapus "${name}" dari keranjang?`,
                    () => setQty(0)
                );
            } else {
                setQty(current - 1);
            }
        });
        plus?.addEventListener('click', () => {
            const current = Number(qtyBox.textContent || 0);
            setQty(current + 1);
        });


    });

    // Saat ganti tab → sinkron blok tanggal sesuai item aktif
    tabsUL.querySelectorAll('[data-bs-toggle="tab"]').forEach(btn => {
        btn.addEventListener('shown.bs.tab', () => {
            syncDateBlockWithActiveItem();
        });
    });
}

/* ---------- Real-time Availability Check ---------- */
/* ---------- Real-time Availability Check ---------- */
const startDateEl = document.getElementById('startDate');
const startTimeEl = document.getElementById('startTime');
const endDateEl = document.getElementById('endDate');
const endTimeEl = document.getElementById('endTime');

async function checkRealtimeAvailability() {
    const sd = startDateEl?.value;
    const st = startTimeEl?.value;
    const ed = endDateEl?.value;
    const et = endTimeEl?.value;

    // Only check if all fields are filled
    if (!sd || !st || !ed || !et) return;

    try {
        const url = `/api/peminjaman/check?startDate=${sd}&startTime=${encodeURIComponent(st)}&endDate=${ed}&endTime=${encodeURIComponent(et)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Availability check failed');

        const availabilityData = await res.json(); // Array of {itemId, itemName, available}

        console.log("checkRealtimeAvailability: Data received", availabilityData);

        // --- UPDATE UI PANELS ---
        const tabsContent = document.getElementById('itemTabContent');
        if (!tabsContent) return;

        // Iterate over all panels (items in cart)
        Array.from(tabsContent.querySelectorAll('.tab-pane')).forEach(pane => {
            const rawName = pane.dataset.itemName;
            const type = pane.dataset.itemType;
            if (!rawName) return;

            const normalizedName = rawName.trim().toLowerCase();

            // Robust Match
            const stockInfo = availabilityData.find(s => (s.itemName || '').trim().toLowerCase() === normalizedName);
            let realAvailable = 999;

            if (stockInfo) {
                realAvailable = stockInfo.available;
            }

            // Ruangan max always 1
            if (type === 'ruang') {
                realAvailable = (realAvailable > 0) ? 1 : 0;
            }

            console.log(`Checking ${rawName}: RealAvailable=${realAvailable}`);

            // Update Text "Stok tersedia: X"
            // Use the specific class we added
            const limitEl = pane.querySelector('.stock-limit-text');
            if (limitEl) {
                if (type === 'ruang') {
                    limitEl.textContent = '(Maks 1)';
                } else {
                    limitEl.textContent = `(Stok tersedia: ${realAvailable})`;
                }
            } else {
                console.warn("Stock limit text element not found for", rawName);
            }

            // Update Controls
            const qtyBox = pane.querySelector('.qty-display');
            const qtyText = pane.querySelector('.qty-display-text');
            const plusBtn = pane.querySelector('.btn-qplus');

            let currentQty = Number(qtyBox?.textContent || 0);

            // Auto-reduce if current > available
            if (currentQty > realAvailable) {
                currentQty = realAvailable;
                if (qtyBox) qtyBox.textContent = currentQty;
                if (qtyText) qtyText.textContent = currentQty;

                // Update Badge
                const index = Array.from(tabsContent.children).findIndex(p => p === pane);
                const tabButton = document.getElementById(index >= 0 ? `tab-${index}` : '');
                if (tabButton) {
                    const badge = tabButton.querySelector('.badge');
                    if (badge) badge.textContent = `${currentQty}x`;
                }

                // Update MSUCart
                if (window.MSUCart) window.MSUCart.update(rawName, type, currentQty);
            }

            // Update Plus Button State
            if (plusBtn) {
                plusBtn.disabled = (currentQty >= realAvailable);
            }

            // Update pane dataset for setQty to use
            pane.dataset.dynamicMax = realAvailable;
        });

    } catch (e) {
        console.error("Error checking availability:", e);
    }
}

// Add listeners
[startDateEl, startTimeEl, endDateEl, endTimeEl].forEach(el => {
    el?.addEventListener('change', checkRealtimeAvailability);
});

// Setup on load: Populate dates from MSUDates if available, then check
document.addEventListener('DOMContentLoaded', () => {
    // Populate form fields from MSUDates (Global Storage)
    if (window.MSUDates) {
        const saved = window.MSUDates.get();
        if (startDateEl && saved.startDate) startDateEl.value = saved.startDate;
        if (startTimeEl && saved.startTime) startTimeEl.value = saved.startTime;
        if (endDateEl && saved.endDate) endDateEl.value = saved.endDate;
        if (endTimeEl && saved.endTime) endTimeEl.value = saved.endTime;
    }

    // Trigger check if all values exist
    if (startDateEl?.value && startTimeEl?.value && endDateEl?.value && endTimeEl?.value) {
        // slight delay to ensure tabs are built
        setTimeout(() => {
            if (document.getElementById('itemTabContent')?.children?.length) {
                checkRealtimeAvailability();
            }
        }, 300);
    }
});

/* Legacy syncing (keeping it for non-blocking UI sync if needed, but the real check is above) */
function syncDateBlockWithActiveItem() {
    // Legacy local check code removed or minimized
    if (!loanDate) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    loanDate.min = today.toISOString().split('T')[0];
}

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

    /* SUBMIT HANDLER - Modified for Modal Confirmation */
    form?.addEventListener('submit', async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            validateForm();
            return;
        }

        // Show Confirmation Modal first
        const confirmSubmitModalEl = document.getElementById('confirmSubmitModal');
        const confirmSubmitModal = confirmSubmitModalEl ? new bootstrap.Modal(confirmSubmitModalEl) : null;
        const btnRealSubmit = document.getElementById('btnRealSubmit');

        if (confirmSubmitModal) {
            confirmSubmitModal.show();
            // Handle real submit inside modal button click
            // Remove previous listeners using cloned node or just setting onclick (simple way for this context)
            // Using onclick property to overwrite previous handler if user opens modal multiple times
            btnRealSubmit.onclick = function () {
                confirmSubmitModal.hide();
                processSubmission();
            };
        } else {
            // Fallback if modal missing
            if (confirm("Pastikan data sudah benar. Kirim booking?")) processSubmission();
        }
    });

    async function processSubmission() {
        const loanNo = document.getElementById('loanNumber')?.value?.trim() || '';
        const email = document.getElementById('email')?.value?.trim() || '';
        const pj = document.getElementById('pjName')?.value?.trim() || '';
        const nim = document.getElementById('idNumber')?.value?.trim() || '';
        const prodi = document.getElementById('studyProgram')?.value || '';
        const kep = document.getElementById('purpose')?.value?.trim() || '';
        const det = document.getElementById('longPurpose')?.value?.trim() || '';

        const sd = document.getElementById('startDate')?.value || '';
        const st = document.getElementById('startTime')?.value || '';
        const ed = document.getElementById('endDate')?.value || '';
        const et = document.getElementById('endTime')?.value || '';

        // Calculate simple duration in hours for reference (optional)
        // This is just a rough estimate for the 'duration' field if backend needs it
        let dur = 0;
        try {
            const start = new Date(`${sd}T${st}`);
            const end = new Date(`${ed}T${et}`);
            const diffMs = end - start;
            dur = Math.floor(diffMs / (1000 * 60 * 60));
            if (dur < 1) dur = 1;
        } catch (e) { }

        if (email) localStorage.setItem('lastBookingEmail', email);

        const cart = (MSUCart && MSUCart.get()) || [];
        if (!cart.length) {
            alert('Keranjang kosong.');
            return;
        }

        /* BACKEND SUBMIT */
        const formData = new FormData();
        const pjName = document.getElementById('pjName');
        const idNumber = document.getElementById('idNumber');
        const studyProgram = document.getElementById('studyProgram');
        const purpose = document.getElementById('purpose');
        const longPurpose = document.getElementById('longPurpose');
        const loanNumber = document.getElementById('loanNumber');
        const locationInput = document.getElementById('location');

        formData.append('borrowerName', pjName.value);
        formData.append('email', email);
        formData.append('phone', loanNumber.value);
        formData.append('nimNip', idNumber.value);
        formData.append('department', studyProgram.value);
        formData.append('reason', purpose.value);
        formData.append('location', locationInput.value);

        // Descriptive string with time info
        const timeInfo = `[Waktu: ${sd} ${st} s/d ${ed} ${et}]`;
        formData.append('description', `${timeInfo} ${longPurpose.value}`);

        formData.append('startDate', sd);
        formData.append('startTime', st);
        formData.append('endDate', ed);
        formData.append('endTime', et);
        formData.append('duration', dur);

        const fileInput = document.getElementById('requirements');
        if (fileInput.files.length > 0) {
            formData.append('file', fileInput.files[0]);
        }

        const identityInput = document.getElementById('identityFile');
        if (identityInput && identityInput.files.length > 0) {
            formData.append('identityFile', identityInput.files[0]);
        }

        formData.append('items', JSON.stringify(cart));

        // Loading state
        const originalText = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Mengirim...';

        try {
            const response = await fetch('/api/peminjaman', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                MSUCart.clear();
                window.location.href = '/success';
            } else {
                const text = await response.text();
                throw new Error(text);
            }
        } catch (err) {
            console.error(err);
            alert('Gagal menyimpan booking: ' + err.message);
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalText;
        }
    }

    // Load meta booking (tanggal, sesi) dari localStorage (std: msu_dates_v2)
    try {
        const meta = JSON.parse(localStorage.getItem('msu_dates_v2') || '{}');
        if (meta.startDate && document.getElementById('startDate')) {
            document.getElementById('startDate').value = meta.startDate;
        }
        if (meta.startTime && document.getElementById('startTime')) {
            document.getElementById('startTime').value = meta.startTime;
        }
        if (meta.endDate && document.getElementById('endDate')) {
            document.getElementById('endDate').value = meta.endDate;
        }
        if (meta.endTime && document.getElementById('endTime')) {
            document.getElementById('endTime').value = meta.endTime;
        }
    } catch (e) { }


    // initial
    validateForm();
})();

/* ---------- Bootstrap awal ---------- */
// Panggil sekali saat load agar jika data sudah ada di localStorage (via cart.js init), tabs langsung muncul
if (window.MSUCart) {
    buildTabsFromCart();
    MSUCart.renderBadge();
} else {
    // Fallback jika MSUCart belum siap (async load), tunggu event
    window.addEventListener('load', () => {
        if (window.MSUCart) {
            buildTabsFromCart();
            MSUCart.renderBadge();
        }
    });
}

window.addEventListener('msu:cart-updated', () => {
    renderCartList();
    buildTabsFromCart();
    window.MSUCart?.renderBadge();
});
