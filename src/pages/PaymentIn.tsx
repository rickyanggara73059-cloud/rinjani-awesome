import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Search,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './PaymentIn.css'

type PaymentRow = {
  id: string
  tripId: string
  totalPrice: number
  amount: number
  paymentStatus: string
  paymentMethod: string
  paymentDate: string
  notes: string
  customerId: string
  customerName: string
  country: string
  phone: string
  packageName: string
  tripStart: string
  tripEnd: string
}

type PaymentHistory = {
  id: string
  amount: number
  payment_status: string
  payment_method: string
  payment_date: string
  notes: string | null
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

function getPaymentClass(status: string) {
  const value = status.toLowerCase()

  if (value === 'dp') {
    return 'payment-in-status payment-in-status--dp'
  }

  if (value.includes('lunas')) {
    return 'payment-in-status payment-in-status--paid'
  }

  return 'payment-in-status'
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function PaymentIn() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [selectedPayment, setSelectedPayment] =
    useState<PaymentRow | null>(null)

  const [paymentHistory, setPaymentHistory] =
    useState<PaymentHistory[]>([])

  const [detailLoading, setDetailLoading] = useState(false)
  const [settlementLoading, setSettlementLoading] =
    useState(false)

  const [showSettlement, setShowSettlement] =
    useState(false)

  const [settlementForm, setSettlementForm] = useState({
    amount: '',
    paymentMethod: 'Transfer',
    paymentDate: getToday(),
    notes: 'Pelunasan pembayaran',
  })

  const loadPayments = async () => {
    setLoading(true)

    try {
      const now = new Date()

      const firstDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      )

      const nextMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1,
      )

      const firstDayString = firstDay.toISOString()
      const nextMonthString = nextMonth.toISOString()

      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_status,
          payment_method,
          payment_date,
          notes,
          trip:trips (
            id,
            package_name,
            start_date,
            end_date,
            total_price,
            customer:customers (
              id,
              name,
              country,
              whatsapp
            )
          )
        `)
        .gte('payment_date', firstDayString)
        .lt('payment_date', nextMonthString)
        .order('payment_date', {
          ascending: false,
        })

      if (error) throw error

      const mapped: PaymentRow[] = (data ?? []).flatMap(
        (payment: any) => {
          const trip = payment.trip
          const customer = trip?.customer

          if (!trip || !customer) return []

          return [
            {
              id: payment.id,
              tripId: trip.id,
              totalPrice: Number(
                trip.total_price ?? 0,
              ),
              amount: Number(
                payment.amount ?? 0,
              ),
              paymentStatus:
                payment.payment_status ??
                'Belum ditentukan',
              paymentMethod:
                payment.payment_method ?? '-',
              paymentDate:
                payment.payment_date ?? '',
              notes: payment.notes ?? '',
              customerId: customer.id,
              customerName:
                customer.name ?? 'Customer',
              country:
                customer.country ?? '-',
              phone:
                customer.whatsapp ?? '-',
              packageName:
                trip.package_name ?? '-',
              tripStart:
                trip.start_date ?? '',
              tripEnd:
                trip.end_date ?? '',
            },
          ]
        },
      )

      setPayments(mapped)
    } catch (error) {
      console.error(
        'Gagal mengambil pembayaran masuk:',
        error,
      )

      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [])

  const openPaymentDetail = async (
    payment: PaymentRow,
  ) => {
    setSelectedPayment(payment)
    setShowSettlement(false)
    setDetailLoading(true)

    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_status,
          payment_method,
          payment_date,
          notes
        `)
        .eq('trip_id', payment.tripId)
        .order('payment_date', {
          ascending: true,
        })

      if (error) throw error

      const history =
        (data ?? []) as PaymentHistory[]

      setPaymentHistory(history)

      const totalPaid = history.reduce(
        (sum, item) =>
          sum + Number(item.amount ?? 0),
        0,
      )

      const remaining = Math.max(
        payment.totalPrice - totalPaid,
        0,
      )

      setSettlementForm({
        amount: String(remaining),
        paymentMethod: 'Transfer',
        paymentDate: getToday(),
        notes: 'Pelunasan pembayaran',
      })
    } catch (error) {
      console.error(
        'Gagal mengambil riwayat pembayaran:',
        error,
      )

      setPaymentHistory([])
    } finally {
      setDetailLoading(false)
    }
  }

  const totalSelectedPaid =
    paymentHistory.reduce(
      (sum, payment) =>
        sum + Number(payment.amount ?? 0),
      0,
    )

  const selectedRemaining =
    selectedPayment
      ? Math.max(
          selectedPayment.totalPrice -
            totalSelectedPaid,
          0,
        )
      : 0

  const handleSettlement = async () => {
    if (!selectedPayment) return

    const amount = Number(
      settlementForm.amount,
    )

    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert(
        'Nominal pelunasan harus lebih dari 0.',
      )
      return
    }

    if (selectedRemaining <= 0) {
      window.alert(
        'Pembayaran trip ini sudah lunas.',
      )

      setShowSettlement(false)
      return
    }

    if (amount > selectedRemaining) {
      window.alert(
        `Nominal pelunasan tidak boleh lebih dari sisa pembayaran ${formatRupiah(selectedRemaining)}.`,
      )
      return
    }

    setSettlementLoading(true)

    try {
      /*
       * Cek ulang ke database sebelum insert.
       * Ini mencegah pelunasan ganda jika data berubah
       * ketika modal masih terbuka.
       */
      const { data: existingPayments, error: lookupError } =
        await supabase
          .from('payments')
          .select('amount')
          .eq(
            'trip_id',
            selectedPayment.tripId,
          )

      if (lookupError) throw lookupError

      const totalAlreadyPaid =
        (existingPayments ?? []).reduce(
          (sum, payment) =>
            sum + Number(payment.amount ?? 0),
          0,
        )

      const remainingFromDatabase =
        Math.max(
          selectedPayment.totalPrice -
            totalAlreadyPaid,
          0,
        )

      if (remainingFromDatabase <= 0) {
        window.alert(
          'Pembayaran trip ini sudah lunas.',
        )

        setShowSettlement(false)
        await loadPayments()
        return
      }

      if (amount > remainingFromDatabase) {
        window.alert(
          `Nominal pelunasan tidak boleh lebih dari sisa pembayaran ${formatRupiah(remainingFromDatabase)}.`,
        )
        return
      }

      const newStatus =
        amount >= remainingFromDatabase
          ? 'Lunas'
          : 'DP'

      const { error: insertError } =
        await supabase
          .from('payments')
          .insert({
            trip_id: selectedPayment.tripId,
            amount,
            payment_status: newStatus,
            payment_method:
              settlementForm.paymentMethod,
            payment_date:
              settlementForm.paymentDate ||
              getToday(),
            notes:
              settlementForm.notes.trim() ||
              'Pelunasan pembayaran',
          })

      if (insertError) throw insertError

      /*
       * Jika pembayaran sudah mencapai total harga,
       * pastikan status trip juga menjadi Completed
       * hanya jika memang sebelumnya sudah selesai.
       *
       * Status trip tidak kita ubah otomatis di sini
       * agar tidak mengganggu workflow status trip Papa.
       */

      setShowSettlement(false)

      setPaymentHistory([])

      setSelectedPayment(null)

      await loadPayments()

      window.alert(
        `Pelunasan sebesar ${formatRupiah(amount)} berhasil disimpan.`,
      )
    } catch (error) {
      console.error(
        'Gagal menyimpan pelunasan:',
        error,
      )

      window.alert(
        'Pelunasan gagal disimpan. Silakan coba lagi.',
      )
    } finally {
      setSettlementLoading(false)
    }
  }

  const filteredPayments = useMemo(() => {
    const keyword =
      search.toLowerCase().trim()

    if (!keyword) return payments

    return payments.filter((payment) =>
      [
        payment.customerName,
        payment.country,
        payment.phone,
        payment.packageName,
        payment.paymentStatus,
        payment.paymentMethod,
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [payments, search])

  const totalIncoming = payments.reduce(
    (sum, payment) =>
      sum + payment.amount,
    0,
  )

  const totalDp = payments
    .filter(
      (payment) =>
        payment.paymentStatus
          .toLowerCase() === 'dp',
    )
    .reduce(
      (sum, payment) =>
        sum + payment.amount,
      0,
    )

  const totalPaid = payments
    .filter((payment) =>
      payment.paymentStatus
        .toLowerCase()
        .includes('lunas'),
    )
    .reduce(
      (sum, payment) =>
        sum + payment.amount,
      0,
    )

  const monthName =
    new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(new Date())

  return (
    <div className="payment-in-page">
      <div className="payment-in-heading">
        <div>
          <div className="payment-in-eyebrow">
            <ArrowDownCircle size={16} />
            FINANCIAL MANAGEMENT
          </div>

          <h1>Pembayaran Masuk</h1>

          <p>
            Pantau customer yang melakukan pembayaran
            dan jumlah uang yang masuk.
          </p>
        </div>

        <div className="payment-in-period">
          <CalendarDays size={15} />
          {monthName}
        </div>
      </div>

      <section className="payment-in-stats">
        <div className="payment-in-stat">
          <div className="payment-in-stat__icon">
            <WalletCards size={21} />
          </div>

          <div>
            <span>Total Pembayaran</span>

            <strong>
              {loading
                ? '...'
                : formatRupiah(
                    totalIncoming,
                  )}
            </strong>

            <small>
              seluruh pembayaran bulan ini
            </small>
          </div>
        </div>

        <div className="payment-in-stat">
          <div className="payment-in-stat__icon payment-in-stat__icon--blue">
            <Users size={21} />
          </div>

          <div>
            <span>Transaksi</span>

            <strong>
              {loading
                ? '...'
                : payments.length}
            </strong>

            <small>
              pembayaran tercatat
            </small>
          </div>
        </div>

        <div className="payment-in-stat">
          <div className="payment-in-stat__icon payment-in-stat__icon--gold">
            <CreditCard size={21} />
          </div>

          <div>
            <span>Total DP</span>

            <strong>
              {loading
                ? '...'
                : formatRupiah(totalDp)}
            </strong>

            <small>
              uang muka customer
            </small>
          </div>
        </div>

        <div className="payment-in-stat">
          <div className="payment-in-stat__icon payment-in-stat__icon--green">
            <ArrowDownCircle size={21} />
          </div>

          <div>
            <span>Pelunasan</span>

            <strong>
              {loading
                ? '...'
                : formatRupiah(totalPaid)}
            </strong>

            <small>
              pembayaran lunas
            </small>
          </div>
        </div>
      </section>

      <section className="payment-in-panel">
        <div className="payment-in-toolbar">
          <div>
            <h3>Daftar Pembayaran</h3>

            <p>
              {filteredPayments.length}{' '}
              pembayaran ditemukan untuk{' '}
              {monthName}.
            </p>
          </div>

          <div className="payment-in-search">
            <Search size={17} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Cari customer, paket, WhatsApp..."
            />
          </div>
        </div>

        <div className="payment-in-table-wrapper">
          <table className="payment-in-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>PAKET / TRIP</th>
                <th>TANGGAL BAYAR</th>
                <th>JUMLAH</th>
                <th>METODE</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="payment-in-empty">
                      <WalletCards size={28} />

                      <strong>
                        Memuat pembayaran...
                      </strong>

                      <span>
                        Mengambil data pembayaran
                        dari database.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="payment-in-empty">
                      <CreditCard size={30} />

                      <strong>
                        Belum ada pembayaran masuk
                      </strong>

                      <span>
                        Pembayaran customer akan
                        muncul di sini secara otomatis.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map(
                  (payment) => (
                    <tr key={payment.id}>
                      <td>
                        <button
                          type="button"
                          className="payment-in-customer payment-in-customer-clickable"
                          onClick={() =>
                            openPaymentDetail(payment)
                          }
                        >
                          <div className="payment-in-avatar">
                            {payment.customerName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong className="payment-in-customer-button">
                              {payment.customerName}
                            </strong>

                            <small>
                              {payment.country}{' '}
                              · {payment.phone}
                            </small>
                          </div>
                        </button>
                      </td>

                      <td>
                        <div className="payment-in-package">
                          <strong>
                            {payment.packageName}
                          </strong>

                          <small>
                            {formatDate(
                              payment.tripStart,
                            )}
                            {' → '}
                            {formatDate(
                              payment.tripEnd,
                            )}
                          </small>
                        </div>
                      </td>

                      <td>
                        <div className="payment-in-date">
                          <CalendarDays size={15} />

                          {formatDate(
                            payment.paymentDate,
                          )}
                        </div>
                      </td>

                      <td>
                        <strong className="payment-in-amount">
                          {formatRupiah(
                            payment.amount,
                          )}
                        </strong>
                      </td>

                      <td>
                        <span className="payment-in-method">
                          {payment.paymentMethod}
                        </span>
                      </td>

                      <td>
                        <span
                          className={getPaymentClass(
                            payment.paymentStatus,
                          )}
                        >
                          {payment.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedPayment && (
        <div
          className="payment-in-modal-backdrop"
          onMouseDown={() => {
            if (!settlementLoading) {
              setSelectedPayment(null)
              setShowSettlement(false)
            }
          }}
        >
          <div
            className="payment-in-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="payment-in-modal__header">
              <div>
                <div className="payment-in-modal__eyebrow">
                  PAYMENT DETAIL
                </div>

                <h2>
                  {selectedPayment.customerName}
                </h2>

                <p>
                  {selectedPayment.packageName}
                </p>
              </div>

              <button
                type="button"
                className="payment-in-modal__close"
                onClick={() => {
                  setSelectedPayment(null)
                  setShowSettlement(false)
                }}
                disabled={
                  settlementLoading
                }
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div className="payment-in-detail-loading">
                <WalletCards size={26} />

                <strong>
                  Memuat detail pembayaran...
                </strong>
              </div>
            ) : (
              <>
                <div className="payment-in-summary">
                  <div>
                    <span>Total Trip</span>

                    <strong>
                      {formatRupiah(
                        selectedPayment.totalPrice,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Sudah Dibayar</span>

                    <strong>
                      {formatRupiah(
                        totalSelectedPaid,
                      )}
                    </strong>
                  </div>

                  <div className="payment-in-summary__remaining">
                    <span>
                      Sisa Pembayaran
                    </span>

                    <strong>
                      {formatRupiah(
                        selectedRemaining,
                      )}
                    </strong>
                  </div>
                </div>

                <div className="payment-in-history">
                  <div className="payment-in-modal-title">
                    RIWAYAT PEMBAYARAN
                  </div>

                  {paymentHistory.length ===
                  0 ? (
                    <div className="payment-in-history-empty">
                      Belum ada pembayaran.
                    </div>
                  ) : (
                    paymentHistory.map(
                      (item) => (
                        <div
                          className="payment-in-history-row"
                          key={item.id}
                        >
                          <div>
                            <strong>
                              {
                                item.payment_status
                              }
                            </strong>

                            <small>
                              {formatDate(
                                item.payment_date,
                              )}
                              {' · '}
                              {
                                item.payment_method
                              }
                            </small>
                          </div>

                          <strong>
                            {formatRupiah(
                              Number(
                                item.amount ?? 0,
                              ),
                            )}
                          </strong>
                        </div>
                      ),
                    )
                  )}
                </div>

                {!showSettlement ? (
                  <div className="payment-in-modal-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        setSelectedPayment(
                          null,
                        )
                      }
                    >
                      Tutup
                    </button>

                    {selectedRemaining >
                    0 ? (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() =>
                          setShowSettlement(
                            true,
                          )
                        }
                      >
                        <Banknote size={16} />
                        Lunasi Pembayaran
                      </button>
                    ) : (
                      <div className="payment-in-paid-label">
                        <CheckCircle2
                          size={16}
                        />
                        Sudah Lunas
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="payment-in-settlement">
                    <div className="payment-in-modal-title">
                      PELUNASAN PEMBAYARAN
                    </div>

                    <label>
                      <span>
                        Nominal Pelunasan
                      </span>

                      <input
                        type="number"
                        min="0"
                        max={
                          selectedRemaining
                        }
                        value={
                          settlementForm.amount
                        }
                        onChange={(event) =>
                          setSettlementForm(
                            (current) => ({
                              ...current,
                              amount:
                                event.target.value,
                            }),
                          )
                        }
                        disabled={
                          settlementLoading
                        }
                      />

                      <small>
                        Sisa saat ini:{' '}
                        <strong>
                          {formatRupiah(
                            selectedRemaining,
                          )}
                        </strong>
                      </small>
                    </label>

                    <div className="payment-in-form-grid">
                      <label>
                        <span>
                          Metode Pembayaran
                        </span>

                        <select
                          value={
                            settlementForm.paymentMethod
                          }
                          onChange={(event) =>
                            setSettlementForm(
                              (current) => ({
                                ...current,
                                paymentMethod:
                                  event.target.value,
                              }),
                            )
                          }
                          disabled={
                            settlementLoading
                          }
                        >
                          <option value="Transfer">
                            Transfer
                          </option>

                          <option value="Cash">
                            Cash
                          </option>

                          <option value="Payment Gateway">
                            Payment Gateway
                          </option>
                        </select>
                      </label>

                      <label>
                        <span>
                          Tanggal Pembayaran
                        </span>

                        <input
                          type="date"
                          value={
                            settlementForm.paymentDate
                          }
                          onChange={(event) =>
                            setSettlementForm(
                              (current) => ({
                                ...current,
                                paymentDate:
                                  event.target.value,
                              }),
                            )
                          }
                          disabled={
                            settlementLoading
                          }
                        />
                      </label>
                    </div>

                    <label>
                      <span>
                        Catatan
                      </span>

                      <input
                        type="text"
                        value={
                          settlementForm.notes
                        }
                        onChange={(event) =>
                          setSettlementForm(
                            (current) => ({
                              ...current,
                              notes:
                                event.target.value,
                            }),
                          )
                        }
                        disabled={
                          settlementLoading
                        }
                      />
                    </label>

                    <div className="payment-in-modal-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          setShowSettlement(
                            false,
                          )
                        }
                        disabled={
                          settlementLoading
                        }
                      >
                        Batal
                      </button>

                      <button
                        type="button"
                        className="primary-button"
                        onClick={
                          handleSettlement
                        }
                        disabled={
                          settlementLoading ||
                          selectedRemaining <= 0
                        }
                      >
                        <CheckCircle2
                          size={16}
                        />

                        {settlementLoading
                          ? 'Menyimpan...'
                          : 'Simpan Pelunasan'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

