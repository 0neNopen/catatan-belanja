# Import Barang dari Google Sheets

## Siapkan Google Sheets

1. Buat spreadsheet baru bernama `Catatan Belanja - Template Import`.
2. Buat sheet `Data Barang` dengan header tepat:

   `Nama Barang,Kategori,Satuan,Harga`

3. Isi satu barang per baris. Contoh harga: `15000`, bukan `Rp15.000`.
4. Gunakan kategori yang sudah dibuat pada akun aplikasi: `Sembako`, `Rokok`, `Snack`.
5. Gunakan satuan yang sudah dibuat: `dus`, `box`, `rtg`, `ikat`.
6. Download hanya sheet `Data Barang`: **File → Download → Comma-separated values (.csv)**.
7. Simpan hasilnya sebagai `data.csv` di folder proyek atau folder `import`.

`import/data-template.csv` dapat diunggah ke Google Sheets sebagai contoh. Google Sheets share link tidak dapat dibuat otomatis tanpa akses akun Google; setelah spreadsheet dibuat, gunakan **Share → General access** sesuai kebutuhan. Jangan membagikan spreadsheet yang memuat credential.

## Siapkan credential

1. Supabase Dashboard → **Project Settings → API**.
2. Salin `service_role` secret key. Jangan gunakan `anon public key` untuk script import.
3. Buka `import/.env.import`.
4. Isi:

```env
SUPABASE_URL=https://glfmzbkbkxwlspcyzass.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_key_anda
USER_EMAIL=warung.yayuk1971@gmail.com
```

Service role key memberi akses penuh dan hanya boleh disimpan di komputer pribadi. Jangan kirim, commit, atau masukkan ke Google Sheets. File ini sudah masuk `.gitignore`.

## Test aman tanpa menulis database

Dari root proyek:

```bash
node import/import.js --dry-run --file import/data-template.csv
```

Hasil yang diharapkan: 3 valid, 2 dilewati. `--dry-run` hanya membaca user, kategori, satuan, dan barang existing; tidak insert.

## Import nyata

Setelah dry-run bersih:

```bash
node import/import.js --file data.csv
```

Atau jika file berada di folder import:

```bash
node import/import.js --file import/data.csv
```

Script:

- mencari user berdasarkan `USER_EMAIL`;
- memetakan kategori dan satuan milik user;
- memberi peringatan untuk nama duplikat, lalu tetap insert;
- melewati baris dengan kategori/satuan/harga tidak valid;
- insert per batch 100 barang;
- menampilkan hasil di terminal dan `import/import-report.txt`.

## Troubleshooting

- `User tidak ditemukan`: login/verifikasi email tersebut di aplikasi dulu.
- `Kategori tidak ditemukan`: buat kategori di aplikasi sebelum import.
- `Satuan tidak ditemukan`: tambah satuan dari form `Tambah Barang` sebelum import.
- `Kolom CSV hilang`: gunakan header tepat, termasuk huruf besar dan spasi.
- `Harga harus angka murni`: hapus `Rp`, titik, dan koma.
- `permission denied` atau RLS error: jangan ganti ke anon key; cek service role key dan URL.

Setelah import, buka aplikasi dan cek jumlah barang, filter kategori, pencarian, edit, checklist, dan cetak.
