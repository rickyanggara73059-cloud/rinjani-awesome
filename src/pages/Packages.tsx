import { useEffect, useMemo, useState } from 'react'
import {
  Package,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type PackageItem = {
  id: string
  name: string
  description: string | null
  price_per_pax: number
  is_active: boolean
  created_at: string
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPrice(value: number) {
  if (!Number.isFinite(value)) return '-'

  return value >= 1000
    ? formatRupiah(value)
    : `$${value.toLocaleString('en-US')}/pax`
}

function Packages() {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)

  const loadPackages = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('packages')
      .select(`
        id,
        name,
        description,
        price_per_pax,
        is_active,
        created_at
      `)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Gagal memuat Packages:', error)
      alert(`Gagal memuat Packages: ${error.message}`)
      setPackages([])
    } else {
      setPackages((data ?? []) as PackageItem[])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadPackages()
  }, [])

  const filteredPackages = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return packages.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        (item.description ?? '').toLowerCase().includes(keyword)

      const matchesStatus =
        !activeOnly || item.is_active

      return matchesSearch && matchesStatus
    })
  }, [packages, search, activeOnly])

  const activeCount = packages.filter(
    (item) => item.is_active,
  ).length

  const inactiveCount = packages.length - activeCount

  return (
    <div className="packages-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Package size={15} />
            MASTER DATA
          </div>

          <h1>Packages</h1>

          <p>
            Kelola paket perjalanan dan harga per Pax Rinjani Awesome.
          </p>
        </div>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Total Paket</p>
              <h2>{loading ? '...' : packages.length}</h2>
            </div>

            <div className="stat-icon">
              <Package size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Database</span>
            <small>semua paket</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Paket Aktif</p>
              <h2>{loading ? '...' : activeCount}</h2>
            </div>

            <div className="stat-icon">
              <CheckCircle2 size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Active</span>
            <small>siap digunakan</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Paket Nonaktif</p>
              <h2>{loading ? '...' : inactiveCount}</h2>
            </div>

            <div className="stat-icon">
              <XCircle size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Inactive</span>
            <small>tidak digunakan</small>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>Daftar Packages</h3>
            <p>Data langsung dari Supabase.</p>
          </div>

          <span className="count-pill">
            {filteredPackages.length}
          </span>
        </div>

        <div className="followup-toolbar">
          <div className="topbar__search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama paket atau deskripsi..."
            />
          </div>

          <label className="package-filter">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(event) =>
                setActiveOnly(event.target.checked)
              }
            />
            <span>Aktif saja</span>
          </label>
        </div>

        {loading ? (
          <div className="empty-customers">
            <Package size={25} />
            <strong>Memuat Packages...</strong>
            <span>Mengambil data dari database.</span>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="empty-customers">
            <Package size={30} />
            <strong>Paket tidak ditemukan</strong>
            <span>Belum ada paket yang cocok.</span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nama Paket</th>
                  <th>Deskripsi</th>
                  <th>Harga / Pax</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredPackages.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="customer-cell">
                        <div className="customer-avatar">
                          <Package size={16} />
                        </div>

                        <div>
                          <strong>{item.name}</strong>
                          <small>
                            ID: {item.id.slice(0, 8)}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="package-description">
                        {item.description || '-'}
                      </span>
                    </td>

                    <td>
                      <strong className="spending-value">
                        {formatPrice(Number(item.price_per_pax))}
                      </strong>
                    </td>

                    <td>
                      {item.is_active ? (
                        <span className="status status--ongoing">
                          Aktif
                        </span>
                      ) : (
                        <span className="status">
                          Nonaktif
                        </span>
                      )}
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

export default Packages
