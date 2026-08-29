import { useEffect, useMemo, useState } from 'react'
import {
  UsersRound,
  Search,
  RotateCcw,
  CalendarDays,
  CreditCard,
  Package,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './RepeatOrders.css'

type RepeatOrder = {
  id: string
  customerId: string
  name: string
  country: string
  phone: string
  packageName: string
  bookingDate: string
  tripStart: string
  tripEnd: string
  pax: number
  totalPrice: number
  paid: number
  remaining: number
  paymentStatus: string
  status: string
  repeatNumber: number
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getStatusClass(status: string) {
  switch (status) {
    case 'Ongoing':
      return 'repeat-status repeat-status--ongoing'
    case 'Completed':
      return 'repeat-status repeat-status--completed'
    case 'Cancelled':
      return 'repeat-status repeat-status--cancelled'
    default:
      return 'repeat-status repeat-status--booked'
  }
}

export default function RepeatOrders() {
  const [orders, setOrders] = useState<RepeatOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadRepeatOrders = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          country,
          whatsapp,
          trips (
            id,
            package_name,
            booking_date,
            start_date,
            end_date,
            pax,
            total_price,
            status,
            payments (
              amount,
              payment_status
            )
          )
        `)

      if (error) throw error

      const mapped: RepeatOrder[] = []

      for (const customer of data ?? []) {
        const trips = [...(customer.trips ?? [])].sort(
          (a: any, b: any) =>
            new Date(a.start_date).getTime() -
            new Date(b.start_date).getTime(),
        )

        if (trips.length <= 1) continue

        trips.slice(1).forEach((trip: any, index: number) => {
          const payments = trip.payments ?? []

          const paid = payments.reduce(
            (sum: number, payment: any) =>
              sum + Number(payment.amount ?? 0),
            0,
          )

          const totalPrice = Number(trip.total_price ?? 0)

          const paymentStatus =
            payments.length > 0
              ? payments[payments.length - 1]?.payment_status ?? 'Belum Bayar'
              : 'Belum Bayar'

          mapped.push({
            id: trip.id,
            customerId: customer.id,
            name: customer.name,
            country: customer.country ?? '-',
            phone: customer.whatsapp ?? '-',
            packageName: trip.package_name ?? '-',
            bookingDate: trip.booking_date ?? '',
            tripStart: trip.start_date ?? '',
            tripEnd: trip.end_date ?? '',
            pax: Number(trip.pax ?? 0),
            totalPrice,
            paid,
            remaining: Math.max(totalPrice - paid, 0),
            paymentStatus,
            status: trip.status ?? 'Booked',
            repeatNumber: index + 2,
          })
        })
      }

      mapped.sort(
        (a, b) =>
          new Date(b.bookingDate || b.tripStart).getTime() -
          new Date(a.bookingDate || a.tripStart).getTime(),
      )

      setOrders(mapped)
    } catch (error) {
      console.error('Gagal mengambil repeat order:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRepeatOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    if (!keyword) return orders

    return orders.filter((order) =>
      [
        order.name,
        order.country,
        order.phone,
        order.packageName,
        order.status,
        order.paymentStatus,
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [orders, search])

  const totalSpending = orders.reduce(
    (sum, order) => sum + order.totalPrice,
    0,
  )

  return (
    <div className="repeat-page">
      <div className="repeat-page__heading">
        <div>
          <div className="repeat-page__eyebrow">
            <RotateCcw size={16} />
            CUSTOMER RELATIONSHIP
          </div>

          <h1>Repeat Order</h1>

          <p>
            Customer yang melakukan booking kembali setelah perjalanan
            sebelumnya.
          </p>
        </div>
      </div>

      <section className="repeat-stats">
        <div className="repeat-stat-card">
          <div className="repeat-stat-card__icon">
            <RotateCcw size={21} />
          </div>

          <div>
            <span>Total Repeat Order</span>
            <strong>{loading ? '...' : orders.length}</strong>
            <small>booking berulang</small>
          </div>
        </div>

        <div className="repeat-stat-card">
          <div className="repeat-stat-card__icon repeat-stat-card__icon--blue">
            <UsersRound size={21} />
          </div>

          <div>
            <span>Customer Repeat</span>
            <strong>
              {loading
                ? '...'
                : new Set(orders.map((order) => order.customerId)).size}
            </strong>
            <small>customer kembali booking</small>
          </div>
        </div>

        <div className="repeat-stat-card">
          <div className="repeat-stat-card__icon repeat-stat-card__icon--gold">
            <CreditCard size={21} />
          </div>

          <div>
            <span>Total Spending</span>
            <strong>{loading ? '...' : formatRupiah(totalSpending)}</strong>
            <small>dari repeat order</small>
          </div>
        </div>
      </section>

      <section className="repeat-table-panel">
        <div className="repeat-table-toolbar">
          <div>
            <h3>Semua Repeat Order</h3>
            <p>
              {filteredOrders.length} repeat order ditemukan dalam database.
            </p>
          </div>

          <div className="repeat-search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, negara, WhatsApp..."
            />
          </div>
        </div>

        <div className="repeat-table-wrapper">
          <table className="repeat-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>REPEAT KE</th>
                <th>PAKET</th>
                <th>JADWAL</th>
                <th>PAX</th>
                <th>TOTAL</th>
                <th>PEMBAYARAN</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className="repeat-empty">
                      <RotateCcw size={28} />
                      <strong>Memuat repeat order...</strong>
                      <span>Mengambil data dari Supabase.</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="repeat-empty">
                      <UsersRound size={30} />
                      <strong>Belum ada repeat order</strong>
                      <span>
                        Customer akan otomatis muncul di sini ketika melakukan
                        booking kembali.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="repeat-customer">
                        <div className="repeat-avatar">
                          {order.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <strong>{order.name}</strong>
                          <small>
                            {order.country} · {order.phone}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="repeat-number">
                        #{order.repeatNumber}
                      </span>
                    </td>

                    <td>
                      <div className="repeat-package">
                        <Package size={15} />
                        <span>{order.packageName}</span>
                      </div>
                    </td>

                    <td>
                      <div className="repeat-date">
                        <CalendarDays size={15} />
                        <div>
                          <strong>{formatDate(order.tripStart)}</strong>
                          <small>s/d {formatDate(order.tripEnd)}</small>
                        </div>
                      </div>
                    </td>

                    <td>{order.pax} pax</td>

                    <td>
                      <strong>{formatRupiah(order.totalPrice)}</strong>
                    </td>

                    <td>
                      <div className="repeat-payment">
                        <strong>{order.paymentStatus}</strong>
                        {order.remaining > 0 && (
                          <small>
                            Sisa {formatRupiah(order.remaining)}
                          </small>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className={getStatusClass(order.status)}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

