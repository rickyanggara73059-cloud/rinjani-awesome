import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Search,
  Plus,
  X,
  UserPlus,
  Users,
  Repeat2,
  Wallet,
  MapPin,
  Phone,
  Mail,
  Globe2,
  CalendarDays,
  Eye,
  Mountain,
  CreditCard,
  FileText,
  UserRound,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
type TripStatus = 'Booked' | 'Ongoing' | 'Completed' | 'Cancelled'
type PaymentStatus = 'Belum Bayar' | 'DP' | 'Lunas' | 'Refund'

type PackageOption = {
  id: string
  name: string
  description: string | null
  price_per_pax: number
  is_active: boolean
  category: 'local' | 'international'
  currency: 'IDR' | 'USD'
}

type PackagePricing = {
  id: string
  package_id: string
  min_pax: number
  max_pax: number | null
  price_per_pax: number
}

type Customer = {
  id: number
  tripId: string
  name: string
  country: string
  city: string
  phone: string
  email: string
  nationality: string
  totalTrips: number
  lastTrip: string
  totalSpending: number
  lastPackage: string
  type: 'New' | 'Repeat'
  bookingDate: string
  tripStart: string
  tripEnd: string
  pax: number
  pricePerPax: number
  totalPrice: number
  dpAmount: number
  remainingPayment: number
  paymentStatus: PaymentStatus
  paymentMethod: string
  tripStatus: TripStatus
  guide: string
  notes: string
  paymentNotes: string
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  if (!value || value === '-') return '-'

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function Customers({ initialCustomerId }: { initialCustomerId?: string }) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
  const [savingEditCustomer, setSavingEditCustomer] = useState(false)

  const [editCustomerForm, setEditCustomerForm] = useState({
    name: '',
    country: '',
    city: '',
    nationality: '',
    phone: '',
    email: '',
  })

  const updateEditCustomerForm = (key: string, value: string) => {
    setEditCustomerForm((current) => ({
      ...current,
      [key]: value,
    }))
  }
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showTripModal, setShowTripModal] = useState(false)
  const [savingTrip, setSavingTrip] = useState(false)
  const [packages, setPackages] = useState<PackageOption[]>([])
  const [packagePricing, setPackagePricing] = useState<PackagePricing[]>([])

  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [savingFollowUp, setSavingFollowUp] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)
  const [paymentTrips, setPaymentTrips] = useState<any[]>([])
  const [selectedPaymentTripId, setSelectedPaymentTripId] = useState('')

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Transfer',
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  const updatePaymentForm = (key: string, value: string) => {
    setPaymentForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: '',
      paymentMethod: 'Transfer',
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: '',
    })
  }

  const [followUpForm, setFollowUpForm] = useState({
    followUpDate: new Date().toISOString().slice(0, 10),
    subject: '',
    notes: '',
    status: 'Pending',
  })

  const updateFollowUpForm = (key: string, value: string) => {
    setFollowUpForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const resetFollowUpForm = () => {
    setFollowUpForm({
      followUpDate: new Date().toISOString().slice(0, 10),
      subject: '',
      notes: '',
      status: 'Pending',
    })
  }

  const handleUpdateCustomer = async (event: FormEvent) => {
    event.preventDefault()

    if (!selectedCustomer) return

      if (!selectedPaymentTripId) {
    alert('Pilih trip yang akan dibayar.')
    return
  }

    if (!editCustomerForm.name.trim()) {
      alert('Nama customer wajib diisi.')
      return
    }

    if (!editCustomerForm.country.trim()) {
      alert('Negara customer wajib diisi.')
      return
    }

    setSavingEditCustomer(true)

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: editCustomerForm.name.trim(),
          country: editCustomerForm.country.trim(),
          city: editCustomerForm.city.trim() || null,
          nationality:
            editCustomerForm.nationality.trim() ||
            editCustomerForm.country.trim(),
          whatsapp: editCustomerForm.phone.trim(),
          email: editCustomerForm.email.trim() || null,
        })
        .eq('id', selectedCustomer.id)

      if (error) throw error

      setSelectedCustomer((current) =>
        current
          ? {
              ...current,
              name: editCustomerForm.name.trim(),
              country: editCustomerForm.country.trim(),
              city: editCustomerForm.city.trim() || '-',
              nationality:
                editCustomerForm.nationality.trim() ||
                editCustomerForm.country.trim(),
              phone: editCustomerForm.phone.trim(),
              email: editCustomerForm.email.trim() || '-',
            }
          : current,
      )

      await loadCustomers()

      setShowEditCustomerModal(false)

      alert('Data customer berhasil diperbarui.')
    } catch (error) {
      const supabaseError = error as {
        message?: string
        details?: string
        hint?: string
        code?: string
      }

      alert(
        [
          'Gagal memperbarui customer.',
          'Code: ' + (supabaseError.code ?? '-'),
          'Message: ' + (supabaseError.message ?? 'Unknown error'),
          'Details: ' + (supabaseError.details ?? '-'),
          'Hint: ' + (supabaseError.hint ?? '-'),
        ].join('\n'),
      )
    } finally {
      setSavingEditCustomer(false)
    }
  }
  const handleAddPayment = async (event: FormEvent) => {
    event.preventDefault()

    if (!selectedCustomer) return

    const paymentAmount = Number(paymentForm.amount || 0)

    if (!paymentAmount || paymentAmount <= 0) {
      alert('Nominal pembayaran harus lebih dari 0.')
      return
    }

    const selectedTripForPayment = paymentTrips.find(
  (trip: any) => trip.id === selectedPaymentTripId,
)

const selectedTripPaymentTotal = Number(
  selectedTripForPayment?.total_price ?? 0,
)

const selectedTripPaymentPaid = (
  selectedTripForPayment?.payments ?? []
).reduce(
  (sum: number, payment: any) =>
    sum + Number(payment.amount ?? 0),
  0,
)

const selectedTripPaymentRemaining = Math.max(
  selectedTripPaymentTotal - selectedTripPaymentPaid,
  0,
)

if (paymentAmount > selectedTripPaymentRemaining) {
  alert(
    `Nominal pembayaran tidak boleh melebihi sisa pembayaran ${formatRupiah(
      selectedTripPaymentRemaining,
    )}.`,
  )
  return
}

    setSavingPayment(true)

    try {
      const { data: latestTrip, error: tripError } = await supabase
  .from('trips')
  .select('id, total_price')
  .eq('id', selectedPaymentTripId)
  .maybeSingle()

      if (tripError) throw tripError

      if (!latestTrip) {
        alert('Trip customer tidak ditemukan.')
        return
      }

      const { data: existingPayments, error: paymentsLookupError } =
        await supabase
          .from('payments')
          .select('amount')
          .eq('trip_id', latestTrip.id)

      if (paymentsLookupError) throw paymentsLookupError

      const totalAlreadyPaid = (existingPayments ?? []).reduce(
        (sum, payment) => sum + Number(payment.amount ?? 0),
        0,
      )

      const remainingBeforePayment = Math.max(
        Number(latestTrip.total_price ?? 0) - totalAlreadyPaid,
        0,
      )

      if (paymentAmount > remainingBeforePayment) {
        alert(
          `Nominal pembayaran tidak boleh melebihi sisa pembayaran ${formatRupiah(
            remainingBeforePayment,
          )}.`,
        )
        return
      }

      const newRemaining = Math.max(
        remainingBeforePayment - paymentAmount,
        0,
      )

      const nextStatus: PaymentStatus =
        newRemaining <= 0 ? 'Lunas' : 'DP'

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          trip_id: latestTrip.id,
          amount: paymentAmount,
          payment_status: nextStatus,
          payment_method: paymentForm.paymentMethod,
          payment_date: paymentForm.paymentDate || null,
          notes: paymentForm.notes.trim() || null,
        })

      if (paymentError) throw paymentError

      resetPaymentForm()
      setShowPaymentModal(false)

      await loadCustomers()

      const { data: refreshedCustomer, error: refreshError } =
        await supabase
          .from('customers')
          .select(`
            id,
            name,
            country,
            city,
            nationality,
            whatsapp,
            email,
            created_at,
            trips (
              id,
              package_id,
              package_name,
              booking_date,
              start_date,
              end_date,
              pax,
              price_per_pax,
              total_price,
              guide_name,
              status,
              notes,
              payments (
                id,
                amount,
                payment_status,
                payment_method,
                payment_date,
                notes
              )
            )
          `)
          .eq('id', selectedCustomer.id)
          .single()

      if (!refreshError && refreshedCustomer) {
        const trips = refreshedCustomer.trips ?? []
        const latest = [...trips].sort((a, b) =>
          String(b.booking_date ?? '').localeCompare(
            String(a.booking_date ?? ''),
          ),
        )[0]

        const payments = latest?.payments ?? []

        const totalPaid = payments.reduce(
          (sum, payment) => sum + Number(payment.amount ?? 0),
          0,
        )

        setSelectedCustomer((current) =>
          current
            ? {
                ...current,
                totalSpending: trips.reduce(
                  (sum, trip) =>
                    sum + Number(trip.total_price ?? 0),
                  0,
                ),
                totalTrips: trips.length,
                lastPackage: latest?.package_name ?? current.lastPackage,
                tripStart: latest?.start_date ?? current.tripStart,
                tripEnd: latest?.end_date ?? current.tripEnd,
                pax: Number(latest?.pax ?? current.pax),
                totalPrice: Number(
                  latest?.total_price ?? current.totalPrice,
                ),
                dpAmount: totalPaid,
                remainingPayment: Math.max(
                  Number(latest?.total_price ?? 0) - totalPaid,
                  0,
                ),
                paymentStatus:
                  payments[payments.length - 1]?.payment_status ??
                  current.paymentStatus,
                paymentMethod:
                  payments[payments.length - 1]?.payment_method ??
                  current.paymentMethod,
                paymentNotes:
                  payments[payments.length - 1]?.notes ??
                  current.paymentNotes,
              }
            : current,
        )
      }

      alert(
        newRemaining <= 0
          ? 'Pembayaran berhasil disimpan. Trip sudah Lunas.'
          : 'Pembayaran berhasil disimpan.',
      )
    } catch (error) {
      const supabaseError = error as {
        message?: string
        details?: string
        hint?: string
        code?: string
      }

      alert(
        [
          'Gagal menyimpan pembayaran.',
          'Code: ' + (supabaseError.code ?? '-'),
          'Message: ' + (supabaseError.message ?? 'Unknown error'),
          'Details: ' + (supabaseError.details ?? '-'),
          'Hint: ' + (supabaseError.hint ?? '-'),
        ].join('\n'),
      )
    } finally {
      setSavingPayment(false)
    }
  }
  const handleSaveFollowUp = async (event: FormEvent) => {
    event.preventDefault()

    if (!selectedCustomer) return

    if (!followUpForm.followUpDate) {
      alert('Tanggal follow up wajib diisi.')
      return
    }

    if (!followUpForm.subject.trim()) {
      alert('Judul / keperluan follow up wajib diisi.')
      return
    }

    setSavingFollowUp(true)

    try {
      const { data: latestTrip, error: tripLookupError } = await supabase
        .from('trips')
        .select('id')
        .eq('customer_id', selectedCustomer.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (tripLookupError) throw tripLookupError

      const { error } = await supabase
        .from('follow_ups')
        .insert({
          customer_id: selectedCustomer.id,
          trip_id: latestTrip?.id ?? null,
          follow_up_date: followUpForm.followUpDate,
          subject: followUpForm.subject.trim(),
          notes: followUpForm.notes.trim() || null,
          status: followUpForm.status,
        })

      if (error) throw error

      resetFollowUpForm()
      setShowFollowUpModal(false)

      alert('Follow up berhasil disimpan.')
    } catch (error) {
      const supabaseError = error as {
        message?: string
        details?: string
        hint?: string
        code?: string
      }

      alert(
        [
          'Gagal menyimpan follow up.',
          '',
          'Code: ' + (supabaseError.code ?? '-'),
          'Message: ' + (supabaseError.message ?? 'Unknown error'),
          'Details: ' + (supabaseError.details ?? '-'),
          'Hint: ' + (supabaseError.hint ?? '-'),
        ].join('\n'),
      )
    } finally {
      setSavingFollowUp(false)
    }
  }

  useEffect(() => {
    const loadPackages = async () => {
      const [{ data: packageData, error: packageError }, { data: pricingData, error: pricingError }] = await Promise.all([
        supabase
          .from('packages')
          .select('id, name, description, price_per_pax, is_active, category, currency')
          .eq('is_active', true)
          .order('name', { ascending: true }),
        supabase
          .from('package_pricing')
          .select('id, package_id, min_pax, max_pax, price_per_pax')
          .order('min_pax', { ascending: true }),
      ])

      if (packageError) {
        console.error('Gagal memuat packages:', packageError)
        return
      }

      if (pricingError) {
        console.error('Gagal memuat pricing packages:', pricingError)
        return
      }

      setPackages((packageData ?? []) as PackageOption[])
      setPackagePricing((pricingData ?? []) as PackagePricing[])
    }

    loadPackages()
  }, [])

  const formatPrice = (
    value: number,
    currency: 'IDR' | 'USD',
  ) => {
    if (currency === 'USD') {
      return `$${value.toLocaleString('en-US')}`
    }

    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getPackageCurrency = (packageName: string) => {
    const selectedPackage = packages.find(
      (item) => item.name === packageName,
    )

    return selectedPackage?.currency ?? 'IDR'
  }
const getPackagePrice = (packageName: string, pax: number) => {
    const selectedPackage = packages.find(
      (item) => item.name === packageName,
    )

    if (!selectedPackage || pax < 1) return 0

    const tier = packagePricing.find(
      (item) =>
        item.package_id === selectedPackage.id &&
        pax >= item.min_pax &&
        (item.max_pax === null || pax <= item.max_pax),
    )

    return Number(tier?.price_per_pax ?? selectedPackage.price_per_pax ?? 0)
  }

  const [tripForm, setTripForm] = useState({
    packageName: 'VIP Package',
    customPackage: '',
    bookingDate: new Date().toISOString().slice(0, 10),
    tripStart: '',
    tripEnd: '',
    pax: '1',
    pricePerPax: '',
    guide: '',
    tripStatus: 'Booked' as TripStatus,
    paymentStatus: 'DP' as PaymentStatus,
    dpAmount: '',
    paymentMethod: 'Transfer',
    notes: '',
    paymentNotes: '',
  })

  const updateTripForm = (key: string, value: string) => {
    setTripForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const resetTripForm = () => {
    setTripForm({
      packageName: 'VIP Package',
      customPackage: '',
      bookingDate: new Date().toISOString().slice(0, 10),
      tripStart: '',
      tripEnd: '',
      pax: '1',
      pricePerPax: '',
      guide: '',
      tripStatus: 'Booked',
      paymentStatus: 'DP',
      dpAmount: '',
      paymentMethod: 'Transfer',
      notes: '',
      paymentNotes: '',
    })
  }

  const [form, setForm] = useState({
    name: '',
    country: '',
    city: '',
    phone: '',
    email: '',
    nationality: '',
    packageName: 'VIP Package',
    customPackage: '',
    bookingDate: '',
    tripStart: '',
    tripEnd: '',
    pax: '1',
    pricePerPax: '',
    dpAmount: '0',
    paymentStatus: 'Belum Bayar' as PaymentStatus,
    paymentMethod: 'Transfer',
    tripStatus: 'Booked' as TripStatus,
    guide: '',
    notes: '',
    paymentNotes: '',
  })

  const paxNumber = Number.parseInt(form.pax, 10) || 0
  const pricePerPaxNumber =
    Number.parseInt(form.pricePerPax, 10) || 0

  const totalPrice = paxNumber * pricePerPaxNumber

  const dpAmount = Math.min(
    Number(form.dpAmount || 0),
    totalPrice || Number(form.dpAmount || 0),
  )

  const remainingPayment = Math.max(totalPrice - dpAmount, 0)

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    if (!initialCustomerId || loadingCustomers || customers.length === 0) {
      return
    }

    const customerToOpen = customers.find(
      (customer) => String(customer.id) === String(initialCustomerId),
    )

    if (customerToOpen) {
      setSelectedCustomer(customerToOpen)
    }
  }, [customers, initialCustomerId, loadingCustomers])

  const loadCustomers = async () => {
    setLoadingCustomers(true)

    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        trips (
          id,
          package_name,
          booking_date,
          start_date,
          end_date,
          pax,
          price_per_pax,
          total_price,
          guide_name,
          status,
          notes,
          payments (
            id,
            amount,
            payment_status,
            payment_method,
            payment_date,
            notes
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Gagal mengambil customer:', error)
      setLoadingCustomers(false)
      return
    }

    const mappedCustomers: Customer[] = (data ?? []).flatMap(
      (customer: any) => {
        const trips = [...(customer.trips ?? [])].sort(
          (a, b) =>
            new Date(b.start_date).getTime() -
            new Date(a.start_date).getTime(),
        )

        return trips.map((trip: any, tripIndex: number) => {
          const payments = trip.payments ?? []

          const totalPaid = payments.reduce(
            (sum: number, payment: any) =>
              sum + Number(payment.amount ?? 0),
            0,
          )

          const totalPrice = Number(trip.total_price ?? 0)

          const remainingPayment = Math.max(
            totalPrice - totalPaid,
            0,
          )

          const latestPayment =
            payments[payments.length - 1]

          const paymentStatus: PaymentStatus =
            remainingPayment === 0 && totalPrice > 0
              ? 'Lunas'
              : totalPaid > 0
                ? 'DP'
                : 'Belum Bayar'

          return {
  id: customer.id,
  tripId: trip.id,
  name: customer.name,
            country: customer.country,
            city: customer.city ?? '-',
            phone: customer.whatsapp,
            email: customer.email ?? '-',
            nationality: customer.nationality ?? '-',
            totalTrips: trips.length,
            lastTrip: trip.start_date
              ? formatDate(trip.start_date)
              : '-',
            totalSpending: totalPrice,
            lastPackage: trip.package_name ?? '-',
            type: tripIndex === trips.length - 1 ? 'New' : 'Repeat',
            bookingDate: trip.booking_date ?? '',
            tripStart: trip.start_date ?? '',
            tripEnd: trip.end_date ?? '',
            pax: Number(trip.pax ?? 0),
            pricePerPax: Number(
              trip.price_per_pax ?? 0,
            ),
            totalPrice,
            dpAmount: totalPaid,
            remainingPayment,
            paymentStatus,
            paymentMethod:
              latestPayment?.payment_method ?? '-',
            tripStatus:
              trip.status ?? 'Booked',
            guide:
              trip.guide_name ?? '-',
            notes:
              trip.notes ?? '',
            paymentNotes:
              latestPayment?.notes ?? '',
          }
        })
      },
    )

    setCustomers(mappedCustomers)
    setLoadingCustomers(false)
  }

  const filteredCustomers = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    if (!keyword) return customers

    return customers.filter((customer) =>
      [
        customer.name,
        customer.country,
        customer.city,
        customer.phone,
        customer.email,
        customer.nationality,
        customer.lastPackage,
        customer.paymentStatus,
        customer.tripStatus,
      ]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [customers, search])

  const repeatCustomers = customers.filter(
    (customer) => customer.type === 'Repeat',
  ).length

  const totalSpending = customers.reduce(
    (total, customer) => total + customer.totalSpending,
    0,
  )

  const updateForm = (key: string, value: string) => {
    setForm((current) => {
      const next = {
        ...current,
        [key]: value,
      }

      if (key === 'packageName' || key === 'pax') {
        const pax = Number.parseInt(next.pax, 10) || 0
        const price = getPackagePrice(next.packageName, pax)

        next.pricePerPax = price > 0 ? String(price) : ''
      }

      return next
    })
  }

  const resetForm = () => {
    setForm({
      name: '',
      country: '',
      city: '',
      phone: '',
      email: '',
      nationality: '',
      packageName: 'VIP Package',
      customPackage: '',
      bookingDate: '',
      tripStart: '',
      tripEnd: '',
      pax: '1',
      pricePerPax: '',
      dpAmount: '0',
      paymentStatus: 'Belum Bayar',
      paymentMethod: 'Transfer',
      tripStatus: 'Booked',
      guide: '',
      notes: '',
      paymentNotes: '',
    })
  }

  const handleUpdateTripStatus = async (status: TripStatus) => {
    if (!selectedCustomer) return

    try {
      const { data: latestTrip, error: lookupError } = await supabase
  .from('trips')
  .select('id')
  .eq('id', selectedCustomer.tripId)
  .maybeSingle()

      if (lookupError) throw lookupError

      if (!latestTrip) {
        alert('Trip customer tidak ditemukan.')
        return
      }

      const { error: updateError } = await supabase
        .from('trips')
        .update({
          status,
        })
        .eq('id', latestTrip.id)

      if (updateError) throw updateError

      setSelectedCustomer((current) =>
        current
          ? {
              ...current,
              tripStatus: status,
            }
          : current,
      )

      await loadCustomers()

      alert(`Status trip berhasil diubah menjadi ${status}.`)
    } catch (error) {
      const supabaseError = error as {
        message?: string
        details?: string
        hint?: string
        code?: string
      }

      alert(
        [
          'Gagal mengubah status trip.',
          'Code: ' + (supabaseError.code ?? '-'),
          'Message: ' + (supabaseError.message ?? 'Unknown error'),
          'Details: ' + (supabaseError.details ?? '-'),
          'Hint: ' + (supabaseError.hint ?? '-'),
        ].join('\n'),
      )
    }
  }
  const handleAddNextTrip = async (event: FormEvent) => {
    event.preventDefault()

    if (!selectedCustomer) return

    const paxNumber = Number(tripForm.pax)
    const pricePerPaxNumber = Number(tripForm.pricePerPax)
    const paymentAmount = Number(tripForm.dpAmount || 0)

    if (!tripForm.tripStart || !tripForm.tripEnd) {
      alert('Tanggal trip wajib diisi.')
      return
    }

    if (!paxNumber || paxNumber < 1) {
      alert('Jumlah Pax harus minimal 1.')
      return
    }

    if (!pricePerPaxNumber || pricePerPaxNumber < 0) {
      alert('Harga per Pax wajib diisi.')
      return
    }

    const packageName =
      tripForm.packageName === 'Custom Package'
        ? tripForm.customPackage.trim()
        : tripForm.packageName

    if (!packageName) {
      alert('Nama paket wajib diisi.')
      return
    }

    const totalPrice = paxNumber * pricePerPaxNumber

    if (paymentAmount > totalPrice) {
      alert('Nominal pembayaran tidak boleh melebihi total harga trip.')
      return
    }

    setSavingTrip(true)

    try {
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          customer_id: selectedCustomer.id,
          package_id: null,
          package_name: packageName,
          booking_date: tripForm.bookingDate || null,
          start_date: tripForm.tripStart,
          end_date: tripForm.tripEnd,
          pax: paxNumber,
          price_per_pax: pricePerPaxNumber,

          guide_name: tripForm.guide.trim() || null,
          status: tripForm.tripStatus,
          notes: tripForm.notes.trim() || null,
        })
        .select()
        .single()

      if (tripError) throw tripError

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          trip_id: trip.id,
          amount: paymentAmount,
          payment_status: tripForm.paymentStatus,
          payment_method: tripForm.paymentMethod,
          payment_date:
            paymentAmount > 0 ? tripForm.bookingDate || null : null,
          notes: tripForm.paymentNotes.trim() || null,
        })

      if (paymentError) {
        await supabase.from('trips').delete().eq('id', trip.id)
        throw paymentError
      }

      resetTripForm()
      setShowTripModal(false)

      await loadCustomers()

      alert('Trip berikutnya berhasil disimpan.')
    } catch (error) {
      console.error('Gagal menambahkan trip:', error)

      const supabaseError = error as {
        message?: string
        details?: string
        hint?: string
        code?: string
      }

      alert(
        [
          'Gagal menyimpan trip berikutnya.',
          '',
          'Code: ' + (supabaseError.code ?? '-'),
          'Message: ' + (supabaseError.message ?? 'Unknown error'),
          'Details: ' + (supabaseError.details ?? '-'),
          'Hint: ' + (supabaseError.hint ?? '-'),
        ].join('\n'),
      )
    } finally {
      setSavingTrip(false)
    }
  }
  const handleAddCustomer = async (event: FormEvent) => {
    event.preventDefault()

    if (
      !form.name.trim() ||
      !form.country.trim() ||
      !form.phone.trim() ||
      !form.tripStart ||
      !form.tripEnd ||
      totalPrice <= 0
    ) {
      return
    }

    const packageName =
      form.packageName === 'Lainnya'
        ? form.customPackage.trim() || 'Paket Custom'
        : form.packageName

    setSavingCustomer(true)

    try {
      const { data: packageData } = await supabase
        .from('packages')
        .select('id, name')
        .eq('name', packageName)
        .maybeSingle()

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: form.name.trim(),
          country: form.country.trim(),
          city: form.city.trim() || null,
          nationality: form.nationality.trim() || form.country.trim(),
          whatsapp: form.phone.trim(),
          email: form.email.trim() || null,
          notes: form.notes.trim() || null,
        })
        .select()
        .single()

      if (customerError || !customer) {
        throw customerError ?? new Error('Customer gagal dibuat.')
      }

      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .insert({
          customer_id: customer.id,
          package_id: packageData?.id ?? null,
          package_name: packageName,
          booking_date: form.bookingDate || null,
          start_date: form.tripStart,
          end_date: form.tripEnd,
          pax: paxNumber,
          price_per_pax: pricePerPaxNumber,
          guide_name: form.guide.trim() || null,
          status: form.tripStatus,
          notes: form.notes.trim() || null,
        })
        .select()
        .single()

      if (tripError || !trip) {
        await supabase.from('customers').delete().eq('id', customer.id)
        throw tripError ?? new Error('Trip gagal dibuat.')
      }

      const paymentAmount =
        form.paymentStatus === 'Lunas'
          ? totalPrice
          : form.paymentStatus === 'DP'
            ? dpAmount
            : 0

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          trip_id: trip.id,
          amount: paymentAmount,
          payment_status: form.paymentStatus,
          payment_method: form.paymentMethod,
          payment_date: paymentAmount > 0 ? form.bookingDate || null : null,
          notes: form.paymentNotes.trim() || null,
        })

      if (paymentError) {
        await supabase.from('trips').delete().eq('id', trip.id)
        await supabase.from('customers').delete().eq('id', customer.id)
        throw paymentError
      }

      resetForm()
      setShowModal(false)

      await loadCustomers()
    } catch (error) {
      console.error('Gagal menyimpan customer:', error)

      window.alert(
        'Customer gagal disimpan. Silakan cek koneksi Supabase dan console browser.',
      )
    } finally {
      setSavingCustomer(false)
    }
  }
  return (
    <>
      <div className="customers-page">
        <div className="customers-heading">
          <div>
            <div className="eyebrow">
              <Users size={15} />
              CUSTOMER DATABASE
            </div>
            <h1>Customers</h1>
            <p>
              Kelola customer, trip, jadwal, dan pembayaran dalam satu data.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} />
            Tambah Customer
          </button>
        </div>

        <section className="customer-stats">
          <div className="customer-stat-card">
            <div className="customer-stat-icon customer-stat-icon--green">
              <Users size={21} />
            </div>
            <div>
              <span>Total Customer</span>
              <strong>{customers.length.toLocaleString('id-ID')}</strong>
              <small>database customer</small>
            </div>
          </div>

          <div className="customer-stat-card">
            <div className="customer-stat-icon customer-stat-icon--blue">
              <UserPlus size={21} />
            </div>
            <div>
              <span>Customer Baru</span>
              <strong>
                {customers.filter((customer) => customer.type === 'New').length}
              </strong>
              <small>belum repeat booking</small>
            </div>
          </div>

          <div className="customer-stat-card">
            <div className="customer-stat-icon customer-stat-icon--purple">
              <Repeat2 size={21} />
            </div>
            <div>
              <span>Repeat Customer</span>
              <strong>{repeatCustomers}</strong>
              <small>pernah booking kembali</small>
            </div>
          </div>

          <div className="customer-stat-card">
            <div className="customer-stat-icon customer-stat-icon--gold">
              <Wallet size={21} />
            </div>
            <div>
              <span>Total Spending</span>
              <strong>{formatRupiah(totalSpending)}</strong>
              <small>dari customer database</small>
            </div>
          </div>
        </section>

        <section className="customer-table-panel">
          <div className="customer-table-toolbar">
            <div>
              <h3>Semua Customer</h3>
              <p>
                {filteredCustomers.length} customer ditemukan dalam database.
              </p>
            </div>

            <div className="customer-search">
              <Search size={17} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, negara, WhatsApp..."
              />
            </div>
          </div>

          <div className="customer-table-wrapper">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Negara</th>
                  <th>Paket</th>
                  <th>Trip</th>
                  <th>Jadwal</th>
                  <th>Total</th>
                  <th>Pembayaran</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {loadingCustomers ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-customers">
                        <span>Memuat data customer dari Supabase...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-customers">
                        <Users size={28} />
                        <strong>Customer tidak ditemukan</strong>
                        <span>
                          Coba gunakan nama, negara, atau nomor WhatsApp lain.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.tripId}>
                      <td>
                        <div className="customer-main-cell">
                          <div className="customer-avatar customer-avatar--large">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <strong>{customer.name}</strong>
                            <small>{customer.phone}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="country-cell">
                          <Globe2 size={14} />
                          {customer.country}
                        </div>
                      </td>

                      <td>
                        <strong className="table-package">
                          {customer.lastPackage}
                        </strong>
                      </td>

                      <td>
                        <strong className="table-number">
                          {customer.totalTrips} Trip
                        </strong>

                        <small className="table-subtext">
                          {customer.pax} Pax
                        </small>
                      </td>

                      <td>
                        <div className="schedule-cell">
                          <CalendarDays size={13} />

                          <span>
                            {formatDate(customer.tripStart)}
                            <small>
                              → {formatDate(customer.tripEnd)}
                            </small>
                          </span>
                        </div>
                      </td>

                      <td>
                        <strong className="spending-value">
                          {formatRupiah(customer.totalPrice)}
                        </strong>
                      </td>

                      <td>
                        <div
                          className={`payment-cell payment-cell--${customer.paymentStatus
                            .toLowerCase()
                            .replaceAll(' ', '-')}`}
                        >
                          <strong>{customer.paymentStatus}</strong>

                          <small>
                            {customer.remainingPayment > 0
                              ? `Sisa ${formatRupiah(customer.remainingPayment)}`
                              : 'Sudah lunas'}
                          </small>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`trip-status trip-status--${customer.tripStatus.toLowerCase()}`}
                        >
                          {customer.tripStatus}
                        </span>
                      </td>

                      <td>
                        <button
                          className="view-customer-button"
                          onClick={() => setSelectedCustomer(customer)}
                          aria-label={`Lihat ${customer.name}`}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowModal(false)}
        >
          <div
            className="customer-modal customer-modal--wide"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="modal-icon">
                  <UserPlus size={20} />
                </div>
                <h2>Tambah Customer</h2>
                <p>
                  Masukkan customer sekaligus booking trip pertamanya.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Tutup"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleAddCustomer}>
              <div className="form-section-title">
                INFORMASI PERSONAL
              </div>

              <div className="form-grid">
                <label>
                  <span>Nama Lengkap *</span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateForm('name', event.target.value)
                    }
                    placeholder="Contoh: Ricky"
                    required
                  />
                </label>

                <label>
                  <span>Negara *</span>
                  <input
                    value={form.country}
                    onChange={(event) =>
                      updateForm('country', event.target.value)
                    }
                    placeholder="Contoh: Singapore"
                    required
                  />
                </label>

                <label>
                  <span>Kota</span>
                  <input
                    value={form.city}
                    onChange={(event) =>
                      updateForm('city', event.target.value)
                    }
                    placeholder="Contoh: Singapore"
                  />
                </label>

                <label>
                  <span>Nationality</span>
                  <input
                    value={form.nationality}
                    onChange={(event) =>
                      updateForm('nationality', event.target.value)
                    }
                    placeholder="Contoh: Singaporean"
                  />
                </label>

                <label>
                  <span>Nomor WhatsApp *</span>
                  <input
                    value={form.phone}
                    onChange={(event) =>
                      updateForm('phone', event.target.value)
                    }
                    placeholder="+65 8123 4567"
                    required
                  />
                </label>

                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateForm('email', event.target.value)
                    }
                    placeholder="customer@email.com"
                  />
                </label>
              </div>

              <div className="form-divider" />

              <div className="form-section-heading">
                <div className="form-section-heading__icon">
                  <Mountain size={16} />
                </div>
                <div>
                  <strong>INFORMASI TRIP</strong>
                  <small>Booking pertama customer</small>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  <span>Paket Trip *</span>
                                    <select
                    value={form.packageName}
                    onChange={(event) =>
                      updateForm('packageName', event.target.value)
                    }
                    required
                  >
                    <optgroup label="🇮🇩 LOCAL TRIP">
                      {packages
                        .filter((item) => item.category === 'local')
                        .map((item) => (
                          <option key={item.id} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                    </optgroup>

                    <optgroup label="🌍 INTERNATIONAL TRIP">
                      {packages
                        .filter(
                          (item) => item.category === 'international',
                        )
                        .map((item) => (
                          <option key={item.id} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                    </optgroup>

                    <option value="Lainnya">Lainnya</option>
                  </select>
                </label>

                {form.packageName === 'Lainnya' ? (
                  <label>
                    <span>Nama Paket Custom *</span>
                    <input
                      value={form.customPackage}
                      onChange={(event) =>
                        updateForm('customPackage', event.target.value)
                      }
                      placeholder="Contoh: Rinjani Family Package"
                      required
                    />
                  </label>
                ) : (
                  <label>
                    <span>Guide / PIC</span>
                    <input
                      value={form.guide}
                      onChange={(event) =>
                        updateForm('guide', event.target.value)
                      }
                      placeholder="Contoh: Ahmad"
                    />
                  </label>
                )}

                {form.packageName === 'Lainnya' && (
                  <label>
                    <span>Guide / PIC</span>
                    <input
                      value={form.guide}
                      onChange={(event) =>
                        updateForm('guide', event.target.value)
                      }
                      placeholder="Contoh: Ahmad"
                    />
                  </label>
                )}

                <label>
                  <span>Tanggal Booking</span>
                  <input
                    type="date"
                    value={form.bookingDate}
                    onChange={(event) =>
                      updateForm('bookingDate', event.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Tanggal Mulai Trip *</span>
                  <input
                    type="date"
                    value={form.tripStart}
                    onChange={(event) =>
                      updateForm('tripStart', event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  <span>Tanggal Selesai Trip *</span>
                  <input
                    type="date"
                    value={form.tripEnd}
                    onChange={(event) =>
                      updateForm('tripEnd', event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  <span>Jumlah Pax *</span>
                  <input
                    type="number"
                    min="1"
                    value={form.pax}
                    onChange={(event) =>
                      updateForm('pax', event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  <span>Harga / Pax *</span>
                  <input
                    type="number"
                    min="0"
                    value={form.pricePerPax}
                    onChange={(event) =>
                      updateForm('pricePerPax', event.target.value)
                    }
                    placeholder="3000000"
                    required
                  />
                </label>

                <label>
                  <span>Status Trip</span>
                  <select
                    value={form.tripStatus}
                    onChange={(event) =>
                      updateForm(
                        'tripStatus',
                        event.target.value as TripStatus,
                      )
                    }
                  >
                    <option>Booked</option>
                    <option>Ongoing</option>
                    <option>Completed</option>
                  </select>
                </label>
              </div>

              <div className="trip-total-preview">
                <div>
                  <span>Total Trip</span>
                  <strong>{formatPrice(totalPrice, getPackageCurrency(form.packageName))}</strong>
                </div>
                <div>
                  <span>{form.pax || 0} Pax</span>
                  <small>
                    {formatPrice(Number(form.pricePerPax || 0), getPackageCurrency(form.packageName))} / pax
                  </small>
                </div>
              </div>

              <div className="form-divider" />

              <div className="form-section-heading">
                <div className="form-section-heading__icon form-section-heading__icon--gold">
                  <CreditCard size={16} />
                </div>
                <div>
                  <strong>PEMBAYARAN</strong>
                  <small>Status pembayaran booking</small>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  <span>Status Pembayaran *</span>
                  <select
                    value={form.paymentStatus}
                    onChange={(event) =>
                      updateForm(
                        'paymentStatus',
                        event.target.value as PaymentStatus,
                      )
                    }
                  >
                    <option>Belum Bayar</option>
                    <option>DP</option>
                    <option>Lunas</option>
                    <option>Refund</option>
                  </select>
                </label>

                <label>
                  <span>Nominal DP / Dibayar</span>
                  <input
                    type="number"
                    min="0"
                    max={totalPrice || undefined}
                    value={form.dpAmount}
                    onChange={(event) =>
                      updateForm('dpAmount', event.target.value)
                    }
                    placeholder="0"
                  />
                </label>

                <label>
                  <span>Metode Pembayaran</span>
                  <select
                    value={form.paymentMethod}
                    onChange={(event) =>
                      updateForm('paymentMethod', event.target.value)
                    }
                  >
                    <option>Transfer</option>
                    <option>Cash</option>
                    <option>Payment Gateway</option>
                    <option>Lainnya</option>
                  </select>
                </label>

                <label>
                  <span>Sisa Pembayaran</span>
                  <input
                    value={formatPrice(remainingPayment, getPackageCurrency(form.packageName))}
                    readOnly
                    className="input-readonly"
                  />
                </label>
              </div>

              <div className="payment-summary">
                <div>
                  <span>Total Harga</span>
                  <strong>{formatPrice(totalPrice, getPackageCurrency(form.packageName))}</strong>
                </div>
                <div>
                  <span>Sudah Dibayar</span>
                  <strong className="payment-paid">
                    {formatPrice(dpAmount, getPackageCurrency(form.packageName))}
                  </strong>
                </div>
                <div>
                  <span>Sisa</span>
                  <strong className="payment-remaining">
                    {formatPrice(remainingPayment, getPackageCurrency(form.packageName))}
                  </strong>
                </div>
              </div>

              <div className="form-divider" />

              <div className="form-section-heading">
                <div className="form-section-heading__icon form-section-heading__icon--gray">
                  <FileText size={16} />
                </div>
                <div>
                  <strong>CATATAN</strong>
                  <small>Informasi tambahan customer</small>
                </div>
              </div>

              <div className="form-grid">
                <label className="form-grid__full">
                  <span>Catatan Trip / Permintaan Khusus</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateForm('notes', event.target.value)
                    }
                    placeholder="Contoh: Customer request makanan vegetarian..."
                    rows={3}
                  />
                </label>

                <label className="form-grid__full">
                  <span>Catatan Pembayaran</span>
                  <textarea
                    value={form.paymentNotes}
                    onChange={(event) =>
                      updateForm('paymentNotes', event.target.value)
                    }
                    placeholder="Contoh: Pelunasan sebelum keberangkatan..."
                    rows={2}
                  />
                </label>
              </div>

              <div className="form-note">
                <CheckCircle2 size={15} />
                Customer, booking trip pertama, dan pembayaran akan disimpan
                sebagai satu data.
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </button>

                <button type="submit" className="primary-button">
                  <UserPlus size={17} />
                  {savingCustomer ? 'Menyimpan...' : 'Simpan Customer & Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setSelectedCustomer(null)}
        >
          <div
            className="customer-detail-modal customer-detail-modal--wide"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="detail-header">
              <button
                className="modal-close"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Tutup"
              >
                <X size={19} />
              </button>

              <div className="detail-profile">
                <div className="customer-avatar customer-avatar--detail">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <div className="eyebrow">CUSTOMER PROFILE</div>
                  <h2>{selectedCustomer.name}</h2>
                  <p>
                    {selectedCustomer.country} ·{' '}
                    {selectedCustomer.nationality}
                  </p>
                </div>
              </div>
            </div>

            <div className="detail-contact-grid">
              <div>
                <Phone size={15} />
                <span>WhatsApp</span>
                <strong>{selectedCustomer.phone}</strong>
              </div>

              <div>
                <Mail size={15} />
                <span>Email</span>
                <strong>{selectedCustomer.email}</strong>
              </div>

              <div>
                <MapPin size={15} />
                <span>Kota</span>
                <strong>{selectedCustomer.city}</strong>
              </div>
            </div>

            <div className="detail-stat-grid">
              <div>
                <span>Trip</span>
<strong>{selectedCustomer.lastPackage}</strong>
              </div>

              <div>
                <span>Total Harga Trip</span>
<strong>{formatRupiah(selectedCustomer.totalPrice)}</strong>
              </div>

              <div>
                <span>Status Trip</span>
<strong>{selectedCustomer.tripStatus}</strong>
              </div>
            </div>

            <div className="detail-trip-card">
              <div className="detail-trip-card__header">
                <div>
                  <div className="detail-card-label">
                    <Mountain size={14} />
                    DETAIL TRIP
                  </div>
                  <h3>{selectedCustomer.lastPackage}</h3>
                </div>

                <select
                  className={`trip-status trip-status--${selectedCustomer.tripStatus.toLowerCase()}`}
                  value={selectedCustomer.tripStatus}
                  onChange={(event) =>
                    handleUpdateTripStatus(
                      event.target.value as TripStatus,
                    )
                  }
                  aria-label="Ubah status trip"
                >
                  <option value="Booked">Booked</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="detail-trip-grid">
                <div>
                  <CalendarDays size={14} />
                  <span>Jadwal</span>
                  <strong>
                    {formatDate(selectedCustomer.tripStart)} →{' '}
                    {formatDate(selectedCustomer.tripEnd)}
                  </strong>
                </div>

                <div>
                  <Users size={14} />
                  <span>Pax</span>
                  <strong>{selectedCustomer.pax} Pax</strong>
                </div>

                <div>
                  <Wallet size={14} />
                  <span>Total Harga</span>
                  <strong>{formatRupiah(selectedCustomer.totalPrice)}</strong>
                </div>

                <div>
                  <CreditCard size={14} />
                  <span>Pembayaran</span>
                  <strong>{selectedCustomer.paymentStatus}</strong>
                  <small>
                    {selectedCustomer.remainingPayment > 0
                      ? `Sisa ${formatRupiah(selectedCustomer.remainingPayment)}`
                      : 'Sudah lunas'}
                  </small>
                </div>

                <div>
                  <UserRound size={14} />
                  <span>Guide / PIC</span>
                  <strong>{selectedCustomer.guide}</strong>
                </div>

                <div>
                  <Globe2 size={14} />
                  <span>Metode Bayar</span>
                  <strong>{selectedCustomer.paymentMethod}</strong>
                </div>
              </div>
            </div>

            <div className="detail-notes-grid">
              <div>
                <span>Catatan Trip</span>
                <p>{selectedCustomer.notes || 'Tidak ada catatan.'}</p>
              </div>

              <div>
                <span>Catatan Pembayaran</span>
                <p>
                  {selectedCustomer.paymentNotes ||
                    'Tidak ada catatan pembayaran.'}
                </p>
              </div>
            </div>

            <div className="detail-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  if (!selectedCustomer) return

                  setEditCustomerForm({
                    name: selectedCustomer.name,
                    country: selectedCustomer.country,
                    city: selectedCustomer.city === '-' ? '' : selectedCustomer.city,
                    nationality: selectedCustomer.nationality,
                    phone: selectedCustomer.phone,
                    email: selectedCustomer.email === '-' ? '' : selectedCustomer.email,
                  })

                  setShowEditCustomerModal(true)
                }}
              >
                <FileText size={16} />
                Edit Customer
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={async () => {
                  if (!selectedCustomer) return

                  const { data, error } = await supabase
                    .from('trips')
                    .select(`
                      id,
                      package_name,
                      total_price,
                      start_date,
                      end_date,
                      payments (
                        amount
                      )
                    `)
                    .eq('customer_id', selectedCustomer.id)
                    .order('created_at', { ascending: false })

                  if (error) {
                    alert(`Gagal mengambil trip customer: ${error.message}`)
                    return
                  }

                  const unpaidTrips = (data ?? []).filter((trip: any) => {
                    const totalPrice = Number(trip.total_price ?? 0)
                    const totalPaid = (trip.payments ?? []).reduce(
                      (sum: number, payment: any) =>
                        sum + Number(payment.amount ?? 0),
                      0,
                    )

                    return totalPrice > totalPaid
                  })

                  if (unpaidTrips.length === 0) {
                    alert('Semua trip customer sudah lunas.')
                    return
                  }

                  setPaymentTrips(unpaidTrips)
                  setSelectedPaymentTripId(unpaidTrips[0].id)
                  resetPaymentForm()
                  setShowPaymentModal(true)
                }}
              >
                <CreditCard size={16} />
                Tambah Pembayaran
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  resetTripForm()
                  setShowTripModal(true)
                }}
              >
                <Plus size={16} />
                Tambah Trip Berikutnya
              </button>

              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  resetFollowUpForm()
                  setShowFollowUpModal(true)
                }}
              >
                <CalendarDays size={16} />
                Atur Follow Up
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditCustomerModal && selectedCustomer && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowEditCustomerModal(false)}
        >
          <div
            className="customer-modal customer-modal--wide"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">EDIT CUSTOMER</div>
                <h2>Edit Data Customer</h2>
                <p>
                  Perbarui informasi <strong>{selectedCustomer.name}</strong>
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowEditCustomerModal(false)}
                aria-label="Tutup"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer}>
              <div className="form-section-title">
                INFORMASI CUSTOMER
              </div>

              <div className="form-grid">
                <label>
                  <span>Nama Customer *</span>
                  <input
                    type="text"
                    value={editCustomerForm.name}
                    onChange={(event) =>
                      updateEditCustomerForm(
                        'name',
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>

                <label>
                  <span>Negara *</span>
                  <input
                    type="text"
                    value={editCustomerForm.country}
                    onChange={(event) =>
                      updateEditCustomerForm(
                        'country',
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>

                <label>
                  <span>Kota</span>
                  <input
                    type="text"
                    value={editCustomerForm.city}
                    onChange={(event) =>
                      updateEditCustomerForm(
                        'city',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>Nationality</span>
                  <input
                    type="text"
                    value={editCustomerForm.nationality}
                    onChange={(event) =>
                      updateEditCustomerForm(
                        'nationality',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>WhatsApp</span>
                  <input
                    type="tel"
                    value={editCustomerForm.phone}
                    onChange={(event) =>
                      updateEditCustomerForm(
                        'phone',
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={editCustomerForm.email}
                    onChange={(event) =>
                      updateEditCustomerForm(
                        'email',
                        event.target.value,
                      )
                    }
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowEditCustomerModal(false)}
                  disabled={savingEditCustomer}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingEditCustomer}
                >
                  <CheckCircle2 size={16} />
                  {savingEditCustomer
                    ? 'Menyimpan...'
                    : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedCustomer && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowPaymentModal(false)}
        >
          <div
            className="customer-modal customer-modal--wide"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">PAYMENT</div>
                <h2>Tambah Pembayaran</h2>
                <p>
                  Customer: <strong>{selectedCustomer.name}</strong>
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowPaymentModal(false)}
                aria-label="Tutup"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleAddPayment}>
              <div className="form-section-title">
                PILIH TRIP
              </div>

              <label>
                <span>Trip yang akan dibayar</span>
                <select
                  value={selectedPaymentTripId}
                  onChange={(event) => {
                    setSelectedPaymentTripId(event.target.value)
                    resetPaymentForm()
                  }}
                >
                  {paymentTrips.map((trip: any) => {
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

                    return (
                      <option key={trip.id} value={trip.id}>
                        {trip.package_name ?? 'Trip'} — Sisa {formatRupiah(remaining)}
                      </option>
                    )
                  })}
                </select>
              </label>

              <div className="form-section-title">
                RINGKASAN PEMBAYARAN
              </div>

              <div className="payment-summary">
                <div>
                  <span>Total Trip</span>
                  <strong>
                    {formatRupiah(Number(paymentTrips.find((trip: any) => trip.id === selectedPaymentTripId)?.total_price ?? 0))}
                  </strong>
                </div>

                <div>
                  <span>Sudah Dibayar</span>
                  <strong>
  {formatRupiah(
    (paymentTrips.find(
      (trip: any) => trip.id === selectedPaymentTripId,
    )?.payments ?? []).reduce(
      (sum: number, payment: any) =>
        sum + Number(payment.amount ?? 0),
      0,
    ),
  )}
</strong>
                </div>

                <div>
                  <span>Sisa Pembayaran</span>
                  <strong className="payment-summary__remaining">
  {formatRupiah(
    Math.max(
      Number(
        paymentTrips.find(
          (trip: any) => trip.id === selectedPaymentTripId,
        )?.total_price ?? 0,
      ) -
        (paymentTrips.find(
          (trip: any) => trip.id === selectedPaymentTripId,
        )?.payments ?? []).reduce(
          (sum: number, payment: any) =>
            sum + Number(payment.amount ?? 0),
          0,
        ),
      0,
    ),
  )}
</strong>
                </div>
              </div>

              <div className="form-section-title">
                PEMBAYARAN BARU
              </div>

              <div className="form-grid">
                <label>
                  <span>Nominal Pembayaran *</span>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(
  Number(
    paymentTrips.find(
      (trip: any) => trip.id === selectedPaymentTripId,
    )?.total_price ?? 0,
  ) -
    (paymentTrips.find(
      (trip: any) => trip.id === selectedPaymentTripId,
    )?.payments ?? []).reduce(
      (sum: number, payment: any) =>
        sum + Number(payment.amount ?? 0),
      0,
    ),
  0,
)}
                    value={paymentForm.amount}
                    onChange={(event) =>
                      updatePaymentForm(
                        'amount',
                        event.target.value,
                      )
                    }
                    placeholder="Contoh: 1000000"
                    required
                  />
                </label>

                <label>
                  <span>Tanggal Pembayaran *</span>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(event) =>
                      updatePaymentForm(
                        'paymentDate',
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>

                <label>
                  <span>Metode Pembayaran</span>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(event) =>
                      updatePaymentForm(
                        'paymentMethod',
                        event.target.value,
                      )
                    }
                  >
                    <option>Transfer</option>
                    <option>Cash</option>
                    <option>Payment Gateway</option>
                  </select>
                </label>

                <label>
                  <span>Catatan Pembayaran</span>
                  <input
                    value={paymentForm.notes}
                    onChange={(event) =>
                      updatePaymentForm(
                        'notes',
                        event.target.value,
                      )
                    }
                    placeholder="Contoh: Pelunasan tahap kedua"
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={savingPayment}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
  savingPayment ||
  !selectedPaymentTripId
}
                >
                  <CreditCard size={16} />
                  {savingPayment
                    ? 'Menyimpan...'
                    : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFollowUpModal && selectedCustomer && (
        <div className="modal-backdrop">
          <div className="customer-modal customer-modal--wide">
            <div className="modal-header">
              <div className="modal-header__icon">
                <CalendarDays size={20} />
              </div>

              <div>
                <span className="modal-eyebrow">FOLLOW UP</span>
                <h2>Atur Follow Up</h2>
                <p>
                  Customer: <strong>{selectedCustomer.name}</strong>
                </p>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={() => setShowFollowUpModal(false)}
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp}>
              <div className="modal-body">
                <div className="form-section-title">
                  <span>INFORMASI FOLLOW UP</span>
                </div>

                <div className="form-grid">
                  <label>
                    <span>Tanggal Follow Up *</span>
                    <input
                      type="date"
                      value={followUpForm.followUpDate}
                      onChange={(event) =>
                        updateFollowUpForm(
                          'followUpDate',
                          event.target.value,
                        )
                      }
                      required
                    />
                  </label>

                  <label>
                    <span>Status</span>
                    <select
                      value={followUpForm.status}
                      onChange={(event) =>
                        updateFollowUpForm('status', event.target.value)
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </label>
                </div>

                <div className="form-grid">
                  <label className="form-grid__full">
                    <span>Judul / Keperluan *</span>
                    <input
                      type="text"
                      value={followUpForm.subject}
                      onChange={(event) =>
                        updateFollowUpForm('subject', event.target.value)
                      }
                      placeholder="Contoh: Follow up booking, pembayaran DP, atau promo"
                      required
                    />
                  </label>
                </div>

                <div className="form-grid">
                  <label className="form-grid__full">
                    <span>Catatan</span>
                    <textarea
                      value={followUpForm.notes}
                      onChange={(event) =>
                        updateFollowUpForm('notes', event.target.value)
                      }
                      placeholder="Catatan follow up customer..."
                      rows={4}
                    />
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  disabled={savingFollowUp}
                >
                  Batal
                </button>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={savingFollowUp}
                >
                  <CalendarDays size={16} />
                  {savingFollowUp ? 'Menyimpan...' : 'Simpan Follow Up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTripModal && selectedCustomer && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowTripModal(false)}
        >
          <div
            className="customer-modal customer-modal--wide"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">NEW TRIP</div>
                <h2>Tambah Trip Berikutnya</h2>
                <p>
                  Customer: <strong>{selectedCustomer.name}</strong>
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowTripModal(false)}
                aria-label="Tutup"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleAddNextTrip}>
              <div className="form-section-title">INFORMASI TRIP</div>

              <div className="form-grid">
                <label>
                  <span>Paket Trip</span>
                                    <select
                    value={tripForm.packageName}
                    onChange={(event) =>
                      updateTripForm('packageName', event.target.value)
                    }
                  >
                    <optgroup label="🇮🇩 LOCAL TRIP">
                      {packages
                        .filter((item) => item.category === 'local')
                        .map((item) => (
                          <option key={item.id} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                    </optgroup>

                    <optgroup label="🌍 INTERNATIONAL TRIP">
                      {packages
                        .filter(
                          (item) => item.category === 'international',
                        )
                        .map((item) => (
                          <option key={item.id} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                    </optgroup>

                    <option value="Custom Package">
                      Custom Package
                    </option>
                  </select>
                </label>

                {tripForm.packageName === 'Custom Package' && (
                  <label>
                    <span>Nama Paket Custom</span>
                    <input
                      value={tripForm.customPackage}
                      onChange={(event) =>
                        updateTripForm('customPackage', event.target.value)
                      }
                      placeholder="Nama paket"
                      required
                    />
                  </label>
                )}

                <label>
                  <span>Tanggal Booking</span>
                  <input
                    type="date"
                    value={tripForm.bookingDate}
                    onChange={(event) =>
                      updateTripForm('bookingDate', event.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Trip Mulai</span>
                  <input
                    type="date"
                    value={tripForm.tripStart}
                    onChange={(event) =>
                      updateTripForm('tripStart', event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  <span>Trip Selesai</span>
                  <input
                    type="date"
                    value={tripForm.tripEnd}
                    onChange={(event) =>
                      updateTripForm('tripEnd', event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  <span>Jumlah Pax</span>
                  <input
                    type="number"
                    min="1"
                    value={tripForm.pax}
                    onChange={(event) =>
                      updateTripForm('pax', event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  <span>Harga / Pax</span>
                  <input
                    type="number"
                    min="0"
                    value={tripForm.pricePerPax}
                    onChange={(event) =>
                      updateTripForm('pricePerPax', event.target.value)
                    }
                    placeholder="3000000"
                    required
                  />
                </label>

                <label>
                  <span>Guide / PIC</span>
                  <input
                    value={tripForm.guide}
                    onChange={(event) =>
                      updateTripForm('guide', event.target.value)
                    }
                    placeholder="Nama guide"
                  />
                </label>

                <label>
                  <span>Status Trip</span>
                  <select
                    value={tripForm.tripStatus}
                    onChange={(event) =>
                      updateTripForm('tripStatus', event.target.value)
                    }
                  >
                    <option>Booked</option>
                    <option>Ongoing</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </label>
              </div>

              <div className="form-section-title">PEMBAYARAN</div>

              <div className="form-grid">
                <label>
                  <span>Status Pembayaran</span>
                  <select
                    value={tripForm.paymentStatus}
                    onChange={(event) =>
                      updateTripForm('paymentStatus', event.target.value)
                    }
                  >
                    <option>Belum Bayar</option>
                    <option>DP</option>
                    <option>Lunas</option>
                  </select>
                </label>

                <label>
                  <span>Nominal DP / Pembayaran</span>
                  <input
                    type="number"
                    min="0"
                    value={tripForm.dpAmount}
                    onChange={(event) =>
                      updateTripForm('dpAmount', event.target.value)
                    }
                    placeholder="0"
                  />
                </label>

                <label>
                  <span>Metode Pembayaran</span>
                  <select
                    value={tripForm.paymentMethod}
                    onChange={(event) =>
                      updateTripForm('paymentMethod', event.target.value)
                    }
                  >
                    <option>Transfer</option>
                    <option>Cash</option>
                    <option>Payment Gateway</option>
                  </select>
                </label>

                <label>
                  <span>Catatan Pembayaran</span>
                  <input
                    value={tripForm.paymentNotes}
                    onChange={(event) =>
                      updateTripForm('paymentNotes', event.target.value)
                    }
                    placeholder="Catatan pembayaran"
                  />
                </label>
              </div>

              <div className="form-section-title">CATATAN TRIP</div>

              <label>
                <span>Catatan</span>
                <textarea
                  value={tripForm.notes}
                  onChange={(event) =>
                    updateTripForm('notes', event.target.value)
                  }
                  placeholder="Catatan khusus customer / trip"
                  rows={3}
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={() => setShowTripModal(false)}
                  disabled={savingTrip}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingTrip}
                >
                  <Plus size={17} />
                  {savingTrip ? 'Menyimpan...' : 'Simpan Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Customers




















































