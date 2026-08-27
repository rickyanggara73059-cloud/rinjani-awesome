import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  CreditCard,
  Users,
  Mountain,
  CheckCircle2,
  Clock3,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type ReportTrip = {
  id: string
  package_name: string | null
  total_price: number | null
  status: string | null
  booking_date: string | null
  customer: {
    name: string
    country: string | null
  } | {
    name: string
    country: string | null
  }[] | null
  payments: {
    amount: number | null
  }[] | null
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function Reports() {
  const [trips, setTrips] = useState<ReportTrip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          package_name,
          total_price,
          status,
          booking_date,
          customer:customers (
            name,
            country
          ),
          payments (
            amount
          )
        `)
        .order('booking_date', { ascending: false })

      if (error) {
        console.error('Gagal memuat reports:', error)
        setTrips([])
        setLoading(false)
        return
      }

      setTrips((data ?? []) as unknown as ReportTrip[])
      setLoading(false)
    }

    loadReports()
  }, [])

  const report = useMemo(() => {
    const totalTripValue = trips.reduce(
      (sum, trip) => sum + Number(trip.total_price ?? 0),
      0,
    )

    const totalPayment = trips.reduce(
      (sum, trip) =>
        sum +
        (trip.payments ?? []).reduce(
          (paymentSum, payment) =>
            paymentSum + Number(payment.amount ?? 0),
          0,
        ),
      0,
    )

    const remaining = Math.max(
      totalTripValue - totalPayment,
      0,
    )

    const totalTrips = trips.length

    const ongoingTrips = trips.filter(
      (trip) => trip.status === 'Ongoing',
    ).length

    const completedTrips = trips.filter(
      (trip) => trip.status === 'Completed',
    ).length

    const bookedTrips = trips.filter(
      (trip) => trip.status === 'Booked',
    ).length

    const customerIds = new Set<string>()

    trips.forEach((trip) => {
      const customer = Array.isArray(trip.customer)
        ? trip.customer[0]
        : trip.customer

      if (customer?.name) {
        customerIds.add(customer.name)
      }
    })

    return {
      totalTripValue,
      totalPayment,
      remaining,
      totalTrips,
      ongoingTrips,
      completedTrips,
      bookedTrips,
      totalCustomers: customerIds.size,
    }
  }, [trips])

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <BarChart3 size={15} />
            BUSINESS REPORT
          </div>

          <h1>Reports</h1>

          <p>
            Ringkasan performa trip dan pembayaran Rinjani Awesome.
          </p>
        </div>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Total Nilai Trip</p>
              <h2>
                {loading
                  ? '...'
                  : formatRupiah(report.totalTripValue)}
              </h2>
            </div>

            <div className="stat-icon">
              <Mountain size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>{report.totalTrips} Trip</span>
            <small>total booking</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Pembayaran Masuk</p>
              <h2>
                {loading
                  ? '...'
                  : formatRupiah(report.totalPayment)}
              </h2>
            </div>

            <div className="stat-icon">
              <CreditCard size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Total Payment</span>
            <small>seluruh trip</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Sisa Pembayaran</p>
              <h2>
                {loading
                  ? '...'
                  : formatRupiah(report.remaining)}
              </h2>
            </div>

            <div className="stat-icon">
              <CreditCard size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Belum lunas</span>
            <small>saldo berjalan</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Total Customer</p>
              <h2>
                {loading
                  ? '...'
                  : report.totalCustomers.toLocaleString('id-ID')}
              </h2>
            </div>

            <div className="stat-icon">
              <Users size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Customer</span>
            <small>dari data trip</small>
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel__header">
            <div>
              <h3>Status Trip</h3>
              <p>Distribusi status seluruh trip.</p>
            </div>
          </div>

          <div className="customer-summary">
            <div className="customer-summary__item">
              <div className="customer-avatar customer-avatar--gold">
                <Clock3 size={16} />
              </div>

              <div>
                <strong>Booked</strong>
                <small>Trip yang belum berjalan</small>
              </div>

              <strong>{report.bookedTrips}</strong>
            </div>

            <div className="customer-summary__item">
              <div className="customer-avatar customer-avatar--blue">
                <Mountain size={16} />
              </div>

              <div>
                <strong>Ongoing</strong>
                <small>Trip sedang berjalan</small>
              </div>

              <strong>{report.ongoingTrips}</strong>
            </div>

            <div className="customer-summary__item">
              <div className="customer-avatar customer-avatar--purple">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <strong>Completed</strong>
                <small>Trip sudah selesai</small>
              </div>

              <strong>{report.completedTrips}</strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel__header">
            <div>
              <h3>Trip Terbaru</h3>
              <p>Booking terbaru dari database.</p>
            </div>
          </div>

          <div className="upcoming-list">
            {trips.slice(0, 5).map((trip) => {
              const customer = Array.isArray(trip.customer)
                ? trip.customer[0]
                : trip.customer

              return (
                <div
                  className="upcoming-item"
                  key={trip.id}
                >
                  <div className="calendar-box">
                    <Mountain size={18} />
                  </div>

                  <div>
                    <strong>
                      {customer?.name ?? 'Customer'}
                    </strong>

                    <small>
                      {trip.package_name ?? '-'}
                    </small>
                  </div>

                  <span>
                    {formatRupiah(
                      Number(trip.total_price ?? 0),
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </article>
      </section>
    </div>
  )
}

export default Reports
