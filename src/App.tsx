import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Mountain,
  CalendarDays,
  History,
  Bell,
  Search,
  Plus,
  ClipboardList,
  Wallet,
  CreditCard,
  Package,
  UserRoundCog,
  BarChart3,
  Settings,
  Menu,
  X,
  MapPinned,
} from 'lucide-react'
import Customers from './pages/Customers'
import FollowUp from './pages/FollowUp'
import OngoingTrips from './pages/OngoingTrips'
import UpcomingTrips from './pages/UpcomingTrips'
import TripHistory from './pages/TripHistory'
import Packages from './pages/Packages'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'
import RemainingPayments from './pages/RemainingPayments'
import Login from './pages/Login'
import { supabase } from './lib/supabase'
import './App.css'

type NavItem = {
  label: string
  icon: typeof LayoutDashboard
  section?: string
}

const navigation: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Customers', icon: Users, section: 'CUSTOMER' },
  { label: 'Ongoing Trips', icon: Mountain },
  { label: 'Upcoming Trips', icon: CalendarDays },
  { label: 'Trip History', icon: History },
  { label: 'Follow Up', icon: Bell, section: 'RELATIONSHIP' },
  { label: 'Sisa Pembayaran', icon: CreditCard },
  { label: 'Packages', icon: Package, section: 'MASTER DATA' },
  { label: 'Guides / Team', icon: UserRoundCog },
  { label: 'Reports', icon: BarChart3, section: 'REPORTS' },
  { label: 'Settings', icon: Settings, section: 'SYSTEM' },
]

type DashboardTrip = {
  id: string
  package_name: string
  pax: number
  start_date: string
  end_date: string
  guide_name: string | null
  status: string
  customer: {
    name: string
    country: string | null
  } | null
}

type DashboardFollowUp = {
  id: string
  follow_up_date: string
  subject: string | null
  status: string
  customer: {
    name: string
    country: string | null
  } | null
}

type DashboardCustomer = {
  id: string
  name: string
  country: string | null
  created_at: string
}

function formatDashboardDate(value: string) {
  if (!value) return '-'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
  }).format(date)
}

function formatDashboardCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function Dashboard({ onOpenRemainingPayments }: { onOpenRemainingPayments: () => void }) {
  const [loading, setLoading] = useState(true)

  const [totalCustomers, setTotalCustomers] = useState(0)
  const [monthlyTripValue, setMonthlyTripValue] = useState(0)
  const [monthlyPaymentIn, setMonthlyPaymentIn] = useState(0)
  const [monthlyRemainingPayment, setMonthlyRemainingPayment] = useState(0)
  const [remainingCustomers, setRemainingCustomers] = useState<
    Array<{
      id: string
      customerName: string
      country: string
      packageName: string
      totalPrice: number
      totalPaid: number
      remaining: number
    }>
  >([])

  const [ongoingTrips, setOngoingTrips] = useState<DashboardTrip[]>([])
  const [upcomingTrips, setUpcomingTrips] = useState<DashboardTrip[]>([])
  const [followUps, setFollowUps] = useState<DashboardFollowUp[]>([])
  const [latestCustomers, setLatestCustomers] = useState<DashboardCustomer[]>([])

  const loadDashboard = async () => {
    setLoading(true)

    const now = new Date()

    const today = now.toISOString().slice(0, 10)

    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    )
      .toISOString()
      .slice(0, 10)

    const nextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    )
      .toISOString()
      .slice(0, 10)

    try {
      const [
        customersResult,
        ongoingResult,
        upcomingResult,
        followUpResult,
        paymentsResult,
        monthlyTripsResult,
        latestCustomersResult,
      ] = await Promise.all([
        supabase
          .from('customers')
          .select('id', { count: 'exact', head: true }),

        supabase
          .from('trips')
          .select(`
            id,
            package_name,
            pax,
            start_date,
            end_date,
            guide_name,
            status,
            customer:customers (
              name,
              country
            )
          `)
          .eq('status', 'Ongoing')
          .order('start_date', { ascending: true })
          .limit(5),

        supabase
          .from('trips')
          .select(`
            id,
            package_name,
            pax,
            start_date,
            end_date,
            guide_name,
            status,
            customer:customers (
              name,
              country
            )
          `)
          .gte('start_date', today)
          .neq('status', 'Completed')
          .order('start_date', { ascending: true })
          .limit(5),

        supabase
          .from('follow_ups')
          .select(`
            id,
            follow_up_date,
            subject,
            status,
            customer:customers (
              name,
              country
            )
          `)
          .eq('follow_up_date', today)
          .eq('status', 'Pending')
          .order('follow_up_date', { ascending: true })
          .limit(5),

        supabase
          .from('payments')
          .select('amount')
          .gte('payment_date', monthStart)
          .lt('payment_date', nextMonth),

        supabase
          .from('trips')
          .select(`
            id,
            package_name,
            total_price,
            booking_date,
            customer:customers (
              id,
              name,
              country
            ),
            payments (
              amount
            )
          `)
          .gte('booking_date', monthStart)
          .lt('booking_date', nextMonth),

        supabase
          .from('customers')
          .select('id, name, country, created_at')
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      if (customersResult.error) throw customersResult.error
      if (ongoingResult.error) throw ongoingResult.error
      if (upcomingResult.error) throw upcomingResult.error
      if (followUpResult.error) throw followUpResult.error
      if (paymentsResult.error) throw paymentsResult.error
      if (monthlyTripsResult.error) throw monthlyTripsResult.error
      if (latestCustomersResult.error) throw latestCustomersResult.error

      setTotalCustomers(customersResult.count ?? 0)

      const ongoingData =
        (ongoingResult.data ?? []) as unknown as DashboardTrip[]

      const upcomingData =
        (upcomingResult.data ?? []) as unknown as DashboardTrip[]

      const followUpData =
        (followUpResult.data ?? []) as unknown as DashboardFollowUp[]

      setOngoingTrips(ongoingData)
      setUpcomingTrips(upcomingData)
      setFollowUps(followUpData)

      const paymentIn = (paymentsResult.data ?? []).reduce(
        (sum, payment) => sum + Number(payment.amount ?? 0),
        0,
      )

      type MonthlyTripRow = {
        id: string
        package_name: string | null
        total_price: number | null
        booking_date: string | null
        customer:
          | {
              id: string
              name: string
              country: string | null
            }
          | Array<{
              id: string
              name: string
              country: string | null
            }>
          | null
        payments:
          | Array<{
              amount: number | null
            }>
          | null
      }

      const monthlyTripRows =
        (monthlyTripsResult.data ?? []) as unknown as MonthlyTripRow[]

      const tripValue = monthlyTripRows.reduce(
        (sum, trip) => sum + Number(trip.total_price ?? 0),
        0,
      )

      const paidForMonthlyTrips = monthlyTripRows.reduce(
        (sum, trip) =>
          sum +
          (trip.payments ?? []).reduce(
            (paymentSum, payment) =>
              paymentSum + Number(payment.amount ?? 0),
            0,
          ),
        0,
      )

      const remainingCustomerRows = monthlyTripRows
        .map((trip) => {
          const totalPrice = Number(trip.total_price ?? 0)

          const totalPaid = (trip.payments ?? []).reduce(
            (sum, payment) => sum + Number(payment.amount ?? 0),
            0,
          )

          const remaining = Math.max(
            totalPrice - totalPaid,
            0,
          )

          return {
            id: (Array.isArray(trip.customer) ? trip.customer[0]?.id : trip.customer?.id) ?? trip.id,
            customerName: (Array.isArray(trip.customer) ? trip.customer[0]?.name : trip.customer?.name) ?? 'Customer',
            country: (Array.isArray(trip.customer) ? trip.customer[0]?.country : trip.customer?.country) ?? '-',
            packageName: trip.package_name ?? '-',
            totalPrice,
            totalPaid,
            remaining,
          }
        })
        .filter((item) => item.remaining > 0)

      setMonthlyTripValue(tripValue)
      setMonthlyPaymentIn(paymentIn)
      setMonthlyRemainingPayment(
        Math.max(tripValue - paidForMonthlyTrips, 0),
      )
      setRemainingCustomers(remainingCustomerRows)
      setLatestCustomers(
        (latestCustomersResult.data ?? []) as DashboardCustomer[],
      )
    } catch (error) {
      console.error('Gagal memuat dashboard:', error)

      const supabaseError = error as {
        message?: string
        details?: string
        hint?: string
        code?: string
      }

      alert(
        [
          'Gagal memuat Dashboard.',
          'Code: ' + (supabaseError.code ?? '-'),
          'Message: ' + (supabaseError.message ?? 'Unknown error'),
          'Details: ' + (supabaseError.details ?? '-'),
          'Hint: ' + (supabaseError.hint ?? '-'),
        ].join('\n'),
      )
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    loadDashboard()
  }, [])

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <MapPinned size={15} />
            CUSTOMER & TRIP MANAGEMENT
          </div>

          <h1>Dashboard Rinjani Awesome</h1>

          <p>
            Pantau customer, perjalanan, follow up, dan performa bisnis
            Rinjani Awesome.
          </p>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Tambah Customer
        </button>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Total Customers</p>
              <h2>{loading ? '...' : totalCustomers.toLocaleString('id-ID')}</h2>
            </div>

            <div className="stat-icon">
              <Users size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Database</span>
            <small>customer terdaftar</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Total Nilai Trip Bulan Ini</p>
              <h2>
                {loading
                  ? '...'
                  : formatDashboardCurrency(monthlyTripValue)}
              </h2>
            </div>

            <div className="stat-icon">
              <Mountain size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Booking bulan ini</span>
            <small>total nilai trip</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Pembayaran Masuk</p>
              <h2>
                {loading
                  ? '...'
                  : formatDashboardCurrency(monthlyPaymentIn)}
              </h2>
            </div>

            <div className="stat-icon">
              <Wallet size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Payment masuk</span>
            <small>bulan berjalan</small>
          </div>
        </article>

        <button
          type="button"
          className="stat-card stat-card--clickable"
          onClick={onOpenRemainingPayments}

        >
          <div className="stat-card__top">
            <div>
              <p>Sisa Pembayaran Bulan Ini</p>
              <h2>
                {loading
                  ? '...'
                  : formatDashboardCurrency(monthlyRemainingPayment)}
              </h2>
            </div>

            <div className="stat-icon">
              <CreditCard size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>
              {remainingCustomers.length} customer
            </span>
            <small>klik untuk lihat detail</small>
          </div>
        </button>
      </section>

      <section className="content-grid">
        <article className="panel panel--large">
          <div className="panel__header">
            <div>
              <h3>Ongoing Trips</h3>
              <p>Customer yang sedang menggunakan jasa Rinjani Awesome.</p>
            </div>

            <button className="text-button">
              Lihat Semua →
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Paket</th>
                  <th>Pax</th>
                  <th>Perjalanan</th>
                  <th>Guide</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {ongoingTrips.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-customers">
                        <Mountain size={22} />
                        <strong>Tidak ada ongoing trip</strong>
                        <span>
                          Belum ada trip dengan status Ongoing.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  ongoingTrips.map((trip) => (
                    <tr key={trip.id}>
                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar">
                            {(trip.customer?.name ?? '?').charAt(0)}
                          </div>

                          <div>
                            <strong>
                              {trip.customer?.name ?? 'Customer'}
                            </strong>

                            <small>
                              {trip.customer?.country ?? '-'}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>{trip.package_name}</td>
                      <td>{trip.pax} Pax</td>

                      <td>
                        <strong>
                          {formatDashboardDate(trip.start_date)}
                        </strong>

                        <span className="date-arrow"> → </span>

                        {formatDashboardDate(trip.end_date)}
                      </td>

                      <td>{trip.guide_name || '-'}</td>

                      <td>
                        <span className="status status--ongoing">
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <h3>Follow Up Hari Ini</h3>
              <p>Customer yang perlu dihubungi kembali.</p>
            </div>

            <span className="count-pill">
              {followUps.length}
            </span>
          </div>

          <div className="followup-list">
            {followUps.length === 0 ? (
              <div className="empty-customers">
                <Bell size={22} />
                <strong>Tidak ada follow up hari ini</strong>
                <span>Semua follow up hari ini sudah selesai.</span>
              </div>
            ) : (
              followUps.map((item) => (
                <div className="followup-item" key={item.id}>
                  <div className="followup-avatar">
                    {(item.customer?.name ?? '?').charAt(0)}
                  </div>

                  <div className="followup-content">
                    <strong>{item.customer?.name ?? 'Customer'}</strong>

                    <small>{item.customer?.country ?? '-'}</small>

                    <p>{item.subject || 'Follow up customer'}</p>
                  </div>

                  <span className="followup-date">Hari ini</span>
                </div>
              ))
            )}
          </div>

          <button className="secondary-button">
            Buka Semua Follow Up
          </button>
        </article>
      </section>

      <section className="content-grid content-grid--bottom">
        <article className="panel">
          <div className="panel__header">
            <div>
              <h3>Upcoming Trips</h3>
              <p>Perjalanan customer yang akan datang.</p>
            </div>

            <button className="text-button">
              Kalender →
            </button>
          </div>

          <div className="upcoming-list">
            {upcomingTrips.length === 0 ? (
              <div className="empty-customers">
                <CalendarDays size={22} />
                <strong>Tidak ada upcoming trip</strong>
                <span>Belum ada perjalanan yang dijadwalkan.</span>
              </div>
            ) : (
              upcomingTrips.map((trip) => (
                <div className="upcoming-item" key={trip.id}>
                  <div className="calendar-box">
                    <CalendarDays size={19} />
                    <strong>
                      {new Date(`${trip.start_date}T00:00:00`).getDate()}
                    </strong>
                  </div>

                  <div>
                    <strong>
                      {trip.customer?.name ?? 'Customer'}
                    </strong>

                    <small>
                      {trip.customer?.country ?? '-'} ·{' '}
                      {trip.package_name}
                    </small>
                  </div>

                  <span>{trip.pax} Pax</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <h3>Customer Terbaru</h3>
              <p>Customer yang baru ditambahkan.</p>
            </div>

            <button className="text-button">
              Lihat Semua →
            </button>
          </div>

          <div className="customer-summary">
            {latestCustomers.length === 0 ? (
              <div className="empty-customers">
                <Users size={22} />
                <strong>Belum ada customer</strong>
              </div>
            ) : (
              latestCustomers.map((customer, index) => (
                <div
                  className="customer-summary__item"
                  key={customer.id}
                >
                  <div
                    className={`customer-avatar customer-avatar--${
                      ['gold', 'blue', 'purple'][index] ?? 'gold'
                    }`}
                  >
                    {customer.name.charAt(0)}
                  </div>

                  <div>
                    <strong>{customer.name}</strong>
                    <small>{customer.country || '-'}</small>
                  </div>

                  <strong>Customer</strong>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <div className="dashboard-footer">
        <div>
          <ClipboardList size={16} />
          <span>Data diperbarui langsung dari database</span>
        </div>

        <span>Rinjani Awesome CRM · v1.0.0</span>
      </div>
    </>
  )
}
function App() {
  const [active, setActive] = useState('Dashboard')
   const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [userRole, setUserRole] = useState('staff')
  const handleLogin = async (
  email: string,
  password: string,
): Promise<string | null> => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return error ? error.message : null
}
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [ongoingCount, setOngoingCount] = useState(0)
  const [pendingFollowUpCount, setPendingFollowUpCount] = useState(0)
  const [customerIdToOpen, setCustomerIdToOpen] = useState<string | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!session?.user?.id) return

    supabase.from('user_profiles').select('role').eq('id', session.user.id).maybeSingle().then(({ data }) => {
      setUserRole(data?.role ?? 'staff')
    })
  }, [session])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(`Gagal logout: ${error.message}`)
    }
  }
  const handleNavigation = (label: string) => {
    setActive(label)
    setMobileOpen(false)
  }

  useEffect(() => {
    const loadSidebarCounts = async () => {
      try {
        const [ongoingResult, followUpResult] = await Promise.all([
          supabase
            .from('trips')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'Ongoing'),

          supabase
            .from('follow_ups')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'Pending'),
        ])

        if (ongoingResult.error) {
          console.error('Gagal memuat jumlah Ongoing Trips:', ongoingResult.error)
        } else {
          setOngoingCount(ongoingResult.count ?? 0)
        }

        if (followUpResult.error) {
          console.error('Gagal memuat jumlah Follow Up:', followUpResult.error)
        } else {
          setPendingFollowUpCount(followUpResult.count ?? 0)
        }
      } catch (error) {
        console.error('Gagal memuat badge sidebar:', error)
      }
    }

    loadSidebarCounts()
  }, [])

  if (authLoading) {
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

          <h1>Memuat...</h1>
          <p>Memeriksa sesi keamanan.</p>
        </div>
      </div>
    </main>
  )
}

if (!session) {
  return (
    <Login onLogin={handleLogin} />
  )
}

return (
  <div className="app-shell">
      {mobileOpen && (
        <button
          className="mobile-overlay"
          aria-label="Tutup menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <div className="brand-mark">
            <img src="/logo-crm.png" alt="Rinjani Awesome" />
          </div>

          <div>
            <div className="brand-title">RINJANI AWESOME</div>
            <div className="brand-subtitle">
              Customer & Trip Management
            </div>
          </div>

          <button
            className="sidebar__close"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {navigation.map((item, index) => {
            const Icon = item.icon

            return (
              <div key={item.label}>
                {item.section && (
                  <div className="nav-section">{item.section}</div>
                )}

                {index === 0 && (
                  <div className="nav-section nav-section--first">
                    OVERVIEW
                  </div>
                )}

                <button
                  className={`nav-item ${
                    active === item.label ? 'nav-item--active' : ''
                  }`}
                  onClick={() => handleNavigation(item.label)}
                >
                  <Icon size={19} strokeWidth={1.9} />
                  <span>{item.label}</span>

                  {item.label === 'Ongoing Trips' && (
                    <span className="nav-badge">{ongoingCount}</span>
                  )}

                  {item.label === 'Follow Up' && (
                    <span className="nav-badge nav-badge--warning">{pendingFollowUpCount}</span>
                  )}
                </button>
              </div>
            )
          })}
        </nav>

        <div className="sidebar__footer">
          <div className="online-dot" />
          <span>System Online</span>
          <span className="version">v1.0.0</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
          >
            <Menu size={22} />
          </button>

          <div className="topbar__search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Cari customer, trip, nomor WhatsApp..."
            />
          </div>

          <div className="topbar__right">
            <div className="system-status">
              <span className="status-dot" />
              <span>Database Ready</span>
            </div>

            <button
  type="button"
  className="icon-button notification-button"
  aria-label="Notifikasi"
  onClick={() =>
    setNotificationOpen((current) => !current)
  }
>
              <Bell size={19} />
              <span>3</span>
            </button>

            {notificationOpen && (
              <div className="notification-menu">
                <div className="notification-menu__header">
                  <strong>Notifikasi</strong>
                  <small>Perlu perhatian</small>
                </div>

                <div className="notification-item">
                  <CreditCard size={17} />
                  <div>
                    <strong>Sisa Pembayaran</strong>
                    <small>
                      Sisa pembayaran perlu dicek
                    </small>
                  </div>
                </div>

                <div className="notification-item">
                  <Mountain size={17} />
                  <div>
                    <strong>Ongoing Trips</strong>
                    <small>
                      {ongoingCount} trip sedang berjalan
                    </small>
                  </div>
                </div>

                <div className="notification-item">
                  <Bell size={17} />
                  <div>
                    <strong>Follow Up Hari Ini</strong>
                    <small>
                      {pendingFollowUpCount} follow up pending
                    </small>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              className="admin-profile"
              onClick={() => setProfileOpen((current) => !current)}
            >
              <div className="admin-avatar">P</div>
              <div className="admin-info">
                <strong>{session.user.email}</strong>
                <small>{userRole.toUpperCase()}</small>
              </div>
            </button>

            {profileOpen && (
              <div className="profile-menu">
                <div className="profile-menu__header">
                  <strong>{session.user.email}</strong>
                  <small>{userRole.toUpperCase()}</small>
                </div>

                <button
                  type="button"
                  className="profile-menu__logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}

          </div>
        </header>

        <div className="page-content">
          {active === 'Customers' ? (
            <Customers initialCustomerId={customerIdToOpen} />
          ) : active === 'Follow Up' ? (
            <FollowUp />
          ) : active === 'Ongoing Trips' ? (
            <OngoingTrips />
          ) : active === 'Upcoming Trips' ? (
            <UpcomingTrips />
          ) : active === 'Trip History' ? (
            <TripHistory />
          ) : active === 'Packages' ? (
            <Packages />
          ) : active === 'Reports' ? (
            <Reports />
          ) : active === 'Settings' ? (
            <SettingsPage />
          ) : active === 'Sisa Pembayaran' ? (
            <RemainingPayments onOpenCustomer={(customerId) => { setCustomerIdToOpen(customerId); setActive('Customers') }} />
          ) : (
            <Dashboard onOpenRemainingPayments={() => setActive('Sisa Pembayaran')} />
          )}
        </div>
      </main>
    </div>
  )
}

export default App




































