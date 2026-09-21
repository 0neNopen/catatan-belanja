import { supabase } from '../supabase'

export default function TopBar({ session }) {
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
      <button
        className="nav-logout"
        aria-label="Keluar dari akun"
        onClick={() => supabase.auth.signOut()}
      >
        Keluar
      </button>
    </header>
  )
}
