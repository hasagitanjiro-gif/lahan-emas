export type InvestmentStatus = 'aktif' | 'selesai' | 'sudah_diklaim'

export interface Profile {
  id: string
  full_name: string
  referral_code: string
  referred_by: string | null
  created_at: string
}

export interface Balance {
  user_id: string
  balance: number
  total_invested: number
  total_earned: number
  referral_reward_total: number
  total_withdrawn: number
}

export interface PackageRow {
  id: string
  name: string
  rate_min: number
  rate_max: number
  duration_days: number
  min_amount: number
  max_amount: number
  description: string | null
  is_active: boolean
}

export interface Investment {
  id: string
  user_id: string
  package_id: string
  package_name: string
  amount: number
  rate_min: number
  rate_max: number
  duration_days: number
  start_date: string
  end_date: string
  claim_amount: number | null
  locked_rate: number | null
  total_return: number | null
  profit_paid: number
  profit_days_paid: number
  status: InvestmentStatus
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: 'deposit' | 'investasi' | 'klaim' | 'referral_reward' | 'voucher_rabat' | 'penarikan'
  amount: number
  description: string
  reference_id: string | null
  created_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  referred_name: string | null
  referred_code: string
  is_valid: boolean
  reward_amount: number | null
  rewarded_at: string | null
  created_at: string
}

export interface ReferralReward {
  id: string
  referrer_id: string
  referred_id: string
  investment_id: string
  amount: number
  created_at: string
}

export interface VoucherLevelRow {
  id: string
  level: number
  name: string
  rabat_percent: number
  min_total_investment: number
}

export interface DashboardData {
  profile: Profile
  balance: Balance
  activeInvestments: Investment[]
  recentTransactions: Transaction[]
  referralCount: number
  validReferralCount: number
  referralRewardTotal: number
}
