import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'

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
    <main className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img
            src="/logo-crm.png"
            alt="Rinjani Awesome"
          />
        </div>

        <div className="login-heading">
          <div className="eyebrow">
            RINJANI AWESOME CRM
          </div>
          <h1>Selamat Datang</h1>
          <p>
            Masuk untuk mengelola customer dan perjalanan.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >
          <label>
            <span>Email</span>

            <div className="login-input">
              <Mail size={17} />

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

          <label>
            <span>Password</span>

            <div className="login-input">
              <LockKeyhole size={17} />

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
                className="login-password-toggle"
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
                  <EyeOff size={17} />
                ) : (
                  <Eye size={17} />
                )}
              </button>
            </div>
          </label>

          {error && (
            <div
              className="login-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button login-submit"
            disabled={loading}
          >
            {loading
              ? 'Memproses...'
              : 'Masuk ke CRM'}
          </button>
        </form>

        <div className="login-security">
          <LockKeyhole size={14} />
          <span>
            Secure access · Supabase Auth
          </span>
        </div>
      </div>
    </main>
  )
}

export default Login
