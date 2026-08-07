# Catatan Belanja

Catatan Belanja adalah website sederhana untuk membantu pemilik warung membuat daftar barang yang perlu dibeli atau diisi ulang.

Project ini dibuat supaya pencatatan belanja lebih cepat, mudah dicari, bisa dicetak, dan dapat digunakan dari laptop maupun HP.

## Fitur

- Tambah, lihat, ubah, dan hapus barang.
- Data barang berisi nama, harga, kategori, dan satuan.
- Checklist barang yang ingin dibeli.
- Barang yang dichecklist tampil di bagian atas daftar.
- Pencarian dan filter berdasarkan kategori.
- Cetak barang yang sudah dipilih.
- Riwayat pembelian dengan detail barang, kategori, satuan, dan harga.
- Filter riwayat berdasarkan waktu.
- Hapus riwayat pembelian.
- Login menggunakan email OTP.
- Sinkronisasi data laptop dan HP melalui Supabase.
- Import banyak barang dari CSV menggunakan script Node.js.

## Teknologi

- React
- Vite
- Supabase PostgreSQL
- Supabase Authentication
- Supabase Realtime
- CSS biasa
- Node.js untuk script import CSV

## Menjalankan Secara Lokal

Pastikan Node.js sudah terpasang, lalu jalankan:

```bash
npm install
npm run dev
```

Buka alamat yang muncul, biasanya `http://localhost:5173`.

Agar dapat dibuka dari HP pada Wi-Fi yang sama:

```bash
npm run dev -- --host
```

## Environment Variable

Buat file `.env.local` di folder utama project:

```env
VITE_SUPABASE_URL=https://project-anda.supabase.co
VITE_SUPABASE_ANON_KEY=anon-public-key-anda
```

Jangan masukkan `service_role key` ke `.env.local`, source code, atau repository GitHub.

## Setup Supabase

1. Buat project di Supabase.
2. Aktifkan Email provider pada Authentication.
3. Tambahkan URL aplikasi pada Authentication → URL Configuration.
4. Buat tabel `categories`, `units`, `items`, dan `purchase_history`.
5. Aktifkan Row Level Security.
6. Gunakan policy yang membatasi data berdasarkan `auth.uid() = user_id`.
7. Aktifkan Realtime untuk empat tabel tersebut.
8. Jalankan `supabase-price-migration.sql` jika kolom harga belum tersedia.

## Import CSV

Script import berada di folder `import/`. Panduan lengkap ada di:

```text
import/IMPORT_GUIDE.md
```

Install dependency:

```bash
npm install
```

Siapkan `import/.env.import` secara lokal:

```env
SUPABASE_URL=https://project-anda.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key-anda
USER_EMAIL=email-akun-anda
```

Test tanpa menulis database:

```bash
node import/import.js --dry-run --file import/data-template.csv
```

Import data yang sudah lolos validasi:

```bash
node import/import.js --file import/data.csv
```

Script melakukan validasi kategori, satuan, dan harga. Baris yang salah dilewati dan ditulis ke `import/import-report.txt`.

`service_role key` sangat rahasia. Jangan commit file `import/.env.import`.

## Build Produksi

```bash
npm run build
```

Hasil build dibuat di folder `dist/`.

## Deploy

Project dapat dideploy melalui Vercel, Netlify, atau layanan hosting lain yang mendukung Vite.

Saat membuat deployment, tambahkan environment variable berikut pada pengaturan hosting:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Setelah mendapat domain production, tambahkan domain tersebut ke Supabase Authentication → URL Configuration.

## Struktur Folder

```text
src/                  Kode aplikasi React
import/               Script dan panduan import CSV
index.html            Halaman HTML utama
vite.config.js        Konfigurasi Vite
```

## Catatan Keamanan

- Data barang tersimpan di Supabase, bukan di GitHub.
- Repository hanya berisi kode aplikasi dan template.
- File environment lokal sudah masuk `.gitignore`.
- RLS harus tetap aktif agar data setiap akun terpisah.
- Jangan membagikan anon key bersama service role key. Anon key boleh digunakan di aplikasi web, service role key tidak boleh.

## Lisensi

Project ini menggunakan lisensi MIT.
