# Catatan Belanja

**Catatan Belanja** adalah aplikasi web modern dan responsif yang dirancang untuk membantu pemilik warung, toko kelontong, dan UMKM dalam mengelola stok, membandingkan harga antar toko/agen grosir, mencatat kebutuhan belanja harian, menghitung estimasi biaya belanja, serta mencetak struk belanja langsung ke printer thermal mini (Bluetooth) maupun cetak standar (browser).

Aplikasi ini dapat diakses secara fleksibel dari perangkat HP Android/iOS, tablet, maupun laptop/desktop dengan sinkronisasi realtime melalui Supabase dan dukungan offline PWA.

---

## Fitur Utama

### 1. Manajemen Stok, Data Barang & Multi-Store (Beda Toko & Harga)
- **CRUD Barang Lengkap**: Tambah, lihat, ubah (edit), dan hapus data barang dengan aman (disertai konfirmasi).
- **Dukungan Multi-Store**: Barang dengan nama yang sama dapat disimpan dengan toko dan harga yang berbeda (contoh: *Botol Minum 600ml* di *Toko A* Rp15.000 vs di *Toko B* Rp18.000).
- **Atribut Lengkap**: Menyimpan nama barang, nama toko/agen (opsional dengan saran otomatis *autocomplete*), harga satuan, kategori, dan satuan unit (misal: `/kg`, `/dus`, `/pcs`, `/renceng`).
- **Modal Input Kustom Ramah HP**: Penambahan Kategori dan Satuan baru menggunakan modal in-app yang elegan menggantikan `window.prompt()` bawaan browser, sehingga 100% aman dan nyaman ditekan di layar sentuh HP.

### 2. Paginasi Cerdas (10 Barang per Halaman)
- **Ringan & Cepat**: Menampilkan maksimal **10 barang per halaman** sehingga aplikasi tetap gesit dan lancar meski memuat ratusan data stok barang.
- **Navigasi Pintar**: Navigasi halaman intuitif (`‹ Prev`, nomor halaman aktif, ellipsis `…`, `Next ›`) yang otomatis menyesuaikan jumlah data.
- **Reset Otomatis**: Halaman otomatis kembali ke Halaman 1 saat pengguna melakukan pencarian atau memilih kategori tertentu.

### 3. Checklist Belanja & Kontrol Jumlah (Quantity Counter)
- **Checklist Cepat**: Pilih barang yang perlu dibeli dengan satu sentuhan.
- **Alih Fungsi Tombol Otomatis**: Saat barang dichecklist, tombol `[Edit]` & `[Hapus]` otomatis berganti menjadi kontrol jumlah beli **`[ - ] (angka) [ + ]`**.
- **Perhitungan Subtotal Instan**: Subtotal dihitung otomatis $(\text{Harga Satuan} \times \text{Jumlah Beli})$ dan ditampilkan langsung di layar.
- **Sinkronisasi Kuantitas Hybrid**: Kuantitas tersimpan di cloud database serta sinkron dengan `localStorage` perangkat.
- **Prioritas Tampilan**: Barang yang dichecklist otomatis diposisikan di urutan teratas (Halaman 1).

### 4. Pencetakan Struk Thermal Mini & Browser (Dual-Mode Print)
- **Direct Bluetooth ESC/POS**: Terhubung langsung ke printer thermal mini Bluetooth (58mm / 80mm).
- **System / Browser Print Fallback**: Opsi cetak melalui dialog print browser/HP jika Bluetooth tidak tersedia.
- **Format 2 Baris Anti-Terpotong (Standar Kasir POS)**:
  - **Baris 1**: `- (jumlah barang)  (nama barang)` leluasa dan utuh sepanjang baris tanpa terpotong atau bertabrakan dengan harga.
  - **Baris 2**: Indentasi rapi memuat `(satuan)` dan opsional `(nama toko)` di kiri, serta `(harga)` **rata kanan** di ujung kertas 32 karakter sehingga nominal harga selalu tercetak rapi, bersih, dan tidak pernah bertubrukan.
- **Sakelar Opsi Cetak Toko Fleksibel**: Tersedia tombol pilihan `[✓] Cetak toko` di sebelah tombol cetak. Jika diaktifkan, nama toko dicantumkan di baris ke-2; jika dimatikan, struk tercetak bersih tanpa keterangan toko.
- **Format Struk Catatan Belanja (Opsi Cetak Toko Aktif)**:
  ```text
          CATATAN BELANJA
     Waktu: 21 Sep 2026, 09.30
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
- 2 Botol Minum 600ml
    /pcs (Toko A)      Rp30.000
- 1 Botol Minum 600ml
    /pcs (Toko B)      Rp18.000
- 5 Beras Ramos 5kg
    /karung           Rp140.000
- 3 Telur Ayam 1kg
    /kg (Agen Berkah)  Rp84.000
- 1 Barang dengan harga
    terjangkau
    /dus (Toko Laris)  Rp35.000
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Total Barang: 12 item
Total: Rp307.000
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  ```
- **Format Struk Riwayat Pembelian (Dikelompokkan per Kategori)**:
  ```text
       RIWAYAT PEMBELIAN
     Waktu: 21 Sep 2026, 11.45
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

===> SEMBAKO
- 5 Beras Ramos 5kg
    /karung           Rp140.000
- 3 Telur Ayam 1kg
    /kg (Agen Berkah)  Rp84.000

===> PERABOTAN & PLASTIK
- 2 Botol Minum 600ml
    /pcs (Toko A)      Rp30.000
- 1 Botol Minum 600ml
    /pcs (Toko B)      Rp18.000

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Total Barang: 11 item
Total: Rp272.000
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

### 5. Banner "Selesai Belanja" & Riwayat Pembelian (Purchase History)
- **Banner Interaktif**: Desain banner modern dengan kontras tinggi, menampilkan status dinamis jumlah barang yang dipilih, serta tombol yang nyaman ditekan di HP.
- **Integritas Transaksi Aman**: Memverifikasi penyimpanan arsip riwayat transaksi secara ketat sebelum mereset centang daftar belanjaan.
- **Detail Rinci dengan Kolom Toko**: Riwayat memuat tanggal transaksi, rincian barang, toko pembelian, kategori, satuan, jumlah beli (qty), harga satuan, dan subtotal.
- **Filter Waktu**: Filter riwayat berdasarkan Semua, Hari ini, 7 hari terakhir, atau Bulan ini.
- **Optimasi Kuota (Limit 30 Transaksi)**: Query dibatasi maksimal 30 transaksi terakhir sehingga konsumsi database Supabase super ringan dan aplikasi tetap gesit selamanya.
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
- **Tutup Modal Bertingkat**: Jika sedang membuka pop-up (Tambah/Edit barang, modal Kategori/Satuan, opsi Cetak, atau panduan Bluetooth), tombol *Back* akan menutup modal tersebut terlebih dahulu.
- **Pindah Tab Cerdas**: Jika sedang di tab Riwayat atau Pengaturan, tombol *Back* akan mengembalikan tampilan ke tab Daftar Barang.
- **Modal Verifikasi Keluar**: Jika pengguna menekan *Back* di halaman utama, akan muncul konfirmasi:
  > *"Keluar dari Catatan Belanja?"* `[ Tetap di Aplikasi ]` `[ Ya, Keluar dari Web ]`
  sehingga data belanjaan dan sesi tidak hilang secara tidak sengaja.

### 9. Pencegahan Auto-Pause Supabase & Layar Auto-Resume
- **GitHub Actions Keep-Alive**: Otomatisasi cron job yang melakukan ping ke Supabase REST API setiap 5 hari sekali agar project Supabase Free Tier tidak pernah di-pause otomatis karena tidak aktif.
- **Layar Membangunkan Database**: Jika database sedang resume setelah idle, antarmuka menampilkan pesan ramah *"Membangunkan database..."* disertai animasi countdown 5 detik dan sistem retry otomatis hingga 1 menit tanpa membuat pengguna panik atau melihat pesan error mentah.

### 10. Dukungan PWA & Akses Offline (Service Worker)
- **Aplikasi Native-like**: Pengguna dapat mengklik **"Install / Tambahkan ke Layar Utama"** di browser HP (Android & iOS).
- **Layar Penuh (Standalone)**: Aplikasi terbuka tanpa bilah alamat (*URL bar*) browser, terasa seperti aplikasi native (APK), dan sepenuhnya mengeliminasi risiko salah pencet tombol navigasi browser.
- **Ketahanan Offline Pasar**: Dilengkapi Service Worker (`public/sw.js`) dengan strategi caching *Network-First* dan *Stale-While-Revalidate* agar aplikasi tetap terbuka instan meski sinyal internet di pasar sedang terputus.

### 11. Import Data Massal (CSV)
- Tersedia script Node.js untuk memasukkan ratusan data barang sekaligus dari file CSV secara otomatis dan tervalidasi.

---

## Teknologi

- **Frontend**: React 19, Vite, Vanilla CSS modern (Glassmorphism, DM Mono, Plus Jakarta Sans)
- **PWA & Offline**: Web App Manifest & Service Worker Cache API
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
   - `categories` (`id`, `user_id`, `name`, `created_at`)
   - `units` (`id`, `user_id`, `name`, `created_at`)
   - `items` (`id`, `user_id`, `name`, `price`, `category_id`, `unit_id`, `store_name`, `quantity`, `is_selected`, `created_at`)
   - `purchase_history` (`id`, `user_id`, `items` (JSONB), `purchased_at`, `created_at`)
5. Jika tabel `items` sudah ada sebelumnya, tambahkan kolom `store_name`:
   ```sql
   ALTER TABLE items ADD COLUMN IF NOT EXISTS store_name TEXT DEFAULT '';
   ```
6. Aktifkan **Row Level Security (RLS)** dengan policy `auth.uid() = user_id`.
7. Aktifkan fitur **Realtime** pada tabel-tabel tersebut.

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
    └── keep-alive.yml          # Workflow GitHub Actions untuk ping Supabase otomatis tiap 5 hari
public/
├── favicon.svg                 # Logo resmi brand & favicon web
├── manifest.webmanifest        # Konfigurasi PWA untuk install ke layar utama HP
└── sw.js                       # Service Worker PWA untuk offline caching antarmuka
src/
├── components/
│   ├── modals/
│   │   ├── BluetoothGuideModal.jsx   # Panduan aktivasi Web Bluetooth di Linux
│   │   ├── ConfirmExitModal.jsx      # Modal konfirmasi back button guard
│   │   ├── ItemModal.jsx             # Form tambah & edit barang dengan input nama toko
│   │   ├── PrintFallbackModal.jsx    # Opsi cetak browser jika Bluetooth tidak aktif
│   │   └── PromptModal.jsx           # Modal kustom Kategori & Satuan ramah HP
│   ├── AuthScreen.jsx          # Form login dual-mode (password instan & email OTP)
│   ├── HistoryView.jsx         # Arsip riwayat pembelian dengan kolom toko & filter waktu
│   ├── ItemList.jsx            # Daftar barang, paginasi, badge toko, & sakelar cetak toko
│   ├── Notice.jsx              # Layar info, loading, & auto-resume database bangun
│   ├── SettingsView.jsx        # Pengaturan kategori, satuan, & ganti kata sandi akun
│   └── TopBar.jsx              # Header aplikasi, status realtime cloud, & tombol logout
├── utils/
│   └── bluetoothPrinter.js     # Driver printer thermal ESC/POS 32-kolom & Web Bluetooth GATT
├── App.jsx                     # Orkestrator aplikasi, state, routing tab, & back button guard
├── main.jsx                    # Entry point React & registrasi Service Worker
├── styles.css                  # Desain antarmuka, responsivitas HP, & styling struk cetak
└── supabase.js                 # Inisialisasi Supabase client dengan persistent session
import/
├── data-template.csv           # Template file data CSV barang
├── import.js                   # Script import data massal
├── IMPORT_GUIDE.md             # Panduan detail cara import CSV
└── import-report.txt           # Laporan log hasil import
index.html                      # Halaman HTML utama
vite.config.js                  # Konfigurasi Vite
package.json                    # Konfigurasi dependensi project
```

---

## Catatan Keamanan

- Seluruh data barang terlindungi oleh sistem keamanan **Row Level Security (RLS)** di Supabase PostgreSQL.
- Token `service_role key` hanya digunakan untuk script import lokal dan tidak pernah dimasukkan ke frontend.
- File environment `.env.local` dan `import/.env.import` sudah terdaftar di `.gitignore` untuk mencegah kebocoran kredensial.
