import type { ReactNode } from 'react'

/** Logo marka: batangan emas */
export function GoldMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="10" width="18" height="8" rx="2" fill="#D4AF37" />
      <rect x="6" y="5" width="12" height="5" rx="1.5" fill="#F4E4C1" />
      <rect x="8.5" y="6.5" width="7" height="2" rx="1" fill="#9C7C22" opacity="0.55" />
    </svg>
  )
}

/** Indikator memuat */
export function Spinner({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12" role="status" aria-live="polite">
      <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
      </svg>
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}

/** Kartu kerangka saat data dimuat */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card animate-pulse" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="mb-3 h-4 rounded bg-surface2" style={{ width: `${90 - i * 15}%` }} />
      ))}
    </div>
  )
}

/** Kondisi kosong */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-2 py-10 text-center">
      <svg className="h-10 w-10 text-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 7h16M4 12h10M4 17h7" strokeLinecap="round" />
      </svg>
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Kondisi gagal memuat */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-2 border-danger/30 py-10 text-center" role="alert">
      <svg className="h-10 w-10 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
      </svg>
      <p className="font-semibold text-ink">Gagal memuat data</p>
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-ghost mt-2">
          Coba Lagi
        </button>
      )}
    </div>
  )
}

/** Banner sukses */
export function SuccessBanner({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary"
      role="status"
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{message}</span>
    </div>
  )
}

/** Banner galat untuk aksi form */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
      role="alert"
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
      </svg>
      <span>{message}</span>
    </div>
  )
}

/** Kartu statistik ringkas */
export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-2">
        <p className="stat-label">{label}</p>
        {icon && <span className="text-primary">{icon}</span>}
      </div>
      <p className="stat-value mt-2">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

/** Bar progres emas 0–100 */
export function ProgressBar({ percent }: { percent: number }) {
  const p = Math.min(100, Math.max(0, percent))
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-surface2"
      role="progressbar"
      aria-valuenow={Math.round(p)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="anim-grow-x h-full rounded-full"
        style={{
          width: `${p}%`,
          background: 'linear-gradient(90deg, #9c7c22, #d4af37 60%, #f2dc8f)',
        }}
      />
    </div>
  )
}

/** Badge status investasi */
export function StatusBadge({ status }: { status: 'aktif' | 'selesai' | 'sudah_diklaim' }) {
  const style =
    status === 'aktif'
      ? 'border-primary/40 bg-primary/10 text-primary'
      : status === 'selesai'
        ? 'border-accent/40 bg-accent/10 text-accent'
        : 'border-line bg-surface2 text-muted'
  const label = status === 'aktif' ? 'Aktif' : status === 'selesai' ? 'Selesai' : 'Sudah Diklaim'
  return <span className={`badge ${style}`}>{label}</span>
}

/** Ikon aktivitas berdasarkan tipe transaksi */
export function ActivityIcon({ type }: { type: string }) {
  const common = 'h-4 w-4 shrink-0'
  switch (type) {
    case 'deposit':
      return (
        <svg className={`${common} text-primary`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'penarikan':
      return (
        <svg className={`${common} text-accent`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19V5M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'investasi':
      return (
        <svg className={`${common} text-primary`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19V9M10 19V5M16 19v-8M22 19H2" strokeLinecap="round" />
        </svg>
      )
    case 'klaim':
      return (
        <svg className={`${common} text-accent`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'referral_reward':
      return (
        <svg className={`${common} text-primary`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 4a3 3 0 0 1 0 6M21 20c0-2.5-2-4.5-4.5-5" strokeLinecap="round" />
        </svg>
      )
    case 'voucher_rabat':
      return (
        <svg className={`${common} text-accent`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a3 3 0 0 0 0 6v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a3 3 0 0 0 0-6z" />
          <path d="M13 5v2M13 11v2M13 17v2" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg className={`${common} text-muted`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
  }
}

/** Label tipe aktivitas dalam Bahasa Indonesia */
export function labelAktivitas(type: string): string {
  switch (type) {
    case 'deposit':
      return 'Deposit'
    case 'investasi':
      return 'Investasi'
    case 'klaim':
      return 'Klaim'
    case 'referral_reward':
      return 'Referral Reward'
    case 'voucher_rabat':
      return 'Voucher Rabat'
    case 'penarikan':
      return 'Penarikan'
    default:
      return type
  }
}
