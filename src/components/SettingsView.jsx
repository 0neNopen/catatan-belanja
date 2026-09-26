import { useState } from 'react'
import { supabase } from '../supabase'
import ConfirmDeleteModal from './modals/ConfirmDeleteModal'

export default function SettingsView({
  categories,
  units,
  pieceUnits = [],
  items = [],
  historyCount = 0,
  onOpenAddCategory,
  onOpenAddUnit,
  onOpenAddPieceUnit,
  onOpenEditCategory,
  onOpenEditUnit,
  onOpenEditPieceUnit,
  onDeleteCategory,
  onDeleteUnit,
  onDeletePieceUnit,
  onCleanupHistory,
  onToast,
}) {
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: null,
  })

  function handleDeleteCategoryClick(item) {
    const used = items.filter((i) => i.category_id === item.id)
    if (used.length > 0) {
      const examples = used.slice(0, 3).map((i) => `"${i.name}"`).join(', ')
      const more = used.length > 3 ? ', dsb.' : ''
      setConfirmModal({
        isOpen: true,
        type: 'warning',
        title: 'Kategori Masih Digunakan',
        message: `Kategori "${item.name}" saat ini masih digunakan oleh ${used.length} barang belanjaan (${examples}${more}).\n\nKategori tidak dapat dihapus sebelum barang-barang tersebut diubah atau dihapus.\n\nTips: Jika Anda hanya ingin memperbaiki ejaan (typo), gunakan tombol "Edit".`,
        onConfirm: null,
      })
      return
    }

    setConfirmModal({
      isOpen: true,
      type: 'confirm',
      title: 'Hapus Kategori?',
      message: `Apakah Anda yakin ingin menghapus kategori "${item.name}"?\n\nTindakan ini permanen dan tidak dapat dibatalkan.`,
      onConfirm: () => onDeleteCategory(item),
    })
  }

  function handleDeleteUnitClick(item) {
    const used = items.filter((i) => i.unit_id === item.id)
    if (used.length > 0) {
      const examples = used.slice(0, 3).map((i) => `"${i.name}"`).join(', ')
      const more = used.length > 3 ? ', dsb.' : ''
      setConfirmModal({
        isOpen: true,
        type: 'warning',
        title: 'Satuan Masih Digunakan',
        message: `Satuan "/${item.name}" saat ini masih digunakan oleh ${used.length} barang belanjaan (${examples}${more}).\n\nSatuan tidak dapat dihapus sebelum barang-barang tersebut diubah atau dihapus.\n\nTips: Jika Anda hanya ingin memperbaiki ejaan (typo), gunakan tombol "Edit".`,
        onConfirm: null,
      })
      return
    }

    setConfirmModal({
      isOpen: true,
      type: 'confirm',
      title: 'Hapus Satuan Belanja?',
      message: `Apakah Anda yakin ingin menghapus satuan "/${item.name}"?\n\nTindakan ini permanen dan tidak dapat dibatalkan.`,
      onConfirm: () => onDeleteUnit(item),
    })
  }

  function handleDeletePieceUnitClick(item) {
    const used = items.filter((i) => i.piece_unit === item.name)
    if (used.length > 0) {
      const examples = used.slice(0, 3).map((i) => `"${i.name}"`).join(', ')
      const more = used.length > 3 ? ', dsb.' : ''
      setConfirmModal({
        isOpen: true,
        type: 'warning',
        title: 'Satuan Eceran Masih Digunakan',
        message: `Satuan eceran "${item.name}" saat ini masih digunakan oleh ${used.length} barang belanjaan (${examples}${more}).\n\nSatuan eceran tidak dapat dihapus sebelum barang-barang tersebut diubah atau dihapus.\n\nTips: Jika Anda hanya ingin memperbaiki ejaan (typo), gunakan tombol "Edit".`,
        onConfirm: null,
      })
      return
    }

    setConfirmModal({
      isOpen: true,
      type: 'confirm',
      title: 'Hapus Satuan Eceran?',
      message: `Apakah Anda yakin ingin menghapus satuan eceran "${item.name}"?\n\nTindakan ini permanen dan tidak dapat dibatalkan.`,
      onConfirm: () => onDeletePieceUnit(item),
    })
  }

  return (
    <section className="settings">
      <div className="section-title">
        <div>
          <p className="eyebrow">ATUR SESUAI WARUNG</p>
          <h2>Kategori & Satuan</h2>
        </div>
      </div>
      <div className="setting-grid">
        <SettingBlock
          title="Kategori"
          items={categories}
          onAdd={onOpenAddCategory}
          onEdit={onOpenEditCategory}
          onDelete={handleDeleteCategoryClick}
        />
        <SettingBlock
          title="Satuan Belanja / Paket"
          description="Satuan kemasan besar/grosir (misal: dus, renceng, karung, pak, bal, kg)"
          items={units}
          prefix="/"
          onAdd={onOpenAddUnit}
          onEdit={onOpenEditUnit}
          onDelete={handleDeleteUnitClick}
        />
        <SettingBlock
          title="Satuan Isi / Eceran"
          description="Satuan eceran per item di dalam paket (misal: botol, buah, pcs, sachet, bungkus, butir)"
          items={pieceUnits}
          prefix=""
          onAdd={onOpenAddPieceUnit}
          onEdit={onOpenEditPieceUnit}
          onDelete={handleDeletePieceUnitClick}
        />
      </div>

      <div className="section-title" style={{ marginTop: '36px' }}>
        <div>
          <p className="eyebrow">PEMELIHARAAN & CADANGAN</p>
          <h2>Data & Keamanan Database</h2>
        </div>
      </div>
      <div className="setting-grid">
        <DataBackupBlock
          items={items}
          categories={categories}
          units={units}
          onToast={onToast}
        />
        <HistoryCleanupBlock
          historyCount={historyCount}
          onCleanup={onCleanupHistory}
        />
      </div>

      <PasswordSettingBlock />

      <ConfirmDeleteModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </section>
  )
}

function SettingBlock({ title, description, items, prefix = '', onAdd, onEdit, onDelete }) {
  return (
    <div className="setting-block">
      <div className="block-head">
        <strong>{title}</strong>
        <button className="btn-action btn-primary-sm" onClick={onAdd}>
          + Tambah
        </button>
      </div>
      {description && (
        <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '4px 0 10px', lineHeight: '1.4' }}>
          {description}
        </p>
      )}
      {items.map((item) => (
        <div className="setting-row" key={item.id}>
          <span>
            {prefix}
            {item.name}
          </span>
          <div className="setting-row-actions">
            {onEdit && (
              <button
                type="button"
                className="btn-action btn-edit-sm"
                onClick={() => onEdit(item)}
                aria-label={`Ubah ${item.name}`}
              >
                Edit
              </button>
            )}
            <button
              type="button"
              className="btn-action btn-danger-sm"
              onClick={() => onDelete(item)}
              aria-label={`Hapus ${item.name}`}
            >
              Hapus
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function PasswordSettingBlock() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', isError: false })

  async function handleSave(e) {
    e.preventDefault()
    setMsg({ text: '', isError: false })
    if (!password) {
      return setMsg({ text: 'Masukkan kata sandi baru.', isError: true })
    }
    if (password.length < 6) {
      return setMsg({ text: 'Kata sandi minimal 6 karakter.', isError: true })
    }
    if (password !== confirm) {
      return setMsg({ text: 'Konfirmasi kata sandi tidak cocok.', isError: true })
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) {
      setMsg({ text: error.message, isError: true })
    } else {
      setPassword('')
      setConfirm('')
      setMsg({
        text: 'Kata sandi berhasil disimpan! Anda sekarang bisa login langsung menggunakan email & kata sandi (tanpa menunggu email).',
        isError: false,
      })
    }
  }

  return (
    <div className="setting-block" style={{ marginTop: '20px' }}>
      <div className="block-head">
        <strong>Kata Sandi Akun</strong>
        <span style={{ fontSize: '11px', color: 'var(--muted)', font: '11px "DM Mono"' }}>
          Bebas Limit Email
        </span>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6', margin: '14px 0 16px' }}>
        Atur kata sandi agar Anda bisa langsung login kapan saja tanpa perlu menunggu tautan email atau terkena batas limit email.
      </p>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            font: '12px "DM Mono"',
            color: 'var(--muted)',
          }}
        >
          Kata Sandi Baru (min. 6 karakter)
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            style={{
              border: '1px solid var(--line)',
              background: 'white',
              borderRadius: '6px',
              padding: '10px 12px',
              font: '13px "Plus Jakarta Sans"',
            }}
          />
        </label>
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            font: '12px "DM Mono"',
            color: 'var(--muted)',
          }}
        >
          Ulangi Kata Sandi
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Ketik ulang kata sandi"
            style={{
              border: '1px solid var(--line)',
              background: 'white',
              borderRadius: '6px',
              padding: '10px 12px',
              font: '13px "Plus Jakarta Sans"',
            }}
          />
        </label>
        {msg.text && (
          <div
            style={{
              fontSize: '12px',
              padding: '10px 12px',
              borderRadius: '6px',
              background: msg.isError ? '#fbe8e4' : '#e8f0df',
              color: msg.isError ? '#984b43' : 'var(--green)',
              border: `1px solid ${msg.isError ? '#efc6bd' : '#c8ddb6'}`,
            }}
          >
            {msg.text}
          </div>
        )}
        <button
          type="submit"
          className="primary"
          disabled={saving || !password}
          style={{ alignSelf: 'flex-start', padding: '10px 18px', marginTop: '4px' }}
        >
          {saving ? 'Menyimpan...' : 'Simpan Kata Sandi'}
        </button>
      </form>
    </div>
  )
}

function DataBackupBlock({ items, categories, units, onToast }) {
  const [downloading, setDownloading] = useState(false)

  function handleExport() {
    if (!items || items.length === 0) {
      if (onToast) onToast('Belum ada data barang untuk dicadangkan.')
      return
    }

    setDownloading(true)
    try {
      const categoryMap = {}
      categories.forEach((c) => {
        categoryMap[c.id] = c.name
      })
      const unitMap = {}
      units.forEach((u) => {
        unitMap[u.id] = u.name
      })

      const headers = [
        'No',
        'Nama Barang',
        'Kategori',
        'Satuan Grosir',
        'Isi Per Paket',
        'Satuan Eceran',
        'Toko Langganan',
        'Harga (Rp)',
        'Status Checklist',
      ]

      const escapeCSV = (val) => {
        if (val === null || val === undefined) return '""'
        const str = String(val).replace(/"/g, '""')
        return `"${str}"`
      }

      const rows = items.map((item, idx) => {
        const catName = categoryMap[item.category_id] || item.categories?.name || 'Tanpa Kategori'
        const unitName = unitMap[item.unit_id] || item.units?.name || '-'
        const pieces = item.pieces_per_unit || ''
        const pieceUnit = item.piece_unit || ''
        const store = item.store_name || ''
        const price = Number(item.price) || 0
        const isChecked = item.is_selected ? 'Ya' : 'Tidak'

        return [
          idx + 1,
          escapeCSV(item.name),
          escapeCSV(catName),
          escapeCSV(unitName),
          escapeCSV(pieces),
          escapeCSV(pieceUnit),
          escapeCSV(store),
          price,
          escapeCSV(isChecked),
        ].join(',')
      })

      // UTF-8 BOM (\uFEFF) untuk kompatibilitas penuh dengan Microsoft Excel & Google Sheets
      const csvContent = '\uFEFF' + headers.map(escapeCSV).join(',') + '\n' + rows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10)
      link.setAttribute('href', url)
      link.setAttribute('download', `catatan-belanja-cadangan-${dateStr}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      if (onToast) onToast(`File cadangan (${items.length} barang) berhasil diunduh!`)
    } catch {
      if (onToast) onToast('Gagal mengunduh file cadangan.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="setting-block">
      <div className="block-head">
        <strong>Cadangan Data Barang</strong>
        <span style={{ fontSize: '11px', color: 'var(--muted)', font: '11px "DM Mono"' }}>
          CSV / Excel
        </span>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.5', margin: '8px 0 16px' }}>
        Unduh salinan seluruh daftar barang ke HP Anda. File dapat dibuka langsung di Microsoft Excel, Google Sheets, atau aplikasi spreadsheet lainnya.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--ink)' }}>
          Total: <strong>{items.length}</strong> barang terdaftar
        </span>
        <button
          type="button"
          className="btn-action btn-primary-sm"
          onClick={handleExport}
          disabled={downloading || items.length === 0}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          {downloading ? 'Mengunduh...' : '📥 Unduh Cadangan CSV'}
        </button>
      </div>
    </div>
  )
}

function HistoryCleanupBlock({ historyCount = 0, onCleanup }) {
  const [cleaning, setCleaning] = useState(false)

  async function handleTriggerCleanup() {
    if (!onCleanup) return
    setCleaning(true)
    try {
      await onCleanup()
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="setting-block">
      <div className="block-head">
        <strong>Pembersih Riwayat Otomatis</strong>
        <span style={{ fontSize: '11px', color: 'var(--green)', font: '11px "DM Mono"', fontWeight: 700 }}>
          Maks. 25 Transaksi
        </span>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.5', margin: '8px 0 16px' }}>
        Sistem otomatis membatasi riwayat belanja maksimal 25 transaksi terbaru. Setiap transaksi baru setelah 25 transaksi otomatis menggantikan riwayat terlama agar database tetap ringan dan cepat selamanya.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="sync-dot" style={{ background: '#82b52f' }} />
          <span style={{ fontSize: '12px', color: 'var(--ink)' }}>
            Tersimpan: <strong>{historyCount}</strong> / 25 riwayat
          </span>
        </div>
        <button
          type="button"
          className="btn-action btn-edit-sm"
          onClick={handleTriggerCleanup}
          disabled={cleaning}
          style={{ padding: '8px 14px', fontSize: '12px' }}
        >
          {cleaning ? 'Memeriksa...' : '🧹 Optimalkan Riwayat'}
        </button>
      </div>
    </div>
  )
}

