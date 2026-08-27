import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

type RemainingPayment = {
  id: string
  customerId: string
  customerName: string
  country: string
  packageName: string
  totalPrice: number
  totalPaid: number
  remaining: number
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function RemainingPayments({ onOpenCustomer }: { onOpenCustomer: (customerId: string) => void }) {
  const [items, setItems] = useState<RemainingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          package_name,
          total_price,
          customer:customers (
            id,
            name,
            country
          ),
          payments (
            amount
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Gagal memuat sisa pembayaran:', error)
        setItems([])
        setLoading(false)
        return
      }

      const result = (data ?? []).flatMap((trip: any) => {
        const customer = Array.isArray(trip.customer)
          ? trip.customer[0]
          : trip.customer

        const totalPrice = Number(trip.total_price ?? 0)

        const totalPaid = (trip.payments ?? []).reduce(
          (sum: number, payment: any) =>
            sum + Number(payment.amount ?? 0),
          0,
        )

        const remaining = Math.max(
          totalPrice - totalPaid,
          0,
        )

        if (!customer || remaining <= 0) return []

        return [{
          id: trip.id,
          customerId: customer.id,
          customerName: customer.name ?? 'Customer',
          country: customer.country ?? '-',
          packageName: trip.package_name ?? '-',
          totalPrice,
          totalPaid,
          remaining,
        }]
      })

      setItems(result)
      setLoading(false)
    }

    load()
  }, [])

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) return items

    return items.filter((item) =>
      [
        item.customerName,
        item.country,
        item.packageName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [items, search])

  const totalRemaining = filteredItems.reduce(
    (sum, item) => sum + item.remaining,
    0,
  )

  return (
    <div>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <CreditCard size={15} />
            PAYMENT FOLLOW UP
          </div>

          <h1>Sisa Pembayaran</h1>
          <p>Customer yang masih memiliki saldo pembayaran.</p>
        </div>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Customer Belum Lunas</p>
              <h2>{loading ? '...' : filteredItems.length}</h2>
            </div>

            <div className="stat-icon">
              <CreditCard size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Perlu Follow Up</span>
            <small>masih punya saldo</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Total Sisa Pembayaran</p>
              <h2>
                {loading
                  ? '...'
                  : formatRupiah(totalRemaining)}
              </h2>
            </div>

            <div className="stat-icon">
              <CreditCard size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Belum Lunas</span>
            <small>total saldo customer</small>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Daftar Sisa Pembayaran</h3>
            <p>Data langsung dari Supabase.</p>
          </div>

          <span className="count-pill">
            {filteredItems.length}
          </span>
        </div>

        <div className="followup-toolbar">
          <div className="topbar__search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Cari customer, negara, atau paket..."
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-customers">
            <CreditCard size={28} />
            <strong>Memuat data pembayaran...</strong>
            <span>Mengambil data dari database.</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-customers">
            <CreditCard size={30} />
            <strong>Semua pembayaran sudah lunas</strong>
            <span>Tidak ada customer dengan saldo tersisa.</span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Paket</th>
                  <th>Total Trip</th>
                  <th>Sudah Bayar</th>
                  <th>Sisa</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar">
                          {item.customerName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>{item.customerName}</strong>
                          <small>{item.country}</small>
                        </div>
                      </div>
                    </td>

                    <td>{item.packageName}</td>

                    <td>{formatRupiah(item.totalPrice)}</td>

                    <td>{formatRupiah(item.totalPaid)}</td>

                    <td>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => onOpenCustomer(item.customerId)}
                      >
                        <strong className="spending-value">
                          {formatRupiah(item.remaining)}
                        </strong>
                      </button>
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

export default RemainingPayments



