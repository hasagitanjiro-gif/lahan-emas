import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ambilPesanError } from '../lib/api'
import { GoldMark } from '../components/ui'

export default function Daftar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const refFromUrl = searchParams.get('ref') ?? ''

  const [nama, setNama] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referral, setReferral] = useState(refFromUrl ? refFromUrl.toUpperCase() : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!nama.trim()) {
      setError('Nama lengkap wajib diisi.')
      return
    }
    if (!email.trim()) {
      setError('Email wajib diisi.')
      return
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: nama.trim(), referral_code: referral.trim() || null },
        },
      })
      if (error) throw error

      // Jika verifikasi email aktif di Supabase, pengguna tidak langsung login.
      // Tampilkan layar sukses; tombol "Masuk Sekarang" tersedia.
      navigate('/masuk?daftar=1')
    } catch (err) {
      setError(ambilPesanError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-md pb-16">
      <GoldMark className="h-9 w-9" />
      <h1 className="mt-3 font-display text-3xl font-bold text-ink">Daftar</h1>
      <p className="mt-1 text-sm text-muted">Buat akun untuk mulai investasi.</p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
        {error && (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="nama" className="label">
            Nama Lengkap
          </label>
          <input
            id="nama"
            type="text"
            className="input"
            placeholder="cth: Budi Santoso"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Kata Sandi
          </label>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="referral" className="label">
            Kode Referral (opsional)
          </label>
          <input
            id="referral"
            type="text"
            className="input"
            placeholder="Kode teman Anda"
            value={referral}
            onChange={(e) => setReferral(e.target.value.toUpperCase())}
          />
          <p className="mt-1 text-xs text-muted">
            Isi jika Anda direferensikan. Referral menjadi valid setelah investasi pertama yang valid.
          </p>
          <p className="mt-1 text-xs text-muted">Referral diri sendiri otomatis ditolak.</p>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full cursor-pointer">
          {loading ? 'Memproses…' : 'Daftar'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Sudah punya akun?{' '}
        <Link to="/masuk" className="text-primary hover:underline cursor-pointer">
          Masuk di sini
        </Link>
      </p>
    </div>
  )
}
