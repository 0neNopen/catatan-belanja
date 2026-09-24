export default function HistoryView({
  filteredHistory,
  historyFilter,
  setHistoryFilter,
  expandedHistory,
  setExpandedHistory,
  onPrint,
  onDelete,
}) {
  return (
    <section className="history">
      <div className="section-title">
        <div>
          <p className="eyebrow">ARSIP BELANJA</p>
          <h2>Riwayat pembelian</h2>
        </div>
        <span>{filteredHistory.length} daftar</span>
      </div>

      <div className="history-filters">
        <button
          className={historyFilter === 'all' ? 'selected' : ''}
          onClick={() => setHistoryFilter('all')}
        >
          Semua
        </button>
        <button
          className={historyFilter === 'today' ? 'selected' : ''}
          onClick={() => setHistoryFilter('today')}
        >
          Hari ini
        </button>
        <button
          className={historyFilter === '7d' ? 'selected' : ''}
          onClick={() => setHistoryFilter('7d')}
        >
          7 hari
        </button>
        <button
          className={historyFilter === 'month' ? 'selected' : ''}
          onClick={() => setHistoryFilter('month')}
        >
          Bulan ini
        </button>
      </div>

      {filteredHistory.length ? (
        filteredHistory.map((entry) => {
          const entryTotal = entry.items.reduce(
            (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
            0
          )
          const isExpanded = expandedHistory === entry.id

          return (
            <article className="history-card" key={entry.id}>
              <div className="history-card-head">
                <button
                  className="history-toggle"
                  onClick={() => setExpandedHistory(isExpanded ? null : entry.id)}
                >
                  <strong>
                    {new Date(entry.purchased_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                  <span>
                    {entry.items.length} barang dibeli · Total Rp{entryTotal.toLocaleString('id-ID')} ·{' '}
                    {isExpanded ? 'Tutup' : 'Lihat detail'}
                  </span>
                </button>
                <div className="history-actions">
                  <button
                    className="btn-action btn-secondary history-print-btn"
                    onClick={() => onPrint(entry)}
                  >
                    Cetak
                  </button>
                  <button
                    className="btn-action btn-danger history-delete"
                    onClick={() => onDelete(entry)}
                  >
                    Hapus
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="history-table-wrap">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Barang</th>
                        <th>Toko</th>
                        <th>Kategori</th>
                        <th>Satuan</th>
                        <th>Qty</th>
                        <th>Harga</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.items.map((item, index) => {
                        const q = item.quantity || 1
                        const p = Number(item.price) || 0
                        return (
                          <tr key={`${entry.id}-${index}`}>
                            <td>{item.name}</td>
                            <td>
                              {item.store ? (
                                <span className="history-store-tag">{item.store}</span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>{item.category || '-'}</td>
                            <td>
                              /{item.unit || '-'}
                              {item.pieces_per_unit > 1 && (
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)' }}>
                                  (isi {item.pieces_per_unit}{item.piece_unit ? ` ${item.piece_unit}` : ''})
                                </span>
                              )}
                            </td>
                            <td>{q}</td>
                            <td>
                              {p ? `Rp${p.toLocaleString('id-ID')}` : '—'}
                              {item.pieces_per_unit > 1 && p > 0 && (
                                <span style={{ display: 'block', fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>
                                  @{Math.round(p / item.pieces_per_unit).toLocaleString('id-ID')}{item.piece_unit ? `/${item.piece_unit}` : ''}
                                </span>
                              )}
                            </td>
                            <td>{p ? `Rp${(p * q).toLocaleString('id-ID')}` : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td
                          colSpan="6"
                          style={{ fontWeight: 700, textAlign: 'right', paddingRight: '12px' }}
                        >
                          Total
                        </td>
                        <td style={{ fontWeight: 700 }}>Rp{entryTotal.toLocaleString('id-ID')}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </article>
          )
        })
      ) : (
        <div className="empty">
          <strong>Belum ada riwayat pada waktu ini.</strong>
          <span>Ubah filter atau tandai daftar sebagai sudah dibeli.</span>
        </div>
      )}
    </section>
  )
}
