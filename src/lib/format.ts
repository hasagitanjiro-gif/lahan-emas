/** Format angka ke Rupiah: Rp1.000.000 (tanpa spasi, tanpa desimal) */
export function formatIDR(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value ?? 0
  if (Number.isNaN(n)) return 'Rp0'
  return 'Rp' + Math.round(n).toLocaleString('id-ID')
}

/** Format input angka dengan pemisah ribuan saat mengetik */
export function formatNumberInput(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('id-ID')
}

/** Parse string ribuan Indonesia ("1.000.000") menjadi number */
export function parseNumberInput(value: string): number {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

/** Format tanggal ke format Indonesia: 12 Mei 2025 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Format tanggal + jam singkat: 12 Mei 2025, 14.30 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return (
    d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  )
}

/** Tambah n hari ke tanggal */
export function addDays(date: Date | string, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Selisih hari antara dua tanggal (bisa negatif) */
export function daysBetween(from: Date | string, to: Date | string): number {
  const a = new Date(from).setHours(0, 0, 0, 0)
  const b = new Date(to).setHours(0, 0, 0, 0)
  return Math.round((b - a) / 86_400_000)
}

/** Persen progress 0–100, dibatasi */
export function clampPercent(v: number): number {
  return Math.min(100, Math.max(0, v))
}
