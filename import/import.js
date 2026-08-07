import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'
import csv from 'csv-parser'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const fileIndex = args.indexOf('--file')
const inputFile = fileIndex >= 0 ? args[fileIndex + 1] : null
const reportFile = path.resolve('import/import-report.txt')

function loadEnv(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
}

loadEnv(path.resolve('import/.env.import'))

const report = { valid: 0, skipped: 0, inserted: 0, duplicates: 0, errors: [], warnings: [] }
const output = []
function log(message) { output.push(message); console.log(message) }
function finish() {
  const summary = [`Mode: ${dryRun ? 'DRY RUN' : 'IMPORT'}`, `Valid: ${report.valid}`, `Inserted: ${report.inserted}`, `Skipped: ${report.skipped}`, `Duplicates: ${report.duplicates}`, `Errors: ${report.errors.length}`, '', ...output]
  fs.writeFileSync(reportFile, `${summary.join('\n')}\n`, 'utf8')
  log(`\nReport tersimpan: ${reportFile}`)
}
function fail(message) { console.error(`Error: ${message}`); fs.writeFileSync(reportFile, `${message}\n`, 'utf8'); process.exitCode = 1 }

if (!inputFile) fail('Gunakan --file <path.csv>. Contoh: node import/import.js --dry-run --file import/data-template.csv')
else if (!fs.existsSync(inputFile)) fail(`File CSV tidak ditemukan: ${inputFile}`)
else if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.USER_EMAIL) fail('Isi SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan USER_EMAIL di import/.env.import')
else {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  const rows = []
  fs.createReadStream(inputFile).pipe(csv()).on('data', (row) => rows.push(row)).on('error', (error) => fail(`CSV gagal dibaca: ${error.message}`)).on('end', async () => {
    try {
      const headers = Object.keys(rows[0] || {})
      const required = ['Nama Barang', 'Kategori', 'Satuan', 'Harga']
      const missing = required.filter((header) => !headers.includes(header))
      if (missing.length) return fail(`Kolom CSV hilang: ${missing.join(', ')}. Header wajib: ${required.join(', ')}`)
      const user = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (user.error) return fail(`Gagal membaca user: ${user.error.message}`)
      const account = user.data.users.find((item) => item.email?.toLowerCase() === process.env.USER_EMAIL.toLowerCase())
      if (!account) return fail(`User tidak ditemukan: ${process.env.USER_EMAIL}`)
      const [categoryResult, unitResult, itemResult] = await Promise.all([
        supabase.from('categories').select('id,name').eq('user_id', account.id),
        supabase.from('units').select('id,name').eq('user_id', account.id),
        supabase.from('items').select('name,category_id').eq('user_id', account.id),
      ])
      const failure = [categoryResult, unitResult, itemResult].find((result) => result.error)
      if (failure) return fail(`Gagal membaca referensi: ${failure.error.message}`)
      const categories = new Map(categoryResult.data.map((item) => [item.name.trim().toLowerCase(), item]))
      const units = new Map(unitResult.data.map((item) => [item.name.trim().toLowerCase(), item]))
      const existing = new Set(itemResult.data.map((item) => `${item.name.trim().toLowerCase()}|${item.category_id}`))
      const validRows = []
      rows.forEach((row, index) => {
        const line = index + 2
        const name = row['Nama Barang']?.trim()
        const categoryName = row['Kategori']?.trim()
        const unitName = row['Satuan']?.trim()
        const price = row['Harga']?.trim()
        const category = categories.get(categoryName?.toLowerCase())
        const unit = units.get(unitName?.toLowerCase())
        const problems = []
        if (!name) problems.push('Nama Barang kosong')
        if (!category) problems.push(`Kategori tidak ditemukan: ${categoryName || '(kosong)'}`)
        if (!unit) problems.push(`Satuan tidak ditemukan: ${unitName || '(kosong)'}`)
        if (!/^\d+$/.test(price || '')) problems.push('Harga harus angka murni')
        if (problems.length) { report.skipped++; report.errors.push(`Baris ${line}: ${problems.join('; ')}`); log(`SKIP baris ${line}: ${problems.join('; ')}`); return }
        const duplicateKey = `${name.toLowerCase()}|${category.id}`
        if (existing.has(duplicateKey)) { report.duplicates++; report.warnings.push(`Baris ${line}: duplikat ${name}`); log(`WARN baris ${line}: ${name} sudah ada, tetap insert ID baru`) }
        existing.add(duplicateKey)
        validRows.push({ user_id: account.id, name, price: Number(price), category_id: category.id, unit_id: unit.id, is_selected: false })
        report.valid++
      })
      if (dryRun) { log('DRY RUN selesai: tidak ada data yang ditulis.'); return finish() }
      for (let index = 0; index < validRows.length; index += 100) {
        const batch = validRows.slice(index, index + 100)
        const result = await supabase.from('items').insert(batch)
        if (result.error) { report.errors.push(`Batch ${index + 1}-${index + batch.length}: ${result.error.message}`); report.skipped += batch.length; log(`ERROR batch ${index + 1}-${index + batch.length}: ${result.error.message}`) }
        else { report.inserted += batch.length; log(`OK batch ${index + 1}-${index + batch.length}: ${batch.length} barang`) }
      }
      finish()
    } catch (error) { fail(error.message) }
  })
}
