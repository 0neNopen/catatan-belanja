import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function AuthScreen() {
  const [authMode, setAuthMode] = useState('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(() =>
    Math.max(0, Number(sessionStorage.getItem('otp-cooldown-until') || 0) - Date.now())
  )

  useEffect(() => {
    if (!cooldown) return undefined
    const timer = window.setInterval(
      () => setCooldown((remaining) => Math.max(0, remaining - 1000)),
      1000
    )
    return () => window.clearInterval(timer)
  }, [cooldown])

  async function handlePasswordSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: result } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    })
    setSubmitting(false)
    if (result) {
      if (result.message?.toLowerCase().includes('invalid login credentials')) {
        setError(
          'Email atau kata sandi tidak cocok. Jika belum pernah membuat kata sandi, masuk lewat tab "Tautan Email" terlebih dahulu, lalu buat kata sandi di Pengaturan.'
        )
      } else {
        setError(result.message)
      }
    }
  }

  async function handleOtpSubmit(event) {
    event.preventDefault()
    if (cooldown > 0) return
    setError('')
    setSubmitting(true)
    const { error: result } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setSubmitting(false)
    if (result) {
      const limited =
        result.code === 'over_request_rate_limit' ||
        result.status === 429 ||
        result.message.toLowerCase().includes('rate limit')
      setError(
        limited
          ? 'Batas email Supabase tercapai. Gunakan tab "Kata Sandi" di atas untuk masuk langsung tanpa menunggu kiriman email.'
          : result.message
      )
      if (limited) {
        sessionStorage.setItem('otp-cooldown-until', String(Date.now() + 3600000))
        setCooldown(3600000)
      }
      return
    }
    sessionStorage.setItem('otp-cooldown-until', String(Date.now() + 60000))
    setCooldown(60000)
    setSent(true)
  }

  const seconds = Math.ceil(cooldown / 1000)

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src="/favicon.svg" alt="Logo" className="brand-mark" />
        <p className="eyebrow">CATATAN STOK WARUNG</p>
        <h1>
          Masuk untuk<br />
          <em>mulai.</em>
        </h1>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            className={`auth-tab ${authMode === 'password' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('password')
              setError('')
            }}
          >
            Kata Sandi (Instan)
          </button>
          <button
            type="button"
            className={`auth-tab ${authMode === 'magiclink' ? 'active' : ''}`}
            onClick={() => {
              setAuthMode('magiclink')
              setError('')
            }}
          >
            Tautan Email
          </button>
        </div>

        {authMode === 'password' ? (
          <form onSubmit={handlePasswordSubmit}>
            <p>Masuk langsung tanpa perlu menunggu email OTP.</p>
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
              />
            </label>
            <label style={{ marginTop: '12px' }}>
              Kata Sandi
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
              />
            </label>
            <button className="primary modal-submit" disabled={submitting}>
              {submitting ? 'Memeriksa...' : 'Masuk sekarang'}
            </button>
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '14px', lineHeight: '1.5' }}>
              *Belum punya kata sandi? Masuk lewat tab <strong>"Tautan Email"</strong>, lalu atur kata sandi Anda di menu Pengaturan.
            </p>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <p>
              {sent
                ? 'Tautan masuk sudah dikirim. Cek email sebelum meminta tautan baru.'
                : 'Kirim tautan masuk satu kali klik ke alamat email Anda.'}
            </p>
            {!sent && (
              <>
                <label>
                  Email
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                  />
                </label>
                <button className="primary modal-submit" disabled={cooldown > 0 || submitting}>
                  {submitting
                    ? 'Mengirim...'
                    : cooldown > 0
                    ? `Coba lagi dalam ${seconds} detik`
                    : 'Kirim tautan masuk'}
                </button>
              </>
            )}
            {sent && (
              <button
                type="button"
                className="primary modal-submit"
                onClick={() => setSent(false)}
                disabled={cooldown > 0}
              >
                {cooldown > 0 ? `Kirim ulang dalam ${seconds} detik` : 'Kirim ulang tautan'}
              </button>
            )}
          </form>
        )}

        {error && <div className="error" style={{ marginTop: '16px' }}>{error}</div>}
      </div>
    </div>
  )
}
