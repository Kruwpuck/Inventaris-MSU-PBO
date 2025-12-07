// MSU Shared Cart (Backend Integrated)
window.MSUCart = (function () {
    const API_URL = "/api/cart";
    let _items = [];

    const STORAGE_KEY = 'MSU_Cart_Items';

    function saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_items));
    }

    function loadFromStorage() {
        const s = localStorage.getItem(STORAGE_KEY);
        if (s) {
            try {
                _items = JSON.parse(s);
                // Normalize legacy data
                _items.forEach(it => {
                    if (it.qty !== undefined && it.quantity === undefined) it.quantity = it.qty;
                    if (it.thumb !== undefined && it.imageUrl === undefined) it.imageUrl = it.thumb;
                });
            } catch (e) { }
        }
    }

    // Init: fetch from server or storage
    async function init() {
        loadFromStorage(); // Load from local first
        renderBadge();
        window.dispatchEvent(new CustomEvent('msu:cart-updated'));

        try {
            const res = await fetch(API_URL);
            if (res.ok) {
                const serverItems = await res.json();
                if (serverItems && serverItems.length > 0) {
                    _items = serverItems; // Server wins if connected and has data
                    saveToStorage();
                }
                renderBadge();
                window.dispatchEvent(new CustomEvent('msu:cart-updated'));
            }
        } catch (e) { console.error("Failed to sync cart", e); }
    }

    // Call init immediately
    init();

    function get() { return _items; }

    // helper: apakah item sudah ada
    function has(name, type = 'barang') {
        return _items.some(it => it.name === name && it.type === type);
    }

    async function add(name, type = 'barang', thumb = '', inc = 1, maxQty = 999) {
        // Optimistic update
        let idx = _items.findIndex(it => it.name === name && it.type === type);
        let newQty = inc;

        if (idx >= 0) {
            let currentQty = Number(_items[idx].quantity || 0);
            newQty = currentQty + inc;
            if (newQty > maxQty) newQty = maxQty; // Enforce max limit
            _items[idx].quantity = newQty;
            _items[idx].maxQty = maxQty; // Update maxQty just in case
        } else {
            _items.push({
                name: name,
                type: type,
                quantity: Math.min(inc, maxQty),
                imageUrl: thumb,
                maxQty: maxQty
            });
            idx = _items.length - 1;
        }
        saveToStorage();
        renderBadge();
        window.dispatchEvent(new CustomEvent('msu:cart-updated'));

        // Send to server
        try {
            await fetch(API_URL + "/add", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    type: type,
                    quantity: newQty,
                    imageUrl: thumb
                })
            });
        } catch (e) {
            console.error("Failed to add item", e);
        }
    }

    function count() {
        return _items.reduce((a, b) => a + Number(b.quantity || 0), 0);
    }

    function renderBadge() {
        const c = count();
        // badge di navbar
        const navBadge = document.querySelector(".msu-cart-badge");
        if (navBadge) navBadge.textContent = String(c);
        // badge di FAB
        const fab = document.getElementById("fabCount");
        if (fab) fab.textContent = String(c);
        const fabBtn = document.getElementById('fabCheckout');
        if (fabBtn) fabBtn.classList.toggle('is-disabled', c <= 0);
    }

    function toListHTML() {
        if (!_items.length) return '<p class="text-muted m-0">Keranjang kosong.</p>';
        return `<ul class="list-group">
      ${_items.map(it => `
        <li class="list-group-item d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-3">
            <img src="${it.imageUrl || 'https://placehold.co/64'}" alt="" width="54" height="40" style="object-fit:cover;border-radius:8px">
            <div>
              <div class="fw-bold">${it.name}</div>
              <small class="text-muted">${it.type === 'ruang' ? 'Ruang' : 'Barang'}</small>
            </div>
          </div>
          <span class="badge text-bg-success">${it.quantity}x</span>
        </li>
      `).join("")}
    </ul>`;
    }

    function clear() {
        _items = [];
        saveToStorage();
        renderBadge();
        window.dispatchEvent(new CustomEvent('msu:cart-updated'));
        fetch(API_URL + "/clear", { method: 'POST' });
    }

    async function update(name, type, quantity) {
        let idx = _items.findIndex(it => it.name === name && it.type === type);
        if (idx >= 0) {
            _items[idx].quantity = quantity;
            if (quantity <= 0) {
                _items.splice(idx, 1);
            }
        }
        saveToStorage();
        renderBadge();
        window.dispatchEvent(new CustomEvent('msu:cart-updated'));

        try {
            await fetch(API_URL + "/update", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, type, quantity })
            });
        } catch (e) { console.error("Failed to update item", e); }
    }

    return { get, add, update, count, renderBadge, toListHTML, has, init, clear };
})();

// Tambahkan ikon cart di navbar (sekali, kalau belum ada)
(function injectCartNav() {
    const nav = document.querySelector("#navMain .navbar-nav");
    if (!nav || nav.querySelector('.msu-cart-entry')) return;
    const li = document.createElement("li");
    li.className = "nav-item d-flex align-items-center msu-cart-entry";
    li.innerHTML = `
    <a class="nav-link position-relative" href="/form?from=cart" aria-label="Buka keranjang">
      <i class="bi bi-bag-check"></i>
      <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger msu-cart-badge">0</span>
    </a>`;
    nav.appendChild(li);
    window.addEventListener("load", () => window.MSUCart && MSUCart.renderBadge());
})();
