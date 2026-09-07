import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { formatIDR } from '../lib/format'
import { GoldMark } from './ui'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Lahan Emas">
      <GoldMark />
      <span className="font-display text-lg font-bold tracking-wide text-ink">
        Lahan<span className="text-gold-gradient">Emas</span>
      </span>
    </Link>
  )
}

const NAV_ITEMS = [
  { to: '/beranda', label: 'Beranda' },
  { to: '/paket', label: 'Paket' },
  { to: '/investasi', label: 'Investasi Saya' },
  { to: '/deposit', label: 'Deposit' },
  { to: '/penarikan', label: 'Penarikan' },
  { to: '/referral', label: 'Referral' },
  { to: '/voucher', label: 'Voucher Rabat' },
  { to: '/aktivitas', label: 'Aktivitas' },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
      isActive
        ? 'border border-primary/30 bg-primary/10 text-primary'
        : 'border border-transparent text-muted hover:bg-surface2 hover:text-ink'
    }`
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} className={navClass} onClick={onNavigate}>
          {item.label}
        </NavLink>
      ))}
    </>
  )
}

export default function AppLayout() {
  const { saldo, signOut } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const saldoText = saldo === null ? 'Rp…' : formatIDR(saldo)

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface/60 px-4 py-5 lg:flex">
        <Logo />
        <div className="mt-6 rounded-2xl border border-primary/25 bg-primary/5 p-4">
          <p className="stat-label">Saldo IDR</p>
          <p className="stat-value mt-1 text-gold-gradient">{saldoText}</p>
          <div className="mt-3 flex gap-2">
            <Link to="/deposit" className="btn btn-primary flex-1 px-2 py-1.5 text-xs">
              Deposit
            </Link>
            <Link to="/penarikan" className="btn btn-ghost flex-1 px-2 py-1.5 text-xs">
              Tarik
            </Link>
          </div>
        </div>
        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto" aria-label="Navigasi utama">
          <NavLinks />
        </nav>
        <button
          type="button"
          onClick={() => signOut()}
          className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface2 hover:text-danger cursor-pointer"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 12H4m0 0 4-4m-4 4 4 4M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Keluar
        </button>
      </aside>

      {/* Bilah atas mobile */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Logo />
            <div className="flex items-center gap-2">
              <span className="badge border-primary/30 bg-primary/10 text-primary">{saldoText}</span>
              <button
                type="button"
                className="btn btn-ghost px-2.5"
                aria-expanded={menuOpen}
                aria-label="Buka menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {menuOpen ? (
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  ) : (
                    <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav className="space-y-1 border-t border-line px-4 py-3" aria-label="Navigasi utama">
              <NavLinks onNavigate={() => setMenuOpen(false)} />
              <button
                type="button"
                onClick={() => signOut()}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-danger hover:bg-surface2 cursor-pointer"
              >
                Keluar
              </button>
            </nav>
          )}
        </header>

        <main key={location.pathname} className="anim-fade-in mx-auto max-w-5xl px-4 py-6 md:py-8">
          <Outlet />
        </main>

        <footer className="border-t border-line py-6">
          <p className="mx-auto max-w-5xl px-4 text-center text-xs text-muted">
            LahanEmas — platform investasi simulasi. Deposit, hasil, dan penarikan bersifat simulasi untuk MVP.
          </p>
        </footer>
      </div>
    </div>
  )
}
