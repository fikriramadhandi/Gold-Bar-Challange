# Gold Bar Challenge — BSI International Expo 2026

Web app untuk aktivasi Gold Bar Challenge: registrasi peserta, timer maks 60 detik, dan leaderboard live 3 tercepat per hari. Dibuat untuk tablet/iPad, berjalan di luar Claude (di-hosting di Vercel), dengan data tersimpan **di tablet** dan otomatis tersinkron ke **Google Sheets**.

## Isi folder

| File | Fungsi |
|---|---|
| `index.html` | Aplikasinya (semua tampilan & logika) |
| `sw.js`, `manifest.json`, `icon-*.png` | Agar bisa dipasang di Home Screen iPad dan tetap terbuka saat Wi-Fi putus |
| `vercel.json`, `.vercelignore` | Pengaturan deploy Vercel |
| `apps-script/Code.gs` | Backend Google Sheets (ditempel di Apps Script, **tidak** ikut ter-deploy ke Vercel) |

## Cara data tersimpan

1. Setiap hasil langsung disimpan di **browser tablet** (tidak hilang walau sinyal putus atau halaman di-refresh).
2. Jika Google Sheets sudah terhubung, hasil dikirim otomatis ke Sheet tab **Peserta**. Kalau sinyal putus, hasil menunggu di antrean dan terkirim sendiri saat online lagi (lihat status di pojok kanan atas).
3. Leaderboard di semua tablet & layar TV membaca dari Google Sheets setiap 5 detik. No. HP lengkap dan No. Rekening **tidak pernah** dikirim balik ke layar mana pun; hanya ada di Sheet dan di tablet yang menginput.

---

## Langkah 1 — Siapkan Google Sheets (±5 menit)

1. Buat Google Sheet baru, beri nama misalnya **Gold Bar Challenge BIE 2026**.
2. Menu **Ekstensi → Apps Script**.
3. Hapus isi editor, tempel seluruh isi `apps-script/Code.gs`.
4. Di baris `const API_KEY = 'GANTI-DENGAN-KUNCI-RAHASIA';` ganti dengan kunci buatan sendiri, minimal 12 karakter (contoh: `BBG-emas-2026-x7Kq`). Simpan (ikon disket).
5. Klik **Terapkan → Deployment baru**.
   - Ikon roda gigi → pilih **Aplikasi web**
   - Jalankan sebagai: **Saya**
   - Yang memiliki akses: **Siapa saja**
   - Klik **Terapkan**, lalu izinkan akses ke akun Google (klik *Advanced/Lanjutan → Go to … (unsafe)* jika muncul peringatan, karena skrip ini buatan sendiri).
6. Salin **URL aplikasi web** (berakhiran `/exec`). Simpan URL ini dan kuncinya.

> Kalau nanti `Code.gs` diubah: **Terapkan → Kelola deployment → ikon pensil → Versi: Versi baru → Terapkan**. Dengan cara ini URL tidak berubah.

## Langkah 2 — Ganti PIN menu Kelola

Buka `index.html`, cari bagian `const CONFIG` di dekat bawah file, lalu ganti `ADMIN_PIN: '2210'` dengan PIN panitia. Jangan isi kunci rahasia di file ini (isi lewat menu Kelola di Langkah 4), karena isi file bisa dilihat siapa pun yang membuka link.

## Langkah 3 — Deploy ke Vercel

**Cara A — lewat GitHub (tanpa install apa pun)**
1. Login ke github.com → **New repository** (boleh Private) → beri nama `gold-bar-challenge` → Create.
2. Klik **uploading an existing file**, tarik semua isi folder ini (termasuk `.vercelignore`), lalu **Commit changes**.
3. Login ke vercel.com (bisa pakai akun GitHub) → **Add New… → Project** → pilih repo tadi → **Deploy**. Framework: *Other*, tanpa build command.
4. Selesai. Link-nya berbentuk `https://gold-bar-challenge-xxxx.vercel.app`. Setiap kali file di GitHub diubah, Vercel otomatis deploy ulang.

**Cara B — lewat terminal**
```
npm i -g vercel
cd gold-bar-challenge-app
vercel --prod
```

## Langkah 4 — Setup tablet

1. Buka link Vercel di Safari iPad.
2. Tab **Kelola** → masukkan PIN → isi **URL Web App**, **Kunci rahasia**, dan **Nama tablet** (misal *Tablet Booth 1*) → **Simpan & tes koneksi**. Harus muncul *"Terhubung ke Google Sheets"*.
3. Untuk tablet berikutnya: tekan **Salin link setup tablet lain**, kirim ke operator, buka di tablet itu. URL & kunci terisi otomatis (tinggal ganti nama tablet di Kelola).
4. Supaya tampil layar penuh seperti aplikasi: di Safari tekan **Bagikan → Tambahkan ke Layar Utama**, lalu buka dari ikon *Gold Bar* di Home Screen.
5. Matikan **Kunci Otomatis** iPad (Pengaturan → Layar & Kecerahan) selama acara.

## Langkah 5 — Layar TV / monitor leaderboard

Di Kelola tekan **Salin link layar TV**, buka di browser laptop/Smart TV yang tersambung ke monitor. Halaman langsung tampil sebagai podium layar penuh dan update otomatis. Link ini hanya bisa membaca leaderboard (tanpa kunci, tanpa No. HP).

## Sebelum acara dimulai

- Lakukan gladi beberapa kali, cek data masuk ke Sheet tab **Peserta**.
- Setelah gladi: Kelola → ketik `HAPUS` → **Hapus semua data** (menghapus di tablet & Sheet).

## Selama acara

- **Salah pencet STOP?** Di layar hasil tekan *Batalkan hasil ini* dua kali.
- **Peserta curang?** Kelola → **Diskualifikasi** (bisa dipulihkan lagi).
- **Rekap pemenang:** buka Google Sheet, atau Kelola → **CSV hari ini** (CSV memuat No. HP & rekening untuk peserta yang diinput di tablet tersebut).
- Peringkat dihitung per hari (22, 23, 24, 25 Okt) memakai zona waktu WIB. Pilihan *Semua hari* tersedia di tab Leaderboard.

## Catatan keamanan data

- No. HP dan No. Rekening tersimpan di Google Sheet milik akun yang membuat Apps Script, dan di browser tablet yang menginput. Gunakan akun Google resmi unit/BSI bila ada, dan batasi siapa yang punya akses edit ke Sheet.
- Siapa pun yang tahu URL `/exec` bisa membaca leaderboard publik (nama, waktu, No. HP tersamar). Menulis data butuh kunci rahasia.
- Konfirmasikan penggunaan data nasabah ini dengan tim Compliance/IT Security sesuai kebijakan internal dan UU PDP.
