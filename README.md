# Catatan Belanja

**Catatan Belanja** adalah aplikasi web modern dan responsif yang dirancang untuk membantu pemilik warung, toko kelontong, dan UMKM dalam mengelola stok, mencatat kebutuhan belanja harian, menghitung estimasi biaya belanja, serta mencetak struk belanja langsung ke printer thermal mini (Bluetooth) maupun cetak standar (browser).

Aplikasi ini dapat diakses secara fleksibel dari perangkat HP Android/iOS, tablet, maupun laptop/desktop dengan sinkronisasi realtime melalui Supabase.

---

## Fitur Utama

### 1. Manajemen Stok & Data Barang
- **CRUD Barang**: Tambah, lihat, ubah (edit), dan hapus data barang dengan aman (disertai konfirmasi).
- **Atribut Lengkap**: Menyimpan nama barang, harga satuan, kategori, dan satuan unit (misal: `/kg`, `/dus`, `/pcs`, `/renceng`).
- **Kelola Kategori & Satuan**: Tambah atau hapus kategori dan satuan yang disesuaikan dengan kebutuhan warung.

### 2. Paginasi Cerdas (10 Barang per Halaman)
- **Ringan & Cepat**: Menampilkan maksimal **10 barang per halaman** sehingga aplikasi tetap gesit dan lancar meski memuat ratusan data stok barang.
- **Navigasi Pintar**: Navigasi halaman intuitif (`‹ Prev`, nomor halaman aktif, ellipsis `…`, `Next ›`) yang otomatis menyesuaikan jumlah data.
- **Reset Otomatis**: Halaman otomatis kembali ke Halaman 1 saat pengguna melakukan pencarian atau memilih kategori tertentu.

### 3. Checklist Belanja & Kontrol Jumlah (Quantity Counter)
- **Checklist Cepat**: Pilih barang yang perlu dibeli dengan satu sentuhan.
- **Alih Fungsi Tombol Otomatis**: Saat barang dichecklist, tombol `[Edit]` & `[Hapus]` otomatis berganti menjadi kontrol jumlah beli **`[ - ] (angka) [ + ]`**.
- **Perhitungan Subtotal Instan**: Subtotal dihitung otomatis $(\text{Harga Satuan} \times \text{Jumlah Beli})$ dan ditampilkan langsung di layar.
- **Penyimpanan Lokal**: Jumlah barang tersimpan di `localStorage` sehingga tidak hilang saat halaman di-refresh.
- **Prioritas Tampilan**: Barang yang dichecklist otomatis diposisikan di urutan teratas (Halaman 1).

### 4. Pencetakan Struk Thermal Mini & Browser (Dual-Mode Print)
- **Direct Bluetooth ESC/POS**: Terhubung langsung ke printer thermal mini Bluetooth (58mm / 80mm).
- **System / Browser Print Fallback**: Opsi cetak melalui dialog print browser/HP jika Bluetooth tidak tersedia.
- **Format 2 Baris Anti-Terpotong**:
  - **Baris 1**: `- (jumlah barang)  (nama barang)`
  - **Baris 2**: Indentasi rapi memuat `(satuan)` di kiri dan `(harga)` **rata kanan** di ujung kertas 32 karakter sehingga nominal harga tidak akan terpotong atau patah ke baris baru.
- **Keterangan Total Barang**: Menampilkan akumulasi seluruh *quantity* barang yang dibeli tepat di atas Total Harga.
- **Format Struk Catatan Belanja**:
  ```text
          CATATAN BELANJA
       Waktu: 21 Agu 2026, 09.30
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  - 2  Beras Ramos 5kg
       /karung           Rp140.000
  - 3  Minyak Bimoli 2L
       /pouch             Rp99.000
  - 1  Telur Ayam 1kg
       /kg                Rp28.000
  - 5  Gula Pasir 1kg
       /kg                Rp75.000
  - 2  Kopi Kapal Api
       /renceng           Rp30.000
  - 1  Indomie Goreng
       /dus              Rp118.000
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Total Barang: 14 item
  Total: Rp490.000
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  ```
- **Format Struk Riwayat Pembelian (Dikelompokkan per Kategori)**:
  ```text
         RIWAYAT PEMBELIAN
       Waktu: 21 Agu 2026, 11.45
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  ===> SEMBAKO
  - 2  Beras Ramos 5kg
       /karung           Rp140.000
  - 3  Minyak Bimoli 2L
       /pouch             Rp99.000
  - 5  Gula Pasir 1kg
       /kg                Rp75.000

  ===> MAKANAN & MINUMAN
  - 1  Indomie Goreng
       /dus              Rp118.000
  - 2  Kopi Kapal Api
       /renceng           Rp30.000

  ===> KEBUTUHAN RUMAH
  - 4  Sabun Mandi
       /pcs               Rp16.000
  - 2  Deterjen Bubuk
       /bungkus           Rp34.000

  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Total Barang: 19 item
  Total: Rp512.000
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  ```

### 5. Banner "Selesai Belanja" & Riwayat Pembelian (Purchase History)
- **Banner Interaktif**: Desain banner modern dengan kontras tinggi, menampilkan status dinamis jumlah barang yang dipilih, serta tombol yang nyaman ditekan di HP.
- **Tandai Selesai Belanja**: Memindahkan daftar barang belanja yang dipilih ke dalam arsip riwayat pembelian dalam sekali klik.
- **Detail Rinci**: Riwayat memuat tanggal transaksi, rincian barang, kategori, satuan, jumlah beli (qty), harga satuan, dan subtotal.
- **Filter Waktu**: Filter riwayat berdasarkan Semua, Hari ini, 7 hari terakhir, atau Bulan ini.
- **Cetak Ulang & Hapus Riwayat**: Kemudahan mencetak ulang struk riwayat kapan saja atau menghapus arsip yang sudah tidak diperlukan.

### 6. Branding & Logo Resmi
- Dilengkapi logo vektor SVG resmi (ikon tas belanja dengan checklist centang hijau) yang terintegrasi pada Favicon browser, topbar aplikasi, serta halaman login.

### 7. Autentikasi Fleksibel & Bebas Limit (Dual-Mode Auth)
- **Login Kata Sandi (Instan)**: Masuk langsung menggunakan email dan kata sandi dalam 2 detik tanpa perlu menunggu email dan 100% bebas dari risiko terkena batas rate-limit 1 jam Supabase.
- **Tautan Email (Magic Link / OTP)**: Opsi alternatif masuk satu kali klik via email bagi pengguna baru atau yang lupa kata sandi.
- **Pengaturan Kata Sandi Mandiri**: Pengguna dapat membuat atau mengganti kata sandi akun kapan saja langsung dari tab **Pengaturan**.
- **Sinkronisasi Realtime**: Perubahan data di HP langsung tersinkron ke laptop secara realtime melalui Supabase WebSockets.

### 8. Anti-Keluar Tidak Sengaja (Back-Button Navigation Guard)
- **Cegah Terlempar Keluar**: Tombol *Back* peramban atau gesture swipe di HP tidak akan langsung menutup website.
- **Tutup Modal Bertingkat**: Jika sedang membuka pop-up (Tambah/Edit barang, opsi Cetak, atau panduan Bluetooth), tombol *Back* akan menutup modal tersebut terlebih dahulu.
- **Pindah Tab Cerdas**: Jika sedang di tab Riwayat atau Pengaturan, tombol *Back* akan mengembalikan tampilan ke tab Daftar Barang.
- **Modal Verifikasi Keluar**: Jika pengguna menekan *Back* di halaman utama, akan muncul konfirmasi:
  > *"Keluar dari Catatan Belanja?"* `[ Tetap di Aplikasi ]` `[ Ya, Keluar dari Web ]`
  sehingga data belanjaan dan sesi tidak hilang secara tidak sengaja.

### 9. Pencegahan Auto-Pause Supabase & Layar Auto-Resume
- **GitHub Actions Keep-Alive**: Otomatisasi cron job yang melakukan ping ke Supabase REST API setiap 5 hari sekali agar project Supabase Free Tier tidak pernah di-pause otomatis karena tidak aktif.
- **Layar Membangunkan Database**: Jika database sedang resume setelah idle, antarmuka menampilkan pesan ramah *"Membangunkan database..."* disertai animasi countdown 5 detik dan sistem retry otomatis hingga 1 menit tanpa membuat pengguna panik atau melihat pesan error mentah.

### 10. Import Data Massal (CSV)
- Tersedia script Node.js untuk memasukkan ratusan data barang sekaligus dari file CSV secara otomatis dan tervalidasi.

---

## Teknologi

- **Frontend**: React 19, Vite, Vanilla CSS modern (Glassmorphism, DM Mono, Plus Jakarta Sans)
- **Hardware Integration**: Web Bluetooth API (ESC/POS Thermal Printer Protocol)
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Realtime Sync, Auth)
- **CLI Utility**: Node.js dengan `csv-parser` untuk import massal

---

## Menjalankan Secara Lokal

Pastikan Node.js sudah terpasang di komputer Anda:

```bash
# 1. Install dependency
npm install

# 2. Jalankan dev server lokal
npm run dev
```

Buka URL yang muncul di terminal (biasanya `http://localhost:5173`).

Untuk membuka web dari HP yang terhubung ke jaringan Wi-Fi yang sama:
```bash
npm run dev -- --host
```

---

## Environment Variable

Buat file `.env.local` di folder utama project:

```env
VITE_SUPABASE_URL=https://project-anda.supabase.co
VITE_SUPABASE_ANON_KEY=anon-public-key-anda
```

> **Perhatian**: Jangan pernah memasukkan `service_role key` ke dalam `.env.local`, source code frontend, atau commit ke repository GitHub.

---

## Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com).
2. Aktifkan **Email Auth** pada menu *Authentication* → *Providers*.
3. Daftarkan URL aplikasi pada *Authentication* → *URL Configuration*.
4. Buat tabel database:
   - `categories` (id, user_id, name, created_at)
   - `units` (id, user_id, name, created_at)
   - `items` (id, user_id, name, price, category_id, unit_id, is_selected, created_at)
   - `purchase_history` (id, user_id, items (JSONB), purchased_at, created_at)
5. Aktifkan **Row Level Security (RLS)** dengan policy `auth.uid() = user_id`.
6. Aktifkan fitur **Realtime** pada keempat tabel tersebut.

---

## Import Data dari CSV

Script import berada di folder `import/`. Panduan lengkap dapat dibaca di `import/IMPORT_GUIDE.md`.

1. Siapkan file konfigurasi lokal `import/.env.import`:
   ```env
   SUPABASE_URL=https://project-anda.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=service-role-key-anda
   USER_EMAIL=email-akun-anda@example.com
   ```

2. Jalankan simulasi (Dry Run) tanpa menulis ke database:
   ```bash
   node import/import.js --dry-run --file import/data-template.csv
   ```

3. Jalankan import data yang sesungguhnya:
   ```bash
   node import/import.js --file import/data.csv
   ```

---

## Build & Deployment

### Build Produksi
```bash
npm run build
```
File bundle produksi siap pakai akan dihasilkan di folder `dist/`.

### Deployment ke Vercel / Netlify
1. Hubungkan repository GitHub project ke Vercel/Netlify.
2. Tambahkan **Environment Variables** pada pengaturan hosting:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Setelah mendapat domain production, tambahkan URL tersebut ke Supabase *Authentication* → *URL Configuration*.

### Konfigurasi GitHub Actions (Keep-Alive Supabase)
Agar workflow otomatis pencegah auto-pause di `.github/workflows/keep-alive.yml` dapat berjalan:
1. Buka repository di GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. Klik **New repository secret** dan tambahkan:
   - `SUPABASE_URL`: URL project Supabase Anda (contoh: `https://xxxx.supabase.co`)
   - `SUPABASE_ANON_KEY`: Kunci anonim publik Supabase Anda

---

## Struktur Folder

```text
.github/
└── workflows/
    └── keep-alive.yml   # Workflow GitHub Actions untuk ping Supabase otomatis tiap 5 hari
src/
├── App.jsx              # Komponen utama aplikasi, logika belanja, paginasi, print, auth, & state
├── main.jsx             # Entry point React
├── styles.css           # Desain antarmuka, paginasi, responsivitas HP, auth tabs, & styling print
└── supabase.js          # Inisialisasi Supabase client dengan persistent session
public/
└── favicon.svg          # Logo resmi brand & favicon web
import/
├── data-template.csv    # Template file data CSV barang
├── import.js            # Script import data massal
├── IMPORT_GUIDE.md      # Panduan detail cara import CSV
└── import-report.txt    # Laporan log hasil import
index.html               # Halaman HTML utama
vite.config.js           # Konfigurasi Vite
```

---

## Catatan Keamanan

- Seluruh data barang terlindungi oleh sistem keamanan **Row Level Security (RLS)** di Supabase PostgreSQL.
- Token `service_role key` hanya digunakan untuk script import lokal dan tidak pernah dimasukkan ke frontend.
- File environment `.env.local` dan `import/.env.import` sudah terdaftar di `.gitignore` untuk mencegah kebocoran kredensial.
