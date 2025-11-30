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

// ==== Inisialisasi setiap kartu ruang (max 1) ====
function initCards(){
  document.querySelectorAll('.item-card').forEach(card=>{
    const sisaEl = card.querySelector('.sisa');
    if(!sisaEl) return;
    let initial = Number(sisaEl.textContent.trim()||'1');
    if (Number.isNaN(initial)) initial = 1;
    initial = Math.min(1, Math.max(0, initial));
    card.dataset.max = 1;
    sisaEl.textContent = String(initial);
    updateBadgeAndButtons(card, initial);
  });
}
initCards();

function updateBadgeAndButtons(card, sisa){
  const badge = card.querySelector('.badge-status');
  const minusBtn = card.querySelector('.qty-btn[data-action="inc"]'); // − batal
  const plusBtn  = card.querySelector('.qty-btn[data-action="dec"]'); // ＋ pilih

  if(badge){
    if(sisa===0){ badge.textContent='Habis'; badge.style.background='#a94442'; }
    else { badge.textContent='Active'; badge.style.background='#167c73'; }
  }
  if(minusBtn) minusBtn.disabled = (sisa>=1);
  if(plusBtn)  plusBtn.disabled  = (sisa<=0);
}

// ==== Search ====
const q = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearSearch');
const gridEl = document.getElementById('itemsGrid');
const emptyState = document.getElementById('emptyState');

function applyFilter(){
  const term = (q?.value||'').trim().toLowerCase();
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

// ==== Modal konfirmasi tambah ====
let pendingCard = null;
const confirmModalEl = document.getElementById('confirmAddModal');
const confirmModal = confirmModalEl ? new bootstrap.Modal(confirmModalEl) : null;
const confirmNameEl = document.getElementById('confirmName');
const confirmTypeEl = document.getElementById('confirmType');
const confirmThumbEl = document.getElementById('confirmThumb');

function openConfirm(card){
  pendingCard = card;
  const name = card.querySelector('.item-title')?.textContent?.trim() || 'Ruang';
  const thumb = card.querySelector('.item-thumb img')?.getAttribute('src') || '';
  if (confirmNameEl) confirmNameEl.textContent = name;
  if (confirmTypeEl) confirmTypeEl.textContent = 'Ruang';
  if (confirmThumbEl) confirmThumbEl.src = thumb;
  if (confirmModal) confirmModal.show();
  else if (window.confirm(`Pilih "${name}"?`)) confirmAddNoRedirect();
}

document.getElementById('confirmAddBtn')?.addEventListener('click', ()=>{
  confirmAddNoRedirect();
  if (confirmModal) confirmModal.hide();
});

function confirmAddNoRedirect(){
  if(!pendingCard) return;
  const card = pendingCard; pendingCard = null;

  // pilih ruang (sisa -> 0)
  const sisaEl = card.querySelector('.sisa');
  let sisa = Number(sisaEl.textContent.trim() || '1');
  sisa = Math.max(0, sisa - 1);
  sisaEl.textContent = String(sisa);
  updateBadgeAndButtons(card, sisa);

  // masuk ke keranjang
  const name  = card.querySelector('.item-title')?.textContent?.trim() || 'Ruang';
  const thumb = card.querySelector('.item-thumb img')?.getAttribute('src') || '';
  try{
    if(window.MSUCart){
      MSUCart.add(name, 'ruang', thumb, 1);
      MSUCart.renderBadge();
    }
  }catch(e){}
  showToastSuccess(`${name} ditambahkan ke keranjang.`);
}

// Klik tombol qty
document.addEventListener('click',(e)=>{
  const btn = e.target.closest('.qty-btn'); if(!btn) return;
  const card = btn.closest('.item-card'); if(!card) return;

  const sisaEl = card.querySelector('.sisa');
  let sisa = Number(sisaEl.textContent.trim()||'1');
  const action = btn.dataset.action;

  if(action==='dec'){ // ＋ → pilih (konfirmasi)
    openConfirm(card);
    return;
  }

  // − : batalkan (kembalikan ketersediaan ke 1)
  sisa = Math.min(1, sisa + 1);
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
  const c = (window.MSUCart ? MSUCart.count() : 0);
  if (c<=0) return;
  window.location.href = 'bookingbarang.html?from=fab';
});

// Inisialisasi badge saat load
window.addEventListener('load', ()=> {
  if (window.MSUCart) MSUCart.renderBadge();
});

// Search awal
applyFilter();
