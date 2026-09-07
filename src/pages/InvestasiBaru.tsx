import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { fetchPackages, rpcCreateInvestment, ambilPesanError, pesanError } from '../lib/api'
import { formatIDR, formatNumberInput, parseNumberInput, formatDate, addDays } from '../lib/format'
import { Spinner, ErrorState, ErrorBanner, SuccessBanner } from '../components/ui'
import type { PackageRow } from '../types/db'

type Tahap = 'input' | 'ringkasan' | 'sukses'

export default function InvestasiBaru() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const packageId = searchParams.get('package') ?? ''
  const { saldo, refreshSaldo } = useAuth()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pkg, setPkg] = useState<PackageRow | null>(null)

  const [tahap, setTahap] = useState<Tahap>('input')
  const [jumlahText, setJumlahText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hasilId, setHasilId] = useState<string | null>(null)

  useEffect(() => {
    let batal = false
    setLoading(true)
    setLoadError(null)
    fetchPackages()
      .then((rows) => {
        if (batal) return
        const found = rows.find((r) => r.id === packageId) ?? null
        setPkg(found)
      })
      .catch((e) => {
        if (!batal) setLoadError(ambilPesanError(e))
      })
      .finally(() => {
        if (!batal) setLoading(false)
      })
    return () => {
      batal = true
    }
  }, [packageId])

  if (loading) return <Spinner label="Memuat paket…" />
  if (loadError) return <ErrorState message={loadError} />
  if (!pkg)
    return (
      <ErrorState
        message="Paket tidak ditemukan. Pilih salah satu paket berikut."
        onRetry={() => navigate('/paket')}
      />
    )

  const jumlah = parseNumberInput(jumlahText)
  const minNum = Number(pkg.min_amount)
  const maxNum = Number(pkg.max_amount)
  const validasiNominal = jumlah >= minNum && jumlah <= maxNum
  const saldoCukup = saldo !== null && saldo >= jumlah && jumlah > 0

  const tanggalMulai = new Date()
  const tanggalSelesai = addDays(tanggalMulai, pkg.duration_days)

  async function konfirmasi() {
    if (!pkg) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await rpcCreateInvestment(pkg.id, jumlah)
      if (!res.ok) {
        setSubmitError(pesanError(res.error ?? null))
        setTahap('input')
        return
      }
      setHasilId(res.investment_id ?? null)
      setTahap('sukses')
      await refreshSaldo()
    } catch (err) {
      setSubmitError(ambilPesanError(err))
      setTahap('input')
    } finally {
      setSubmitting(false)
    }
  }

  if (tahap === 'sukses') {
    return (
      <div className="card mx-auto mt-10 max-w-lg text-center">
        <SuccessBanner message="Investasi berhasil dibuat. Saldo Anda telah berkurang sesuai nominal." />
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Investasi Aktif</h1>
        <p className="mt-2 text-sm text-muted">
          Investasi Anda berjalan selama {pkg.duration_days} hari. Pantau di halaman Investasi Saya dan klaim
          setelah selesai.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/investasi" className="btn btn-primary">
            Lihat Investasi Saya
          </Link>
          <Link to="/beranda" className="btn btn-ghost">
            Ke Beranda
          </Link>
        </div>
        {hasilId && <p className="mt-4 text-xs text-muted">ID: {hasilId}</p>}
      </div>
    )
  }

  if (tahap === 'ringkasan') {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="font-display text-2xl font-bold text-ink">Ringkasan Investasi</h1>
        <div className="card space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Paket</span>
            <span className="font-semibold text-ink">{pkg.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Jumlah Investasi</span>
            <span className="font-semibold text-ink">{formatIDR(jumlah)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Profit / Cashback</span>
            <span className="font-semibold text-primary">
              {Number(pkg.rate_min)}%–{Number(pkg.rate_max)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Durasi</span>
            <span className="font-semibold text-ink">{pkg.duration_days} hari</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Tanggal Mulai</span>
            <span className="font-semibold text-ink">{formatDate(tanggalMulai.toISOString())}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Tanggal Selesai</span>
            <span className="font-semibold text-ink">{formatDate(tanggalSelesai.toISOString())}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-sm">
            <span className="text-muted">Saldo saat ini</span>
            <span className="font-semibold text-ink">{formatIDR(saldo ?? 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Saldo setelah investasi</span>
            <span className="font-semibold text-ink">{formatIDR((saldo ?? 0) - jumlah)}</span>
          </div>
        </div>

        {submitError && <ErrorBanner message={submitError} />}

        <div className="flex gap-3">
          <button
            type="button"
            className="btn btn-ghost flex-1 cursor-pointer"
            onClick={() => setTahap('input')}
            disabled={submitting}
          >
            Kembali
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1 cursor-pointer"
            onClick={konfirmasi}
            disabled={submitting}
          >
            {submitting ? 'Memproses…' : 'Konfirmasi Investasi'}
          </button>
        </div>
        <p className="text-center text-xs text-muted">
          Dengan mengonfirmasi, saldo dipotong sebesar jumlah investasi. Hasil harian bisa dicairkan kapan saja; modal kembali penuh saat jatuh tempo.
        </p>
      </div>
    )
  }

  // Tahap input
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Investasi Baru — {pkg.name}</h1>
        <p className="mt-1 text-sm text-muted">
          Profit/cashback {Number(pkg.rate_min)}%–{Number(pkg.rate_max)}% · durasi {pkg.duration_days} hari
        </p>
      </div>

      <div className="card space-y-4">
        <div>
          <label htmlFor="jumlah" className="label">
            Jumlah Investasi (IDR)
          </label>
          <input
            id="jumlah"
            type="text"
            inputMode="numeric"
            className="input"
            placeholder={formatNumberInput(String(pkg.min_amount))}
            value={jumlahText}
            onChange={(e) => setJumlahText(formatNumberInput(e.target.value))}
          />
          <p className="mt-1 text-xs text-muted">
            Minimal {formatIDR(minNum)} · Maksimal {formatIDR(maxNum)}
          </p>
        </div>

        <div className="rounded-xl bg-surface2 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Saldo Anda</span>
            <span className="font-semibold text-ink">{formatIDR(saldo ?? 0)}</span>
          </div>
        </div>

        {jumlah > 0 && !validasiNominal && (
          <ErrorBanner message={`Nominal harus antara ${formatIDR(minNum)} dan ${formatIDR(maxNum)}.`} />
        )}
        {jumlah > 0 && validasiNominal && !saldoCukup && (
          <ErrorBanner
            message={'Saldo tidak cukup. Deposit dulu untuk melanjutkan.'}
          />
        )}

        <div className="flex gap-3">
          <button type="button" className="btn btn-ghost flex-1 cursor-pointer" onClick={() => navigate('/paket')}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1 cursor-pointer"
            disabled={!validasiNominal || !saldoCukup}
            onClick={() => setTahap('ringkasan')}
          >
            Lanjut ke Ringkasan
          </button>
        </div>
      </div>
    </div>
  )
}
