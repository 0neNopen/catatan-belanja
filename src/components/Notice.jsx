export function Notice({ title, children }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src="/favicon.svg" alt="Logo" className="brand-mark" />
        <h1>{title}</h1>
        <p>{children}</p>
      </div>
    </div>
  )
}

export function DbWakingScreen({ wakeCountdown }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src="/favicon.svg" alt="Logo" className="brand-mark" />
        <p className="eyebrow">CATATAN STOK WARUNG</p>
        <h1>
          Membangunkan<br />
          <em>database...</em>
        </h1>
        <p style={{ lineHeight: '1.6', color: 'var(--muted)', fontSize: '14px' }}>
          Database sedang aktif kembali setelah beberapa hari tidak digunakan. Ini hanya terjadi sekali dan biasanya selesai dalam{' '}
          <strong>30–60 detik</strong>.
        </p>
        <div
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            background: 'var(--surface, #f5f7f2)',
            borderRadius: '8px',
            border: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '20px', animation: 'spin 1.2s linear infinite', display: 'inline-block' }}>⟳</span>
          <span style={{ fontSize: '13px', color: 'var(--ink)' }}>
            {wakeCountdown > 0 ? `Mencoba ulang dalam ${wakeCountdown} detik...` : 'Menghubungkan...'}
          </span>
        </div>
      </div>
    </div>
  )
}
