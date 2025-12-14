document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formTambah");
  const alertSukses = document.getElementById("alertSukses");

  const btnKategori = document.getElementById("btnKategori");
  const inpKategori = document.getElementById("inpKategori");

  const wrapStok = document.getElementById("wrapStok");
  const inpStok = document.getElementById("inpStok");

  const wrapKapasitas = document.getElementById("wrapKapasitas");
  const inpKapasitas = document.getElementById("inpKapasitas");

  const stockHidden = document.getElementById("stockHidden");

  const fileInput = document.getElementById("fileInput");
  const imgPreview = document.getElementById("imgPreview");

  // Dropdown kategori
  document.querySelectorAll(".dropdown-item[data-value]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const v = a.getAttribute("data-value"); // BARANG / RUANGAN
      const label = v === "BARANG" ? "Barang" : "Ruangan";

      btnKategori.textContent = label;
      inpKategori.value = v;

      if (v === "BARANG") {
        wrapStok.style.display = "";
        wrapKapasitas.style.display = "none";
      } else {
        wrapStok.style.display = "none";
        wrapKapasitas.style.display = "";
      }

      inpKategori.classList.remove("is-invalid");
      inpKategori.classList.add("is-valid");
    });
  });

  // Preview foto (UI only)
  if (fileInput && imgPreview) {
    fileInput.addEventListener("change", () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      imgPreview.src = URL.createObjectURL(f);
    });
  }

  // Submit
  form.addEventListener("submit", (e) => {
    // validasi bootstrap
    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
    }

    // kategori wajib
    if (!inpKategori.value) {
      e.preventDefault();
      inpKategori.classList.add("is-invalid");
      form.classList.add("was-validated");
      return;
    }

    const type = inpKategori.value;

    if (type === "BARANG") {
      const stokVal = (inpStok.value || "").trim();
      if (stokVal === "") {
        e.preventDefault();
        inpStok.classList.add("is-invalid");
        form.classList.add("was-validated");
        return;
      }
      stockHidden.value = parseInt(stokVal, 10) || 0;
    } else {
      const kapVal = (inpKapasitas.value || "").trim();
      if (kapVal === "") {
        e.preventDefault();
        inpKapasitas.classList.add("is-invalid");
        form.classList.add("was-validated");
        return;
      }
      stockHidden.value = parseInt(kapVal, 10) || 0;
    }

    form.classList.add("was-validated");

    if (alertSukses) alertSukses.classList.add("d-none");
  });

  // Reset
  form.addEventListener("reset", () => {
    if (alertSukses) alertSukses.classList.add("d-none");
    btnKategori.textContent = "Pilih kategori";
    inpKategori.value = "";
    wrapStok.style.display = "none";
    wrapKapasitas.style.display = "none";
    stockHidden.value = "0";
    form.classList.remove("was-validated");
  });
});
