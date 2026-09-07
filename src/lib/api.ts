import { supabase } from './supabase'
import { REFERRAL_BONUS_PERCENT } from '../config/config'
import type {
  Balance,
  Investment,
  PackageRow,
  Profile,
  Referral,
  ReferralReward,
  Transaction,
  VoucherLevelRow,
} from '../types/db'

/** Pesan error server (kode dari RPC) diterjemahkan ke Bahasa Indonesia */
const ERROR_MAP: Record<string, string> = {
  UNAUTHENTICATED: 'Sesi berakhir. Silakan masuk kembali.',
  MIN_DEPOSIT: 'Deposit minimal Rp50.000.',
  MIN_WITHDRAWAL: 'Penarikan minimal Rp50.000.',
  SALDO_TIDAK_CUKUP: 'Saldo tidak cukup.',
  PAKET_TIDAK_TERSEDIA: 'Paket tidak tersedia.',
  NOMINAL_TIDAK_SESAI: 'Nominal investasi di luar batas paket.',
  TIDAK_DITEMUKAN: 'Investasi tidak ditemukan.',
  SUDAH_DIKLAIM: 'Investasi ini sudah diklaim sebelumnya.',
  BELUM_JATUH_TEMPO: 'Investasi belum selesai. Klaim akhir tersedia setelah 150 hari.',
  BELUM_ADA_HASIL: 'Hasil hari ini sudah masuk ke saldo Anda. Hasil berikutnya bertambah besok.',
}

export function pesanError(errorCode: string | null, fallback?: string): string {
  if (errorCode && ERROR_MAP[errorCode]) return ERROR_MAP[errorCode]
  return fallback ?? 'Terjadi kesalahan. Coba lagi.'
}

/** Ambil pesan error dari exception Supabase/Postgres */
export function ambilPesanError(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const msg = String((e as { message: unknown }).message)
    const kode = ERROR_MAP[msg] ? msg : null
    return pesanError(kode, msg)
  }
  return 'Terjadi kesalahan. Coba lagi.'
}

// ---------------------------------------------------------------------------
// Data user
// ---------------------------------------------------------------------------

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as Profile
}

export async function fetchBalance(userId: string): Promise<Balance> {
  const { data, error } = await supabase
    .from('balances')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return data as Balance
}

export async function fetchPackages(): Promise<PackageRow[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('id')
  if (error) throw error
  return (data ?? []) as PackageRow[]
}

export async function fetchInvestments(userId: string): Promise<Investment[]> {
  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Investment[]
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as Transaction[]
}

export async function fetchReferrals(userId: string): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Referral[]
}

export async function fetchReferralRewards(userId: string): Promise<ReferralReward[]> {
  const { data, error } = await supabase
    .from('referral_rewards')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ReferralReward[]
}

export async function fetchVoucherLevels(): Promise<VoucherLevelRow[]> {
  const { data, error } = await supabase
    .from('voucher_levels')
    .select('*')
    .order('level')
  if (error) throw error
  return (data ?? []) as VoucherLevelRow[]
}

// ---------------------------------------------------------------------------
// Mutasi (semua via RPC — saldo tidak pernah dikirim dari klien)
// ---------------------------------------------------------------------------

interface RpcResult {
  ok: boolean
  error?: string
  investment_id?: string
  claim_amount?: number
  amount?: number
  days?: number
  rate?: number
}

async function callRpc(fn: string, args: Record<string, unknown>): Promise<RpcResult> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error
  return data as RpcResult
}

export async function rpcDeposit(amount: number): Promise<RpcResult> {
  return callRpc('fn_deposit', { p_amount: amount })
}

export async function rpcWithdraw(amount: number): Promise<RpcResult> {
  return callRpc('fn_withdraw', { p_amount: amount })
}

export async function rpcCreateInvestment(packageId: string, amount: number): Promise<RpcResult> {
  return callRpc('fn_create_investment', { p_package_id: packageId, p_amount: amount })
}

export async function rpcClaimInvestment(investmentId: string): Promise<RpcResult> {
  return callRpc('fn_claim_investment', { p_investment_id: investmentId })
}

export async function rpcClaimProfit(investmentId: string): Promise<RpcResult> {
  return callRpc('fn_claim_profit', { p_investment_id: investmentId })
}

/** Akrual hasil harian semua investasi aktif langsung ke saldo (bisa ditarik) */
export async function rpcAccrueProfits(): Promise<RpcResult> {
  return callRpc('fn_accrue_profits', {})
}

/** Persentase bonus referral untuk ditampilkan di UI (sumber: config pusat) */
export function referralBonusPercent(): number {
  return REFERRAL_BONUS_PERCENT
}
