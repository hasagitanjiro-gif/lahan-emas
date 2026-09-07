import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { rpcDeposit, ambilPesanError, pesanError } from '../lib/api'
import { formatIDR, formatNumberInput, parseNumberInput } from '../lib/format'
import { MIN_DEPOSIT, MAX_DEPOSIT } from '../config/config'
import { ErrorBanner, SuccessBanner } from '../components/ui'

export default function Deposit() {
  const { saldo, refreshSaldo } = useAuth()
  const [jumlahText, setJumlahText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sukses, setSukses] = useState<string | null>(null)

  const jumlah = parseNumberInput(jumlahText)
  const valid = jumlah >= MIN_DEPOSIT && jumlah <= MAX_DEPOSIT

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSukses(null)

    if (!valid) {
      setError(`Nominal deposit harus antara ${formatIDR(MIN_DEPOSIT)} dan ${formatIDR(MAX_DEPOSIT)}.`)
      return
    }

    setLoading(true)
    try {
      const res = await rpcDeposit(jumlah)
      if (!res.ok) {
        setError(pesanError(res.error ?? null))
        return
      }
      setSukses(`Deposit ${formatIDR(jumlah)} berhasil masuk ke saldo Anda.`)
      setJumlahText('')
      await refreshSaldo()
    } catch (err) {
      setError(ambilPesanError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">Deposit</h1>
        <p className="mt-1 text-sm text-muted">
          Deposit simulasi — dana langsung masuk ke saldo IDR Anda.
        </p>
      </div>

      {sukses && <SuccessBanner message={sukses} />}
      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label htmlFor="jumlah" className="label">
            Nominal Deposit (IDR)
          </label>
          <input
            id="jumlah"
            type="text"
            inputMode="numeric"
            className="input"
            placeholder="cth: 1.000.000"
            value={jumlahText}
            onChange={(e) => setJumlahText(formatNumberInput(e.target.value))}
          />
          <p className="mt-1 text-xs text-muted">
            Minimal {formatIDR(MIN_DEPOSIT)} · Maksimal {formatIDR(MAX_DEPOSIT)}
          </p>
        </div>

        <div className="rounded-xl bg-surface2 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Saldo saat ini</span>
            <span className="font-semibold text-ink">{formatIDR(saldo ?? 0)}</span>
          </div>
        </div>

        {/* Nominal cepat */}
        <div className="flex flex-wrap gap-2">
          {[500_000, 1_000_000, 5_000_000, 10_000_000].map((v) => (
            <button
              key={v}
              type="button"
              className="btn btn-ghost cursor-pointer text-xs"
              onClick={() => setJumlahText(formatNumberInput(String(v)))}
            >
              {formatIDR(v)}
            </button>
          ))}
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full cursor-pointer">
          {loading ? 'Memproses…' : 'Deposit Sekarang'}
        </button>
      </form>

      <p className="text-center text-xs text-muted">
        Simulasi MVP: tidak ada integrasi bank atau pembayaran nyata.
      </p>
    </div>
  )
}
