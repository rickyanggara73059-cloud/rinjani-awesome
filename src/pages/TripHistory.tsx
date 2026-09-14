import { useEffect, useMemo, useState } from 'react'
import {
  History,
  Users,
  CreditCard,
  Search,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getTodayDateString, isTripCompleted } from '../lib/tripLifecycle'

type TripHistoryItem = {
  id: string
  package_name: string
  pax: number
  start_date: string
  end_date: string
  guide_name: string | null
  status: string
  total_price: number | null
  currency?: 'IDR' | 'USD'
  customer: {
    name: string
    country: string | null
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

function formatPrice(
  value: number,
  currency: 'IDR' | 'USD' = 'IDR',
) {
  if (currency === 'USD') {
    return '$' + value.toLocaleString('en-US', {
      maximumFractionDigits: 0,
    })
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function TripHistory() {
  const [trips, setTrips] = useState<TripHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadHistory = async () => {
    setLoading(true)

    const today = getTodayDateString()

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
        currency,
        customer:customers (
          name,
          country
        )
      )`)
      .lt('end_date', today)
      .order('end_date', { ascending: false })

    if (error) {
      console.error('Gagal memuat Trip History:', error)
      alert(`Gagal memuat Trip History: ${error.message}`)
      setTrips([])
    } else {
      const completedTrips = ((data ?? []) as unknown as TripHistoryItem[])
        .filter((trip) =>
          isTripCompleted({
            startDate: trip.start_date,
            endDate: trip.end_date,
            storedStatus: trip.status,
            today,
          }),
        )

      setTrips(completedTrips)
    }

    setLoading(false)
  }
  useEffect(() => {
    loadHistory()
  }, [])

  const filteredTrips = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return trips

    return trips.filter((trip) => {
      const customer = trip.customer?.name ?? ''
      const country = trip.customer?.country ?? ''
      const packageName = trip.package_name ?? ''
      const guide = trip.guide_name ?? ''

      return (
        customer.toLowerCase().includes(keyword) ||
        country.toLowerCase().includes(keyword) ||
        packageName.toLowerCase().includes(keyword) ||
        guide.toLowerCase().includes(keyword)
      )
    })
  }, [trips, search])

  const totalPax = filteredTrips.reduce(
    (sum, trip) => sum + Number(trip.pax ?? 0),
    0,
  )

  const totalIDR = filteredTrips
    .filter((trip) => (trip.currency ?? 'IDR') === 'IDR')
    .reduce(
      (sum, trip) => sum + Number(trip.total_price ?? 0),
      0,
    )

  const totalUSD = filteredTrips
    .filter((trip) => trip.currency === 'USD')
    .reduce(
      (sum, trip) => sum + Number(trip.total_price ?? 0),
      0,
    )

  return (
    <div className="history-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <History size={15} />
            TRIP RECORDS
          </div>

          <h1>Trip History</h1>

          <p>
            Riwayat perjalanan customer yang sudah selesai.
          </p>
        </div>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Total Trip Selesai</p>
              <h2>{loading ? '...' : trips.length}</h2>
            </div>

            <div className="stat-icon">
              <History size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Completed</span>
            <small>perjalanan selesai</small>
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
            <small>total pax perjalanan</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Total Nilai Trip</p>
              {loading ? (
                <h2>...</h2>
              ) : (
                <div className="currency-total-stack">
                  {totalIDR > 0 && (
                    <strong>{formatPrice(totalIDR, 'IDR')}</strong>
                  )}

                  {totalUSD > 0 && (
                    <strong>{formatPrice(totalUSD, 'USD')}</strong>
                  )}

                  {totalIDR === 0 && totalUSD === 0 && (
                    <strong>Rp 0</strong>
                  )}
                </div>
              )}
            </div>

            <div className="stat-icon">
              <CreditCard size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Completed</span>
            <small>total nilai perjalanan</small>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Riwayat Perjalanan</h3>
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
              placeholder="Cari customer, negara, paket, atau guide..."
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-customers">
            <History size={24} />
            <strong>Memuat Trip History...</strong>
            <span>Mengambil data dari database.</span>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="empty-customers">
            <History size={30} />
            <strong>Belum ada Trip Selesai</strong>
            <span>
              Trip akan muncul di sini setelah status diubah menjadi Completed.
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
                      <strong>
                        {formatDate(trip.start_date)}
                      </strong>

                      <span className="date-arrow"> → </span>

                      {formatDate(trip.end_date)}
                    </td>

                    <td>{trip.guide_name || '-'}</td>

                    <td>
                      <strong>
                        {formatPrice(Number(trip.total_price ?? 0), trip.currency ?? 'IDR')}
                      </strong>
                    </td>

                    <td>
                      <span className="status status--completed">
                        Completed
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

export default TripHistory








