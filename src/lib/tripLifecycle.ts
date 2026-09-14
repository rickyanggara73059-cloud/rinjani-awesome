export type TripLifecycleStatus =
  | 'Upcoming'
  | 'Ongoing'
  | 'Completed'
  | 'Cancelled'

type TripLifecycleInput = {
  startDate: string | null | undefined
  endDate: string | null | undefined
  storedStatus?: string | null
  today?: string
}

/**
 * Menghasilkan YYYY-MM-DD berdasarkan tanggal lokal komputer.
 * Tidak menggunakan toISOString() agar tidak bergeser karena UTC.
 */
export function getTodayDateString() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Sumber kebenaran lifecycle trip adalah tanggal perjalanan.
 *
 * Upcoming:
 *   start_date > today
 *
 * Ongoing:
 *   start_date <= today <= end_date
 *
 * Completed:
 *   end_date < today
 *
 * Cancelled:
 *   tetap Cancelled sebagai pengecualian manual.
 */
export function getTripLifecycleStatus({
  startDate,
  endDate,
  storedStatus,
  today = getTodayDateString(),
}: TripLifecycleInput): TripLifecycleStatus {
  if (storedStatus === 'Cancelled') {
    return 'Cancelled'
  }

  if (!startDate || !endDate) {
    return storedStatus === 'Cancelled'
      ? 'Cancelled'
      : 'Upcoming'
  }

  if (today < startDate) {
    return 'Upcoming'
  }

  if (today <= endDate) {
    return 'Ongoing'
  }

  return 'Completed'
}

export function isTripUpcoming(
  input: TripLifecycleInput,
) {
  return (
    getTripLifecycleStatus(input) === 'Upcoming'
  )
}

export function isTripOngoing(
  input: TripLifecycleInput,
) {
  return (
    getTripLifecycleStatus(input) === 'Ongoing'
  )
}

export function isTripCompleted(
  input: TripLifecycleInput,
) {
  return (
    getTripLifecycleStatus(input) === 'Completed'
  )
}

export function isTripCancelled(
  input: TripLifecycleInput,
) {
  return (
    getTripLifecycleStatus(input) === 'Cancelled'
  )
}
