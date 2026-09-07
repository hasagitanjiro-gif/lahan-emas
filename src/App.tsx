import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import PublicLayout from './components/PublicLayout'
import AppLayout from './components/AppLayout'
import Landing from './pages/Landing'
import Daftar from './pages/Daftar'
import Masuk from './pages/Masuk'
import Beranda from './pages/Beranda'
import Paket from './pages/Paket'
import InvestasiBaru from './pages/InvestasiBaru'
import InvestasiSaya from './pages/InvestasiSaya'
import Deposit from './pages/Deposit'
import Penarikan from './pages/Penarikan'
import Referral from './pages/Referral'
import VoucherRabat from './pages/VoucherRabat'
import Aktivitas from './pages/Aktivitas'

function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth()
  if (loading) return <SplashScreen />
  if (!session) return <Navigate to="/masuk" replace />
  return children
}

function GuestOnly({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth()
  if (loading) return <SplashScreen />
  if (session) return <Navigate to="/beranda" replace />
  return children
}

function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <svg className="h-10 w-10 animate-pulse text-primary" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="10" width="18" height="8" rx="2" fill="currentColor" />
          <rect x="6" y="5" width="12" height="5" rx="1.5" fill="currentColor" opacity="0.5" />
        </svg>
        <p className="text-sm text-muted">Memuat…</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Publik */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route
            path="/daftar"
            element={
              <GuestOnly>
                <Daftar />
              </GuestOnly>
            }
          />
          <Route
            path="/masuk"
            element={
              <GuestOnly>
                <Masuk />
              </GuestOnly>
            }
          />
        </Route>

        {/* Setelah login */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/beranda" element={<Beranda />} />
          <Route path="/paket" element={<Paket />} />
          <Route path="/paket/investasi" element={<InvestasiBaru />} />
          <Route path="/investasi" element={<InvestasiSaya />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/penarikan" element={<Penarikan />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/voucher" element={<VoucherRabat />} />
          <Route path="/aktivitas" element={<Aktivitas />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
