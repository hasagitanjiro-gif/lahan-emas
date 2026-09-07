import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { fetchTransactions, ambilPesanError } from '../lib/api'
import { formatIDR, formatDateTime } from '../lib/format'
import { Spinner, ErrorState, EmptyState, ActivityIcon, labelAktivitas } from '../components/ui'
import type { Transaction } from '../types/db'

/** Opsi filter jenis aktivitas */
const JENIS: { value: string; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'investasi', label: 'Investasi' },
  { value: 'klaim', label: 'Klaim' },
  { value: 'referral_reward', label: 'Referral Reward' },
  { value: 'voucher_rabat', label: 'Voucher Rabat' },
  { value: 'penarikan', label: 'Penarikan' },
]

export default function Aktivitas() {
  const { session } = useAuth()
  const uid = session?.user.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filter, setFilter] = useState('semua')

  useEffect(() => {
    if (!uid) return
    let batal = false
    setLoading(true)
    setError(null)
    fetchTransactions(uid)
      .then((rows) => {
        if (!batal) setTransactions(rows)
      })
      .catch((e) => {
        if (!batal) setError(ambilPesanError(e))
      })
      .finally(() => {
        if (!batal) setLoading(false)
      })
    return () => {
      batal = true
    }
  }, [uid])

  if (loading) return <Spinner label="Memuat aktivitas…" />
  if (error) return <ErrorState message={error} />

  const tersaring = filter === 'semua' ? transactions : transactions.filter((t) => t.type === filter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">Aktivitas</h1>
        <p className="mt-1 text-sm text-muted">Riwayat semua mutasi akun Anda.</p>
      </div>

      {/* Filter jenis */}
      <div className="flex flex-wrap gap-2">
        {JENIS.map((j) => (
          <button
            key={j.value}
            type="button"
            onClick={() => setFilter(j.value)}
            className={
              'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ' +
              (filter === j.value
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-line bg-surface2 text-muted hover:text-ink')
            }
          >
            {j.label}
          </button>
        ))}
      </div>

      {tersaring.length === 0 ? (
        <EmptyState
          title="Belum ada aktivitas"
          description="Aktivitas seperti deposit, investasi, dan klaim akan muncul di sini."
        />
      ) : (
        <ul className="card divide-y divide-line p-0">
          {tersaring.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-5 py-3">
              <ActivityIcon type={t.type} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{labelAktivitas(t.type)}</p>
                <p className="truncate text-xs text-muted">{t.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-ink">{formatIDR(Number(t.amount))}</p>
                <p className="text-xs text-muted">{formatDateTime(t.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
