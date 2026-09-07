import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Mountain,
  ShieldCheck,
  Users,
} from 'lucide-react'

type LoginProps = {
  onLogin: (email: string, password: string) => Promise<string | null>
}

function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Email dan password wajib diisi.')
      return
    }

    setLoading(true)

    try {
      const message = await onLogin(
        email.trim(),
        password,
      )

      if (message) {
        setError(message)
      }
    } catch {
      setError('Terjadi kesalahan saat mencoba masuk.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      {/* LEFT — BRANDING */}
      <section className="login-showcase">
        <div className="showcase-orbit showcase-orbit--one" />
        <div className="showcase-orbit showcase-orbit--two" />

        <div className="showcase-grid" />

        <div className="showcase-content">
          <div className="showcase-brand">
            <img
              src="/logo-crm.png"
              alt="Rinjani Awesome"
            />
            <div>
              <strong>RINJANI</strong>
              <span>AWESOME</span>
            </div>
          </div>

          <div className="showcase-badge">
            <span className="showcase-badge__dot" />
            CRM &amp; TRIP MANAGEMENT
          </div>

          <div className="showcase-heading">
            <h1>
              Kelola Bisnis.
              <br />
              <span>Lebih Mudah.</span>
            </h1>

            <p>
              Platform CRM yang membantu Anda mengelola
              customer, perjalanan, dan tim dalam satu
              sistem yang terintegrasi.
            </p>

            <strong>
              Rinjani Awesome, solusi terbaik untuk bisnis Anda.
            </strong>
          </div>

          <div className="showcase-features">
            <div className="showcase-feature">
              <div className="showcase-feature__icon">
                <Users size={22} />
              </div>
              <div>
                <strong>Customers</strong>
                <span>Kelola data customer</span>
              </div>
            </div>

            <div className="showcase-feature">
              <div className="showcase-feature__icon">
                <Mountain size={22} />
              </div>
              <div>
                <strong>Trips</strong>
                <span>Kelola perjalanan</span>
              </div>
            </div>

            <div className="showcase-feature">
              <div className="showcase-feature__icon">
                <BarChart3 size={22} />
              </div>
              <div>
                <strong>Management</strong>
                <span>Pantau bisnis Anda</span>
              </div>
            </div>
          </div>

          <div className="showcase-summary">
            <div className="summary-header">
              <div className="summary-title">
                <BarChart3 size={16} />
                <span>RINGKASAN SISTEM</span>
              </div>

              <div className="summary-status">
                <span />
                Sistem aktif
              </div>
            </div>

            <div className="summary-body">
              <div className="summary-item">
                <div className="summary-item__icon">
                  <Users size={24} />
                </div>
                <div>
                  <strong>Customers</strong>
                  <span>Data customer terorganisir</span>
                </div>
              </div>

              <div className="summary-divider" />

              <div className="summary-item">
                <div className="summary-item__icon summary-item__icon--green">
                  <Mountain size={24} />
                </div>
                <div>
                  <strong>Trips</strong>
                  <span>Perjalanan lebih terkontrol</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="showcase-footer">
          <span>© {new Date().getFullYear()} Rinjani Awesome</span>
          <span>CRM &amp; Business Management</span>
        </div>
      </section>

      {/* RIGHT — LOGIN */}
      <section className="login-panel">
        <div className="login-panel__inner">
          <div className="login-welcome-icon">
            <ShieldCheck size={24} />
          </div>

          <div className="login-welcome">
            <span>WELCOME BACK</span>
            <h2>
              Selamat datang kembali <span>👋</span>
            </h2>
            <p>
              Masuk ke akun Anda untuk melanjutkan
              pengelolaan bisnis.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="modern-login-form"
          >
            <label className="modern-login-field">
              <span>Email Address</span>

              <div className="modern-login-input">
                <Mail size={19} />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="admin@example.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </label>

            <label className="modern-login-field">
              <span>Password</span>

              <div className="modern-login-input">
                <LockKeyhole size={19} />

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="modern-password-toggle"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  aria-label={
                    showPassword
                      ? 'Sembunyikan password'
                      : 'Tampilkan password'
                  }
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </label>

            <div className="login-options">
              <label className="remember-option">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() => {
                  setError(
                    'Silakan hubungi administrator untuk reset password.',
                  )
                }}
              >
                Lupa password?
              </button>
            </div>

            {error && (
              <div
                className="modern-login-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="modern-login-submit"
              disabled={loading}
            >
              <span>
                {loading ? 'Memproses...' : 'Masuk ke Akun'}
              </span>

              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="login-register">
            <span>Belum memiliki akun?</span>
            <button
              type="button"
              onClick={() =>
                setError(
                  'Pembuatan akun dilakukan oleh administrator.',
                )
              }
            >
              Buat Akun Sekarang
            </button>
          </div>

          <div className="login-secure">
            <div className="login-secure__icon">
              <LockKeyhole size={15} />
            </div>

            <div>
              <strong>Sistem aman &amp; terenkripsi</strong>
              <span>
                Data Anda dilindungi dengan keamanan tingkat tinggi.
              </span>
            </div>
          </div>

          <div className="login-copyright">
            © {new Date().getFullYear()} <strong>Rinjani Awesome.</strong>{' '}
            All rights reserved.
          </div>
        </div>
      </section>
    </main>
  )
}

export default Login
