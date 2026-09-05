import { useEffect, useMemo, useState } from 'react'
import { Banknote, CheckCircle2, CreditCard, Search, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './PaymentIn.css'

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

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function RemainingPayments({ onOpenCustomer }: { onOpenCustomer: (customerId: string) => void }) {
  const [items, setItems] = useState<RemainingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<RemainingPayment | null>(null)
  const [savingPayment, setSavingPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Transfer',
    paymentDate: getToday(),
    notes: 'Pelunasan pembayaran',
  })

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

  useEffect(() => {
    load()
  }, [])

  const openPaymentModal = (item: RemainingPayment) => {
    setSelectedItem(item)
    setPaymentForm({
      amount: String(item.remaining),
      paymentMethod: 'Transfer',
      paymentDate: getToday(),
      notes: 'Pelunasan pembayaran',
    })
  }

  const handlePayment = async () => {
    if (!selectedItem) return

    const amount = Number(paymentForm.amount)

    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert('Nominal pembayaran harus lebih dari 0.')
      return
    }

    if (amount > selectedItem.remaining) {
      window.alert(
        `Nominal pembayaran tidak boleh lebih dari sisa pembayaran ${formatRupiah(selectedItem.remaining)}.`,
      )
      return
    }

    setSavingPayment(true)

    try {
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('id, total_price')
        .eq('id', selectedItem.id)
        .maybeSingle()

      if (tripError) throw tripError

      if (!trip) {
        window.alert('Trip tidak ditemukan.')
        return
      }

      const { data: existingPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('trip_id', trip.id)

      if (paymentsError) throw paymentsError

      const totalAlreadyPaid = (existingPayments ?? []).reduce(
        (sum, payment) => sum + Number(payment.amount ?? 0),
        0,
      )
      const remainingFromDatabase = Math.max(
        Number(trip.total_price ?? 0) - totalAlreadyPaid,
        0,
      )

      if (remainingFromDatabase <= 0) {
        window.alert('Pembayaran trip ini sudah lunas.')
        setSelectedItem(null)
        await load()
        return
      }

      if (amount > remainingFromDatabase) {
        window.alert(
          `Nominal pembayaran tidak boleh lebih dari sisa pembayaran ${formatRupiah(remainingFromDatabase)}.`,
        )
        return
      }

      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          trip_id: trip.id,
          amount,
          payment_status: amount >= remainingFromDatabase ? 'Lunas' : 'DP',
          payment_method: paymentForm.paymentMethod,
          payment_date: paymentForm.paymentDate || getToday(),
          notes: paymentForm.notes.trim() || 'Pelunasan pembayaran',
        })

      if (insertError) throw insertError

      setSelectedItem(null)
      await load()
      window.alert(`Pembayaran sebesar ${formatRupiah(amount)} berhasil disimpan.`)
    } catch (error) {
      console.error('Gagal menyimpan pembayaran:', error)
      window.alert('Pembayaran gagal disimpan. Silakan coba lagi.')
    } finally {
      setSavingPayment(false)
    }
  }

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
                  <th>Aksi</th>
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

                    <td>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => openPaymentModal(item)}
                      >
                        <Banknote size={16} />
                        Bayar / Lunasi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedItem && (
        <div
          className="payment-in-modal-backdrop"
          onMouseDown={() => {
            if (!savingPayment) setSelectedItem(null)
          }}
        >
          <div
            className="payment-in-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="payment-in-modal__header">
              <div>
                <div className="payment-in-modal__eyebrow">PEMBAYARAN TRIP</div>
                <h2>{selectedItem.customerName}</h2>
                <p>{selectedItem.packageName}</p>
              </div>

              <button
                type="button"
                className="payment-in-modal__close"
                onClick={() => setSelectedItem(null)}
                disabled={savingPayment}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div className="payment-in-summary">
              <div>
                <span>Total Trip</span>
                <strong>{formatRupiah(selectedItem.totalPrice)}</strong>
              </div>
              <div>
                <span>Sudah Dibayar</span>
                <strong>{formatRupiah(selectedItem.totalPaid)}</strong>
              </div>
              <div className="payment-in-summary__remaining">
                <span>Sisa Pembayaran</span>
                <strong>{formatRupiah(selectedItem.remaining)}</strong>
              </div>
            </div>

            <div className="payment-in-settlement">
              <div className="payment-in-modal-title">PEMBAYARAN BARU</div>

              <label>
                <span>Nominal Pembayaran</span>
                <input
                  type="number"
                  min="1"
                  max={selectedItem.remaining}
                  value={paymentForm.amount}
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  disabled={savingPayment}
                  required
                />
                <small>Sisa saat ini: <strong>{formatRupiah(selectedItem.remaining)}</strong></small>
              </label>

              <div className="payment-in-form-grid">
                <label>
                  <span>Metode Pembayaran</span>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(event) =>
                      setPaymentForm((current) => ({
                        ...current,
                        paymentMethod: event.target.value,
                      }))
                    }
                    disabled={savingPayment}
                  >
                    <option value="Transfer">Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Payment Gateway">Payment Gateway</option>
                  </select>
                </label>

                <label>
                  <span>Tanggal Pembayaran</span>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(event) =>
                      setPaymentForm((current) => ({
                        ...current,
                        paymentDate: event.target.value,
                      }))
                    }
                    disabled={savingPayment}
                  />
                </label>
              </div>

              <label>
                <span>Catatan</span>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  disabled={savingPayment}
                />
              </label>

              <div className="payment-in-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setSelectedItem(null)}
                  disabled={savingPayment}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={handlePayment}
                  disabled={savingPayment}
                >
                  <CheckCircle2 size={16} />
                  {savingPayment ? 'Menyimpan...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RemainingPayments



