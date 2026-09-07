import { Link } from 'react-router-dom'
import { PACKAGES, REFERRAL_BONUS_PERCENT, VOUCHER_LEVELS } from '../config/config'
import { formatIDR } from '../lib/format'
import { GoldMark } from '../components/ui'
import { CoinRain } from '../components/CoinRain'

function SectionCaraKerja() {
  const steps = [
    { title: 'Daftar / Masuk', desc: 'Buat akun dalam satu menit. Punya kode referral teman? Masukkan saat daftar.' },
    { title: 'Deposit IDR', desc: 'Isi saldo rupiah Anda melalui deposit simulasi. Dana langsung tersedia di Beranda.' },
    { title: 'Pilih Paket', desc: 'Tiga paket — ETH, BTC, GOLD — profit harian dengan durasi 150 hari.' },
    { title: 'Investasi', desc: 'Tentukan nominal, periksa ringkasan, lalu konfirmasi. Saldo otomatis berkurang.' },
    { title: 'Cairkan Hasil Harian', desc: 'Hasil harian masuk ke saldo IDR dan bisa ditarik kapan saja.' },
    { title: 'Klaim Akhir', desc: 'Di hari ke-150, modal kembali penuh beserta sisa hasil ke saldo Anda.' },
  ]
  return (
    <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="cara-kerja">
      <h2 id="cara-kerja" className="section-title">Cara Kerja</h2>
      <div className="hairline mt-4 max-w-xs" />
      <p className="mt-4 max-w-2xl text-sm text-muted">
        Enam langkah sederhana — hasil mengalir harian, bukan menunggu 150 hari.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className={`card anim-fade-up anim-d${(i % 3) + 1}`}>
            <p className="font-display text-sm font-bold text-primary">0{i + 1}</p>
            <p className="mt-1 font-semibold text-ink">{s.title}</p>
            <p className="mt-2 text-sm text-muted">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function SectionPaket() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="paket">
      <h2 id="paket" className="section-title">Paket Investasi</h2>
      <div className="hairline mt-4 max-w-xs" />
      <p className="mt-4 max-w-2xl text-sm text-muted">
        Profit/cashback per hari, durasi 150 hari. Pilih sesuai profil dan modal Anda.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {PACKAGES.map((p, i) => (
          <div
            key={p.id}
            className={'card anim-fade-up flex flex-col' + (i === 0 ? ' border-primary/50' : '')}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            {i === 0 && (
              <span className="badge mb-3 w-fit border-primary/40 bg-primary/10 text-primary">Paling Populer</span>
            )}
            <p className="font-display text-lg font-bold text-ink">{p.name}</p>
            <p className="text-gold-gradient mt-3 font-display text-4xl font-bold">
              {p.rateRange[0]}%–{p.rateRange[1]}%
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted">Profit / Cashback per Hari</p>
            <p className="mt-4 text-sm text-muted">{p.description}</p>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="text-muted">Durasi</dt>
                <dd className="text-ink">{p.durationDays} hari</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Minimal</dt>
                <dd className="text-ink">{formatIDR(p.minAmount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Maksimal</dt>
                <dd className="text-ink">{formatIDR(p.maxAmount)}</dd>
              </div>
            </dl>
            <Link to="/daftar" className="btn btn-primary mt-5 w-full">
              Mulai Investasi
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="gold-glow relative overflow-hidden">
        <CoinRain density={28} />
        <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-14 md:grid-cols-2 md:items-center md:pt-20">
          <div>
            <p className="badge border-primary/30 bg-primary/10 text-primary">
              <GoldMark className="h-3.5 w-3.5" /> Platform investasi simulasi
            </p>
            <h1 className="anim-fade-up mt-5 font-display text-4xl font-bold leading-tight md:text-5xl">
              <span className="text-gold-gradient">Wujudkan masa depanmu</span>
              <br />
              <span className="text-ink">dengan investasi yang aman.</span>
            </h1>
            <p className="anim-fade-up anim-d1 mt-5 max-w-lg text-base text-muted">
              LahanEmas membantu tumbuhkan Rupiah Anda: pilih paket, cairkan hasil harian langsung ke saldo,
              dan klaim modal penuh saat jatuh tempo. Dilengkapi referral {REFERRAL_BONUS_PERCENT}% dan voucher rabat berjenjang.
            </p>
            <div className="anim-fade-up anim-d2 mt-7 flex flex-wrap gap-3">
              <Link to="/daftar" className="btn btn-primary px-7 py-3">
                Mulai Investasi
              </Link>
              <Link to="/masuk" className="btn btn-ghost px-7 py-3">
                Sudah punya akun
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted">
              Simulasi MVP: tanpa integrasi bank, tanpa kripto, tanpa blockchain.
            </p>
          </div>

          {/* Ilustrasi kartu saldo */}
          <div className="anim-fade-up anim-d2">
            <div className="card border-primary/40">
              <div className="flex items-center justify-between">
                <p className="stat-label">Saldo IDR (simulasi)</p>
                <GoldMark className="h-5 w-5" />
              </div>
              <p className="stat-value mt-1 text-3xl text-gold-gradient">Rp12.500.000</p>
              <div className="mt-5 space-y-3">
                <div className="rounded-xl bg-surface2 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Paket ETH — Aktif</span>
                    <span className="text-primary">2%–7% per hari</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
                    <div className="anim-grow-x h-full w-2/3 rounded-full" style={{ background: 'linear-gradient(90deg,#9c7c22,#d4af37,#f2dc8f)' }} />
                  </div>
                </div>
                <div className="rounded-xl bg-surface2 p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Paket GOLD — Aktif</span>
                    <span className="text-primary">2%–4% per hari</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
                    <div className="anim-grow-x h-full w-1/3 rounded-full" style={{ background: 'linear-gradient(90deg,#9c7c22,#d4af37,#f2dc8f)' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-primary/5 p-3">
                  <span className="text-xs text-muted">Hasil harian siap cair</span>
                  <span className="text-sm font-semibold text-primary">Rp840.000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionCaraKerja />
      <SectionPaket />

      {/* REFERRAL */}
      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="referral">
        <h2 id="referral" className="section-title">Referral</h2>
        <div className="hairline mt-4 max-w-xs" />
        <p className="mt-4 max-w-2xl text-sm text-muted">
          Ajak teman, dapatkan bonus {REFERRAL_BONUS_PERCENT}% dari investasi pertama valid mereka. Setiap akun
          mendapat kode dan link referral unik. Bonus diberikan sekali per teman — anti duplikat.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: 'Kode & Link Unik', d: 'Setiap akun otomatis mendapat kode referral dan link siap bagikan.' },
            { t: `Bonus ${REFERRAL_BONUS_PERCENT}%`, d: 'Masuk ke saldo Anda begitu teman menyelesaikan investasi pertama yang valid.' },
            { t: 'Hasil Harian', d: 'Hasil investasi bisa dicairkan setiap hari langsung ke saldo IDR Anda.' },
            { t: 'Anti Duplikat', d: 'Satu reward per teman — tidak bisa diklaim ganda.' },
          ].map((c) => (
            <div key={c.t} className="card">
              <p className="font-semibold text-primary">{c.t}</p>
              <p className="mt-2 text-sm text-muted">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VOUCHER RABAT */}
      <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="voucher">
        <h2 id="voucher" className="section-title">Voucher Rabat</h2>
        <div className="hairline mt-4 max-w-xs" />
        <p className="mt-4 max-w-2xl text-sm text-muted">
          Semakin besar total investasi, semakin tinggi level rabat yang Anda dapatkan.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VOUCHER_LEVELS.map((v) => (
            <div key={v.level} className="card text-center">
              <p className="font-display text-3xl font-bold text-accent">{v.rabatPercent}%</p>
              <p className="mt-1 text-sm font-semibold text-ink">{v.name}</p>
              <p className="mt-1 text-xs text-muted">
                {v.minTotalInvestment === 0 ? 'Sejak awal' : `Total investasi ${formatIDR(v.minTotalInvestment)}`}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="card gold-glow relative flex flex-col items-center gap-4 overflow-hidden border-primary/40 py-12 text-center">
          <CoinRain density={12} />
          <GoldMark className="relative z-10 h-10 w-10" />
          <h2 className="section-title relative z-10">Siap mulai?</h2>
          <p className="relative z-10 max-w-md text-sm text-muted">
            Daftar sekarang, deposit pertama, dan mulai tumbuhkan Rupiah Anda hari ini.
          </p>
          <Link to="/daftar" className="btn btn-primary relative z-10 px-8 py-3">
            Mulai Investasi
          </Link>
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          Dengan mendaftar, Anda memahami bahwa platform ini adalah simulasi MVP.
        </p>
      </section>
    </div>
  )
}
