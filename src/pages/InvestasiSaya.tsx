import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { fetchInvestments, rpcClaimInvestment, rpcClaimProfit, rpcAccrueProfits, ambilPesanError, pesanError } from '../lib/api'
import { formatIDR, formatDate, daysBetween, clampPercent } from '../lib/format'
import { Spinner, ErrorState, EmptyState, ProgressBar, StatusBadge, ErrorBanner, SuccessBanner } from '../components/ui'
import type { Investment, InvestmentStatus } from '../types/db'

/** Status tampilan: 'aktif' berjalan, 'selesai' bisa diklaim, 'sudah_diklaim' */
function statusTampil(inv: Investment): InvestmentStatus {
  if (inv.status === 'sudah_diklaim') return 'sudah_diklaim'
  const selesai = new Date(inv.end_date).getTime() <= Date.now()
  return selesai ? 'selesai' : 'aktif'
}

export default function InvestasiSaya() {
  const { session, refreshSaldo } = useAuth()
  const uid = session?.user.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [investments, setInvestments] = useState<Investment[]>([])

  const [klaimId, setKlaimId] = useState<string | null>(null)
  const [profitId, setProfitId] = useState<string | null>(null)
  const [klaimError, setKlaimError] = useState<string | null>(null)
  const [klaimSukses, setKlaimSukses] = useState<string | null>(null)

  const muat = useCallback(() => {
    if (!uid) return
    setLoading(true)
    setError(null)
    // Akrual hasil harian dulu supaya daftar investasi memuat hasil terbaru
    ;(async () => {
      try {
        await rpcAccrueProfits()
      } catch {
        // Akrual gagal — tetap tampilkan data terakhir yang tersimpan
      }
      return fetchInvestments(uid)
    })()
      .then((rows) => setInvestments(rows))
      .catch((e) => setError(ambilPesanError(e)))
      .finally(() => setLoading(false))
  }, [uid])

  useEffect(() => {
    muat()
  }, [muat])

  async function klaimHarian(inv: Investment) {
    setProfitId(inv.id)
    setKlaimError(null)
    setKlaimSukses(null)
    try {
      const res = await rpcClaimProfit(inv.id)
      if (!res.ok) {
        setKlaimError(pesanError(res.error ?? null))
        return
      }
      setKlaimSukses(
        `Hasil harian berhasil diklaim. ${formatIDR(Number(res.amount ?? 0))} masuk ke saldo IDR Anda.`,
      )
      muat()
      await refreshSaldo()
    } catch (err) {
      setKlaimError(ambilPesanError(err))
    } finally {
      setProfitId(null)
    }
  }

  async function klaim(inv: Investment) {
    setKlaimId(inv.id)
    setKlaimError(null)
    setKlaimSukses(null)
    try {
      const res = await rpcClaimInvestment(inv.id)
      if (!res.ok) {
        setKlaimError(pesanError(res.error ?? null))
        return
      }
      setKlaimSukses(
        `Klaim berhasil. ${formatIDR(Number(res.claim_amount ?? 0))} masuk ke saldo IDR Anda.`,
      )
      muat()
      await refreshSaldo()
    } catch (err) {
      setKlaimError(ambilPesanError(err))
    } finally {
      setKlaimId(null)
    }
  }

  if (loading) return <Spinner label="Memuat investasi…" />
  if (error) return <ErrorState message={error} onRetry={muat} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">Investasi Saya</h1>
        <p className="mt-1 text-sm text-muted">
          Semua investasi Anda. Hasil harian masuk otomatis ke saldo dan bisa ditarik kapan saja; modal kembali penuh di hari ke-150.
        </p>
      </div>

      {klaimSukses && <SuccessBanner message={klaimSukses} />}
      {klaimError && <ErrorBanner message={klaimError} />}

      {investments.length === 0 ? (
        <EmptyState
          title="Belum ada investasi"
          description="Mulai dengan memilih salah satu paket investasi kami."
          action={
            <Link to="/paket" className="btn btn-primary">
              Lihat Paket
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {investments.map((inv) => {
            const st = statusTampil(inv)
            const hariBerjalan = daysBetween(inv.start_date, new Date())
            const persen = clampPercent((hariBerjalan / inv.duration_days) * 100)
            const rateKunci = inv.locked_rate != null ? Number(inv.locked_rate) : null
            const totalHasil = inv.total_return != null ? Number(inv.total_return) : null
            const hariTerbayar = Number(inv.profit_days_paid ?? 0)
            const sudahDibayar = Number(inv.profit_paid ?? 0)
            const hariTersedia = Math.max(0, Math.min(hariBerjalan, inv.duration_days) - hariTerbayar)
            const bisaKlaimHarian = st === 'aktif' && hariTersedia > 0
            return (
              <div key={inv.id} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-display font-bold text-ink">{inv.package_name}</p>
                  <StatusBadge status={st} />
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted">Modal</dt>
                    <dd className="font-semibold text-ink">{formatIDR(Number(inv.amount))}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Rate</dt>
                    <dd className="font-semibold text-ink">
                      {rateKunci != null ? `${rateKunci}% (terkunci)` : `${Number(inv.rate_min)}%–${Number(inv.rate_max)}%`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Durasi</dt>
                    <dd className="font-semibold text-ink">{inv.duration_days} hari</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Tanggal Mulai</dt>
                    <dd className="font-semibold text-ink">{formatDate(inv.start_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Tanggal Selesai</dt>
                    <dd className="font-semibold text-ink">{formatDate(inv.end_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Estimasi Hasil</dt>
                    <dd className="font-semibold text-primary">
                      {totalHasil != null
                        ? formatIDR(totalHasil)
                        : `${formatIDR((Number(inv.amount) * Number(inv.rate_min)) / 100)} – ${formatIDR((Number(inv.amount) * Number(inv.rate_max)) / 100)}`}
                    </dd>
                  </div>
                </dl>

                {st === 'aktif' && (
                  <div className="space-y-3">
                    <ProgressBar percent={persen} />
                    <p className="text-xs text-muted">
                      Hasil berjalan: hari ke-{Math.max(0, hariBerjalan)} dari {inv.duration_days} ·{' '}
                      {Math.round(persen)}%
                    </p>
                    {totalHasil != null && (
                      <div className="rounded-xl bg-surface2 p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted">Hasil siap diklaim</span>
                          <span className="font-semibold text-primary">
                            {formatIDR(Math.round((totalHasil / inv.duration_days) * hariTersedia))}
                          </span>
                        </div>
                        <div className="mt-1 flex justify-between">
                          <span className="text-muted">Sudah dicairkan</span>
                          <span className="font-semibold text-ink">{formatIDR(sudahDibayar)}</span>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted">
                      Hasil yang sudah dicairkan bisa langsung ditarik lewat halaman Penarikan.
                    </p>
                    <button
                      type="button"
                      className="btn btn-accent w-full cursor-pointer"
                      onClick={() => klaimHarian(inv)}
                      disabled={!bisaKlaimHarian || profitId === inv.id}
                    >
                      {profitId === inv.id
                        ? 'Memproses…'
                        : bisaKlaimHarian
                          ? 'Klaim Hasil Harian'
                          : 'Hasil hari ini sudah diklaim'}
                    </button>
                  </div>
                )}

                {st === 'selesai' && (
                  <button
                    type="button"
                    className="btn btn-accent w-full cursor-pointer"
                    onClick={() => klaim(inv)}
                    disabled={klaimId === inv.id}
                  >
                    {klaimId === inv.id ? 'Memproses klaim…' : 'Klaim Akhir — Modal Kembali + Sisa Hasil'}
                  </button>
                )}

                {st === 'sudah_diklaim' && (
                  <div className="rounded-xl bg-surface2 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Klaim akhir</span>
                      <span className="font-semibold text-ink">
                        {formatIDR(Number(inv.claim_amount ?? 0))}
                      </span>
                    </div>
                    {sudahDibayar > 0 && (
                      <div className="mt-1 flex justify-between">
                        <span className="text-muted">Termasuk hasil harian</span>
                        <span className="font-semibold text-ink">{formatIDR(sudahDibayar)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
