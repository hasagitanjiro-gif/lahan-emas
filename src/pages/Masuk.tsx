import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ambilPesanError } from '../lib/api'
import { GoldMark } from '../components/ui'

export default function Masuk() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const baruDaftar = searchParams.get('daftar') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Email wajib diisi.')
      return
    }
    if (!password) {
      setError('Kata sandi wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/beranda')
    } catch (err) {
      setError(ambilPesanError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-md pb-16">
      <GoldMark className="h-9 w-9" />
      <h1 className="mt-3 font-display text-3xl font-bold text-ink">Masuk</h1>
      <p className="mt-1 text-sm text-muted">Masuk untuk mengelola investasi Anda.</p>

      {baruDaftar && (
        <div className="mt-4 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary" role="status">
          Pendaftaran berhasil. Silakan masuk dengan akun baru Anda.
        </div>
      )}

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4">
        {error && (
          <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            {error}
          </div>
        )}

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
            placeholder="Kata sandi Anda"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full cursor-pointer">
          {loading ? 'Memproses…' : 'Masuk'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">
        Belum punya akun?{' '}
        <Link to="/daftar" className="text-primary hover:underline cursor-pointer">
          Daftar di sini
        </Link>
      </p>
    </div>
  )
}
