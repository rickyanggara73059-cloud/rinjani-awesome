import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  CheckCircle2,
  Clock3,
  Search,
  XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type FollowUp = {
  id: number
  customer_id: number
  trip_id: number | null
  follow_up_date: string
  subject: string
  notes: string | null
  status: string
  customer?: {
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

function FollowUp() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Semua')

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
          whatsapp
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
    loadFollowUps()
  }, [])

  const filteredFollowUps = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return followUps.filter((item) => {
      const customerName = item.customer?.name ?? ''
      const subject = item.subject ?? ''

      const matchesSearch =
        !keyword ||
        customerName.toLowerCase().includes(keyword) ||
        subject.toLowerCase().includes(keyword)

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

  const today = new Date().toISOString().slice(0, 10)

  const todayCount = followUps.filter(
    (item) =>
      item.follow_up_date === today && item.status === 'Pending',
  ).length

  const updateStatus = async (id: number, status: string) => {
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
                        </div>
                      </div>
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
                        {item.status === 'Pending' && (
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

                        {item.status !== 'Cancelled' &&
                          item.status !== 'Pending' && (
                            <button
                              type="button"
                              className="followup-action"
                              onClick={() =>
                                updateStatus(item.id, 'Pending')
                              }
                              title="Kembalikan ke Pending"
                            >
                              <Clock3 size={16} />
                            </button>
                          )}

                        {item.status !== 'Cancelled' && (
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
