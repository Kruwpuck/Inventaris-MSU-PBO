// ==== Reveal on scroll & drop-in ====
window.addEventListener('load', () => {
  document.querySelector('.drop-in')?.classList.add('show');
});
const io = new IntersectionObserver((entries,obs)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('show'); obs.unobserve(e.target);} });
},{threshold:.12, rootMargin:"0px 0px -40px 0px"});
document.querySelectorAll('.reveal-up').forEach(el=>io.observe(el));

// Tap animation (mobile)
function addTapAnimation(el){
  el.addEventListener('touchstart', ()=>el.classList.add('tap-active'), {passive:true});
  el.addEventListener('touchend',   ()=>setTimeout(()=>el.classList.remove('tap-active'),150));
  el.addEventListener('touchcancel',()=>el.classList.remove('tap-active'));
}
document.querySelectorAll('.tap-anim').forEach(addTapAnimation);

// ==== Util ====
function todayISO(){
  const t = new Date(); t.setHours(0,0,0,0);
  return t.toISOString().split('T')[0];
}
function saveBookingMeta(meta){
  try{ localStorage.setItem('msu_booking_meta', JSON.stringify(meta)); }catch(e){}
}
function loadBookingMeta(){
  try{ return JSON.parse(localStorage.getItem('msu_booking_meta') || '{}'); }catch(e){ return {}; }
}

// ==== Inject toolbar Tanggal/Jam/Durasi (seperti index) ====
(function ensureBookingToolbar(){
  const searchSection = document.querySelector('.search-wrap')?.parentElement; // <section> SEARCH
  if(!searchSection || document.getElementById('bookingMetaBar')) return;

  // nilai default / previously saved
  const prev = loadBookingMeta();
  const defDate = prev.tanggal || todayISO();
  const defTime = prev.mulai || '10:00';
  const defDur  = prev.durasi || '2';

  const bar = document.createElement('div');
  bar.id = 'bookingMetaBar';
  bar.className = 'mt-3 reveal-up';
  bar.innerHTML = `
    <div class="row g-2 align-items-end">
      <div class="col-12 col-md-4">
        <label class="form-label mb-1">Tanggal Peminjaman</label>
        <input type="date" class="form-control" id="loanDateMeta" min="${todayISO()}" value="${defDate}">
      </div>
      <div class="col-6 col-md-4">
        <label class="form-label mb-1">Jam Mulai</label>
        <input type="time" class="form-control" id="startTimeMeta" value="${defTime}">
      </div>
      <div class="col-6 col-md-4">
        <label class="form-label mb-1">Durasi</label>
        <select class="form-select" id="durationMeta">
          <option value="" disabled>Pilih</option>
          <option value="1">1 jam</option>
          <option value="2">2 jam</option>
          <option value="3">3 jam</option>
          <option value="4">4 jam</option>
          <option value="8">Seharian</option>
        </select>
      </div>
    </div>
  `;
  searchSection.insertAdjacentElement('afterend', bar);

  // set durasi default
  const durSel = bar.querySelector('#durationMeta');
  if(durSel) durSel.value = defDur;

  // simpan saat berubah
  function persist(){
    const tanggal = document.getElementById('loanDateMeta')?.value || todayISO();
    const mulai   = document.getElementById('startTimeMeta')?.value || '10:00';
    const durasi  = document.getElementById('durationMeta')?.value || '2';
    saveBookingMeta({ tanggal, mulai, durasi });
  }
  bar.addEventListener('input', persist);
  bar.addEventListener('change', persist);
})();

// ==== Inisialisasi stok & tombol ====
function initCards(){
  document.querySelectorAll('.item-card').forEach(card=>{
    const sisaEl = card.querySelector('.sisa');
    if(!sisaEl) return;
    const initial = Number(sisaEl.textContent.trim()||'0');
    card.dataset.max = Number.isNaN(initial)?0:initial;
    sisaEl.textContent = String(initial);
    updateBadgeAndButtons(card, initial);
  });
}
initCards();

function updateBadgeAndButtons(card, sisa){
  const max = Number(card.dataset.max || 0);
  const badge = card.querySelector('.badge-status');
  const minusBtn = card.querySelector('.qty-btn[data-action="inc"]'); // − kembalikan sisa
  const plusBtn  = card.querySelector('.qty-btn[data-action="dec"]'); // ＋ pilih (tambah ke cart)

  if(badge){
    if(sisa===0){ badge.textContent='Habis'; badge.style.background='#a94442'; }
    else { badge.textContent='Active'; badge.style.background='#167c73'; }
  }
  if(minusBtn) minusBtn.disabled = (sisa>=max);
  if(plusBtn)  plusBtn.disabled  = (sisa<=0);
}

// ==== Search realtime ====
const q = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearSearch');
const gridEl = document.getElementById('itemsGrid');
const emptyState = document.getElementById('emptyState');

function applyFilter(){
  const term = (q?.value||'').trim().toLowerCase();
  if(!gridEl) return;
  let visible = 0;
  gridEl.querySelectorAll('.col').forEach(col=>{
    const title = col.querySelector('.item-title')?.textContent?.toLowerCase()||'';
    const match = title.includes(term);
    col.style.display = match ? '' : 'none';
    if(match) visible++;
  });
  emptyState?.classList.toggle('d-none', visible>0);
}
q?.addEventListener('input', applyFilter);
clearBtn?.addEventListener('click', ()=>{ if(q){ q.value=''; applyFilter(); } });

// ==== Toast util ====
function showToastSuccess(text){
  const wrap = document.getElementById('toastStack');
  if(!wrap) return alert(text);
  const id = 't'+Date.now();
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
  el.addEventListener('hidden.bs.toast', ()=> el.remove());
}

// ==== Modal konfirmasi tambah (seperti index) ====
// SEKALI KONFIRM → klik berikutnya untuk item yang sama TIDAK muncul modal lagi
let pendingCard = null;
const confirmedOnce = new Set(); // nama item yang sudah dikonfirmasi setidaknya sekali

const confirmModalEl = document.getElementById('confirmAddModal');
const confirmModal = confirmModalEl ? new bootstrap.Modal(confirmModalEl) : null;
const confirmNameEl = document.getElementById('confirmName');
const confirmTypeEl = document.getElementById('confirmType');
const confirmThumbEl = document.getElementById('confirmThumb');

function openConfirm(card){
  const name = card.querySelector('.item-title')?.textContent?.trim() || 'Item';

  // SKIP modal jika item ini sudah pernah dikonfirmasi sebelumnya
  if(confirmedOnce.has(name)){
    pendingCard = card;
    confirmAddNoRedirect();
    return;
  }

  pendingCard = card;
  const thumb = card.querySelector('.item-thumb img')?.getAttribute('src') || '';
  if (confirmNameEl) confirmNameEl.textContent = name;
  if (confirmTypeEl) confirmTypeEl.textContent = 'Barang';
  if (confirmThumbEl) confirmThumbEl.src = thumb;
  if (confirmModal) confirmModal.show();
  else if (window.confirm(`Tambah "${name}" ke keranjang?`)) confirmAddNoRedirect();
}

document.getElementById('confirmAddBtn')?.addEventListener('click', ()=>{
  confirmAddNoRedirect();
  if (confirmModal) confirmModal.hide();
});

function confirmAddNoRedirect(){
  if(!pendingCard) return;
  const card = pendingCard; pendingCard = null;

  // simpan meta booking (biar pasti ke-save saat user mulai add)
  const tanggal = document.getElementById('loanDateMeta')?.value || todayISO();
  const mulai   = document.getElementById('startTimeMeta')?.value || '10:00';
  const durasi  = document.getElementById('durationMeta')?.value || '2';
  saveBookingMeta({ tanggal, mulai, durasi });

  // Kurangi sisa 1
  const sisaEl = card.querySelector('.sisa');
  let sisa = Number(sisaEl.textContent.trim() || '0');
  sisa = Math.max(0, sisa - 1);
  sisaEl.textContent = String(sisa);
  updateBadgeAndButtons(card, sisa);

  // Masukkan ke keranjang
  const name  = card.querySelector('.item-title')?.textContent?.trim() || 'Item';
  const thumb = card.querySelector('.item-thumb img')?.getAttribute('src') || '';
  try{
    if(window.MSUCart){
      MSUCart.add(name, 'barang', thumb, 1);
      MSUCart.renderBadge();
    }
  }catch(e){}

  // tandai sudah pernah konfirmasi → klik selanjutnya tidak muncul modal
  confirmedOnce.add(name);

  showToastSuccess(`${name} ditambahkan ke keranjang.`);
}

// Klik tombol qty
document.addEventListener('click',(e)=>{
  const btn = e.target.closest('.qty-btn'); if(!btn) return;
  const card = btn.closest('.item-card'); if(!card) return;

  const sisaEl = card.querySelector('.sisa');
  let sisa = Number(sisaEl.textContent.trim()||'0');
  const max = Number(card.dataset.max||0);
  const action = btn.dataset.action;

  if(action==='dec'){ // ＋ → konfirmasi (atau skip jika sudah pernah)
    openConfirm(card);
    return;
  }

  // − : kembalikan stok di tampilan (simulasi)
  sisa = Math.min(max, sisa + 1);
  sisaEl.textContent = String(sisa);
  updateBadgeAndButtons(card, sisa);
});

// Expand visual saat klik kartu (kecuali tombol qty)
document.addEventListener('click',(e)=>{
  const card = e.target.closest('.item-card'); if(!card) return;
  if(e.target.closest('.qty-btn')) return;
  const grid = card.closest('.items-grid');
  const already = card.classList.contains('is-expanded');
  grid.classList.remove('has-expanded');
  grid.querySelectorAll('.item-card').forEach(c=>c.classList.remove('is-expanded'));
  if(!already){ card.classList.add('is-expanded'); grid.classList.add('has-expanded'); }
});

// FAB → ke halaman booking (jika ada isi keranjang)
document.getElementById('fabCheckout')?.addEventListener('click', ()=>{
  // pastikan meta booking tersimpan terbaru
  const tanggal = document.getElementById('loanDateMeta')?.value || todayISO();
  const mulai   = document.getElementById('startTimeMeta')?.value || '10:00';
  const durasi  = document.getElementById('durationMeta')?.value || '2';
  saveBookingMeta({ tanggal, mulai, durasi });

  const c = (window.MSUCart ? MSUCart.count() : 0);
  if (c<=0) return;
  window.location.href = 'bookingbarang.html?from=fab';
});

// Inisialisasi badge saat load & filter awal
window.addEventListener('load', ()=> {
  if (window.MSUCart) MSUCart.renderBadge();
  applyFilter();
});
