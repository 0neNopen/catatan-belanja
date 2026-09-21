export default function ConfirmExitModal({ isOpen, onStay, onExit }) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onMouseDown={onStay}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Keluar dari Catatan Belanja?</h2>
          <button type="button" onClick={onStay} aria-label="Tutup modal">
            ×
          </button>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.6', margin: '0 0 20px' }}>
          Apakah Anda yakin ingin meninggalkan aplikasi Catatan Belanja? Data dan daftar belanja Anda tetap tersimpan aman di akun Anda.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="primary modal-submit"
            style={{ marginTop: 0 }}
            onClick={onStay}
          >
            Tetap di Aplikasi
          </button>
          <button
            type="button"
            style={{
              border: '1px solid #efc6bd',
              background: '#fbe8e4',
              color: '#984b43',
              padding: '12px',
              borderRadius: '6px',
              font: '13px "Plus Jakarta Sans"',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={onExit}
          >
            Ya, Keluar dari Web
          </button>
        </div>
      </div>
    </div>
  )
}
