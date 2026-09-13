import { useEffect, useMemo, useState } from 'react'
import {
  Package,
  Search,
  CheckCircle2,
  XCircle,
  Globe2,
  MapPin,
  X,
  Users,
  ChevronRight,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

type PackageItem = {
  id: string
  name: string
  description: string | null
  price_per_pax: number
  is_active: boolean
  created_at: string
  category: 'local' | 'international'
  currency: 'IDR' | 'USD'
}

type PricingTier = {
  id: string
  package_id: string
  min_pax: number
  max_pax: number | null
  price_per_pax: number
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPrice(
  value: number,
  currency: 'IDR' | 'USD',
) {
  if (!Number.isFinite(value)) return '-'

  if (currency === 'IDR') {
    return formatRupiah(value)
  }

  return `$${value.toLocaleString('en-US')}`
}

function formatTierRange(tier: PricingTier) {
  if (tier.max_pax === null) {
    return `${tier.min_pax}+ Pax`
  }

  if (tier.min_pax === tier.max_pax) {
    return `${tier.min_pax} Pax`
  }

  return `${tier.min_pax}–${tier.max_pax} Pax`
}

function Packages() {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [pricing, setPricing] = useState<PricingTier[]>([])

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)

  const [category, setCategory] = useState<
    'local' | 'international'
  >('local')

  const [selectedPackage, setSelectedPackage] =
    useState<PackageItem | null>(null)

  const [detailLoading, setDetailLoading] =
    useState(false)

  const loadPackages = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          id,
          name,
          description,
          price_per_pax,
          is_active,
          created_at,
          category,
          currency
        `)
        .order('created_at', {
          ascending: true,
        })

      if (error) throw error

      setPackages(
        (data ?? []) as PackageItem[],
      )
    } catch (error) {
      console.error(
        'Gagal memuat Packages:',
        error,
      )

      alert(
        'Gagal memuat Packages dari database.',
      )

      setPackages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPackages()
  }, [])

  const openPackageDetail = async (
    item: PackageItem,
  ) => {
    setSelectedPackage(item)
    setDetailLoading(true)

    try {
      const { data, error } = await supabase
        .from('package_pricing')
        .select(`
          id,
          package_id,
          min_pax,
          max_pax,
          price_per_pax
        `)
        .eq('package_id', item.id)
        .order('min_pax', {
          ascending: true,
        })

      if (error) throw error

      setPricing(
        (data ?? []) as PricingTier[],
      )
    } catch (error) {
      console.error(
        'Gagal mengambil tier harga:',
        error,
      )

      setPricing([])
    } finally {
      setDetailLoading(false)
    }
  }

  const filteredPackages = useMemo(() => {
    const keyword =
      search.trim().toLowerCase()

    return packages.filter((item) => {
      const matchesCategory =
        item.category === category

      const matchesSearch =
        !keyword ||
        item.name
          .toLowerCase()
          .includes(keyword) ||
        (item.description ?? '')
          .toLowerCase()
          .includes(keyword)

      const matchesStatus =
        !activeOnly || item.is_active

      return (
        matchesCategory &&
        matchesSearch &&
        matchesStatus
      )
    })
  }, [
    packages,
    search,
    activeOnly,
    category,
  ])

  const activePackages = packages.filter(
    (item) => item.is_active,
  )

  const localCount =
    activePackages.filter(
      (item) => item.category === 'local',
    ).length

  const internationalCount =
    activePackages.filter(
      (item) =>
        item.category === 'international',
    ).length

  const inactiveCount =
    packages.length -
    activePackages.length

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
            Kelola paket perjalanan Rinjani
            Awesome berdasarkan market dan
            jumlah Pax.
          </p>
        </div>
      </div>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Local Trip</p>
              <h2>
                {loading
                  ? '...'
                  : localCount}
              </h2>
            </div>

            <div className="stat-icon">
              <MapPin size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Indonesia</span>
            <small>
              paket wisata lokal
            </small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>International Trip</p>
              <h2>
                {loading
                  ? '...'
                  : internationalCount}
              </h2>
            </div>

            <div className="stat-icon">
              <Globe2 size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>USD</span>
            <small>
              paket wisatawan internasional
            </small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Total Aktif</p>
              <h2>
                {loading
                  ? '...'
                  : activePackages.length}
              </h2>
            </div>

            <div className="stat-icon">
              <CheckCircle2 size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Active</span>
            <small>
              siap digunakan
            </small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <div>
              <p>Paket Arsip</p>
              <h2>
                {loading
                  ? '...'
                  : inactiveCount}
              </h2>
            </div>

            <div className="stat-icon">
              <XCircle size={21} />
            </div>
          </div>

          <div className="stat-card__bottom">
            <span>Inactive</span>
            <small>
              paket lama / arsip
            </small>
          </div>
        </article>
      </section>

      <section className="package-category-tabs">
        <button
          type="button"
          className={
            category === 'local'
              ? 'package-category-tab package-category-tab--active'
              : 'package-category-tab'
          }
          onClick={() =>
            setCategory('local')
          }
        >
          <div className="package-category-tab__icon">
            <MapPin size={21} />
          </div>

          <div>
            <strong>Local Trip</strong>
            <span>
              Paket wisatawan lokal · IDR
            </span>
          </div>

          <b>{localCount}</b>

          <ChevronRight size={17} />
        </button>

        <button
          type="button"
          className={
            category === 'international'
              ? 'package-category-tab package-category-tab--active'
              : 'package-category-tab'
          }
          onClick={() =>
            setCategory('international')
          }
        >
          <div className="package-category-tab__icon">
            <Globe2 size={21} />
          </div>

          <div>
            <strong>
              International Trip
            </strong>
            <span>
              International traveler · USD
            </span>
          </div>

          <b>{internationalCount}</b>

          <ChevronRight size={17} />
        </button>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h3>
              {category === 'local'
                ? '🇮🇩 Local Trip'
                : '🌍 International Trip'}
            </h3>

            <p>
              {category === 'local'
                ? 'Paket khusus wisatawan lokal dengan harga Rupiah.'
                : 'Paket khusus wisatawan internasional dengan harga USD.'}
            </p>
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
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder={
                category === 'local'
                  ? 'Cari paket local...'
                  : 'Cari paket international...'
              }
            />
          </div>

          <label className="package-filter">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(event) =>
                setActiveOnly(
                  event.target.checked,
                )
              }
            />

            <span>Aktif saja</span>
          </label>
        </div>

        {loading ? (
          <div className="empty-customers">
            <Package size={25} />

            <strong>
              Memuat Packages...
            </strong>

            <span>
              Mengambil data dari database.
            </span>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="empty-customers">
            <Package size={30} />

            <strong>
              Paket tidak ditemukan
            </strong>

            <span>
              Belum ada paket pada kategori
              ini.
            </span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nama Paket</th>
                  <th>Deskripsi</th>
                  <th>Harga Mulai</th>
                  <th>Currency</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredPackages.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="package-row-clickable"
                      onClick={() =>
                        openPackageDetail(
                          item,
                        )
                      }
                    >
                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar">
                            {item.category ===
                            'international' ? (
                              <Globe2
                                size={16}
                              />
                            ) : (
                              <Package
                                size={16}
                              />
                            )}
                          </div>

                          <div>
                            <strong>
                              {item.name}
                            </strong>

                            <small>
                              Klik untuk melihat
                              tier harga
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="package-description">
                          {item.description ||
                            '-'}
                        </span>
                      </td>

                      <td>
                        <strong className="spending-value">
                          {formatPrice(
                            Number(
                              item.price_per_pax,
                            ),
                            item.currency,
                          )}
                          <small className="package-price-unit">
                            / pax
                          </small>
                        </strong>
                      </td>

                      <td>
                        <span className="package-currency">
                          {item.currency}
                        </span>
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
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedPackage && (
        <div
          className="package-modal-backdrop"
          onMouseDown={() => {
            setSelectedPackage(null)
            setPricing([])
          }}
        >
          <div
            className="package-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="package-modal__header">
              <div>
                <div className="package-modal__eyebrow">
                  {selectedPackage.category ===
                  'local'
                    ? '🇮🇩 LOCAL TRIP'
                    : '🌍 INTERNATIONAL TRIP'}
                </div>

                <h2>
                  {selectedPackage.name}
                </h2>

                <p>
                  {selectedPackage.description}
                </p>
              </div>

              <button
                type="button"
                className="package-modal__close"
                onClick={() => {
                  setSelectedPackage(
                    null,
                  )
                  setPricing([])
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="package-modal__body">
              <div className="package-price-summary">
                <div>
                  <span>
                    Harga mulai
                  </span>

                  <strong>
                    {formatPrice(
                      Number(
                        selectedPackage.price_per_pax,
                      ),
                      selectedPackage.currency,
                    )}
                  </strong>

                  <small>
                    per Pax
                  </small>
                </div>

                <div>
                  <span>Currency</span>

                  <strong>
                    {selectedPackage.currency}
                  </strong>

                  <small>
                    {selectedPackage.category ===
                    'local'
                      ? 'Wisatawan lokal'
                      : 'International traveler'}
                  </small>
                </div>
              </div>

              <div className="package-tier-heading">
                <div>
                  <Users size={17} />

                  <strong>
                    Harga berdasarkan jumlah Pax
                  </strong>
                </div>

                <span>
                  {pricing.length} tier
                </span>
              </div>

              {detailLoading ? (
                <div className="package-detail-loading">
                  <Package size={25} />

                  <span>
                    Memuat tier harga...
                  </span>
                </div>
              ) : pricing.length === 0 ? (
                <div className="package-detail-loading">
                  <XCircle size={25} />

                  <span>
                    Belum ada tier harga.
                  </span>
                </div>
              ) : (
                <div className="package-tier-list">
                  {pricing.map(
                    (tier) => (
                      <div
                        className="package-tier"
                        key={tier.id}
                      >
                        <div className="package-tier__pax">
                          <Users size={15} />

                          <strong>
                            {formatTierRange(
                              tier,
                            )}
                          </strong>
                        </div>

                        <strong className="package-tier__price">
                          {formatPrice(
                            Number(
                              tier.price_per_pax,
                            ),
                            selectedPackage.currency,
                          )}
                          <small>
                            / pax
                          </small>
                        </strong>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            <div className="package-modal__footer">
              <span>
                Harga akan digunakan berdasarkan
                jumlah Pax saat booking.
              </span>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSelectedPackage(
                    null,
                  )
                  setPricing([])
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Packages
