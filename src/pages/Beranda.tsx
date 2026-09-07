import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { rpcClaimProfit, rpcAccrueProfits, fetchBalance, fetchInvestments, fetchTransactions, ambilPesanError, pesanError } from '../lib/api'
import { formatIDR, formatDateTime, daysBetween, clampPercent } from '../lib/format'
import { StatCard, Spinner, ErrorState, ActivityIcon, labelAktivitas, ProgressBar, StatusBadge, ErrorBanner, SuccessBanner } from '../components/ui'
import type { Balance, Investment, Transaction } from '../types/db'

export default function Beranda() {
  const { session, refreshSaldo } = useAuth()
  const uid = session?.user.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [claimId, setClaimId] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimSukses, setClaimSukses] = useState<string | null>(null)

  const muatUlang = (b: Balance, inv: Investment[]) => {
    setBalance(b)
    setInvestments(inv)
  }

  useEffect(() => {
    if (!uid) return
    let batal = false
    setLoading(true)
    setError(null)
    // Akrual hasil harian dulu supaya saldo selalu memuat hasil terbaru (bisa langsung ditarik)
    ;(async () => {
      try {
        await rpcAccrueProfits()
      } catch {
        // Akrual gagal — tetap tampilkan data terakhir yang tersimpan
      }
      const [b, inv, trx] = await Promise.all([fetchBalance(uid), fetchInvestments(uid), fetchTransactions(uid)])
      if (batal) return
      muatUlang(b, inv)
      setTransactions(trx.slice(0, 5))
    })()
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

  async function klaimHarian(inv: Investment) {
    setClaimId(inv.id)
    setClaimError(null)
    setClaimSukses(null)
    try {
      const res = await rpcClaimProfit(inv.id)
      if (!res.ok) {
        setClaimError(pesanError(res.error ?? null))
        return
      }
      setClaimSukses(
        `Hasil harian berhasil diklaim: ${formatIDR(Number(res.amount ?? 0))} masuk ke saldo IDR Anda.`,
      )
      // Data di-refresh penuh agar saldo, status, dan aktivitas konsisten
      if (uid) {
        const [b, invBaru, trx] = await Promise.all([fetchBalance(uid), fetchInvestments(uid), fetchTransactions(uid)])
        muatUlang(b, invBaru)
        setTransactions(trx.slice(0, 5))
      }
      await refreshSaldo()
    } catch (err) {
      setClaimError(ambilPesanError(err))
    } finally {
      setClaimId(null)
    }
  }

  if (loading) return <Spinner label="Memuat beranda…" />
  if (error) return <ErrorState message={error} />
  if (!balance) return <ErrorState message="Data saldo tidak tersedia." />

  const aktif = investments.filter((i) => i.status === 'aktif')
  const totalInvestasi = Number(balance.total_invested)
  const totalHasil = Number(balance.total_earned)
  const rewardReferral = Number(balance.referral_reward_total)

  // Total hasil harian yang bisa dicairkan sekarang (semua investasi aktif)
  const siapCairPerPaket = aktif.map((inv) => {
    const hariBerjalan = daysBetween(inv.start_date, new Date())
    const hariTersedia = Math.max(0, Math.min(hariBerjalan, inv.duration_days) - Number(inv.profit_days_paid ?? 0))
    const totalHasilInv = inv.total_return != null ? Number(inv.total_return) : (Number(inv.amount) * Number(inv.rate_max)) / 100
    const perHari = totalHasilInv / inv.duration_days
    const nominal = Math.round(perHari * hariTersedia)
    return { inv, hariTersedia, nominal, perHari }
  })
  const totalSiapCair = siapCairPerPaket.reduce((acc, x) => acc + x.nominal, 0)
  const hasilPerHari = siapCairPerPaket.reduce((acc, x) => acc + x.perHari, 0)
  const totalSudahDibayar = aktif.reduce((acc, inv) => acc + Number(inv.profit_paid ?? 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">Beranda</h1>
        <p className="mt-1 text-sm text-muted">Ringkasan akun dan investasi Anda.</p>
      </div>

      {claimSukses && <SuccessBanner message={claimSukses} />}
      {claimError && <ErrorBanner message={claimError} />}

      {/* Panel profit harian otomatis */}
      <section aria-labelledby="hasil-harian">
        <div className="panel-gold">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Profit Harian</p>
              <p className="stat-value mt-1 text-gold-gradient">{formatIDR(hasilPerHari)}</p>
              <p className="mt-1 max-w-md text-xs text-muted">
                Masuk otomatis ke saldo IDR Anda setiap hari dan langsung bisa ditarik lewat halaman Penarikan.
              </p>
            </div>
            <span className="badge border-primary/40 bg-primary/10 text-primary">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
              Otomatis ke saldo
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="text-muted">
              Total siap cair sekarang:{' '}
              <span className="font-semibold text-primary">{formatIDR(totalSiapCair)}</span>
            </span>
            <span className="text-muted">
              Sudah dicairkan: <span className="font-semibold text-ink">{formatIDR(totalSudahDibayar)}</span>
            </span>
          </div>
          {siapCairPerPaket.length > 0 && (
            <div className="mt-4 space-y-3">
              {siapCairPerPaket.map(({ inv, hariTersedia, nominal }) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{inv.package_name}</p>
                    <p className="text-xs text-muted">
                      {formatIDR(nominal)} · {hariTersedia} hari belum dicairkan
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-accent shrink-0 px-3 py-1.5 text-xs cursor-pointer"
                    disabled={claimId === inv.id || hariTersedia === 0}
                    onClick={() => klaimHarian(inv)}
                  >
                    {claimId === inv.id ? 'Memproses…' : 'Cairkan Sekarang'}
                  </button>
                </div>
              ))}
            </div>
          )}
          {aktif.length === 0 && (
            <p className="mt-4 text-sm text-muted">Belum ada investasi aktif — hasil harian muncul setelah Anda berinvestasi.</p>
          )}
        </div>
      </section>

      {/* Statistik utama */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Saldo IDR" value={formatIDR(Number(balance.balance))} />
        <StatCard label="Total Investasi" value={formatIDR(totalInvestasi)} />
        <StatCard label="Total Hasil" value={formatIDR(totalHasil)} />
        <StatCard
          label="Paket Aktif"
          value={`${aktif.length} paket`}
          hint={aktif.length > 0 ? 'Sedang berjalan' : 'Belum ada investasi aktif'}
        />
        <StatCard label="Referral Reward" value={formatIDR(rewardReferral)} />
        <StatCard label="Total Penarikan" value={formatIDR(Number(balance.total_withdrawn))} />
      </div>

      {/* Aksi cepat */}
      <div className="flex flex-wrap gap-3">
        <Link to="/deposit" className="btn btn-primary">
          Deposit
        </Link>
        <Link to="/paket" className="btn btn-accent">
          Pilih Paket
        </Link>
        <Link to="/investasi" className="btn btn-ghost">
          Investasi Saya
        </Link>
      </div>

      {/* Paket aktif */}
      <section aria-labelledby="paket-aktif">
        <h2 id="paket-aktif" className="section-title text-xl">
          Paket Aktif
        </h2>
        {aktif.length === 0 ? (
          <div className="card mt-4">
            <p className="text-sm text-muted">Belum ada investasi aktif. Pilih paket untuk mulai berinvestasi.</p>
            <Link to="/paket" className="btn btn-primary mt-4">
              Lihat Paket
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {aktif.slice(0, 4).map((inv) => {
              const hariBerjalan = daysBetween(inv.start_date, new Date())
              const persen = clampPercent((hariBerjalan / inv.duration_days) * 100)
              return (
                <div key={inv.id} className="card">
                  <div className="flex items-center justify-between">
                    <p className="font-display font-bold text-ink">{inv.package_name}</p>
                    <StatusBadge status="aktif" />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {formatIDR(Number(inv.amount))} · {Number(inv.rate_min)}%–{Number(inv.rate_max)}%
                  </p>
                  <div className="mt-3">
                    <ProgressBar percent={persen} />
                    <p className="mt-1 text-xs text-muted">
                      Hari ke-{Math.max(0, hariBerjalan)} dari {inv.duration_days} · hasil harian siap:{' '}
                      {formatIDR(siapCairPerPaket.find((s) => s.inv.id === inv.id)?.nominal ?? 0)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Aktivitas terbaru */}
      <section aria-labelledby="aktivitas-terbaru">
        <div className="flex items-center justify-between">
          <h2 id="aktivitas-terbaru" className="section-title text-xl">
            Aktivitas Terbaru
          </h2>
          <Link to="/aktivitas" className="text-sm text-primary hover:underline cursor-pointer">
            Lihat semua
          </Link>
        </div>
        {transactions.length === 0 ? (
          <div className="card mt-4">
            <p className="text-sm text-muted">Belum ada aktivitas.</p>
          </div>
        ) : (
          <ul className="card mt-4 divide-y divide-line p-0">
            {transactions.map((t) => (
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
      </section>
    </div>
  )
}
