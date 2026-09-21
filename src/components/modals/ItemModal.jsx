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

        <label>
          Harga
          <input
            type="number"
            min="0"
            step="1"
            value={draft.price || ''}
            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            placeholder="Contoh: 15000"
          />
        </label>

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

        <button className="primary modal-submit">Simpan barang</button>
      </form>
    </div>
  )
}
