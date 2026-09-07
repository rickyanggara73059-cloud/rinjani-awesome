import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Mountain,
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
  const [workspaceActive, setWorkspaceActive] = useState(false)

  const sceneRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const handlePointerMove = (event: PointerEvent) => {
      if (workspaceActive) return

      const rect = scene.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5

      scene.style.setProperty('--mouse-x', `${x}`)
      scene.style.setProperty('--mouse-y', `${y}`)
    }

    const handlePointerLeave = () => {
      scene.style.setProperty('--mouse-x', '0')
      scene.style.setProperty('--mouse-y', '0')
    }

    scene.addEventListener('pointermove', handlePointerMove)
    scene.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      scene.removeEventListener('pointermove', handlePointerMove)
      scene.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [workspaceActive])

  useEffect(() => {
    if (!workspaceActive) return

    const timer = window.setTimeout(() => {
      emailRef.current?.focus()
    }, 1150)

    return () => window.clearTimeout(timer)
  }, [workspaceActive])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Email dan password wajib diisi.')
      return
    }

    setLoading(true)

    try {
      const message = await onLogin(email.trim(), password)

      if (message) {
        setError(message)
      }
    } catch {
      setError('Terjadi kesalahan saat mencoba masuk.')
    } finally {
      setLoading(false)
    }
  }

  const enterWorkspace = () => {
    if (!workspaceActive) {
      setWorkspaceActive(true)
    }
  }

  return (
    <main className={`rinjani-3d-login ${workspaceActive ? 'workspace-active' : ''}`}>
      <div className="rinjani-3d-stars" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>

      <div
        ref={sceneRef}
        className="rinjani-command-scene"
      >
        <div className="scene-light scene-light--one" />
        <div className="scene-light scene-light--two" />

        {/* HEADER */}
        <header className="rinjani-login-header">
          <div className="rinjani-logo">
            <img src="/logo-crm.png" alt="Rinjani Awesome" />
          </div>

          <div>
            <strong>RINJANI AWESOME</strong>
            <span>CRM &amp; BUSINESS MANAGEMENT</span>
          </div>
        </header>

        {/* 3D ENVIRONMENT */}
        <div className="command-environment">

          {/* BACK MOUNTAIN */}
          <div className="mountain-back">
            <div className="mountain-peak mountain-peak--left" />
            <div className="mountain-peak mountain-peak--center" />
            <div className="mountain-peak mountain-peak--right" />
          </div>

          {/* FLOOR */}
          <div className="command-floor">
            <div className="floor-grid" />
            <div className="floor-glow" />
          </div>

          {/* MAIN HOLOGRAPHIC SCREEN */}
          <div className="command-monitor">
            <div className="monitor-topbar">
              <div className="monitor-brand">
                <span className="status-dot" />
                RINJANI COMMAND CENTER
              </div>

              <div className="monitor-date">
                LIVE SYSTEM
              </div>
            </div>

            <div className="monitor-content">
              <div className="monitor-welcome">
                <span>BUSINESS OVERVIEW</span>
                <strong>Manage everything.</strong>
                <small>One workspace. One system.</small>
              </div>

              <div className="monitor-chart">
                <div className="chart-line chart-line--one" />
                <div className="chart-line chart-line--two" />
                <div className="chart-bars">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>

            <div className="monitor-base">
              <span />
              <span />
              <span />
            </div>
          </div>

          {/* FLOATING CARD — CUSTOMERS */}
          <div className="floating-card floating-card--customers">
            <div className="floating-card-icon">
              <Users size={17} />
            </div>
            <div>
              <span>CUSTOMERS</span>
              <strong>1,248</strong>
              <small>+12.8% this month</small>
            </div>
          </div>

          {/* FLOATING CARD — TRIPS */}
          <div className="floating-card floating-card--trips">
            <div className="floating-card-icon">
              <Mountain size={17} />
            </div>
            <div>
              <span>ACTIVE TRIPS</span>
              <strong>24</strong>
              <small>8 departures today</small>
            </div>
          </div>

          {/* FLOATING CARD — PAYMENT */}
          <div className="floating-card floating-card--payment">
            <div className="floating-card-icon">
              <BarChart3 size={17} />
            </div>
            <div>
              <span>REVENUE</span>
              <strong>Rp 248M</strong>
              <small>Monthly performance</small>
            </div>
          </div>

          {/* FLOATING TASK */}
          <div className="floating-task">
            <div className="task-check">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <strong>Today's Tasks</strong>
              <span>12 of 16 completed</span>
            </div>
            <div className="task-progress">
              <i />
            </div>
          </div>

          {/* FLOATING CALENDAR */}
          <div className="floating-calendar">
            <CalendarDays size={17} />
            <div>
              <strong>UPCOMING</strong>
              <span>Trip departure</span>
              <b>Tomorrow · 06:30</b>
            </div>
          </div>

          {/* CENTRAL ACTION */}
          {!workspaceActive && (
            <button
              type="button"
              className="enter-command"
              onClick={enterWorkspace}
            >
              <span className="enter-command-ring" />
              <span className="enter-command-icon">
                <ArrowRight size={24} />
              </span>

              <span className="enter-command-text">
                <strong>ENTER WORKSPACE</strong>
                <small>Masuk ke Rinjani Awesome</small>
              </span>
            </button>
          )}

          {/* ATMOSPHERE PARTICLES */}
          <div className="command-particles" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>

        {/* LOGIN PANEL */}
        <section className="rinjani-login-panel" aria-hidden={!workspaceActive}>
          <div className="rinjani-login-card">

            <div className="login-card-top">
              <div className="login-card-icon">
                <LockKeyhole size={20} />
              </div>

              <div>
                <span>SECURE ACCESS</span>
                <strong>Workspace Login</strong>
              </div>
            </div>

            <div className="rinjani-login-heading">
              <span>WELCOME BACK</span>
              <h1>Selamat datang kembali.</h1>
              <p>
                Masuk untuk melanjutkan pengelolaan bisnis Anda.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rinjani-login-form"
            >
              <label>
                <span>Email Address</span>

                <div className="rinjani-login-input">
                  <Mail size={18} />

                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    disabled={!workspaceActive || loading}
                    required
                  />
                </div>
              </label>

              <label>
                <span>Password</span>

                <div className="rinjani-login-input">
                  <LockKeyhole size={18} />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                    disabled={!workspaceActive || loading}
                    required
                  />

                  <button
                    type="button"
                    className="rinjani-password-toggle"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? 'Sembunyikan password'
                        : 'Tampilkan password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </label>

              {error && (
                <div
                  className="rinjani-login-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="rinjani-login-submit"
                disabled={loading || !workspaceActive}
              >
                <span>
                  {loading ? 'Memproses...' : 'Masuk ke Workspace'}
                </span>

                {!loading && <ArrowRight size={19} />}
              </button>
            </form>

            <div className="rinjani-login-security">
              <LockKeyhole size={14} />
              <span>
                Secure workspace · Protected access
              </span>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="rinjani-login-footer">
          <span>© {new Date().getFullYear()} Rinjani Awesome</span>
          <span>CRM · TRIP · BUSINESS MANAGEMENT</span>
        </footer>
      </div>
    </main>
  )
}

export default Login
