import { useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from './supabase'
import './styles.css'

const empty = { categories: [], units: [], items: [], history: [] }

function App() {
  const [session, setSession] = useState(null)
  const [data, setData] = useState(empty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState('list')
  const [category, setCategory] = useState('Semua')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(null)
  const [draft, setDraft] = useState({ name: '', categoryId: '', unitId: '' })
  const [historyFilter, setHistoryFilter] = useState('all')
  const [expandedHistory, setExpandedHistory] = useState(null)
  const [printHistoryId, setPrintHistoryId] = useState(null)
  const [pendingPrint, setPendingPrint] = useState(null)
  const [toast, setToast] = useState('')
  const [quantities, setQuantities] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cb_item_quantities') || '{}')
    } catch {
      return {}
    }
  })

  function getQty(id) {
    return quantities[id] || 1
  }

  function changeQty(id, delta) {
    setQuantities((prev) => {
      const current = prev[id] || 1
      const nextVal = Math.max(1, current + delta)
      const updated = { ...prev, [id]: nextVal }
      try { localStorage.setItem('cb_item_quantities', JSON.stringify(updated)) } catch {}
      return updated
    })
  }

  useEffect(() => {
    if (!supabase) return setLoading(false)
    let active = true
    supabase.auth.getSession().then(({ data: result }) => { if (active) { setSession(result.session); setLoading(false) } })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setLoading(false) })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => { if (session) loadData() }, [session])

  useEffect(() => {
    if (!session || !supabase) return
    const refresh = () => loadData()
    const channel = supabase.channel('catatan-belanja-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${session.user.id}` }, refresh).on('postgres_changes', { event: '*', schema: 'public', table: 'units', filter: `user_id=eq.${session.user.id}` }, refresh).on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `user_id=eq.${session.user.id}` }, refresh).on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_history', filter: `user_id=eq.${session.user.id}` }, refresh).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [session])

  async function loadData() {
    setError('')
    const [categories, units, items, history] = await Promise.all([
      supabase.from('categories').select('*').order('created_at', { ascending: false }),
      supabase.from('units').select('*').order('created_at', { ascending: false }),
      supabase.from('items').select('*, categories(name), units(name)').order('is_selected', { ascending: false }).order('id', { ascending: false }),
      supabase.from('purchase_history').select('*').order('purchased_at', { ascending: false }),
    ])
    const failure = [categories, units, items, history].find((result) => result.error)
    if (failure) return setError(failure.error.message)
    setData({ categories: categories.data, units: units.data, items: items.data, history: history.data })
  }

  async function run(action) { setError(''); const { error: result } = await action(); if (result) setError(result.message); else await loadData() }
  const categories = ['Semua', ...data.categories.map((item) => item.name)]
  const visibleItems = useMemo(() => data.items.filter((item) => (category === 'Semua' || item.categories?.name === category) && item.name.toLowerCase().includes(query.toLowerCase())), [data.items, category, query])
  const selected = data.items.filter((item) => item.is_selected)
  const filteredHistory = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (historyFilter === '7d') start.setDate(start.getDate() - 6)
    if (historyFilter === 'month') start.setDate(1)
    return data.history.filter((entry) => {
      if (historyFilter === 'all') return true
      const date = new Date(entry.purchased_at)
      return historyFilter === 'today' ? date >= start : date >= start
    })
  }, [data.history, historyFilter])

  async function saveItem(event) {
    event.preventDefault()
    if (!draft.name.trim() || !draft.categoryId || !draft.unitId) return setError('Buat kategori dan satuan sebelum menyimpan barang.')
    const payload = { name: draft.name.trim(), price: Number(draft.price) || 0, category_id: draft.categoryId, unit_id: draft.unitId, is_selected: draft.is_selected || false, user_id: session.user.id }
    await run(() => draft.id ? supabase.from('items').update(payload).eq('id', draft.id) : supabase.from('items').insert(payload))
    setModal(null)
  }
  async function addNamed(table, label) {
    const name = window.prompt(`Nama ${label} baru`)?.trim()
    if (name) await run(() => supabase.from(table).insert({ name, user_id: session.user.id }))
  }

  async function markBought() {
    if (!selected.length) return
    await run(async () => {
      const history = await supabase.from('purchase_history').insert({
        user_id: session.user.id,
        items: selected.map((item) => ({
          name: item.name,
          price: Number(item.price) || 0,
          quantity: getQty(item.id),
          category: item.categories?.name || 'Tanpa kategori',
          unit: item.units?.name || '-'
        }))
      })
      if (history.error) return history
      setQuantities((prev) => {
        const updated = { ...prev }
        selected.forEach((item) => delete updated[item.id])
        try { localStorage.setItem('cb_item_quantities', JSON.stringify(updated)) } catch {}
        return updated
      })
      return supabase.from('items').update({ is_selected: false }).eq('user_id', session.user.id).eq('is_selected', true)
    })
  }
  async function toggleItem(item) {
    const next = !item.is_selected
    if (next && !quantities[item.id]) {
      changeQty(item.id, 0)
    }
    setData((current) => ({ ...current, items: current.items.map((old) => old.id === item.id ? { ...old, is_selected: next } : old) }))
    const { error: result } = await supabase.from('items').update({ is_selected: next }).eq('id', item.id)
    if (result) {
      setData((current) => ({ ...current, items: current.items.map((old) => old.id === item.id ? { ...old, is_selected: !next } : old) }))
      setToast('Gagal menyimpan checklist. Perubahan dibatalkan.')
    } else {
      setToast('Checklist tersimpan')
    }
    window.setTimeout(() => setToast(''), 2200)
  }

  async function printReceipt(type, entry = null) {
    if (!navigator.bluetooth) {
      setPendingPrint({
        type,
        entry,
        error: 'Browser pada perangkat ini (misal iOS Safari) tidak mendukung koneksi Bluetooth langsung.'
      });
      setModal('print-error-fallback');
      return;
    }

    const now = new Date();
    const printTimeStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    let text = "\x1B\x40"; // Init printer
    text += "\x1B\x61\x01"; // Align center
    text += type === 'history' ? "RIWAYAT PEMBELIAN\n" : "CATATAN BELANJA\n";
    text += `Waktu: ${printTimeStr}\n`;
    text += "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n";
    text += "\x1B\x61\x00"; // Align left

    let total = 0;
    const itemsToPrint = type === 'active' ? selected : entry?.items || [];

    if (itemsToPrint.length === 0) {
      setToast('Tidak ada barang untuk dicetak.');
      window.setTimeout(() => setToast(''), 3000);
      return;
    }

    if (type === 'active') {
      itemsToPrint.forEach(item => {
        const qty = getQty(item.id);
        const unit = item.units?.name ? `/${item.units.name}` : (item.unit ? (item.unit.startsWith('/') ? item.unit : `/${item.unit}`) : '-');
        const unitPrice = Number(item.price) || 0;
        const subtotal = unitPrice * qty;
        const priceStr = subtotal ? `Rp${subtotal.toLocaleString('id-ID')}` : 'Rp0';
        text += `- ${qty}  ${item.name}  ${unit}  ${priceStr}\n`;
        total += subtotal;
      });
    } else {
      const grouped = itemsToPrint.reduce((acc, item) => {
        const cat = item.category || 'Tanpa kategori';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {});

      Object.entries(grouped).forEach(([catName, groupItems], groupIndex) => {
        if (groupIndex > 0) text += "\n";
        text += `===> ${catName.toUpperCase()}\n`;
        groupItems.forEach(item => {
          const qty = item.quantity || 1;
          const unit = item.unit ? (item.unit.startsWith('/') ? item.unit : `/${item.unit}`) : (item.units?.name ? `/${item.units.name}` : '-');
          const unitPrice = Number(item.price) || 0;
          const subtotal = unitPrice * qty;
          const priceStr = subtotal ? `Rp${subtotal.toLocaleString('id-ID')}` : 'Rp0';
          text += `- ${qty}  ${item.name}  ${unit}  ${priceStr}\n`;
          total += subtotal;
        });
      });
    }

    text += "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n";
    text += `Total: Rp${total.toLocaleString('id-ID')}\n`;
    text += "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n";
    text += "\n\n\n";

    try {
      setToast('Pilih printer Bluetooth Anda...');
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer service
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455' // Serial Port Profile
        ]
      });

      setToast('Menghubungkan ke printer...');
      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();
      let printCharacteristic = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            printCharacteristic = char;
            break;
          }
        }
        if (printCharacteristic) break;
      }

      if (!printCharacteristic) {
        throw new Error('Karakteristik write tidak ditemukan pada printer ini.');
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const chunkSize = 512;

      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        if (printCharacteristic.properties.write) {
          await printCharacteristic.writeValue(chunk);
        } else {
          await printCharacteristic.writeValueWithoutResponse(chunk);
        }
      }

      setToast('Berhasil mencetak struk!');
      window.setTimeout(() => {
        if (device.gatt.connected) device.gatt.disconnect();
        setToast('');
      }, 2500);

    } catch (err) {
      console.error('Bluetooth Print Error:', err);
      const isCancelled = err.name === 'NotFoundError';
      setPendingPrint({
        type,
        entry,
        error: isCancelled ? 'Pencarian/koneksi Bluetooth tidak dipilih.' : err.message
      });
      setModal('print-error-fallback');
    }
  }

  function doFallbackPrint(type, entry) {
    setModal(null);
    if (type === 'history' && entry) {
      setPrintHistoryId(entry.id);
      window.setTimeout(() => {
        window.print();
        setPrintHistoryId(null);
      }, 150);
    } else {
      window.print();
    }
  }

  if (!supabaseConfigured) return <Notice title="Supabase belum dikonfigurasi">Tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` pada `.env.local`.</Notice>
  if (loading) return <Notice title="Memuat Catatan Belanja...">Menghubungkan ke Supabase.</Notice>

  if (!session) return <Auth />

  return <div className={`app-shell ${printHistoryId ? 'is-printing-history' : ''}`}>
    <header className="topbar"><div className="brand"><img src="/favicon.svg" alt="Logo" className="brand-mark" /><span>Catatan<br /><b>Belanja</b></span></div><div className="sync"><span className="sync-dot" /> Tersinkron cloud <span className="sync-note">· {session.user.email}</span></div><button className="icon-button" aria-label="Keluar" onClick={() => supabase.auth.signOut()}>Keluar</button></header>
    {printHistoryId && (
      <div className="history-print-view">
        {(() => {
          const entry = data.history.find(e => e.id === printHistoryId);
          if (!entry) return null;
          const grouped = entry.items.reduce((acc, item) => {
            const cat = item.category || 'Tanpa kategori';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
          }, {});
          const historyTotal = entry.items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (item.quantity || 1)), 0);
          const now = new Date();
          const printTime = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          return <>
            <div className="print-header-center">
              <div className="print-title">RIWAYAT PEMBELIAN</div>
              <div className="print-time">Waktu: {printTime}</div>
              <div className="print-divider">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
            </div>
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="print-category-group">
                <div className="print-category-title">{"===>"} {category.toUpperCase()}</div>
                <div className="print-items-list">
                  {items.map((item, idx) => {
                    const qty = item.quantity || 1;
                    const unit = item.unit ? (item.unit.startsWith('/') ? item.unit : `/${item.unit}`) : '-';
                    const subtotal = (Number(item.price) || 0) * qty;
                    const price = subtotal ? `Rp${subtotal.toLocaleString('id-ID')}` : 'Rp0';
                    return (
                      <div key={idx} className="print-item-line">
                        - {qty} &nbsp;{item.name} &nbsp;{unit} &nbsp;{price}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="print-divider">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
            <div className="print-total">Total: Rp{historyTotal.toLocaleString('id-ID')}</div>
            <div className="print-divider">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
          </>
        })()}
      </div>
    )}
    <main>
      <section className="intro"><div><p className="eyebrow">CATATAN STOK WARUNG</p><h1>Belanja tanpa<br /><em>lupa.</em></h1><p className="lede">Pilih yang perlu dibawa, cetak daftar, lalu lanjutkan jualan.</p></div><div className="date-stamp"><span>DAFTAR AKTIF</span><strong>{selected.length}</strong><small>barang dipilih</small></div></section>
      {error && <div className="error" role="alert">{error}</div>}
      <nav className="tabs" aria-label="Navigasi utama"><button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>Daftar barang <span>{data.items.length}</span></button><button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>Riwayat <span>{data.history.length}</span></button><button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>Pengaturan</button></nav>
      {view === 'list' && <>
        <div className="print-active-header print-only">
          <div className="print-title">CATATAN BELANJA</div>
          <div className="print-time">Waktu: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="print-divider">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
        </div>
        <section className="toolbar"><label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari barang..." /></label><button className="primary" disabled={!data.categories.length || !data.units.length} onClick={() => { setDraft({ name: '', categoryId: data.categories[0]?.id || '', unitId: data.units[0]?.id || '' }); setModal('item') }}>+ Tambah barang</button></section>
        <div className="category-row">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <section className="list-head"><span>{visibleItems.length} barang</span><button onClick={() => printReceipt('active')}>Cetak terpilih <span className="print-icon">↗</span></button></section>
        <section className="items" aria-label="Daftar barang">
          {visibleItems.length ? visibleItems.map((item) => {
            const qty = getQty(item.id);
            const unitPrice = Number(item.price) || 0;
            const subtotal = unitPrice * qty;
            return (
              <article className={`item ${item.is_selected ? 'is-checked' : ''}`} key={item.id}>
                <button className="check" onClick={() => toggleItem(item)} aria-label={`Pilih ${item.name}`}>{item.is_selected ? '✓' : ''}</button>
                <div className="item-info">
                  <div className="screen-only">
                    <strong className="item-name">{item.name}</strong>
                    <div className="item-meta">
                      <span className="item-cat">{item.categories?.name}</span>
                      <span className="item-sep">·</span>
                      <span className="item-unit">/{item.units?.name}</span>
                      {unitPrice > 0 && (
                        <>
                          <span className="item-sep">·</span>
                          <span className="item-price">
                            Rp{unitPrice.toLocaleString('id-ID')}
                            {item.is_selected && qty > 1 && (
                              <span className="item-subtotal"> (Total: Rp{subtotal.toLocaleString('id-ID')})</span>
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="print-only print-item-line">
                    - {qty} &nbsp;{item.name} &nbsp;/{item.units?.name || '-'} &nbsp;{subtotal ? `Rp${subtotal.toLocaleString('id-ID')}` : 'Rp0'}
                  </div>
                </div>
                <div className="item-actions">
                  {item.is_selected ? (
                    <div className="qty-control" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => changeQty(item.id, -1)}
                        aria-label={`Kurangi ${item.name}`}
                      >−</button>
                      <span className="qty-value">{qty}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => changeQty(item.id, 1)}
                        aria-label={`Tambah ${item.name}`}
                      >+</button>
                    </div>
                  ) : (
                    <>
                      <button className="edit" onClick={() => { setDraft({ ...item, categoryId: item.category_id, unitId: item.unit_id }); setModal('item') }}>Edit</button>
                      <button className="delete" onClick={() => window.confirm(`Hapus barang "${item.name}"?`) && run(() => supabase.from('items').delete().eq('id', item.id))} aria-label={`Hapus ${item.name}`}>Hapus</button>
                    </>
                  )}
                </div>
              </article>
            );
          }) : <div className="empty"><strong>Belum ada barang.</strong><span>Tambah barang untuk mulai membuat daftar belanja.</span></div>}
        </section>
        <div className="print-active-footer print-only">
          <div className="print-divider">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
          <div className="print-total">Total: Rp{selected.reduce((sum, item) => sum + ((Number(item.price) || 0) * getQty(item.id)), 0).toLocaleString('id-ID')}</div>
          <div className="print-divider">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
        </div>
        <section className="buy-banner"><div><span className="eyebrow">SELESAI BELANJA?</span><strong>Tandai daftar ini sudah dibeli.</strong></div><button onClick={markBought} disabled={!selected.length}>Masukkan ke riwayat →</button></section>
      </>}
      {view === 'history' && <section className="history"><div className="section-title"><div><p className="eyebrow">ARSIP BELANJA</p><h2>Riwayat pembelian</h2></div><span>{filteredHistory.length} daftar</span></div><div className="history-filters"><button className={historyFilter === 'all' ? 'selected' : ''} onClick={() => setHistoryFilter('all')}>Semua</button><button className={historyFilter === 'today' ? 'selected' : ''} onClick={() => setHistoryFilter('today')}>Hari ini</button><button className={historyFilter === '7d' ? 'selected' : ''} onClick={() => setHistoryFilter('7d')}>7 hari</button><button className={historyFilter === 'month' ? 'selected' : ''} onClick={() => setHistoryFilter('month')}>Bulan ini</button></div>{filteredHistory.length ? filteredHistory.map((entry) => { const entryTotal = entry.items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (item.quantity || 1)), 0); return <article className="history-card" key={entry.id}><div className="history-card-head"><button className="history-toggle" onClick={() => setExpandedHistory(expandedHistory === entry.id ? null : entry.id)}><strong>{new Date(entry.purchased_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong><span>{entry.items.length} barang dibeli · Total Rp{entryTotal.toLocaleString('id-ID')} · {expandedHistory === entry.id ? 'Tutup' : 'Lihat detail'}</span></button><div className="history-actions"><button className="history-print-btn" onClick={() => printReceipt('history', entry)}>Cetak</button><button className="history-delete" onClick={() => window.confirm('Hapus riwayat pembelian ini?') && run(() => supabase.from('purchase_history').delete().eq('id', entry.id))}>Hapus</button></div></div>{expandedHistory === entry.id && <div className="history-table-wrap"><table className="history-table"><thead><tr><th>Barang</th><th>Kategori</th><th>Satuan</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead><tbody>{entry.items.map((item, index) => { const q = item.quantity || 1; const p = Number(item.price) || 0; return <tr key={`${entry.id}-${index}`}><td>{item.name}</td><td>{item.category || '-'}</td><td>/{item.unit || '-'}</td><td>{q}</td><td>{p ? `Rp${p.toLocaleString('id-ID')}` : '—'}</td><td>{p ? `Rp${(p * q).toLocaleString('id-ID')}` : '—'}</td></tr> })}</tbody><tfoot><tr><td colSpan="5" style={{ fontWeight: 700, textAlign: 'right', paddingRight: '12px' }}>Total</td><td style={{ fontWeight: 700 }}>Rp{entryTotal.toLocaleString('id-ID')}</td></tr></tfoot></table></div>}</article> }) : <div className="empty"><strong>Belum ada riwayat pada waktu ini.</strong><span>Ubah filter atau tandai daftar sebagai sudah dibeli.</span></div>}</section>}
      {view === 'settings' && <section className="settings"><div className="section-title"><div><p className="eyebrow">ATUR SESUAI WARUNG</p><h2>Kategori & Satuan</h2></div></div><div className="setting-grid"><SettingBlock title="Kategori" items={data.categories} onAdd={() => addNamed('categories', 'kategori')} onDelete={(item) => { if (data.items.some((i) => i.category_id === item.id)) return window.alert('Kategori masih digunakan oleh barang. Hapus atau ubah barang tersebut terlebih dahulu.'); run(() => supabase.from('categories').delete().eq('id', item.id)) }} /><SettingBlock title="Satuan" items={data.units} onAdd={() => addNamed('units', 'satuan')} onDelete={(item) => { if (data.items.some((i) => i.unit_id === item.id)) return window.alert('Satuan masih digunakan oleh barang. Hapus atau ubah barang tersebut terlebih dahulu.'); run(() => supabase.from('units').delete().eq('id', item.id)) }} /></div></section>}    </main>
    {toast && <div className="toast" role="status">{toast}</div>}
    {modal === 'item' && <div className="modal-backdrop" onMouseDown={() => setModal(null)}><form className="modal" onSubmit={saveItem} onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><h2>{draft.id ? 'Edit barang' : 'Tambah barang'}</h2><button type="button" onClick={() => setModal(null)}>×</button></div><label>Nama barang<input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Contoh: Beras premium" /></label><label>Harga<input type="number" min="0" step="1" value={draft.price || ''} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="Contoh: 15000" /></label><label>Kategori<select value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}>{data.categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Satuan<select value={draft.unitId} onChange={(e) => setDraft({ ...draft, unitId: e.target.value })}>{data.units.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><button className="primary modal-submit">Simpan barang</button></form></div>}
    {modal === 'bluetooth-guide' && <div className="modal-backdrop" onMouseDown={() => setModal(null)}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><h2>Web Bluetooth Belum Aktif</h2><button type="button" onClick={() => setModal(null)}>×</button></div><p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6', margin: '0 0 12px' }}>Pada <strong>Linux Desktop</strong>, Chrome mematikan Web Bluetooth secara default. Cara mengaktifkannya:</p><ol style={{ fontSize: '13px', paddingLeft: '18px', lineHeight: '1.7', margin: '0 0 16px', color: 'var(--ink)' }}><li>Buka tab baru di Chrome, lalu ketik:<br /><code style={{ background: '#e9ede6', padding: '3px 6px', borderRadius: '4px', font: '11px "DM Mono"', userSelect: 'all' }}>chrome://flags/#enable-web-bluetooth-nightly</code></li><li>Ubah opsi dari <strong>Default</strong> menjadi <strong>Enabled</strong>.</li><li>Klik tombol <strong>Relaunch</strong> di kanan bawah Chrome.</li></ol><p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 18px' }}>*Di HP Android, Windows, & macOS, fitur ini sudah aktif otomatis.</p><button className="primary modal-submit" onClick={() => setModal(null)}>Saya Mengerti</button></div></div>}
    {modal === 'print-error-fallback' && <div className="modal-backdrop" onMouseDown={() => setModal(null)}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><h2>Opsi Pencetakan</h2><button type="button" onClick={() => setModal(null)}>×</button></div><p style={{ fontSize: '13px', color: '#66746d', lineHeight: '1.5', margin: '0 0 10px', background: '#f4f6f2', padding: '10px', borderRadius: '6px' }}>{pendingPrint?.error || 'Koneksi Bluetooth tidak tersedia.'}</p><p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6', margin: '0 0 16px' }}>Anda tetap dapat mencetak menggunakan **System Print** (Fitur Cetak HP / AirPrint / Driver Windows).</p><div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><button className="primary modal-submit" style={{ marginTop: 0 }} onClick={() => doFallbackPrint(pendingPrint?.type, pendingPrint?.entry)}>Cetak via System Print (Biasa)</button><button type="button" style={{ border: '1px solid var(--line)', background: 'transparent', padding: '10px', borderRadius: '6px', font: '12px "Plus Jakarta Sans"', color: 'var(--ink)' }} onClick={() => { setModal(null); printReceipt(pendingPrint?.type, pendingPrint?.entry); }}>Coba Hubungkan Bluetooth Lagi</button></div></div></div>}
  </div>
}

function SettingBlock({ title, items, onAdd, onDelete }) { return <div className="setting-block"><div className="block-head"><strong>{title}</strong><button onClick={onAdd}>+ Tambah</button></div>{items.map((item) => <div className="setting-row" key={item.id}><span>{title === 'Satuan' ? '/' : ''}{item.name}</span><button onClick={() => onDelete(item)}>Hapus</button></div>)}</div> }
function Notice({ title, children }) { return <div className="auth-screen"><div className="auth-card"><img src="/favicon.svg" alt="Logo" className="brand-mark" /><h1>{title}</h1><p>{children}</p></div></div> }
function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(() => Math.max(0, Number(sessionStorage.getItem('otp-cooldown-until') || 0) - Date.now()))
  useEffect(() => {
    if (!cooldown) return undefined
    const timer = window.setInterval(() => setCooldown((remaining) => Math.max(0, remaining - 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])
  async function submit(event) {
    event.preventDefault()
    if (cooldown > 0) return
    setError('')
    const { error: result } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } })
    if (result) {
      const limited = result.code === 'over_request_rate_limit' || result.status === 429 || result.message.toLowerCase().includes('rate limit')
      setError(limited ? 'Batas email Supabase tercapai. Tunggu sekitar 1 jam atau gunakan email lain.' : result.message)
      if (limited) { sessionStorage.setItem('otp-cooldown-until', String(Date.now() + 3600000)); setCooldown(3600000) }
      return
    }
    sessionStorage.setItem('otp-cooldown-until', String(Date.now() + 60000))
    setCooldown(60000)
    setSent(true)
  }
  const seconds = Math.ceil(cooldown / 1000)
  return <div className="auth-screen"><form className="auth-card" onSubmit={submit}><img src="/favicon.svg" alt="Logo" className="brand-mark" /><p className="eyebrow">CATATAN STOK WARUNG</p><h1>Masuk untuk<br /><em>mulai.</em></h1><p>{sent ? 'Tautan masuk sudah dikirim. Cek email sebelum meminta tautan baru.' : 'Gunakan email untuk menyinkronkan daftar di HP dan laptop.'}</p>{!sent && <><label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" /></label><button className="primary modal-submit" disabled={cooldown > 0}>{cooldown > 0 ? `Coba lagi dalam ${seconds} detik` : 'Kirim tautan masuk'}</button></>}{sent && <button type="button" className="primary modal-submit" onClick={() => setSent(false)} disabled={cooldown > 0}>{cooldown > 0 ? `Kirim ulang dalam ${seconds} detik` : 'Kirim ulang tautan'}</button>}{error && <div className="error">{error}</div>}</form></div>
}

export default App
