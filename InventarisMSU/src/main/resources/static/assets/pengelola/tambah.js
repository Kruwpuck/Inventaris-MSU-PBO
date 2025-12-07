// ====== AUTH / SESSION UNTUK HALAMAN TAMBAH ======
(function initTambahAuth() {
  const LOGIN_URL = "/login?role=pengelola";

  let currentUser = null;
  try {
    const raw = localStorage.getItem("msuUser");
    if (!raw) {
      // belum login -> balik ke login pengelola
      window.location.href = LOGIN_URL;
      return;
    }
    currentUser = JSON.parse(raw);
  } catch (err) {
    console.error("Gagal membaca data user:", err);
    window.location.href = LOGIN_URL;
    return;
  }

  // Set nama & role di navbar
  const userNameEl = document.getElementById("userName");
  const userRoleEl = document.getElementById("userRoleLabel");

  if (userNameEl && currentUser.username) {
    userNameEl.textContent = currentUser.username;
  }

  if (userRoleEl) {
    userRoleEl.textContent =
      currentUser.role === "pengelola" ? "Pengelola Side" : "Pengurus Side";
  }

  // Tombol logout
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
      e.preventDefault();
      if (!confirm("Yakin ingin keluar dari akun?")) return;

      localStorage.removeItem("msuUser");
      window.location.href = LOGIN_URL;
    });
  }
})();

// Navbar aktif otomatis
(function () {
  const current =
    (location.pathname.split("/").pop() || "tambah.html").toLowerCase();
  document.querySelectorAll(".navbar-nav .nav-link").forEach((a) => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href && current && href.endsWith(current)) a.classList.add("active");
  });
})();

// Preview upload foto
const fileInput = document.getElementById("fileInput");
const imgPreview = document.getElementById("imgPreview");
if (fileInput && imgPreview) {
  fileInput.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => (imgPreview.src = ev.target.result);
    reader.readAsDataURL(f);
  });
}

// Dropdown kategori -> hidden input + bidang dinamis
const btnKategori = document.getElementById("btnKategori");
const menuKategori = btnKategori ? btnKategori.nextElementSibling : null;
const inpKategori = document.getElementById("inpKategori");

const wrapStok = document.getElementById("wrapStok");
const wrapKapasitas = document.getElementById("wrapKapasitas");
const inpStok = document.getElementById("inpStok");
const inpKapasitas = document.getElementById("inpKapasitas");

function applyKategoriUI(v) {
  if (v === "Barang") {
    wrapStok.style.display = "";
    wrapKapasitas.style.display = "none";
    inpStok.required = true;
    inpKapasitas.required = false;
    inpKapasitas.value = "";
  } else if (v === "Ruangan") {
    wrapStok.style.display = "none";
    wrapKapasitas.style.display = "";
    inpStok.required = false;
    inpKapasitas.required = true;
    inpStok.value = "";
  } else {
    wrapStok.style.display = "none";
    wrapKapasitas.style.display = "none";
    inpStok.required = false;
    inpKapasitas.required = false;
    inpStok.value = "";
    inpKapasitas.value = "";
  }
}

if (menuKategori && inpKategori) {
  menuKategori.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      menuKategori
        .querySelectorAll(".dropdown-item")
        .forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      const v = item.getAttribute("data-value") || "";
      btnKategori.textContent = item.textContent.trim();
      inpKategori.value = v;
      applyKategoriUI(v);
    });
  });
}

// Validasi & submit demo
(function () {
  const form = document.getElementById("formTambah");
  if (!form) return;

  form.addEventListener(
    "submit",
    function (event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        event.preventDefault();
        document
          .getElementById("alertSukses")
          .classList.remove("d-none");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      form.classList.add("was-validated");
    },
    false
  );
})();
