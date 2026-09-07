import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { fetchProfile, fetchBalance, fetchReferrals, ambilPesanError } from '../lib/api'
import { REFERRAL_BONUS_PERCENT } from '../config/config'
import { formatIDR, formatDateTime } from '../lib/format'
import { Spinner, ErrorState, EmptyState } from '../components/ui'
import type { Balance, Profile, Referral } from '../types/db'

export default function Referral() {
  const { session } = useAuth()
  const uid = session?.user.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [disalin, setDisalin] = useState<'kode' | 'link' | null>(null)

  useEffect(() => {
    if (!uid) return
    let batal = false
    setLoading(true)
    setError(null)
    Promise.all([fetchProfile(uid), fetchBalance(uid), fetchReferrals(uid)])
      .then(([p, b, r]) => {
        if (batal) return
        setProfile(p)
        setBalance(b)
        setReferrals(r)
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

  if (loading) return <Spinner label="Memuat referral…" />
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  if (!profile || !balance) return <ErrorState message="Data referral tidak tersedia." />

  const linkReferral = `${window.location.origin}/daftar?ref=${profile.referral_code}`
  const totalReferral = referrals.length
  const referralAktif = referrals.filter((r) => r.is_valid).length
  const rewardTotal = Number(balance.referral_reward_total)

  async function salin(teks: string, jenis: 'kode' | 'link') {
    try {
      await navigator.clipboard.writeText(teks)
      setDisalin(jenis)
      setTimeout(() => setDisalin(null), 2000)
    } catch {
      setDisalin(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">Referral</h1>
        <p className="mt-1 text-sm text-muted">
          Ajak teman, dapatkan bonus {REFERRAL_BONUS_PERCENT}% dari investasi pertama yang valid.
        </p>
      </div>

      {/* Kode & link */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <p className="stat-label">Kode Referral</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="rounded-lg bg-surface2 px-3 py-2 font-display text-lg font-bold tracking-widest text-primary">
              {profile.referral_code}
            </code>
            <button
              type="button"
              className="btn btn-ghost cursor-pointer"
              onClick={() => salin(profile.referral_code, 'kode')}
            >
              {disalin === 'kode' ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
        </div>

        <div className="card">
          <p className="stat-label">Link Referral</p>
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={linkReferral} className="input text-xs" onFocus={(e) => e.target.select()} />
            <button
              type="button"
              className="btn btn-ghost shrink-0 cursor-pointer"
              onClick={() => salin(linkReferral, 'link')}
            >
              {disalin === 'link' ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
        </div>
      </div>

      {/* Statistik */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="stat-label">Total Referral</p>
          <p className="stat-value mt-2">{totalReferral}</p>
        </div>
        <div className="card">
          <p className="stat-label">Referral Aktif</p>
          <p className="stat-value mt-2 text-primary">{referralAktif}</p>
          <p className="mt-1 text-xs text-muted">Sudah berinvestasi pertama</p>
        </div>
        <div className="card">
          <p className="stat-label">Reward Referral</p>
          <p className="stat-value mt-2 text-accent">{formatIDR(rewardTotal)}</p>
          <p className="mt-1 text-xs text-muted">Total bonus masuk saldo</p>
        </div>
      </div>

      {/* Riwayat referral */}
      <section aria-labelledby="riwayat-referral">
        <h2 id="riwayat-referral" className="section-title text-xl">
          Referral History
        </h2>
        {referrals.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Belum ada referral"
              description="Bagikan kode atau link referral Anda untuk mulai mengajak teman."
            />
          </div>
        ) : (
          <div className="card mt-4 overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-semibold">Nama</th>
                  <th className="px-5 py-3 font-semibold">Tanggal Gabung</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Reward</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 font-medium text-ink">
                      {r.referred_name || 'Pengguna'}
                    </td>
                    <td className="px-5 py-3 text-muted">{formatDateTime(r.created_at)}</td>
                    <td className="px-5 py-3">
                      {r.is_valid ? (
                        <span className="badge border-primary/40 bg-primary/10 text-primary">Valid</span>
                      ) : (
                        <span className="badge text-muted">Menunggu Investasi</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-ink">
                      {r.reward_amount !== null ? formatIDR(Number(r.reward_amount)) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-muted">
        Catatan: bonus referral diberikan sekali per teman setelah investasi pertama mereka yang valid.
        Referral ke diri sendiri tidak diizinkan.
      </p>
    </div>
  )
}
