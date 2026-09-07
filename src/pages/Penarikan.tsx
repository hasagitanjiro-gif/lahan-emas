import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { rpcWithdraw, ambilPesanError, pesanError } from '../lib/api'
import { formatIDR, formatNumberInput, parseNumberInput } from '../lib/format'
import { MIN_WITHDRAWAL } from '../config/config'
import { ErrorBanner, SuccessBanner } from '../components/ui'

export default function Penarikan() {
  const { saldo, refreshSaldo } = useAuth()
  const [jumlahText, setJumlahText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sukses, setSukses] = useState<string | null>(null)

  const jumlah = parseNumberInput(jumlahText)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSukses(null)

    if (jumlah < MIN_WITHDRAWAL) {
      setError(`Penarikan minimal ${formatIDR(MIN_WITHDRAWAL)}.`)
      return
    }
    if (saldo !== null && jumlah > saldo) {
      setError('Saldo tidak cukup.')
      return
    }

    setLoading(true)
    try {
      const res = await rpcWithdraw(jumlah)
      if (!res.ok) {
        setError(pesanError(res.error ?? null))
        return
      }
      setSukses(`Penarikan ${formatIDR(jumlah)} berhasil diproses (simulasi).`)
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
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">Penarikan</h1>
        <p className="mt-1 text-sm text-muted">Penarikan simulasi dari saldo IDR Anda.</p>
      </div>

      {sukses && <SuccessBanner message={sukses} />}
      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label htmlFor="jumlah" className="label">
            Nominal Penarikan (IDR)
          </label>
          <input
            id="jumlah"
            type="text"
            inputMode="numeric"
            className="input"
            placeholder="cth: 500.000"
            value={jumlahText}
            onChange={(e) => setJumlahText(formatNumberInput(e.target.value))}
          />
          <p className="mt-1 text-xs text-muted">Minimal {formatIDR(MIN_WITHDRAWAL)}</p>
        </div>

        <div className="rounded-xl bg-surface2 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Saldo tersedia</span>
            <span className="font-semibold text-ink">{formatIDR(saldo ?? 0)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || saldo === 0}
          className="btn btn-primary w-full cursor-pointer"
        >
          {loading ? 'Memproses…' : 'Tarik Dana'}
        </button>
      </form>

      <p className="text-center text-xs text-muted">
        Simulasi MVP: dana tidak benar-benar dikirim ke rekening bank.
      </p>
    </div>
  )
}
