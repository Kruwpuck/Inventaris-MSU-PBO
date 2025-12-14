// Animasi masuk (stagger kecil)
window.addEventListener('load', ()=>{
  document.querySelectorAll('.drop-in,.reveal-up').forEach((el, i)=>{
    setTimeout(()=>el.classList.add('show'), 60 + i*40);
  });
});

// Tampilkan email tujuan (jika ada dari booking)
(function showEmail(){
  const email = localStorage.getItem('lastBookingEmail') || '';
  const el = document.getElementById('descText');
  if (email && el){
    el.textContent = `Notifikasi sukses dikirim ke email: ${email}`;
  }
})();

// Bersihkan keranjang setelah sukses (front-end only)
(function clearCart(){
  try { if (window.MSUCart) { MSUCart.clear(); MSUCart.renderBadge?.(); } }
  catch(e){}
})();
