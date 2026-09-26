import { supabase } from '../supabase'

export default function TopBar({ session, onRefresh, isRefreshing }) {
  return (
    <header className="topbar">
      <div className="brand">
        <img src="/favicon.svg" alt="Logo" className="brand-mark" />
        <span>
          Catatan<br />
          <b>Belanja</b>
        </span>
      </div>
      <div className="sync">
        <span className="sync-dot" /> Tersinkron cloud{' '}
        <span className="sync-note">· {session?.user?.email}</span>
      </div>
      <div className="topbar-actions">
        <button
          type="button"
          className={`nav-refresh ${isRefreshing ? 'is-spinning' : ''}`}
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Segarkan data (Refresh)"
          aria-label="Segarkan data"
        >
          <svg
            className="refresh-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          <span className="nav-refresh-text">Segarkan</span>
        </button>
        <button
          className="nav-logout"
          aria-label="Keluar dari akun"
          onClick={() => supabase.auth.signOut()}
        >
          Keluar
        </button>
      </div>
    </header>
  )
}
