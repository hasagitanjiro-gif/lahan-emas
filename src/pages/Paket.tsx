import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPackages, ambilPesanError } from '../lib/api'
import { formatIDR } from '../lib/format'
import { Spinner, ErrorState, EmptyState } from '../components/ui'
import type { PackageRow } from '../types/db'

export default function Paket() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [packages, setPackages] = useState<PackageRow[]>([])

  useEffect(() => {
    let batal = false
    setLoading(true)
    setError(null)
    fetchPackages()
      .then((rows) => {
        if (!batal) setPackages(rows)
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
  }, [])

  if (loading) return <Spinner label="Memuat paket…" />
  if (error) return <ErrorState message={error} />
  if (packages.length === 0)
    return <EmptyState title="Paket belum tersedia" description="Coba lagi nanti." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink md:text-3xl">Paket Investasi</h1>
        <p className="mt-1 text-sm text-muted">
          Tiga paket, durasi 150 hari. Pilih yang sesuai dengan profil Anda.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {packages.map((p, i) => (
          <div key={p.id} className={'card flex flex-col' + (i === 0 ? ' border-primary/40' : '')}>
            <p className="font-display text-lg font-bold text-ink">{p.name}</p>
            <p className="mt-3 font-display text-3xl font-bold text-primary">
              {Number(p.rate_min)}%–{Number(p.rate_max)}%
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted">Profit / Cashback</p>
            {p.description && <p className="mt-4 text-sm text-muted">{p.description}</p>}
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="text-muted">Durasi</dt>
                <dd className="text-ink">{p.duration_days} hari</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Minimal</dt>
                <dd className="text-ink">{formatIDR(Number(p.min_amount))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Maksimal</dt>
                <dd className="text-ink">{formatIDR(Number(p.max_amount))}</dd>
              </div>
            </dl>
            <Link
              to={`/paket/investasi?package=${p.id}`}
              className="btn btn-primary mt-5 w-full cursor-pointer"
            >
              Pilih Paket
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
