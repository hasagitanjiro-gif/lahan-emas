import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { fetchBalance, fetchVoucherLevels, ambilPesanError } from '../lib/api'
import { formatIDR } from '../lib/format'
import { Spinner, ErrorState } from '../components/ui'
import type { VoucherLevelRow } from '../types/db'

export default function VoucherRabat() {
  const { session } = useAuth()
  const uid = session?.user.id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [levels, setLevels] = useState<VoucherLevelRow[]>([])
  const [totalInvestasi, setTotalInvestasi] = useState<number | null>(null)

  useEffect(() => {
    let batal = false
    setLoading(true)
    setError(null)
    const pekerjaan: Promise<void>[] = [
      fetchVoucherLevels().then((rows) => {
        if (!batal) setLevels(rows)
      }),
    ]
    if (uid) {
      pekerjaan.push(
        fetchBalance(uid).then((b) => {
          if (batal) return
          // Total investasi kumulatif = total_invested pada balances
          setTotalInvestasi(Number(b.total_invested))
        }),
      )
    }
    Promise.all(pekerjaan)
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

  if (loading) return <Spinner label="Memuat voucher rabat…" />
  if (error) return <ErrorState message={error} />

  // Level saat ini: syarat tertinggi yang terpenuhi
  let levelSaatIni: VoucherLevelRow = levels[0]
  for (const lvl of levels) {
    if (totalInvestasi !== null && Number(lvl.min_total_investment) <= totalInvestasi) {
      levelSaatIni = lvl
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">Voucher Rabat</h1>
        <p className="mt-1 text-sm text-muted">
          Naik level dengan total investasi kumulatif yang lebih besar.
        </p>
      </div>

      {/* Level saat ini */}
      <div className="card border-primary/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="stat-label">Level Anda Saat Ini</p>
            <p className="mt-1 font-display text-2xl font-bold text-primary">{levelSaatIni?.name ?? '—'}</p>
          </div>
          <div className="text-right">
            <p className="stat-label">Rabat Berlaku</p>
            <p className="mt-1 font-display text-2xl font-bold text-accent">
              {levelSaatIni ? `${Number(levelSaatIni.rabat_percent)}%` : '—'}
            </p>
          </div>
        </div>
        {totalInvestasi !== null && (
          <p className="mt-3 text-xs text-muted">
            Berdasarkan total investasi kumulatif Anda: {formatIDR(totalInvestasi)}
          </p>
        )}
      </div>

      {/* Tabel level */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Level</th>
              <th className="px-5 py-3 font-semibold">Rabat</th>
              <th className="px-5 py-3 font-semibold">Syarat Total Investasi</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((lvl) => {
              const tercapai = totalInvestasi !== null && totalInvestasi >= Number(lvl.min_total_investment)
              const ini = levelSaatIni && lvl.level === levelSaatIni.level
              return (
                <tr key={lvl.id} className={'border-b border-line last:border-0' + (ini ? ' bg-primary/5' : '')}>
                  <td className="px-5 py-3 font-semibold text-ink">{lvl.name}</td>
                  <td className="px-5 py-3 font-semibold text-accent">{Number(lvl.rabat_percent)}%</td>
                  <td className="px-5 py-3 text-muted">
                    {Number(lvl.min_total_investment) === 0 ? 'Tanpa syarat' : formatIDR(Number(lvl.min_total_investment))}
                  </td>
                  <td className="px-5 py-3">
                    {ini ? (
                      <span className="badge border-primary/40 bg-primary/10 text-primary">Level Anda</span>
                    ) : tercapai ? (
                      <span className="badge text-muted">Tercapai</span>
                    ) : (
                      <span className="badge text-muted">Belum Tercapai</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted">
        Rabat voucher diberikan sebagai transaksi Voucher Rabat saat klaim investasi, sesuai level yang berlaku.
      </p>
    </div>
  )
}
