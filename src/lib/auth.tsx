import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { fetchBalance, rpcAccrueProfits } from './api'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  /** Saldo IDR user saat ini (null = belum dimuat) */
  saldo: number | null
  /** Muat ulang saldo dari server (dipanggil setelah deposit/klaim/penarikan) */
  refreshSaldo: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  saldo: null,
  refreshSaldo: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [saldo, setSaldo] = useState<number | null>(null)

  const refreshSaldo = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user.id
    if (!uid) {
      setSaldo(null)
      return
    }
    try {
      // Akrual hasil harian dulu agar saldo selalu memuat hasil terbaru yang bisa ditarik
      await rpcAccrueProfits().catch(() => undefined)
      const b = await fetchBalance(uid)
      setSaldo(Number(b.balance))
    } catch {
      setSaldo(null)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
      if (data.session) refreshSaldo()
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(false)
      if (s) refreshSaldo()
      else setSaldo(null)
    })

    return () => sub.subscription.unsubscribe()
  }, [refreshSaldo])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSaldo(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, saldo, refreshSaldo, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
