import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  CheckCircle2,
  Clock3,
  Mail,
  MessageCircle,
  Search,
  XCircle,
} from 'lucide-react'
import { useRef } from 'react'
import { supabase } from '../lib/supabase'

type FollowUp = {
  id: string
  customer_id: string
  trip_id: string | null
  follow_up_date: string
  subject: string
  notes: string | null
  status: string
  customer?: {
    name: string
    country: string | null
    whatsapp: string | null
    email: string | null
  } | null
  trip?: {
    package_name: string | null
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

function FollowUp() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Semua')
  const hasRunCompletedTripBackfill = useRef(false)

  const backfillCompletedTripFollowUps = async () => {
    try {
      const { data: completedTrips, error: tripsError } = await supabase
        .from('trips')
        .select('id, customer_id')
        .eq('status', 'Completed')

      if (tripsError) throw tripsError

      const trips = completedTrips ?? []

      if (trips.length === 0) return

      const tripIds = trips.map((trip) => trip.id)
      const { data: existingFollowUps, error: followUpsError } = await supabase
        .from('follow_ups')
        .select('trip_id')
        .in('trip_id', tripIds)

      if (followUpsError) throw followUpsError

      const existingTripIds = new Set(
        (existingFollowUps ?? [])
          .map((followUp) => followUp.trip_id)
          .filter((tripId): tripId is string => Boolean(tripId)),
      )

      const missingFollowUps = trips
        .filter((trip) => !existingTripIds.has(trip.id))
        .map((trip) => ({
          customer_id: trip.customer_id,
          trip_id: trip.id,
          follow_up_date: new Date().toISOString().slice(0, 10),
          subject: 'Follow Up Trip Selesai',
          notes: 'Follow Up otomatis dibuat karena Trip telah selesai.',
          status: 'Pending',
        }))

      if (missingFollowUps.length === 0) return

      const { error: insertError } = await supabase
        .from('follow_ups')
        .insert(missingFollowUps)

      if (insertError) throw insertError
    } catch (error) {
      console.error(
        'Gagal melakukan backfill Follow Up untuk trip Completed:',
        error,
      )
    }
  }

  const loadFollowUps = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('follow_ups')
      .select(`
        id,
        customer_id,
        trip_id,
        follow_up_date,
        subject,
        notes,
        status,
        customer:customers (
          name,
          country,
          whatsapp,
          email
        ),
        trip:trips (
          package_name
        )
      `)
      .order('follow_up_date', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Gagal mengambil follow up:', error)
      alert(`Gagal mengambil data Follow Up: ${error.message}`)
      setFollowUps([])
    } else {
      setFollowUps((data ?? []) as unknown as FollowUp[])
    }

    setLoading(false)
  }

  useEffect(() => {
    if (hasRunCompletedTripBackfill.current) return

    hasRunCompletedTripBackfill.current = true

    const initializeFollowUps = async () => {
      await backfillCompletedTripFollowUps()
      await loadFollowUps()
    }

    void initializeFollowUps()
  }, [])

  const filteredFollowUps = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return followUps.filter((item) => {
      const customerName = item.customer?.name ?? ''
      const subject = item.subject ?? ''
      const packageName = item.trip?.package_name ?? ''
      const whatsapp = item.customer?.whatsapp ?? ''
      const email = item.customer?.email ?? ''

      const matchesSearch =
        !keyword ||
        customerName.toLowerCase().includes(keyword) ||
        subject.toLowerCase().includes(keyword) ||
        packageName.toLowerCase().includes(keyword) ||
        whatsapp.toLowerCase().includes(keyword) ||
        email.toLowerCase().includes(keyword)

      const matchesStatus =
        statusFilter === 'Semua' || item.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [followUps, search, statusFilter])

  const pendingCount = followUps.filter(
    (item) => item.status === 'Pending',
  ).length

  const completedCount = followUps.filter(
    (item) => item.status === 'Completed',
  ).length

  const contactedCount = followUps.filter(
    (item) => item.status === 'Contacted',
  ).length

  const cancelledCount = followUps.filter(
    (item) => item.status === 'Cancelled',
  ).length

  const today = new Date().toISOString().slice(0, 10)

  const todayCount = followUps.filter(
    (item) =>
      item.follow_up_date === today && item.status === 'Pending',
  ).length

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('follow_ups')
      .update({ status })
      .eq('id', id)

    if (error) {
      alert(`Gagal mengubah status: ${error.message}`)
      return
    }

    setFollowUps((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
            }
          : item,
      ),
    )
  }

  return (
    <div className="followup-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Bell size={15} />
            CUSTOMER RELATIONSHIP
          </div>

          <h1>Follow Up</h1>

          <p>
            Kelola jadwal follow up customer dan pantau status tindak lanjut.
          </p>
        </div>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Total Follow Up</p>
              <h2>{followUps.length}</h2>
            </div>

            <div className="stat-icon">
              <Bell size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Semua</span>
            <small>data follow up</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Pending</p>
              <h2>{pendingCount}</h2>
            </div>

            <div className="stat-icon">
              <Clock3 size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Perlu ditindaklanjuti</span>
            <small>follow up aktif</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Contacted</p>
              <h2>{contactedCount}</h2>
            </div>

            <div className="stat-icon">
              <MessageCircle size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Sudah dihubungi</span>
            <small>menunggu penyelesaian</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Selesai</p>
              <h2>{completedCount}</h2>
            </div>

            <div className="stat-icon">
              <CheckCircle2 size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Completed</span>
            <small>follow up selesai</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Cancelled</p>
              <h2>{cancelledCount}</h2>
            </div>

            <div className="stat-icon">
              <XCircle size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Dibatalkan</span>
            <small>tidak perlu ditindaklanjuti</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Hari Ini</p>
              <h2>{todayCount}</h2>
            </div>

            <div className="stat-icon">
              <Bell size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Pending hari ini</span>
            <small>perlu perhatian</small>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Daftar Follow Up</h3>
            <p>
              Data diambil langsung dari database Supabase.
            </p>
          </div>

          <span className="count-pill">
            {filteredFollowUps.length}
          </span>
        </div>

        <div className="followup-toolbar">
          <div className="topbar__search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari customer atau keperluan..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Contacted">Contacted</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="empty-customers">
            <Clock3 size={24} />
            <strong>Memuat Follow Up...</strong>
            <span>Mengambil data dari Supabase.</span>
          </div>
        ) : filteredFollowUps.length === 0 ? (
          <div className="empty-customers">
            <Bell size={24} />
            <strong>Tidak ada Follow Up</strong>
            <span>
              Belum ada data yang sesuai dengan filter.
            </span>
          </div>
        ) : (
          <div className="followup-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Trip</th>
                  <th>Keperluan</th>
                  <th>Tanggal</th>
                  <th>Catatan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredFollowUps.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar">
                          {(item.customer?.name ?? '?').charAt(0)}
                        </div>

                        <div>
                          <strong>
                            {item.customer?.name ?? 'Customer'}
                          </strong>

                          <small>
                            {item.customer?.country ?? '-'}
                          </small>

                          <small>
                            WhatsApp: {item.customer?.whatsapp || '-'}
                          </small>

                          <small>
                            Email: {item.customer?.email || '-'}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong>{item.trip?.package_name ?? '-'}</strong>
                    </td>

                    <td>
                      <strong>{item.subject}</strong>
                    </td>

                    <td>
                      <strong>
                        {formatDate(item.follow_up_date)}
                      </strong>
                    </td>

                    <td>
                      <span className="followup-note">
                        {item.notes || '-'}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status status--${
                          item.status.toLowerCase()
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <div className="followup-actions">
                        {item.customer?.whatsapp && (
                          <a
                            className="followup-action"
                            href={`https://wa.me/${item.customer.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Hubungi via WhatsApp"
                            aria-label={`Hubungi ${item.customer.name} via WhatsApp`}
                          >
                            <MessageCircle size={16} />
                          </a>
                        )}

                        {item.customer?.email && (
                          <a
                            className="followup-action"
                            href={`mailto:${item.customer.email}`}
                            title="Kirim email"
                            aria-label={`Kirim email ke ${item.customer.name}`}
                          >
                            <Mail size={16} />
                          </a>
                        )}

                        {item.status === 'Pending' && (
                          <button
                            type="button"
                            className="followup-action"
                            onClick={() =>
                              updateStatus(item.id, 'Contacted')
                            }
                            title="Tandai sudah dihubungi"
                          >
                            <MessageCircle size={16} />
                          </button>
                        )}

                        {item.status === 'Contacted' && (
                          <button
                            type="button"
                            className="followup-action followup-action--complete"
                            onClick={() =>
                              updateStatus(item.id, 'Completed')
                            }
                            title="Tandai selesai"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}

                        {(item.status === 'Pending' ||
                          item.status === 'Contacted') && (
                          <button
                            type="button"
                            className="followup-action followup-action--cancel"
                            onClick={() =>
                              updateStatus(item.id, 'Cancelled')
                            }
                            title="Batalkan"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
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

export default FollowUp
