import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase'
import './styles.css'

import TopBar from './components/TopBar'
import ItemList from './components/ItemList'
import HistoryView from './components/HistoryView'
import SettingsView from './components/SettingsView'
import AuthScreen from './components/AuthScreen'
import { Notice, DbWakingScreen } from './components/Notice'

import ItemModal from './components/modals/ItemModal'
import PromptModal from './components/modals/PromptModal'
import PrintFallbackModal from './components/modals/PrintFallbackModal'
import BluetoothGuideModal from './components/modals/BluetoothGuideModal'
import ConfirmExitModal from './components/modals/ConfirmExitModal'

import { printReceiptBluetooth } from './utils/bluetoothPrinter'

const emptyData = { categories: [], units: [], items: [], history: [] }
const ITEMS_PER_PAGE = 10

export default function App() {
  const [session, setSession] = useState(null)
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('list')
  const [category, setCategory] = useState('Semua')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [draft, setDraft] = useState({
    name: '',
    store_name: '',
    pieces_per_unit: '',
    piece_unit: '',
    categoryId: '',
    unitId: '',
    price: '',
  })
  const [historyFilter, setHistoryFilter] = useState('all')
  const [expandedHistory, setExpandedHistory] = useState(null)
  const [printHistoryId, setPrintHistoryId] = useState(null)
  const [pendingPrint, setPendingPrint] = useState(null)
  const [toast, setToast] = useState('')
  const [dbWaking, setDbWaking] = useState(false)
  const [wakeCountdown, setWakeCountdown] = useState(0)
  const wakeRetryRef = useRef(null)

  // Opsi Cetak Fleksibel (Toko di Struk)
  const [includeStoreInPrint, setIncludeStoreInPrint] = useState(() => {
    try {
      const saved = localStorage.getItem('cb_print_include_store')
      return saved !== null ? JSON.parse(saved) : true
    } catch {
      return true
    }
  })

  function handleToggleIncludeStore(val) {
    setIncludeStoreInPrint(val)
    try {
      localStorage.setItem('cb_print_include_store', JSON.stringify(val))
    } catch {}
  }

  // Modal Kustom Kategori & Satuan
  const [promptConfig, setPromptConfig] = useState({
    isOpen: false,
    table: '',
    label: '',
    title: '',
    placeholder: '',
  })

  // Manajemen Quantity (Hybrid Cloud + LocalStorage)
  const [quantities, setQuantities] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cb_item_quantities') || '{}')
    } catch {
      return {}
    }
  })

  useEffect(() => {
    if (data.items && data.items.length) {
      setQuantities((prev) => {
        let changed = false
        const next = { ...prev }
        data.items.forEach((it) => {
          if (it.quantity !== undefined && it.quantity !== null && it.quantity > 0) {
            if (next[it.id] !== it.quantity) {
              next[it.id] = it.quantity
              changed = true
            }
          }
        })
        if (changed) {
          try {
            localStorage.setItem('cb_item_quantities', JSON.stringify(next))
          } catch {}
          return next
        }
        return prev
      })
    }
  }, [data.items])

  function getQty(id) {
    return quantities[id] || 1
  }

  async function changeQty(id, delta) {
    const current = quantities[id] || 1
    const nextVal = Math.max(1, current + delta)
    setQuantities((prev) => {
      const updated = { ...prev, [id]: nextVal }
      try {
        localStorage.setItem('cb_item_quantities', JSON.stringify(updated))
      } catch {}
      return updated
    })

    try {
      await supabase.from('items').update({ quantity: nextVal }).eq('id', id)
    } catch {
      // Fallback lokal aman
    }
  }

  // Back-Button Navigation Guard
  const allowExitRef = useRef(false)
  const modalRef = useRef(modal)
  const promptOpenRef = useRef(promptConfig.isOpen)
  const viewRef = useRef(view)
  const expandedHistoryRef = useRef(expandedHistory)

  useEffect(() => {
    modalRef.current = modal
  }, [modal])
  useEffect(() => {
    promptOpenRef.current = promptConfig.isOpen
  }, [promptConfig.isOpen])
  useEffect(() => {
    viewRef.current = view
  }, [view])
  useEffect(() => {
    expandedHistoryRef.current = expandedHistory
  }, [expandedHistory])

  useEffect(() => {
    if (!supabase) return setLoading(false)
    let active = true
    supabase.auth.getSession().then(({ data: result }) => {
      if (active) {
        setSession(result.session)
        setLoading(false)
      }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session) loadData()
  }, [session])

  useEffect(() => {
    if (!session) return

    if (window.location.hash && window.location.hash.includes('access_token')) {
      window.history.replaceState({ app: 'catatan-belanja' }, '', window.location.pathname)
    }

    window.history.pushState({ app: 'catatan-belanja' }, '', window.location.href)

    const handlePopState = () => {
      if (allowExitRef.current) return

      if (promptOpenRef.current) {
        setPromptConfig((p) => ({ ...p, isOpen: false }))
        window.history.pushState({ app: 'catatan-belanja' }, '', window.location.href)
        return
      }

      if (modalRef.current) {
        setModal(null)
        window.history.pushState({ app: 'catatan-belanja' }, '', window.location.href)
        return
      }

      if (expandedHistoryRef.current) {
        setExpandedHistory(null)
        window.history.pushState({ app: 'catatan-belanja' }, '', window.location.href)
        return
      }

      if (viewRef.current !== 'list') {
        setView('list')
        window.history.pushState({ app: 'catatan-belanja' }, '', window.location.href)
        return
      }

      window.history.pushState({ app: 'catatan-belanja' }, '', window.location.href)
      setModal('confirm-exit')
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [session])

  function handleConfirmExit() {
    allowExitRef.current = true
    setModal(null)
    window.history.go(-2)
  }

  // Realtime Channel dengan Debounce
  useEffect(() => {
    if (!session || !supabase) return
    let debounceTimer = null
    const debouncedRefresh = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        loadData()
      }, 350)
    }

    const channel = supabase
      .channel('catatan-belanja-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${session.user.id}` },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'units', filter: `user_id=eq.${session.user.id}` },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `user_id=eq.${session.user.id}` },
        debouncedRefresh
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_history', filter: `user_id=eq.${session.user.id}` },
        debouncedRefresh
      )
      .subscribe()

    return () => {
      clearTimeout(debounceTimer)
      supabase.removeChannel(channel)
    }
  }, [session])

  async function loadData({ isRetry = false } = {}) {
    setError('')
    const [categories, units, items, history] = await Promise.all([
      supabase.from('categories').select('*').order('created_at', { ascending: false }),
      supabase.from('units').select('*').order('created_at', { ascending: false }),
      supabase
        .from('items')
        .select('*, categories(name), units(name)')
        .order('is_selected', { ascending: false })
        .order('id', { ascending: false }),
      supabase.from('purchase_history').select('*').order('purchased_at', { ascending: false }).limit(30),
    ])

    const failure = [categories, units, items, history].find((result) => result.error)
    if (failure) {
      const isDbWaking =
        !isRetry &&
        (failure.error.message?.toLowerCase().includes('fetch') ||
          failure.error.message?.toLowerCase().includes('network') ||
          failure.error.message?.toLowerCase().includes('failed') ||
          failure.error.code === 'PGRST301' ||
          failure.error.status === 503 ||
          failure.error.status === 0)

      if (isDbWaking) {
        setDbWaking(true)
        let attempts = 0
        const maxAttempts = 12

        function scheduleRetry() {
          attempts++
          if (attempts > maxAttempts) {
            setDbWaking(false)
            setError('Database tidak dapat terhubung setelah 1 menit. Coba refresh halaman.')
            return
          }
          let countdown = 5
          setWakeCountdown(countdown)
          const tick = window.setInterval(() => {
            countdown--
            setWakeCountdown(countdown)
            if (countdown <= 0) window.clearInterval(tick)
          }, 1000)

          wakeRetryRef.current = window.setTimeout(async () => {
            const [c, u, i, h] = await Promise.all([
              supabase.from('categories').select('*').order('created_at', { ascending: false }),
              supabase.from('units').select('*').order('created_at', { ascending: false }),
              supabase
                .from('items')
                .select('*, categories(name), units(name)')
                .order('is_selected', { ascending: false })
                .order('id', { ascending: false }),
              supabase.from('purchase_history').select('*').order('purchased_at', { ascending: false }).limit(30),
            ])
            const retryFailure = [c, u, i, h].find((r) => r.error)
            if (retryFailure) {
              scheduleRetry()
            } else {
              setDbWaking(false)
              setWakeCountdown(0)
              setData({ categories: c.data, units: u.data, items: i.data, history: h.data })
            }
          }, 5000)
        }

        scheduleRetry()
        return
      }
      return setError(failure.error.message)
    }

    setDbWaking(false)
    setData({ categories: categories.data, units: units.data, items: items.data, history: history.data })
  }

  async function run(action) {
    setError('')
    const { error: result } = await action()
    if (result) {
      setError(result.message)
    } else {
      await loadData()
    }
  }

  const categoryNames = ['Semua', ...data.categories.map((item) => item.name)]

  // Saran Nama Toko dari data yang sudah ada
  const storeSuggestions = useMemo(() => {
    const stores = data.items.map((i) => i.store_name?.trim()).filter(Boolean)
    return [...new Set(stores)].sort()
  }, [data.items])

  const visibleItems = useMemo(
    () =>
      data.items.filter((item) => {
        const matchCategory = category === 'Semua' || item.categories?.name === category
        const q = query.toLowerCase()
        const matchQuery =
          item.name.toLowerCase().includes(q) ||
          (item.store_name && item.store_name.toLowerCase().includes(q))
        return matchCategory && matchQuery
      }),
    [data.items, category, query]
  )
  const selected = data.items.filter((item) => item.is_selected)

  useEffect(() => {
    setPage(1)
  }, [category, query])

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / ITEMS_PER_PAGE))
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return visibleItems.slice(start, start + ITEMS_PER_PAGE)
  }, [visibleItems, page])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const filteredHistory = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (historyFilter === '7d') start.setDate(start.getDate() - 6)
    if (historyFilter === 'month') start.setDate(1)
    return data.history.filter((entry) => {
      if (historyFilter === 'all') return true
      const date = new Date(entry.purchased_at)
      return date >= start
    })
  }, [data.history, historyFilter])

  // Simpan barang dengan penanganan aman kolom store_name, pieces_per_unit, & piece_unit
  async function saveItem(event) {
    event.preventDefault()
    if (!draft.name.trim() || !draft.categoryId || !draft.unitId) {
      return setError('Buat kategori dan satuan sebelum menyimpan barang.')
    }
    const piecesVal = Number(draft.pieces_per_unit)
    const payload = {
      name: draft.name.trim(),
      store_name: draft.store_name?.trim() || '',
      pieces_per_unit: piecesVal > 1 ? piecesVal : null,
      piece_unit: (draft.piece_unit || '').trim(),
      price: Math.max(0, Math.round(Number(draft.price) || 0)),
      category_id: draft.categoryId,
      unit_id: draft.unitId,
      is_selected: draft.is_selected || false,
      user_id: session.user.id,
    }

    await run(async () => {
      let curPayload = { ...payload }
      let op = draft.id
        ? supabase.from('items').update(curPayload).eq('id', draft.id)
        : supabase.from('items').insert(curPayload)
      let res = await op

      // Fallback jika database belum menambahkan kolom piece_unit
      if (res.error && res.error.message?.includes('piece_unit')) {
        delete curPayload.piece_unit
        op = draft.id
          ? supabase.from('items').update(curPayload).eq('id', draft.id)
          : supabase.from('items').insert(curPayload)
        res = await op
      }

      // Fallback jika database belum menambahkan kolom pieces_per_unit
      if (res.error && res.error.message?.includes('pieces_per_unit')) {
        delete curPayload.pieces_per_unit
        op = draft.id
          ? supabase.from('items').update(curPayload).eq('id', draft.id)
          : supabase.from('items').insert(curPayload)
        res = await op
      }

      // Fallback jika database belum menambahkan kolom store_name
      if (res.error && res.error.message?.includes('store_name')) {
        delete curPayload.store_name
        op = draft.id
          ? supabase.from('items').update(curPayload).eq('id', draft.id)
          : supabase.from('items').insert(curPayload)
        res = await op
      }

      return res
    })
    setModal(null)
  }

  function handleOpenPrompt(table, label) {
    setPromptConfig({
      isOpen: true,
      table,
      label,
      title: `Tambah ${label} baru`,
      placeholder: label === 'kategori' ? 'Contoh: Bumbu Dapur' : 'Contoh: kg, dus, renceng',
    })
  }

  async function handleConfirmPrompt(name) {
    setPromptConfig((p) => ({ ...p, isOpen: false }))
    await run(() => supabase.from(promptConfig.table).insert({ name, user_id: session.user.id }))
    setToast(`${promptConfig.label} berhasil ditambahkan!`)
    setTimeout(() => setToast(''), 2200)
  }

  // Selesai Belanja: Mengabadikan snapshot toko ke purchase_history
  async function markBought() {
    if (!selected.length) return
    setError('')
    try {
      const historyPayload = {
        user_id: session.user.id,
        items: selected.map((item) => ({
          name: item.name,
          store: item.store_name || '',
          pieces_per_unit: item.pieces_per_unit || null,
          piece_unit: item.piece_unit || '',
          price: Number(item.price) || 0,
          quantity: getQty(item.id),
          category: item.categories?.name || 'Tanpa kategori',
          unit: item.units?.name || '-',
        })),
      }

      const historyRes = await supabase.from('purchase_history').insert(historyPayload)
      if (historyRes.error) {
        throw new Error(`Gagal menyimpan riwayat: ${historyRes.error.message}`)
      }

      const updateRes = await supabase
        .from('items')
        .update({ is_selected: false })
        .eq('user_id', session.user.id)
        .eq('is_selected', true)

      if (updateRes.error) {
        setToast('Riwayat tersimpan, namun centang barang gagal di-reset otomatis.')
      } else {
        setToast('Belanjaan berhasil dipindahkan ke riwayat!')
      }

      setQuantities((prev) => {
        const updated = { ...prev }
        selected.forEach((item) => delete updated[item.id])
        try {
          localStorage.setItem('cb_item_quantities', JSON.stringify(updated))
        } catch {}
        return updated
      })

      await loadData()
      setTimeout(() => setToast(''), 2500)
    } catch (err) {
      console.error('markBought error:', err)
      setError(err.message || 'Terjadi kesalahan saat memproses selesai belanja.')
    }
  }

  async function toggleItem(item) {
    const next = !item.is_selected
    if (next && !quantities[item.id]) {
      changeQty(item.id, 0)
    }
    setData((current) => ({
      ...current,
      items: current.items.map((old) => (old.id === item.id ? { ...old, is_selected: next } : old)),
    }))

    const { error: result } = await supabase.from('items').update({ is_selected: next }).eq('id', item.id)
    if (result) {
      setData((current) => ({
        ...current,
        items: current.items.map((old) => (old.id === item.id ? { ...old, is_selected: !next } : old)),
      }))
      setToast('Gagal menyimpan checklist. Perubahan dibatalkan.')
    } else {
      setToast('Checklist tersimpan')
    }
    window.setTimeout(() => setToast(''), 2000)
  }

  async function printReceipt(type, entry = null) {
    try {
      await printReceiptBluetooth({
        type,
        items: selected,
        entry,
        getQty,
        includeStore: includeStoreInPrint,
        onStatus: (msg) => {
          setToast(msg)
          setTimeout(() => setToast(''), 3000)
        },
      })
    } catch (err) {
      console.warn('Bluetooth Print Error:', err)
      const isCancelled = err.name === 'NotFoundError'
      setPendingPrint({
        type,
        entry,
        error: isCancelled ? 'Pencarian/koneksi Bluetooth dibatalkan.' : err.message,
      })
      setModal('print-error-fallback')
    }
  }

  function doFallbackPrint(type, entry) {
    setModal(null)
    if (type === 'history' && entry) {
      setPrintHistoryId(entry.id)
      window.setTimeout(() => {
        window.print()
        setPrintHistoryId(null)
      }, 150)
    } else {
      window.print()
    }
  }

  if (!supabaseConfigured) {
    return (
      <Notice title="Supabase belum dikonfigurasi">
        Tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` pada `.env.local`.
      </Notice>
    )
  }

  if (loading) {
    return <Notice title="Memuat Catatan Belanja...">Menghubungkan ke Supabase.</Notice>
  }

  if (dbWaking) {
    return <DbWakingScreen wakeCountdown={wakeCountdown} />
  }

  if (!session) {
    return <AuthScreen />
  }

  return (
    <div className={`app-shell ${printHistoryId ? 'is-printing-history' : ''}`}>
      <TopBar session={session} />

      {printHistoryId && (
        <div className="history-print-view">
          {(() => {
            const entry = data.history.find((e) => e.id === printHistoryId)
            if (!entry) return null
            const grouped = entry.items.reduce((acc, item) => {
              const cat = item.category || 'Tanpa kategori'
              if (!acc[cat]) acc[cat] = []
              acc[cat].push(item)
              return acc
            }, {})
            const historyTotal = entry.items.reduce(
              (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
              0
            )
            const now = new Date()
            const printTime =
              now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
              ', ' +
              now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

            return (
              <>
                <div className="print-header-center">
                  <div className="print-title">RIWAYAT PEMBELIAN</div>
                  <div className="print-time">Waktu: {printTime}</div>
                  <div className="print-divider">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
                </div>
                {Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat} className="print-category-group">
                    <div className="print-category-title">{'===>'} {cat.toUpperCase()}</div>
                    <div className="print-items-list">
                      {items.map((item, idx) => {
                        const qty = item.quantity || 1
                        const storeName = item.store || item.store_name || ''
                        const storeLabel =
                          includeStoreInPrint && storeName
                            ? ` (${storeName.length > 10 ? storeName.slice(0, 8) + '..' : storeName})`
                            : ''
                        const unit = item.unit ? (item.unit.startsWith('/') ? item.unit : `/${item.unit}`) : '-'
                        const subtotal = (Number(item.price) || 0) * qty
                        const price = subtotal ? `Rp${subtotal.toLocaleString('id-ID')}` : 'Rp0'
                        const pieces = item.pieces_per_unit || item.pieces || null
                        const pieceUnit = item.piece_unit ? ` ${item.piece_unit}` : ''
                        const piecesLabel = pieces > 1 ? ` (isi ${pieces}${pieceUnit})` : ''
                        return (
                          <div key={idx} className="print-item-block">
                            <div className="print-item-row-1">
                              <span className="print-item-bullet">-</span>
                              <span className="print-item-qty">{qty}</span>
                              <span className="print-item-name">{item.name}{piecesLabel}</span>
                            </div>
                            <div className="print-item-row-2">
                              <span className="print-item-unit">
                                {unit}{storeLabel}
                              </span>
                              <span className="print-item-price">{price}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div className="print-divider">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
                <div className="print-qty-summary">
                  Total Barang: {entry.items.reduce((sum, item) => sum + (item.quantity || 1), 0)} item
                </div>
                <div className="print-total">Total: Rp{historyTotal.toLocaleString('id-ID')}</div>
                <div className="print-divider">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
              </>
            )
          })()}
        </div>
      )}

      <main>
        <section className="intro">
          <div>
            <p className="eyebrow">CATATAN STOK WARUNG</p>
            <h1>
              Belanja tanpa<br />
              <em>lupa.</em>
            </h1>
            <p className="lede">Pilih yang perlu dibawa, cetak daftar, lalu lanjutkan jualan.</p>
          </div>
          <div className="date-stamp">
            <span>DAFTAR AKTIF</span>
            <strong>{selected.length}</strong>
            <small>barang dipilih</small>
          </div>
        </section>

        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}

        <nav className="tabs" aria-label="Navigasi utama">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            Daftar barang <span>{data.items.length}</span>
          </button>
          <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>
            Riwayat <span>{data.history.length}</span>
          </button>
          <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>
            Pengaturan
          </button>
        </nav>

        {view === 'list' && (
          <ItemList
            query={query}
            setQuery={setQuery}
            category={category}
            setCategory={setCategory}
            categories={categoryNames}
            rawCategories={data.categories}
            rawUnits={data.units}
            visibleItems={visibleItems}
            paginatedItems={paginatedItems}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            ITEMS_PER_PAGE={ITEMS_PER_PAGE}
            selected={selected}
            getQty={getQty}
            changeQty={changeQty}
            toggleItem={toggleItem}
            includeStoreInPrint={includeStoreInPrint}
            setIncludeStoreInPrint={handleToggleIncludeStore}
            onAddItem={() => {
              setDraft({
                name: '',
                store_name: '',
                pieces_per_unit: '',
                piece_unit: '',
                price: '',
                categoryId: data.categories[0]?.id || '',
                unitId: data.units[0]?.id || '',
              })
              setModal('item')
            }}
            onEditItem={(item) => {
              setDraft({
                ...item,
                store_name: item.store_name || '',
                pieces_per_unit: item.pieces_per_unit || '',
                piece_unit: item.piece_unit || '',
                categoryId: item.category_id,
                unitId: item.unit_id,
              })
              setModal('item')
            }}
            onDeleteItem={(item) => {
              const label = item.store_name ? `"${item.name}" (${item.store_name})` : `"${item.name}"`
              if (window.confirm(`Hapus barang ${label}?`)) {
                run(() => supabase.from('items').delete().eq('id', item.id))
              }
            }}
            onGoToSettings={() => setView('settings')}
            onPrintSelected={() => printReceipt('active')}
            onMarkBought={markBought}
          />
        )}

        {view === 'history' && (
          <HistoryView
            filteredHistory={filteredHistory}
            historyFilter={historyFilter}
            setHistoryFilter={setHistoryFilter}
            expandedHistory={expandedHistory}
            setExpandedHistory={setExpandedHistory}
            onPrint={(entry) => printReceipt('history', entry)}
            onDelete={(entry) => {
              if (window.confirm('Hapus riwayat pembelian ini?')) {
                run(() => supabase.from('purchase_history').delete().eq('id', entry.id))
              }
            }}
          />
        )}

        {view === 'settings' && (
          <SettingsView
            categories={data.categories}
            units={data.units}
            items={data.items}
            onOpenAddCategory={() => handleOpenPrompt('categories', 'kategori')}
            onOpenAddUnit={() => handleOpenPrompt('units', 'satuan')}
            onDeleteCategory={(item) => run(() => supabase.from('categories').delete().eq('id', item.id))}
            onDeleteUnit={(item) => run(() => supabase.from('units').delete().eq('id', item.id))}
          />
        )}
      </main>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {/* Modals */}
      <ItemModal
        isOpen={modal === 'item'}
        draft={draft}
        setDraft={setDraft}
        categories={data.categories}
        units={data.units}
        storeSuggestions={storeSuggestions}
        onSave={saveItem}
        onClose={() => setModal(null)}
      />

      <PromptModal
        isOpen={promptConfig.isOpen}
        title={promptConfig.title}
        label={promptConfig.label}
        placeholder={promptConfig.placeholder}
        onConfirm={handleConfirmPrompt}
        onClose={() => setPromptConfig((p) => ({ ...p, isOpen: false }))}
      />

      <BluetoothGuideModal
        isOpen={modal === 'bluetooth-guide'}
        onClose={() => setModal(null)}
      />

      <PrintFallbackModal
        isOpen={modal === 'print-error-fallback'}
        pendingPrint={pendingPrint}
        onFallback={doFallbackPrint}
        onRetry={(type, entry) => {
          setModal(null)
          printReceipt(type, entry)
        }}
        onClose={() => setModal(null)}
      />

      <ConfirmExitModal
        isOpen={modal === 'confirm-exit'}
        onStay={() => setModal(null)}
        onExit={handleConfirmExit}
      />
    </div>
  )
}
