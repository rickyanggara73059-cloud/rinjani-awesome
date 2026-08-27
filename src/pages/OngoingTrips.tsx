import { useEffect, useState } from 'react'
import {
  Mountain,
  Users,
  UserRound,
  CreditCard,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type OngoingTrip = {
  id: string
  package_name: string
  pax: number
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

function formatDate(value: string) {
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

function OngoingTrips() {
  const [trips, setTrips] = useState<OngoingTrip[]>([])
  const [loading, setLoading] = useState(true)

  const loadTrips = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('trips')
      .select(`
        id,
        package_name,
        pax,
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
      .eq('status', 'Ongoing')
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Gagal memuat ongoing trips:', error)
      alert(`Gagal memuat Ongoing Trips: ${error.message}`)
      setTrips([])
    } else {
      setTrips((data ?? []) as unknown as OngoingTrip[])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadTrips()
  }, [])

  const totalPax = trips.reduce(
    (sum, trip) => sum + Number(trip.pax ?? 0),
    0,
  )

  const totalValue = trips.reduce(
    (sum, trip) => sum + Number(trip.total_price ?? 0),
    0,
  )

  return (
    <div className="ongoing-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Mountain size={15} />
            TRIP OPERATIONS
          </div>

          <h1>Ongoing Trips</h1>

          <p>
            Customer yang sedang menggunakan jasa Rinjani Awesome.
          </p>
        </div>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Trip Aktif</p>
              <h2>{loading ? '...' : trips.length}</h2>
            </div>

            <div className="stat-icon">
              <Mountain size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Ongoing</span>
            <small>perjalanan aktif</small>
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
            <small>sedang berada di trip</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Nilai Trip Aktif</p>
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
            <small>total nilai trip aktif</small>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Customer Sedang Trip</h3>
            <p>Data real-time dari Supabase.</p>
          </div>

          <span className="count-pill">{trips.length}</span>
        </div>

        {loading ? (
          <div className="empty-customers">
            <Mountain size={24} />
            <strong>Memuat ongoing trips...</strong>
            <span>Mengambil data dari database.</span>
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-customers">
            <Mountain size={30} />
            <strong>Belum ada Ongoing Trip</strong>
            <span>
              Customer akan muncul di sini ketika status trip diubah menjadi Ongoing.
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
                {trips.map((trip) => (
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

                    <td>
                      <div className="customer-cell">
                        <UserRound size={16} />
                        <span>{trip.guide_name || '-'}</span>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {formatRupiah(Number(trip.total_price ?? 0))}
                      </strong>
                    </td>

                    <td>
                      <span className="status status--ongoing">
                        Ongoing
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

export default OngoingTrips

