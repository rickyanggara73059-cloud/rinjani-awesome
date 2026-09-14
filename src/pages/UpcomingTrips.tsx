import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Users,
  CreditCard,
  Search,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getTodayDateString, isTripUpcoming } from '../lib/tripLifecycle'

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
  ticket_status: string
  ticket_number: string | null
  ticket_purchased_at: string | null
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

  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null)
  const handleTicketStatus = async (
    tripId: string,
    purchased: boolean,
  ) => {
    setUpdatingTicketId(tripId)

    const nextStatus = purchased ? 'Sudah Dibeli' : 'Belum Dibeli'

    const { error } = await supabase
      .from('trips')
      .update({
        ticket_status: nextStatus,
        ticket_purchased_at: purchased
          ? new Date().toISOString().slice(0, 10)
          : null,
      })
      .eq('id', tripId)

    if (error) {
      console.error('Gagal memperbarui status tiket:', error)
      alert(`Gagal memperbarui status tiket: ${error.message}`)
    } else {
      setTrips((currentTrips) =>
        currentTrips.map((trip) =>
          trip.id === tripId
            ? {
                ...trip,
                ticket_status: nextStatus,
                ticket_purchased_at: purchased
                  ? new Date().toISOString().slice(0, 10)
                  : null,
              }
            : trip,
        ),
      )
    }

    setUpdatingTicketId(null)
  }
  const loadTrips = async () => {
    setLoading(true)

    const today = getTodayDateString()

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
        currency,
        ticket_status,
        ticket_number,
        ticket_purchased_at,
        customer:customers (
          name,
          country,
          whatsapp
        )
      )`)
      .gte('start_date', today)
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Gagal memuat upcoming trips:', error)
      alert(`Gagal memuat Upcoming Trips: ${error.message}`)
      setTrips([])
    } else {
      const upcomingTrips = ((data ?? []) as unknown as UpcomingTrip[])
        .filter((trip) =>
          isTripUpcoming({
            startDate: trip.start_date,
            endDate: trip.end_date,
            storedStatus: trip.status,
            today,
          }),
        )

      setTrips(upcomingTrips)
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

  const purchasedTicketCount = filteredTrips.filter(
    (trip) => trip.ticket_status === 'Sudah Dibeli',
  ).length

  const pendingTicketCount = filteredTrips.filter(
    (trip) => trip.ticket_status !== 'Sudah Dibeli',
  ).length

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
        </article>        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Tiket Sudah Dibeli</p>
              <h2>{loading ? '...' : purchasedTicketCount}</h2>
            </div>

            <div className="stat-icon">
              <CreditCard size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Sudah</span>
            <small>tiket pendakian dibeli</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Tiket Belum Dibeli</p>
              <h2>{loading ? '...' : pendingTicketCount}</h2>
            </div>

            <div className="stat-icon">
              <CalendarDays size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Perlu diproses</span>
            <small>tiket pendakian</small>
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
                  <th>Tiket Pendakian</th>
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
                      <div className="ticket-status-cell">
                        <span
                          className={
                            trip.ticket_status === 'Sudah Dibeli'
                              ? 'ticket-badge ticket-badge--done'
                              : 'ticket-badge ticket-badge--pending'
                          }
                        >
                          {trip.ticket_status === 'Sudah Dibeli'
                            ? 'Sudah Dibeli'
                            : 'Belum Dibeli'}
                        </span>

                        <button
                          type="button"
                          className="ticket-toggle-button"
                          disabled={updatingTicketId === trip.id}
                          onClick={() =>
                            handleTicketStatus(
                              trip.id,
                              trip.ticket_status !== 'Sudah Dibeli',
                            )
                          }
                        >
                          {updatingTicketId === trip.id
                            ? 'Menyimpan...'
                            : trip.ticket_status === 'Sudah Dibeli'
                              ? 'Batalkan'
                              : 'Tandai Sudah'}
                        </button>
                      </div>
                    </td>

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



