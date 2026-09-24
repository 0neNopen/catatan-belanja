export default function ItemList({
  query,
  setQuery,
  category,
  setCategory,
  categories,
  rawCategories,
  rawUnits,
  visibleItems,
  paginatedItems,
  page,
  setPage,
  totalPages,
  ITEMS_PER_PAGE,
  selected,
  getQty,
  changeQty,
  toggleItem,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onGoToSettings,
  onPrintSelected,
  onMarkBought,
  includeStoreInPrint,
  setIncludeStoreInPrint,
}) {
  const hasCategoriesAndUnits = rawCategories.length > 0 && rawUnits.length > 0

  return (
    <>
      <div className="print-active-header print-only">
        <div className="print-title">CATATAN BELANJA</div>
        <div className="print-time">
          Waktu: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })},{' '}
          {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="print-divider">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
      </div>

      <section className="toolbar">
        <label className="search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari barang atau nama toko..."
          />
        </label>
        <button
          className="primary"
          disabled={!hasCategoriesAndUnits}
          onClick={onAddItem}
        >
          + Tambah barang
        </button>
      </section>

      {!hasCategoriesAndUnits && (
        <div
          style={{
            background: '#eef4e8',
            border: '1px solid #cce2c3',
            borderRadius: '8px',
            padding: '12px 16px',
            margin: '0 0 16px',
            fontSize: '13px',
            color: 'var(--green)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            💡 Belum ada kategori atau satuan. Tambahkan di menu <strong>Pengaturan</strong> untuk mulai menambah barang.
          </span>
          <button
            onClick={onGoToSettings}
            style={{
              background: 'var(--green)',
              color: 'white',
              border: 0,
              padding: '6px 12px',
              borderRadius: '6px',
              font: '12px "Plus Jakarta Sans"',
              cursor: 'pointer',
              marginLeft: '12px',
              flexShrink: 0,
            }}
          >
            Ke Pengaturan
          </button>
        </div>
      )}

      <div className="category-row">
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? 'selected' : ''}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="list-head">
        <span>
          {visibleItems.length > ITEMS_PER_PAGE
            ? `Menampilkan ${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(
                page * ITEMS_PER_PAGE,
                visibleItems.length
              )} dari ${visibleItems.length} barang`
            : `${visibleItems.length} barang`}
        </span>
        <div className="list-head-actions">
          <label className="print-store-toggle" title="Sertakan nama toko saat mencetak struk">
            <input
              type="checkbox"
              checked={includeStoreInPrint}
              onChange={(e) => setIncludeStoreInPrint(e.target.checked)}
            />
            <span>Cetak toko</span>
          </label>
          <button onClick={onPrintSelected}>
            Cetak terpilih <span className="print-icon">↗</span>
          </button>
        </div>
      </section>

      <section className="items screen-only" aria-label="Daftar barang">
        {paginatedItems.length ? (
          paginatedItems.map((item) => {
            const qty = getQty(item.id)
            const unitPrice = Number(item.price) || 0
            const subtotal = unitPrice * qty
            return (
              <article
                className={`item ${item.is_selected ? 'is-checked' : ''}`}
                key={item.id}
              >
                <button
                  className="check"
                  onClick={() => toggleItem(item)}
                  aria-label={`Pilih ${item.name}`}
                >
                  {item.is_selected ? '✓' : ''}
                </button>
                <div className="item-info">
                  <div className="item-title-row">
                    <strong className="item-name">{item.name}</strong>
                    {unitPrice > 0 && (
                      <span className="item-price">
                        Rp{unitPrice.toLocaleString('id-ID')}
                        {item.is_selected && qty > 1 && (
                          <span className="item-subtotal">
                            {' '}
                            (Total: Rp{subtotal.toLocaleString('id-ID')})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="item-meta">
                    <span className="item-cat">{item.categories?.name}</span>
                    <span className="item-sep">·</span>
                    <span className="item-unit">/{item.units?.name}</span>
                    {item.pieces_per_unit > 1 && (
                      <>
                        <span className="item-pieces">
                          (isi {item.pieces_per_unit}{item.piece_unit ? ` ${item.piece_unit}` : ''})
                        </span>
                        {unitPrice > 0 && (
                          <span className="item-unit-cost">
                            @Rp{Math.round(unitPrice / item.pieces_per_unit).toLocaleString('id-ID')}
                            {item.piece_unit ? `/${item.piece_unit}` : ''}
                          </span>
                        )}
                      </>
                    )}
                    {item.store_name && (
                      <>
                        <span className="item-sep">·</span>
                        <span className="item-store">{item.store_name}</span>
                      </>
                    )}
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
                      >
                        −
                      </button>
                      <span className="qty-value">{qty}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => changeQty(item.id, 1)}
                        aria-label={`Tambah ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className="btn-action btn-secondary edit"
                        onClick={() => onEditItem(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-action btn-danger delete"
                        onClick={() => onDeleteItem(item)}
                        aria-label={`Hapus ${item.name}`}
                      >
                        Hapus
                      </button>
                    </>
                  )}
                </div>
              </article>
            )
          })
        ) : (
          <div className="empty">
            <strong>Belum ada barang.</strong>
            <span>Tambah barang untuk mulai membuat daftar belanja.</span>
          </div>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="pagination screen-only" aria-label="Navigasi halaman">
          <button
            className="page-btn page-prev"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Halaman sebelumnya"
          >
            ‹ Prev
          </button>
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              if (
                totalPages <= 7 ||
                p === 1 ||
                p === totalPages ||
                Math.abs(p - page) <= 1
              ) {
                return (
                  <button
                    key={p}
                    className={`page-num ${page === p ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                    aria-label={`Halaman ${p}`}
                    aria-current={page === p ? 'page' : undefined}
                  >
                    {p}
                  </button>
                )
              } else if (
                (p === 2 && page > 3) ||
                (p === totalPages - 1 && page < totalPages - 2)
              ) {
                return (
                  <span key={`dots-${p}`} className="page-dots">
                    …
                  </span>
                )
              }
              return null
            })}
          </div>
          <button
            className="page-btn page-next"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Halaman selanjutnya"
          >
            Next ›
          </button>
        </nav>
      )}

      <div className="print-active-items print-only">
        {selected.map((item) => {
          const qty = getQty(item.id)
          const unitPrice = Number(item.price) || 0
          const subtotal = unitPrice * qty
          const storeLabel =
            includeStoreInPrint && item.store_name
              ? ` (${item.store_name.length > 10 ? item.store_name.slice(0, 8) + '..' : item.store_name})`
              : ''
          return (
            <div key={item.id} className="print-item-block">
              <div className="print-item-row-1">
                <span className="print-item-bullet">-</span>
                <span className="print-item-qty">{qty}</span>
                <span className="print-item-name">
                  {item.name}
                  {item.pieces_per_unit > 1
                    ? ` (isi ${item.pieces_per_unit}${item.piece_unit ? ` ${item.piece_unit}` : ''})`
                    : ''}
                </span>
              </div>
              <div className="print-item-row-2">
                <span className="print-item-unit">
                  /{item.units?.name || '-'}{storeLabel}
                </span>
                <span className="print-item-price">
                  {subtotal ? `Rp${subtotal.toLocaleString('id-ID')}` : 'Rp0'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="print-active-footer print-only">
        <div className="print-divider">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
        <div className="print-qty-summary">
          Total Barang: {selected.reduce((sum, item) => sum + getQty(item.id), 0)} item
        </div>
        <div className="print-total">
          Total: Rp
          {selected
            .reduce((sum, item) => sum + (Number(item.price) || 0) * getQty(item.id), 0)
            .toLocaleString('id-ID')}
        </div>
        <div className="print-divider">~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~</div>
      </div>

      <section className="buy-banner screen-only">
        <div className="buy-banner-info">
          <span className="buy-banner-eyebrow">SELESAI BELANJA?</span>
          <h3 className="buy-banner-title">
            {selected.length > 0 ? (
              <>
                Tandai <strong>{selected.length} barang</strong> sudah dibeli
              </>
            ) : (
              'Tandai barang belanjaan sudah dibeli'
            )}
          </h3>
          <p className="buy-banner-desc">
            Barang yang dipilih akan dipindahkan ke arsip riwayat pembelian.
          </p>
        </div>
        <button
          className="buy-banner-btn"
          onClick={onMarkBought}
          disabled={!selected.length}
        >
          <span>Masukkan ke riwayat</span>
          {selected.length > 0 && <span className="buy-badge">{selected.length}</span>}
          <span className="buy-arrow">→</span>
        </button>
      </section>
    </>
  )
}
