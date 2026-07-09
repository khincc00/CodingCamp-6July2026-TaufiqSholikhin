# Pencatatan Pengeluaran — CodingCamp RevoU
**Taufiq Sholikhin | CodingCamp 6 Juli 2026**

Repository ini berisi tugas website sederhana dari kelas **CodingCamp RevoU**, yaitu aplikasi pencatatan pengeluaran pribadi berbasis web yang berjalan sepenuhnya di browser tanpa backend.

---

## Daftar Isi

- [Deskripsi Proyek](#deskripsi-proyek)
- [Struktur File](#struktur-file)
- [Fitur Aplikasi](#fitur-aplikasi)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Cara Menjalankan](#cara-menjalankan)
- [Penjelasan Kode](#penjelasan-kode)
- [Yang Ditulis Manual vs Dibantu AI](#yang-ditulis-manual-vs-dibantu-ai)

---

## Deskripsi Proyek

Aplikasi ini adalah **expense tracker** (pencatat pengeluaran) sederhana berbahasa Indonesia. Pengguna dapat mencatat nama barang, jumlah uang, dan kategori pengeluaran, melihat total pengeluaran secara real-time, serta memvisualisasikan distribusi pengeluaran per kategori dalam bentuk donut chart.

Semua data disimpan di **localStorage** browser, sehingga data tetap ada meski halaman di-refresh dan tidak memerlukan server atau database.

---

## Struktur File

```
CodingCamp-6July2026-TaufiqSholikhin/
│
├── index.html                        ← Versi awal (ditulis manual, tanpa styling)
├── index add tailwind by kiro.html   ← Versi final dengan Tailwind v4 + glassmorphism
├── styles.css                        ← Semua styling: glassmorphism, dark/light mode, komponen
├── app.js                            ← Semua logika JavaScript: data, render, sort, tema
└── README.md                         ← Dokumentasi ini
```

### Peran tiap file

| File | Peran |
|---|---|
| `index.html` | Versi awal yang ditulis sendiri, struktur HTML dasar tanpa CSS/JS |
| `index add tailwind by kiro.html` | Versi final dengan Tailwind v4, terhubung ke `styles.css` dan `app.js` |
| `styles.css` | Seluruh visual: CSS variables, glassmorphism, dark/light mode, animasi |
| `app.js` | Seluruh logika: CRUD transaksi, sort, kategori custom, render chart, tema |

---

## Fitur Aplikasi

### Fitur Utama
- **Tambah pengeluaran** — input nama barang, jumlah (Rupiah), dan kategori
- **Daftar transaksi** — ditampilkan dengan nama, kategori (badge warna), dan nominal
- **Total pengeluaran** — dihitung otomatis dan ditampilkan di bagian atas
- **Hapus transaksi** — tombol hapus per item
- **Donut chart** — visualisasi persentase pengeluaran per kategori menggunakan Canvas API
- **Persistensi data** — semua data tersimpan di `localStorage`, tidak hilang saat refresh

### Fitur Tambahan
- **Kategori kustom** — pengguna bisa menambah dan menghapus kategori sendiri di luar 4 kategori bawaan (Makanan, Transportasi, Hiburan, Lainnya). Kategori kustom otomatis mendapat warna unik dari palette 12 warna.
- **Sort transaksi** — 5 opsi pengurutan: Terbaru, Terlama, Nominal Terbesar, Nominal Terkecil, Kategori A-Z. Pilihan sort tersimpan di localStorage.
- **Dark / Light mode toggle** — tombol di pojok kanan header. Dark mode aktif secara default, preferensi disimpan di localStorage.

---

## Teknologi yang Digunakan

| Teknologi | Keterangan |
|---|---|
| **HTML5** | Struktur halaman, form, canvas |
| **CSS3** | Styling manual di `styles.css`: CSS variables, `backdrop-filter`, animasi |
| **Tailwind CSS v4** | Di-load via CDN (`@tailwindcss/browser@4`) untuk utility class pendukung |
| **Vanilla JavaScript** | Semua logika di `app.js`, tanpa framework (tidak ada React, Vue, dll.) |
| **Canvas API** | Menggambar donut chart persentase kategori |
| **localStorage API** | Menyimpan transaksi, kategori kustom, preferensi sort, dan preferensi tema |

> **Catatan:** Tailwind digunakan dari CDN, sehingga membutuhkan koneksi internet saat pertama kali load. Tidak ada backend, tidak ada database server, tidak ada build tool.

---

## Cara Menjalankan

Tidak perlu instalasi apapun.

1. Clone atau download repository ini
2. Buka file `index add tailwind by kiro.html` langsung di browser (Chrome, Firefox, Edge, Safari)
3. Aplikasi langsung berjalan

```bash
# Atau jika ingin serve lokal (opsional)
npx serve .
```

> File `index.html` adalah versi awal tanpa styling. Buka `index add tailwind by kiro.html` untuk versi final.

---

## Penjelasan Kode

### HTML (`index add tailwind by kiro.html`)
Struktur halaman dibagi menjadi 4 card:
1. **Total card** — menampilkan `#JumlahTotal`
2. **Form card** — form input + panel kategori kustom
3. **List card** — sort bar + daftar transaksi `#daftarTransaksi`
4. **Chart card** — `<canvas>` donut chart + legend

### CSS (`styles.css`)
Menggunakan **CSS custom properties (variables)** untuk mendukung dua tema:
- `:root` mendefinisikan semua warna/nilai untuk dark mode (default)
- `body.light` meng-override variabel yang sama untuk light mode
- Efek glassmorphism dicapai dengan `backdrop-filter: blur()` dan background semi-transparan
- Animasi `slideUp` dan `fadeIn` untuk transisi yang halus

### JavaScript (`app.js`)

**State yang dikelola:**
```js
let transaksi        // array objek pengeluaran
let customCategories // array kategori tambahan buatan pengguna
let currentSort      // { field, dir } — preferensi pengurutan
let isDark           // boolean tema aktif
```

**Fungsi utama:**
```
loadJSON / saveJSON      → baca/tulis localStorage
allCategories()          → gabung kategori bawaan + kustom
getCategoryMeta(name)    → ambil warna, emoji, badge class per kategori
getSortedList()          → sort transaksi sesuai currentSort
renderTotal()            → hitung dan tampilkan total
renderList()             → render daftar transaksi dengan sort
renderChart()            → gambar donut chart di Canvas, sesuaikan warna tema
renderCategorySelect()   → isi <select> kategori secara dinamis
renderCustomCatList()    → render tag kategori kustom yang bisa dihapus
addCustomCategory()      → validasi + tambah kategori baru
removeCustomCategory()   → hapus kategori + migrasi transaksi → 'Lainnya'
applyTheme(dark)         → toggle class body.light + update icon + redraw chart
render()                 → memanggil renderTotal + renderList + renderChart
```

**Alur data saat tambah pengeluaran:**
```
form submit
  → validasi input
  → push ke array transaksi
  → saveJSON ke localStorage
  → render() → tampil di list + total + chart terupdate
```

---

## Yang Ditulis Manual vs Dibantu AI

Ini adalah bagian penting untuk transparansi dalam konteks tugas RevoU.

### ✍️ Ditulis / Dibuat Sendiri (Manual)

| Bagian | Detail |
|---|---|
| `index.html` (versi awal) | Seluruh struktur HTML dasar ditulis sendiri: form, label, input, select, canvas, div pembungkus dengan class `wadah` |
| Logika dasar aplikasi | Pemahaman konsep: form submit, ambil nilai input, tambah ke array, tampilkan ke DOM, hitung total |
| Struktur data | Keputusan menyimpan `{ nama, jumlah, kategori }` per transaksi |
| Penggunaan `id` DOM | Penentuan nama ID untuk elemen: `JumlahTotal`, `formTransaksi`, `namaBarang`, `jumlahUang`, `kategori`, `daftarTransaksi`, `grafikLingkaran` |
| Konsep `localStorage` | Pemahaman cara kerja `getItem` / `setItem` untuk persistensi data |
| Konsep Canvas API | Pemahaman dasar menggambar dengan `getContext('2d')`, `arc()`, `fill()` untuk grafik lingkaran |
| Keputusan arsitektur | Memisahkan HTML, CSS, dan JS menjadi 3 file terpisah |
| Bahasa dan konten | Semua teks dalam Bahasa Indonesia, nama variabel, label form |

### 🤖 Dibantu AI (Kiro)

| Bagian | Detail |
|---|---|
| `index add tailwind by kiro.html` | Refactor HTML dengan Tailwind v4 CDN, struktur card yang rapi, aria-label untuk aksesibilitas |
| `styles.css` | Seluruh file: CSS variables dark/light, glassmorphism `backdrop-filter`, animasi, responsive layout, semua komponen visual |
| `app.js` | Implementasi lengkap: fungsi render, sort, custom category, theme toggle, `escapeHtml` untuk keamanan XSS, `hexAlpha` helper, `DOMContentLoaded` wiring |
| Donut chart | Refactor dari lingkaran biasa menjadi donut dengan hole, center text, dan legend dinamis |
| Fitur dark/light mode | CSS variables + toggle class + persistensi |
| Fitur sort | State management sort + 5 opsi + render ulang list |
| Fitur custom category | Logika tambah/hapus kategori + auto-color palette + migrasi transaksi |
| Input sanitasi | `escapeHtml()` untuk mencegah XSS saat render ke innerHTML |

### Kesimpulan

Versi awal (`index.html`) **100% ditulis sendiri** sebagai fondasi dan bukti pemahaman dasar HTML, form, dan konsep logika aplikasi. Versi final (`index add tailwind by kiro.html` + `styles.css` + `app.js`) dikembangkan **bersama AI (Kiro)** untuk menambahkan visual yang lebih baik dan fitur-fitur lanjutan, dengan pemahaman penuh atas setiap bagian kode yang dihasilkan — mulai dari cara kerja CSS variables, alur render DOM, hingga logika sort dan storage.

> Penggunaan AI dalam konteks ini bukan untuk menghindari belajar, melainkan sebagai alat kolaborasi — seperti pair programming — di mana saya mengarahkan apa yang ingin dibangun dan memahami hasilnya.
