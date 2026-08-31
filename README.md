# BINTORO — Business Intelligence for Network Tracking & Operational Retention

Tools internal dealer (Nasmoco Demak) untuk mengelola target replacement, follow-up sales, dan revenue tracking.

## Struktur folder
```
index.html          -> halaman utama
css/style.css        -> semua styling
js/                  -> logic, dipecah per fungsi:
  state.js           -> konfigurasi & state global
  utils.js           -> helper (format rupiah, hitung umur, dst)
  auth.js            -> login & session
  api.js             -> komunikasi ke Google Sheets (Apps Script backend)
  dashboard.js        -> halaman Dashboard
  database.js        -> halaman Target Database
  progress.js        -> halaman Progress Updates
  revenue.js          -> halaman Revenue Tracking
  users.js            -> halaman User Management
  main.js             -> routing antar halaman + init
assets/               -> logo & gambar
```

## Setup
1. Buka `index.html` di browser (bisa langsung double-click, atau host via GitHub Pages).
2. Klik ikon gear (⚙) di kanan atas, tempel URL Web App dari Apps Script backend.
3. Login pakai akun yang sudah didaftarkan di tab "Users" Google Sheets.

## ⚠️ PENTING — Keamanan
- **URL Apps Script TIDAK disimpan di kode ini.** Diisi manual sekali lewat tombol gear,
  lalu tersimpan di browser (localStorage) masing-masing pengguna.
- **JANGAN PERNAH** commit URL Apps Script asli ke repository ini, terutama jika public.
- Ganti semua password default di menu User Management segera setelah setup awal.
- Backend (Google Apps Script) di-deploy terpisah — lihat dokumentasi di kode backend
  (tidak disertakan di repo ini demi keamanan; simpan terpisah/private).
