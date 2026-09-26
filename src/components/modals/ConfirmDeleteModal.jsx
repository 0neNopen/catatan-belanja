export default function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  type = 'confirm', // 'confirm' | 'warning'
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null

  const isWarning = type === 'warning'

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{isWarning ? '⚠️' : '🗑️'}</span>
            <span>{title}</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Tutup modal">
            ×
          </button>
        </div>

        <div
          style={{
            fontSize: '14px',
            color: 'var(--ink)',
            lineHeight: '1.6',
            margin: '0 0 22px',
            background: isWarning ? '#fffbee' : '#fafbfa',
            border: isWarning ? '1px solid #f6e3a4' : '1px solid var(--line)',
            borderRadius: '8px',
            padding: '14px 16px',
            whiteSpace: 'pre-line',
          }}
        >
          {message}
        </div>

        {isWarning ? (
          <div>
            <button
              type="button"
              className="primary modal-submit"
              style={{ marginTop: 0 }}
              onClick={onClose}
            >
              Mengerti
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              style={{
                flex: 1,
                background: '#edf2ea',
                border: '1px solid var(--line)',
                borderRadius: '7px',
                color: 'var(--ink)',
                fontWeight: 600,
                fontSize: '13px',
                padding: '12px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                cursor: 'pointer',
              }}
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                border: '1px solid #efc6bd',
                background: '#fbe8e4',
                color: '#984b43',
                padding: '12px',
                borderRadius: '7px',
                fontSize: '13px',
                fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                cursor: 'pointer',
              }}
              onClick={() => {
                onConfirm?.()
                onClose?.()
              }}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
