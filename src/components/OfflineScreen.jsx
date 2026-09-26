export default function OfflineScreen({ onRetry, isRetrying }) {
  return (
    <div className="auth-screen">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <img src="/favicon.svg" alt="Logo" className="brand-mark" style={{ margin: '0 auto 16px' }} />
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#fdf3e7',
            border: '1px solid #fad390',
            color: '#b75300',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '4px 12px',
            borderRadius: '999px',
            margin: '0 auto 16px',
          }}
        >
          <span>📶</span> Mode Offline
        </div>
        <h1 style={{ fontSize: '32px', margin: '0 0 14px', lineHeight: '1.1' }}>
          Tidak Ada<br />
          <em style={{ fontStyle: 'normal', color: '#7d9d35' }}>Koneksi Internet</em>
        </h1>
        <p style={{ lineHeight: '1.6', color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>
          Aplikasi tidak dapat terhubung ke server. Periksa apakah paket data seluler atau WiFi Anda aktif, lalu coba sambungkan lagi.
        </p>
        <button
          type="button"
          className="primary modal-submit"
          onClick={onRetry}
          disabled={isRetrying}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '0',
          }}
        >
          <span style={{ display: 'inline-block', animation: isRetrying ? 'spin 1s linear infinite' : 'none' }}>
            ⟳
          </span>
          {isRetrying ? 'Menghubungkan...' : 'Coba Sambungkan Lagi'}
        </button>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '18px', lineHeight: '1.4' }}>
          Tip: Pastikan mode pesawat nonaktif dan kuota data Anda aktif.
        </p>
      </div>
    </div>
  )
}
