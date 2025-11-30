/* ===================================================
   LOGIN PENGURUS - FINAL VERSION
   =================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");

    // Cek apakah sudah login
    const user = JSON.parse(localStorage.getItem("msuUser"));
    if (user && user.role === "pengurus") {
        window.location.href = "dashboard.html";
        return;
    }

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        // Validasi login pengurus
        if (username === "pengurus" && password === "pengurus123") {

            // Simpan session login
            localStorage.setItem("msuUser", JSON.stringify({
                username: "pengurus",
                role: "pengurus"
            }));

            alert("Login berhasil!");
            window.location.href = "dashboard.html";
            return;
        }

        alert("Username atau password salah!");
    });
});
