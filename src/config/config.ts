/**
 * ============================================================
 *  KONFIGURASI PUSAT — ubah nilai di sini saja
 * ============================================================
 *  Semua angka bisnis (range profit, durasi, bonus referral,
 *  level voucher rabat) diatur dari file ini agar mudah
 *  dikonfigurasi tanpa menyentuh logika komponen.
 * ------------------------------------------------------------
 */

export interface PackageConfig {
  id: 'paket1' | 'paket2' | 'paket3'
  name: string
  /** Rentang profit/cashback dalam persen (bukan nilai pasti) */
  rateRange: [number, number]
  /** Durasi investasi dalam hari */
  durationDays: number
  /** Deskripsi singkat untuk kartu paket */
  description: string
  /** Nominal minimum & maksimum investasi per paket (IDR) */
  minAmount: number
  maxAmount: number
}

export interface VoucherLevelConfig {
  level: 1 | 2 | 3 | 4
  name: string
  /** Persentase rabat voucher */
  rabatPercent: number
  /** Syarat total investasi kumulatif (IDR) untuk mencapai level */
  minTotalInvestment: number
}

export const DURATION_DAYS = 150

export const PACKAGES: PackageConfig[] = [
  {
    id: 'paket1',
    name: 'Paket I',
    rateRange: [2, 7],
    durationDays: DURATION_DAYS,
    description: 'Rentang hasil paling lebar untuk modal yang ingin tumbuh agresif.',
    minAmount: 100_000,
    maxAmount: 50_000_000,
  },
  {
    id: 'paket2',
    name: 'Paket II',
    rateRange: [2, 5],
    durationDays: DURATION_DAYS,
    description: 'Keseimbangan antara potensi hasil dan stabilitas.',
    minAmount: 100_000,
    maxAmount: 50_000_000,
  },
  {
    id: 'paket3',
    name: 'Paket III',
    rateRange: [2, 4],
    durationDays: DURATION_DAYS,
    description: 'Pilihan konservatif dengan rentang hasil paling stabil.',
    minAmount: 100_000,
    maxAmount: 50_000_000,
  },
]

/** Bonus referral: 10% dari investasi pertama yang valid milik pengguna yang direferensikan */
export const REFERRAL_BONUS_PERCENT = 10

/** Level voucher rabat — urut dari level terendah */
export const VOUCHER_LEVELS: VoucherLevelConfig[] = [
  { level: 1, name: 'Level I', rabatPercent: 10, minTotalInvestment: 0 },
  { level: 2, name: 'Level II', rabatPercent: 5, minTotalInvestment: 5_000_000 },
  { level: 3, name: 'Level III', rabatPercent: 3, minTotalInvestment: 20_000_000 },
  { level: 4, name: 'Level IV', rabatPercent: 2, minTotalInvestment: 50_000_000 },
]

/** Batas deposit & penarikan simulasi */
export const MIN_DEPOSIT = 50_000
export const MAX_DEPOSIT = 100_000_000
export const MIN_WITHDRAWAL = 50_000

/** Ambil satu paket berdasarkan id */
export function getPackage(id: string): PackageConfig | undefined {
  return PACKAGES.find((p) => p.id === id)
}

/**
 * Tentukan level voucher berdasarkan total investasi kumulatif.
 * Level ditentukan dari syarat tertinggi yang terpenuhi.
 */
export function resolveVoucherLevel(totalInvestment: number): VoucherLevelConfig {
  let current = VOUCHER_LEVELS[0]
  for (const lvl of VOUCHER_LEVELS) {
    if (totalInvestment >= lvl.minTotalInvestment) current = lvl
  }
  return current
}
