import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Users,
  CreditCard,
  Search,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type UpcomingTrip = {
  id: string
  package_name: string
  pax: number
  booking_date: string | null
  start_date: string
  end_date: string
  guide_name: string | null
  status: string
  total_price: number | null
  customer: {
    name: string
    country: string | null
    whatsapp: string | null
  } | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function UpcomingTrips() {
  const [trips, setTrips] = useState<UpcomingTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadTrips = async () => {
    setLoading(true)

    const today = new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('trips')
      .select(`
        id,
        package_name,
        pax,
        booking_date,
        start_date,
        end_date,
        guide_name,
        status,
        total_price,
        customer:customers (
          name,
          country,
          whatsapp
        )
      `)
      .eq('status', 'Booked')
      .gte('start_date', today)
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Gagal memuat upcoming trips:', error)
      alert(`Gagal memuat Upcoming Trips: ${error.message}`)
      setTrips([])
    } else {
      setTrips((data ?? []) as unknown as UpcomingTrip[])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadTrips()
  }, [])

  const filteredTrips = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return trips

    return trips.filter((trip) => {
      const customer = trip.customer?.name ?? ''
      const country = trip.customer?.country ?? ''
      const packageName = trip.package_name ?? ''

      return (
        customer.toLowerCase().includes(keyword) ||
        country.toLowerCase().includes(keyword) ||
        packageName.toLowerCase().includes(keyword)
      )
    })
  }, [trips, search])

  const totalPax = filteredTrips.reduce(
    (sum, trip) => sum + Number(trip.pax ?? 0),
    0,
  )

  const totalValue = filteredTrips.reduce(
    (sum, trip) => sum + Number(trip.total_price ?? 0),
    0,
  )

  return (
    <div className="upcoming-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <CalendarDays size={15} />
            TRIP SCHEDULE
          </div>

          <h1>Upcoming Trips</h1>

          <p>
            Customer yang sudah booking dan akan melakukan perjalanan.
          </p>
        </div>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Upcoming Trip</p>
              <h2>{loading ? '...' : trips.length}</h2>
            </div>

            <div className="stat-icon">
              <CalendarDays size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Booked</span>
            <small>jadwal akan datang</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Total Pax</p>
              <h2>{loading ? '...' : totalPax}</h2>
            </div>

            <div className="stat-icon">
              <Users size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Customer</span>
            <small>akan melakukan trip</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Total Nilai Booking</p>
              <h2>
                {loading ? '...' : formatRupiah(totalValue)}
              </h2>
            </div>

            <div className="stat-icon">
              <CreditCard size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Booking</span>
            <small>nilai seluruh upcoming trip</small>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Jadwal Customer Akan Datang</h3>
            <p>Data langsung dari Supabase.</p>
          </div>

          <span className="count-pill">
            {filteredTrips.length}
          </span>
        </div>

        <div className="followup-toolbar">
          <div className="topbar__search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari customer, negara, atau paket..."
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-customers">
            <CalendarDays size={24} />
            <strong>Memuat Upcoming Trips...</strong>
            <span>Mengambil data dari database.</span>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="empty-customers">
            <CalendarDays size={30} />
            <strong>Belum ada Upcoming Trip</strong>
            <span>
              Customer dengan status Booked akan muncul di sini.
            </span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Paket</th>
                  <th>Pax</th>
                  <th>Jadwal</th>
                  <th>Guide / PIC</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredTrips.map((trip) => (
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
                      <div>
                        <strong>
                          {formatDate(trip.start_date)}
                        </strong>

                        <span className="date-arrow"> → </span>

                        {formatDate(trip.end_date)}
                      </div>
                    </td>

                    <td>{trip.guide_name || '-'}</td>

                    <td>
                      <strong>
                        {formatRupiah(Number(trip.total_price ?? 0))}
                      </strong>
                    </td>

                    <td>
                      <span className="status status--booked">
                        Booked
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default UpcomingTrips

