export default function BluetoothGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Web Bluetooth Belum Aktif</h2>
          <button type="button" onClick={onClose} aria-label="Tutup modal">
            ×
          </button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.6', margin: '0 0 12px' }}>
          Pada <strong>Linux Desktop</strong>, Chrome mematikan Web Bluetooth secara default. Cara mengaktifkannya:
        </p>
        <ol style={{ fontSize: '13px', paddingLeft: '18px', lineHeight: '1.7', margin: '0 0 16px', color: 'var(--ink)' }}>
          <li>
            Buka tab baru di Chrome, lalu ketik:<br />
            <code style={{ background: '#e9ede6', padding: '3px 6px', borderRadius: '4px', font: '11px "DM Mono"', userSelect: 'all' }}>
              chrome://flags/#enable-web-bluetooth-nightly
            </code>
          </li>
          <li>Ubah opsi dari <strong>Default</strong> menjadi <strong>Enabled</strong>.</li>
          <li>Klik tombol <strong>Relaunch</strong> di kanan bawah Chrome.</li>
        </ol>
        <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 18px' }}>
          *Di HP Android, Windows, & macOS, fitur ini sudah aktif otomatis.
        </p>
        <button className="primary modal-submit" onClick={onClose}>
          Saya Mengerti
        </button>
      </div>
    </div>
  )
}
