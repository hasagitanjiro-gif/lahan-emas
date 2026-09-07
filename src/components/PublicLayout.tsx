import { Link, Outlet, useLocation } from 'react-router-dom'
import { Logo } from './AppLayout'

export default function PublicLayout() {
  const location = useLocation()
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/masuk" className="btn btn-ghost">
              Masuk
            </Link>
            <Link to="/daftar" className="btn btn-primary">
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <main key={location.pathname} className="anim-fade-in">
        <Outlet />
      </main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
          <Logo />
          <div className="hairline max-w-xs" />
          <p className="max-w-md text-xs text-muted">
            Platform investasi simulasi untuk MVP. Deposit, hasil, dan penarikan bersifat simulasi — tanpa
            integrasi bank, kripto, atau blockchain.
          </p>
        </div>
      </footer>
    </div>
  )
}
