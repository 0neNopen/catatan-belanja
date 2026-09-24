export default function ItemModal({
  isOpen,
  draft,
  setDraft,
  categories,
  units,
  storeSuggestions = [],
  onSave,
  onClose,
}) {
  if (!isOpen) return null

  const priceNum = Number(draft.price) || 0
  const piecesNum = Number(draft.pieces_per_unit) || 0
  const unitPrice = piecesNum > 1 && priceNum > 0 ? Math.round(priceNum / piecesNum) : 0

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="modal" onSubmit={onSave} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{draft.id ? 'Edit barang' : 'Tambah barang'}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup modal">
            ×
          </button>
        </div>

        <label>
          Nama barang
          <input
            autoFocus
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Contoh: Botol minum 600ml"
          />
        </label>

        <label>
          Nama Toko / Agen (Opsional)
          <input
            type="text"
            list="store-suggestions"
            value={draft.store_name || ''}
            onChange={(e) => setDraft({ ...draft, store_name: e.target.value })}
            placeholder="Contoh: Toko A, Agen Berkah, dsb."
          />
          {storeSuggestions.length > 0 && (
            <datalist id="store-suggestions">
              {storeSuggestions.map((store) => (
                <option key={store} value={store} />
              ))}
            </datalist>
          )}
        </label>

        <div className="modal-grid-2">
          <label>
            Satuan
            <select
              value={draft.unitId}
              onChange={(e) => setDraft({ ...draft, unitId: e.target.value })}
            >
              {units.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Isi / Paket (Opsional)
            <input
              type="number"
              min="1"
              step="1"
              value={draft.pieces_per_unit || ''}
              onChange={(e) => setDraft({ ...draft, pieces_per_unit: e.target.value })}
              placeholder="Contoh: 24"
            />
          </label>
        </div>

        <label>
          Harga Beli / Paket
          <input
            type="number"
            min="0"
            step="1"
            value={draft.price || ''}
            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            placeholder="Contoh: 32000"
          />
        </label>

        {unitPrice > 0 && (
          <div className="unit-calc-hint">
            <span>💡 Modal eceran:</span>
            <strong>@Rp{unitPrice.toLocaleString('id-ID')} / item</strong>
          </div>
        )}

        <label>
          Kategori
          <select
            value={draft.categoryId}
            onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
          >
            {categories.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <button className="primary modal-submit">Simpan barang</button>
      </form>
    </div>
  )
}
