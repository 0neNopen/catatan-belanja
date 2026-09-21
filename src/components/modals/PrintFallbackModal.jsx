export default function PrintFallbackModal({
  isOpen,
  pendingPrint,
  onFallback,
  onRetry,
  onClose,
}) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Opsi Pencetakan</h2>
          <button type="button" onClick={onClose} aria-label="Tutup modal">
            ×
          </button>
        </div>
        <p
          style={{
            fontSize: '13px',
            color: '#66746d',
            lineHeight: '1.5',
            margin: '0 0 10px',
            background: '#f4f6f2',
            padding: '10px',
            borderRadius: '6px',
          }}
        >
          {pendingPrint?.error || 'Koneksi Bluetooth tidak tersedia.'}
        </p>
        <p
          style={{
            fontSize: '12px',
            color: 'var(--muted)',
            lineHeight: '1.6',
            margin: '0 0 16px',
          }}
        >
          Anda tetap dapat mencetak menggunakan <strong>System Print</strong> (Fitur Cetak HP / AirPrint / Driver Windows).
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="primary modal-submit"
            style={{ marginTop: 0 }}
            onClick={() => onFallback(pendingPrint?.type, pendingPrint?.entry)}
          >
            Cetak via System Print (Biasa)
          </button>
          <button
            type="button"
            style={{
              border: '1px solid var(--line)',
              background: 'transparent',
              padding: '10px',
              borderRadius: '6px',
              font: '12px "Plus Jakarta Sans"',
              color: 'var(--ink)',
              cursor: 'pointer',
            }}
            onClick={() => onRetry(pendingPrint?.type, pendingPrint?.entry)}
          >
            Coba Hubungkan Bluetooth Lagi
          </button>
        </div>
      </div>
    </div>
  )
}
