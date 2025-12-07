// shared-data.js (REVISI FINAL)

// Sistem manajemen data peminjaman fasilitas

class DataManager {
  constructor() {
    this.STORAGE_KEY = 'peminjamanData';
    this.initData();
  }

  // Inisialisasi data awal
  initData() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      const initialData = {
        dashboard: [
          {
            id: 'd1',
            no: 1,
            nama: 'UKM Al-Fath',
            waktuPengambilan: '18.00 WIB',
            waktuPengembalian: '20.00 WIB',
            fasilitas: 'Ruangan VIP | Aula Syamsul Ulum',
            sudahAmbil: false,
            sudahTerima: false
          },
          {
            id: 'd2',
            no: 2,
            nama: 'HIPMI',
            waktuPengambilan: '29 Oktober 2025',
            waktuPengembalian: '30 Oktober 2025',
            fasilitas: 'Proyektor, Kabel HDMI, Pointer',
            sudahAmbil: false,
            sudahTerima: false
          }
        ],
        pinjamFasilitas: [
          {
            id: 'p1',
            no: 1,
            nama: 'UKM Al-Fath',
            waktuPengambilan: '28 Oktober 2025 | 18.00 WIB',
            waktuPengembalian: '28 Oktober 2025 | 20.00 WIB',
            fasilitas: 'Ruangan VIP | Aula Syamsul Ulum',
            sudahAmbil: false,
            sudahKembali: false
          },
          {
            id: 'p2',
            no: 2,
            nama: 'HIPMI',
            waktuPengambilan: '28 Oktober 2025 | 17.00 WIB',
            waktuPengembalian: '30 Oktober 2025 | 08.00 WIB',
            fasilitas: 'Proyektor, Kabel HDMI, Pointer',
            sudahAmbil: false,
            sudahKembali: false
          },
          {
            id: 'p3',
            no: 3,
            nama: 'HMIT',
            waktuPengambilan: '29 Oktober 2025 | 20.00 WIB',
            waktuPengembalian: '30 Oktober 2025 | 17.00 WIB',
            fasilitas: 'Hijab',
            sudahAmbil: false,
            sudahKembali: false
          }
        ],
        riwayat: []
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
    }
  }

  // Ambil semua data
  getData() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY));
  }

  // Simpan data
  saveData(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  // Format waktu saat ini
  getCurrentTime() {
    const now = new Date();
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    };
    return now.toLocaleString('id-ID', options) + ' WIB';
  }

  // Pindahkan data ke riwayat
  moveToRiwayat(source, id, checkType) {
    const data = this.getData();
    let sourceArray = source === 'dashboard' ? data.dashboard : data.pinjamFasilitas;

    const index = sourceArray.findIndex(i => i.id === id);
    if (index === -1) return;

    const item = sourceArray[index];

    // Cek apakah 2 checkbox akan dicentang
    const willCheckAmbil = checkType === 'ambil' ? true : item.sudahAmbil;
    const willCheckKembali = 
      source === 'dashboard'
      ? (checkType === 'terima' ? true : item.sudahTerima)
      : (checkType === 'kembali' ? true : item.sudahKembali);

    const bothChecked = willCheckAmbil && willCheckKembali;

    // NOTIFIKASI saat centang dua-duanya
    if (bothChecked) {
      const ok = confirm("Apakah fasilitasnya sudah kembali?");
      if (!ok) {
        return false; // batalkan centang
      }
    }

    // Cari di riwayat
    let riwayatItem = data.riwayat.find(
      r => r.originalId === id && r.source === source
    );

    if (!riwayatItem) {
      riwayatItem = {
        id: 'r' + Date.now(),
        originalId: id,
        source: source,
        no: data.riwayat.length + 1,
        nama: item.nama,
        fasilitas: item.fasilitas,

        // Waktu yang ditampilkan (mulai "...")
        waktuAmbil: '...',
        waktuKembali: '...',

        // MENYIMPAN WAKTU ASLI UNTUK CANCEL
        waktuAsliAmbil: item.waktuPengambilan,
        waktuAsliKembali: item.waktuPengembalian,

        isSubmitted: false
      };
      data.riwayat.push(riwayatItem);
    }

    // Update waktu sesuai centang
    if (checkType === 'ambil') {
      riwayatItem.waktuAmbil = this.getCurrentTime();
      item.sudahAmbil = true;
    }
    if (checkType === 'terima' || checkType === 'kembali') {
      riwayatItem.waktuKembali = this.getCurrentTime();
      if (source === 'dashboard') item.sudahTerima = true;
      else item.sudahKembali = true;
    }

    // Jika dua-duanya sudah centang → hapus dari sumber
    if (bothChecked) {
      sourceArray.splice(index, 1);

      // Renumber
      sourceArray.forEach((itm, idx) => {
        itm.no = idx + 1;
      });
    }

    this.saveData(data);
    return true;
  }

  // Cancel riwayat
  cancelRiwayat(riwayatId) {
    const data = this.getData();
    const riIndex = data.riwayat.findIndex(r => r.id === riwayatId);
    if (riIndex === -1) return;

    const riwayatItem = data.riwayat[riIndex];

    // Hapus dari riwayat
    data.riwayat.splice(riIndex, 1);

    // Renumber riwayat
    data.riwayat.forEach((item, i) => {
      item.no = i + 1;
    });

    // Mengembalikan data ke pinjamFasilitas (waktu asli)
    data.pinjamFasilitas.push({
      id: riwayatItem.originalId,
      no: data.pinjamFasilitas.length + 1,
      nama: riwayatItem.nama,
      waktuPengambilan: riwayatItem.waktuAsliAmbil,
      waktuPengembalian: riwayatItem.waktuAsliKembali,
      fasilitas: riwayatItem.fasilitas,
      sudahAmbil: false,
      sudahKembali: false
    });

    this.saveData(data);
  }

  // Submit riwayat
  submitRiwayat(riwayatId) {
    const data = this.getData();
    const item = data.riwayat.find(r => r.id === riwayatId);

    if (item) {
      item.isSubmitted = true;
      this.saveData(data);
      return true;
    }
    return false;
  }
}

// Instance global
const dataManager = new DataManager();

/* ------------------------------
   DASHBOARD PAGE
--------------------------------*/
function initDashboard() {
  const data = dataManager.getData();
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  data.dashboard.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.no}</td>
      <td>${item.nama}</td>
      <td>${item.waktuPengambilan}</td>
      <td>${item.waktuPengembalian}</td>
      <td><button class="detail-btn" data-detail="${item.fasilitas}">Detail Peminjaman</button></td>
      <td><input type="checkbox" data-id="${item.id}" data-type="ambil" ${item.sudahAmbil ? 'checked' : ''}></td>
      <td><input type="checkbox" data-id="${item.id}" data-type="terima" ${item.sudahTerima ? 'checked' : ''}></td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('table tbody input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', function() {
      if (!this.checked) return;
      const id = this.getAttribute('data-id');
      const type = this.getAttribute('data-type');

      const ok = dataManager.moveToRiwayat('dashboard', id, type);
      if (!ok) {
        this.checked = false;
      } else {
        initDashboard();
      }
    });
  });

  attachModalListeners();
}

/* ------------------------------
   PINJAM FASILITAS PAGE
--------------------------------*/
function initPinjamFasilitas() {
  const data = dataManager.getData();
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  data.pinjamFasilitas.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.no}</td>
      <td>${item.nama}</td>
      <td>${item.waktuPengambilan}</td>
      <td>${item.waktuPengembalian}</td>
      <td><button class="detail-btn" data-detail="${item.fasilitas}">Detail Peminjaman</button></td>
      <td><input type="checkbox" data-id="${item.id}" data-type="ambil" ${item.sudahAmbil ? 'checked' : ''}></td>
      <td><input type="checkbox" data-id="${item.id}" data-type="kembali" ${item.sudahKembali ? 'checked' : ''}></td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('table tbody input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', function() {
      if (!this.checked) return;
      const id = this.getAttribute('data-id');
      const type = this.getAttribute('data-type');

      const ok = dataManager.moveToRiwayat('pinjamFasilitas', id, type);
      if (!ok) {
        this.checked = false;
      } else {
        initPinjamFasilitas();
      }
    });
  });

  attachModalListeners();
}

/* ------------------------------
   RIWAYAT PAGE
--------------------------------*/
function initRiwayat() {
  const data = dataManager.getData();
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (data.riwayat.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Belum ada riwayat peminjaman</td></tr>`;
    return;
  }

  data.riwayat.forEach(item => {
    const disabled = item.isSubmitted ? 'disabled' : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.no}</td>
      <td>${item.nama}</td>
      <td>${item.waktuAmbil}</td>
      <td>${item.waktuKembali}</td>
      <td><button class="detail-btn" data-detail="${item.fasilitas}">Detail Peminjaman</button></td>
      <td><button class="cancel-btn" data-id="${item.id}" ${disabled}>Cancel</button></td>
      <td><button class="submit-btn" data-id="${item.id}" ${disabled}>Submit</button></td>
    `;
    tbody.appendChild(tr);
  });

  // Cancel
  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      if (confirm("Anda yakin ingin membatalkan peminjaman ini?")) {
        dataManager.cancelRiwayat(id);
        initRiwayat();
      }
    });
  });

  // Submit
  document.querySelectorAll('.submit-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      if (dataManager.submitRiwayat(id)) {
        alert("Data berhasil disubmit!");
        initRiwayat();
      }
    });
  });

  attachModalListeners();
}

/* ------------------------------
   MODAL DETAIL
--------------------------------*/
function attachModalListeners() {
  const detailButtons = document.querySelectorAll(".detail-btn");
  const modalBg = document.getElementById("modalBg");
  const detailContent = document.getElementById("detailContent");

  if (!modalBg || !detailContent) return;

  detailButtons.forEach(btn => {
    btn.addEventListener("click", function () {
      detailContent.textContent = this.getAttribute("data-detail");
      modalBg.style.display = "flex";
    });
  });

  modalBg.addEventListener("click", function(e) {
    if (e.target === modalBg) closeModal();
  });
}

function closeModal() {
  const modalBg = document.getElementById("modalBg");
  modalBg.style.display = "none";
}

// Auto inisialisasi halaman
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname;
  if (page.includes('dashboard.html')) initDashboard();
  else if (page.includes('pinjamFasilitas.html')) initPinjamFasilitas();
  else if (page.includes('riwayatpinjam.html')) initRiwayat();
});


