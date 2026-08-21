# Catatan Belanja

**Catatan Belanja** adalah aplikasi web modern dan responsif yang dirancang untuk membantu pemilik warung, toko kelontong, dan UMKM dalam mengelola stok, mencatat kebutuhan belanja harian, menghitung estimasi biaya belanja, serta mencetak struk belanja langsung ke printer thermal mini (Bluetooth) maupun cetak standar (browser).

Aplikasi ini dapat diakses secara fleksibel dari perangkat HP Android/iOS, tablet, maupun laptop/desktop dengan sinkronisasi realtime melalui Supabase.

---

## Fitur Utama

### 1. Manajemen Stok & Data Barang
- **CRUD Barang**: Tambah, lihat, ubah (edit), dan hapus data barang dengan aman (disertai konfirmasi).
- **Atribut Lengkap**: Menyimpan nama barang, harga satuan, kategori, dan satuan unit (misal: `/kg`, `/dus`, `/pcs`, `/renceng`).
- **Kelola Kategori & Satuan**: Tambah atau hapus kategori dan satuan yang disesuaikan dengan kebutuhan warung.

### 2. Checklist Belanja & Kontrol Jumlah (Quantity Counter)
- **Checklist Cepat**: Pilih barang yang perlu dibeli dengan satu sentuhan.
- **Alih Fungsi Tombol Otomatis**: Saat barang dichecklist, tombol `[Edit]` & `[Hapus]` otomatis berganti menjadi kontrol jumlah beli **`[ - ] (angka) [ + ]`**.
- **Perhitungan Subtotal Instan**: Subtotal dihitung otomatis $(\text{Harga Satuan} \times \text{Jumlah Beli})$ dan ditampilkan langsung di layar.
- **Penyimpanan Lokal**: Jumlah barang tersimpan di `localStorage` sehingga tidak hilang saat halaman di-refresh.

### 3. Pencetakan Struk Thermal Mini & Browser (Dual-Mode Print)
- **Direct Bluetooth ESC/POS**: Terhubung langsung ke printer thermal mini Bluetooth (58mm / 80mm).
- **System / Browser Print Fallback**: Opsi cetak melalui dialog print browser/HP jika Bluetooth tidak tersedia.
- **Format Catatan Belanja Ringkas**: Menampilkan daftar belanja tanpa penumpukan teks kategori, dengan format:
  ```text
  CATATAN BELANJA
  Waktu: 21 Agu 2026, 16:15
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  - 2  Beras Ramos     /kg     Rp30.000
  - 1  Minyak Goreng   /liter  Rp18.000
  - 3  Sabun Mandi     /pcs    Rp15.000
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Total: Rp63.000
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  ```
- **Format Riwayat Pembelian (Grouped by Category)**: Riwayat dicetak dengan pengelompokan rapi berdasarkan kategori masing-masing:
  ```text
  RIWAYAT PEMBELIAN
  Waktu: 21 Agu 2026, 16:15
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  ===> SEMBAKO
  - 2  Beras Ramos     /kg     Rp30.000
  - 1  Minyak Goreng   /liter  Rp18.000

  ===> BUMBU DAPUR
  - 1  Bawang Merah    /kg     Rp35.000
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  Total: Rp83.000
  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  ```

### 4. Riwayat Pembelian (Purchase History)
- **Tandai Selesai Belanja**: Memindahkan daftar barang belanja yang dipilih ke dalam arsip riwayat pembelian dalam sekali klik.
- **Detail Rinci**: Riwayat memuat tanggal transaksi, rincian barang, kategori, satuan, jumlah beli (qty), harga satuan, dan subtotal.
- **Filter Waktu**: Filter riwayat berdasarkan Semua, Hari ini, 7 hari terakhir, atau Bulan ini.
- **Cetak Ulang & Hapus Riwayat**: Kemudahan mencetak ulang struk riwayat kapan saja atau menghapus arsip yang sudah tidak diperlukan.

### 5. Multi-Device & Autentikasi Cloud
- **Passwordless Auth**: Masuk aman menggunakan Magic Link / OTP via Email.
- **Sinkronisasi Realtime**: Perubahan data di HP langsung tersinkron ke laptop secara realtime melalui Supabase WebSockets.

### 6. Import Data Massal (CSV)
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

---

## Struktur Folder

```text
src/
├── App.jsx              # Komponen utama aplikasi, logika belanja, print, & state
├── main.jsx             # Entry point React
├── styles.css           # Desain antarmuka, responsivitas HP, & styling print
└── supabase.js          # Inisialisasi Supabase client
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
