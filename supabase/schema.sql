-- ============================================================================
-- LAHAN EMAS — SKEMA SUPABASE (MVP investasi simulasi)
-- Jalankan SELURUH file ini di Supabase SQL Editor.
-- Aman dijalankan ulang (idempotent) pada database yang sudah ada.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. PROFILES
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  referral_code text unique not null,
  referred_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- 2. BALANCES
-- --------------------------------------------------------------------------
create table if not exists public.balances (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance numeric(18,2) not null default 0 check (balance >= 0),
  total_invested numeric(18,2) not null default 0,
  total_earned numeric(18,2) not null default 0,
  referral_reward_total numeric(18,2) not null default 0,
  total_withdrawn numeric(18,2) not null default 0
);

-- --------------------------------------------------------------------------
-- 3. PACKAGES
-- --------------------------------------------------------------------------
create table if not exists public.packages (
  id text primary key,
  name text not null,
  rate_min numeric(5,2) not null,
  rate_max numeric(5,2) not null,
  duration_days int not null,
  min_amount numeric(18,2) not null,
  max_amount numeric(18,2) not null,
  description text,
  is_active boolean not null default true
);

-- Rate = profit/cashback PER HARI (%). Upsert agar database lama ikut diperbarui.
insert into public.packages (id, name, rate_min, rate_max, duration_days, min_amount, max_amount, description) values
  ('paket1', 'Paket ETH', 2, 7, 150, 300000, 10000000, 'Rentang hasil harian paling lebar untuk modal yang ingin tumbuh agresif.'),
  ('paket2', 'Paket BTC', 2, 5, 150, 1000000, 50000000, 'Keseimbangan antara potensi hasil harian dan stabilitas.'),
  ('paket3', 'Paket GOLD', 2, 4, 150, 1000000, 100000000, 'Pilihan konservatif dengan rentang hasil harian paling stabil.')
on conflict (id) do update set
  name = excluded.name,
  rate_min = excluded.rate_min,
  rate_max = excluded.rate_max,
  duration_days = excluded.duration_days,
  min_amount = excluded.min_amount,
  max_amount = excluded.max_amount,
  description = excluded.description;

-- --------------------------------------------------------------------------
-- 4. INVESTMENTS
-- --------------------------------------------------------------------------
create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  package_id text not null references public.packages(id),
  package_name text not null,
  amount numeric(18,2) not null check (amount > 0),
  rate_min numeric(5,2) not null,
  rate_max numeric(5,2) not null,
  duration_days int not null,
  start_date timestamptz not null default now(),
  end_date timestamptz not null,
  claim_amount numeric(18,2),
  locked_rate numeric(5,2),
  total_return numeric(18,2),
  profit_paid numeric(18,2) not null default 0,
  profit_days_paid int not null default 0,
  status text not null default 'aktif' check (status in ('aktif','selesai','sudah_diklaim')),
  created_at timestamptz not null default now()
);
create index if not exists idx_investments_user on public.investments(user_id);
create index if not exists idx_investments_status on public.investments(user_id, status);

-- Kolom profit harian (aman dijalankan ulang pada database yang sudah ada)
alter table public.investments add column if not exists locked_rate numeric(5,2);
alter table public.investments add column if not exists total_return numeric(18,2);
alter table public.investments add column if not exists profit_paid numeric(18,2) not null default 0;
alter table public.investments add column if not exists profit_days_paid int not null default 0;

-- --------------------------------------------------------------------------
-- 5. TRANSACTIONS (activity log)
-- --------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('deposit','investasi','klaim','referral_reward','voucher_rabat','penarikan')),
  amount numeric(18,2) not null default 0,
  description text not null default '',
  reference_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_transactions_user on public.transactions(user_id, created_at desc);

-- --------------------------------------------------------------------------
-- 6. REFERRALS
-- --------------------------------------------------------------------------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null unique references public.profiles(id) on delete cascade,
  referred_name text,
  referred_code text not null,
  is_valid boolean not null default false,
  reward_amount numeric(18,2),
  rewarded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_referrals_referrer on public.referrals(referrer_id);

-- --------------------------------------------------------------------------
-- 7. REFERRAL_REWARDS (anti duplikat: satu reward per investasi & per referral)
-- --------------------------------------------------------------------------
create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  investment_id uuid unique not null references public.investments(id) on delete cascade,
  amount numeric(18,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_rewards_referrer on public.referral_rewards(referrer_id);

-- --------------------------------------------------------------------------
-- 8. VOUCHER_LEVELS
-- --------------------------------------------------------------------------
create table if not exists public.voucher_levels (
  id text primary key,
  level int not null unique,
  name text not null,
  rabat_percent numeric(5,2) not null,
  min_total_investment numeric(18,2) not null default 0
);

insert into public.voucher_levels (id, level, name, rabat_percent, min_total_investment) values
  ('level1', 1, 'Level I', 10, 0),
  ('level2', 2, 'Level II', 5, 5000000),
  ('level3', 3, 'Level III', 3, 20000000),
  ('level4', 4, 'Level IV', 2, 50000000)
on conflict (id) do nothing;

-- ============================================================================
--  KEAMANAN: RLS — user hanya bisa melihat data miliknya sendiri.
--  Semua perubahan saldo/investasi HANYA lewat fungsi security definer.
-- ============================================================================
alter table public.profiles         enable row level security;
alter table public.balances         enable row level security;
alter table public.packages         enable row level security;
alter table public.investments      enable row level security;
alter table public.transactions     enable row level security;
alter table public.referrals        enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.voucher_levels   enable row level security;

-- Blokir tulis langsung dari klien (deposit/klaim/penarikan hanya via RPC)
revoke insert, update, delete on public.profiles, public.balances, public.packages,
  public.investments, public.transactions, public.referrals, public.referral_rewards,
  public.voucher_levels from anon, authenticated;

-- profiles: lihat sendiri
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

-- balances: lihat sendiri
drop policy if exists balances_select_own on public.balances;
create policy balances_select_own on public.balances
  for select to authenticated using (user_id = auth.uid());

-- packages & voucher_levels: semua user terautentikasi boleh lihat
drop policy if exists packages_select_all on public.packages;
create policy packages_select_all on public.packages
  for select to authenticated using (is_active = true);

drop policy if exists voucher_levels_select_all on public.voucher_levels;
create policy voucher_levels_select_all on public.voucher_levels
  for select to authenticated using (true);

-- investments: lihat sendiri
drop policy if exists investments_select_own on public.investments;
create policy investments_select_own on public.investments
  for select to authenticated using (user_id = auth.uid());

-- transactions: lihat sendiri
drop policy if exists transactions_select_own on public.transactions;
create policy transactions_select_own on public.transactions
  for select to authenticated using (user_id = auth.uid());

-- referrals: lihat sebagai referrer
drop policy if exists referrals_select_own on public.referrals;
create policy referrals_select_own on public.referrals
  for select to authenticated using (referrer_id = auth.uid());

-- referral_rewards: lihat sebagai referrer
drop policy if exists rewards_select_own on public.referral_rewards;
create policy rewards_select_own on public.referral_rewards
  for select to authenticated using (referrer_id = auth.uid());

-- ============================================================================
--  TRIGGER: buat profile + balance otomatis saat user mendaftar
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_referrer uuid;
  v_raw text;
begin
  -- Kode referral unik (loop sampai unik)
  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.profiles where referral_code = v_code);
  end loop;

  -- Ambil referrer dari metadata signup (opsional); self-referral ditolak
  v_raw := nullif(new.raw_user_meta_data->>'referral_code', '');
  if v_raw is not null then
    select p.id into v_referrer
    from public.profiles p
    where p.referral_code = upper(v_raw)
      and p.id <> new.id;
    if found then
      update public.profiles set referred_by = v_referrer where id = new.id;
    end if;
  end if;

  insert into public.profiles (id, full_name, referral_code, referred_by)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), v_code, v_referrer);

  insert into public.balances (user_id) values (new.id);

  -- Catat referral jika valid
  if v_referrer is not null then
    insert into public.referrals (referrer_id, referred_id, referred_name, referred_code)
    select v_referrer, new.id,
           coalesce(new.raw_user_meta_data->>'full_name', ''),
           (select referral_code from public.profiles where id = v_referrer)
    where not exists (
      select 1 from public.referrals r where r.referred_id = new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
--  FUNGSI FINANSIAL (SECURITY DEFINER)
--  Saldo TIDAK PERNAH dikirim dari klien; semua validasi di server.
-- ============================================================================

-- --------------------------------------------------------------------------
-- DEPOSIT (simulasi)
-- --------------------------------------------------------------------------
create or replace function public.fn_deposit(p_amount numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHENTICATED');
  end if;

  if p_amount is null or p_amount < 50000 then
    return jsonb_build_object('ok', false, 'error', 'MIN_DEPOSIT');
  end if;

  update public.balances
     set balance = balance + p_amount
   where user_id = v_user;

  insert into public.transactions (user_id, type, amount, description)
  values (v_user, 'deposit', p_amount, 'Deposit simulasi ke saldo IDR');

  return jsonb_build_object('ok', true);
end;
$$;

-- --------------------------------------------------------------------------
-- PENARIKAN (simulasi)
-- --------------------------------------------------------------------------
create or replace function public.fn_withdraw(p_amount numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_bal numeric(18,2);
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHENTICATED');
  end if;

  if p_amount is null or p_amount < 50000 then
    return jsonb_build_object('ok', false, 'error', 'MIN_WITHDRAWAL');
  end if;

  select balance into v_bal from public.balances where user_id = v_user for update;
  if v_bal is null or v_bal < p_amount then
    return jsonb_build_object('ok', false, 'error', 'SALDO_TIDAK_CUKUP');
  end if;

  update public.balances
     set balance = balance - p_amount,
         total_withdrawn = total_withdrawn + p_amount
   where user_id = v_user;

  insert into public.transactions (user_id, type, amount, description)
  values (v_user, 'penarikan', p_amount, 'Penarikan simulasi dari saldo');

  return jsonb_build_object('ok', true);
end;
$$;

-- --------------------------------------------------------------------------
-- BUAT INVESTASI (saldo dipotong server; referral jadi valid; reward 10%)
-- --------------------------------------------------------------------------
create or replace function public.fn_create_investment(
  p_package_id text,
  p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_pkg record;
  v_bal numeric(18,2);
  v_inv uuid;
  v_referrer uuid;
  v_bonus numeric(18,2);
  v_rate numeric(5,2);
  v_total_return numeric(18,2);
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHENTICATED');
  end if;

  -- Validasi paket aktif
  select * into v_pkg from public.packages
   where id = p_package_id and is_active;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'PAKET_TIDAK_TERSEDIA');
  end if;

  -- Validasi nominal sesuai batas paket
  if p_amount is null or p_amount < v_pkg.min_amount or p_amount > v_pkg.max_amount then
    return jsonb_build_object('ok', false, 'error', 'NOMINAL_TIDAK_SESAI');
  end if;

  -- Kunci baris saldo & cek dana cukup (anti saldo negatif)
  select balance into v_bal from public.balances where user_id = v_user for update;
  if v_bal is null or v_bal < p_amount then
    return jsonb_build_object('ok', false, 'error', 'SALDO_TIDAK_CUKUP');
  end if;

  -- Kurangi saldo, tambah total_invested
  update public.balances
     set balance = balance - p_amount,
         total_invested = total_invested + p_amount
   where user_id = v_user;

  -- Rate HARIAN ditentukan server (acak dalam rentang paket) dan dikunci saat investasi dibuat.
  -- Klien tidak pernah mengirim nilai rate/saldo.
  -- Total hasil selama durasi = modal x rate harian% x jumlah hari.
  v_rate := round((v_pkg.rate_min + random() * (v_pkg.rate_max - v_pkg.rate_min))::numeric, 2);
  v_total_return := round(p_amount * v_rate / 100 * v_pkg.duration_days);

  -- Buat investasi
  insert into public.investments (user_id, package_id, package_name, amount, rate_min, rate_max,
                                  duration_days, start_date, end_date, locked_rate, total_return, status)
  values (v_user, v_pkg.id, v_pkg.name, p_amount, v_pkg.rate_min, v_pkg.rate_max,
          v_pkg.duration_days, now(), now() + make_interval(days => v_pkg.duration_days),
          v_rate, v_total_return, 'aktif')
  returning id into v_inv;

  insert into public.transactions (user_id, type, amount, description)
  values (v_user, 'investasi', p_amount,
          'Investasi ' || v_pkg.name || ' (' || v_pkg.duration_days || ' hari)');

  -- ===== REFERRAL: valid setelah investasi pertama yang valid =====
  select referred_by into v_referrer from public.profiles where id = v_user;
  if v_referrer is not null then
    -- Tandai referral valid (sekali saja)
    update public.referrals
       set is_valid = true
     where referred_id = v_user and is_valid = false;

    -- Reward 10% dari investasi pertama yang valid; anti duplikat per referred user
    if not exists (
      select 1 from public.referral_rewards where referred_id = v_user
    ) then
      v_bonus := round(p_amount * 0.10);
      insert into public.referral_rewards (referrer_id, referred_id, investment_id, amount)
      values (v_referrer, v_user, v_inv, v_bonus);

      -- Reward masuk ke saldo referrer
      update public.balances
         set balance = balance + v_bonus,
             referral_reward_total = referral_reward_total + v_bonus
       where user_id = v_referrer;

      insert into public.transactions (user_id, type, amount, description)
      values (v_referrer, 'referral_reward', v_bonus,
              'Reward referral 10% dari investasi ' || v_pkg.name);
    end if;
  end if;

  return jsonb_build_object('ok', true, 'investment_id', v_inv);
end;
$$;

-- --------------------------------------------------------------------------
-- AKRUAL HASIL HARIAN OTOMATIS (dipanggil klien saat membuka Beranda/Investasi)
-- Menambahkan hasil harian yang sudah berjalan langsung ke saldo IDR sehingga
-- BISA DITARIK kapan saja lewat halaman Penarikan — tanpa perlu klaim manual.
-- Anti double-pay: profit_days_paid mencatat hari yang sudah dibayar.
-- --------------------------------------------------------------------------
create or replace function public.fn_accrue_profits()
returns jsonb
language plpgsql
security definer
set search_path = public
as $
declare
  v_user uuid := auth.uid();
  v_inv record;
  v_elapsed int;
  v_days_due int;
  v_daily numeric(18,2);
  v_payout numeric(18,2);
  v_total numeric(18,2) := 0;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHENTICATED');
  end if;

  for v_inv in
    select * from public.investments
     where user_id = v_user and status = 'aktif'
     for update
  loop
    v_elapsed := least(
      floor(extract(epoch from (now() - v_inv.start_date)) / 86400)::int,
      v_inv.duration_days
    );
    if v_elapsed < 0 then
      v_elapsed := 0;
    end if;

    v_days_due := v_elapsed - v_inv.profit_days_paid;
    if v_days_due > 0 then
      v_daily := v_inv.total_return / v_inv.duration_days;
      v_payout := round(v_daily * v_days_due);

      update public.investments
         set profit_paid = profit_paid + v_payout,
             profit_days_paid = v_elapsed,
             status = case when v_elapsed >= v_inv.duration_days then 'selesai' else status end
       where id = v_inv.id;

      update public.balances
         set balance = balance + v_payout,
             total_earned = total_earned + v_payout
       where user_id = v_user;

      insert into public.transactions (user_id, type, amount, description)
      values (v_user, 'klaim', v_payout,
              'Hasil harian otomatis ' || v_inv.package_name || ' (' || v_days_due || ' hari)');

      v_total := v_total + v_payout;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'amount', v_total);
end;
$;

-- --------------------------------------------------------------------------
-- KLAIM HASIL HARIAN (profit bisa dicairkan tiap hari selama investasi aktif)
-- Anti double-claim: profit_days_paid mencatat hari yang sudah dibayar.
-- --------------------------------------------------------------------------
create or replace function public.fn_claim_profit(p_investment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_inv record;
  v_elapsed int;
  v_days_due int;
  v_daily numeric(18,2);
  v_payout numeric(18,2);
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHENTICATED');
  end if;

  -- Kunci baris investasi (anti race condition)
  select * into v_inv from public.investments
   where id = p_investment_id and user_id = v_user
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'TIDAK_DITEMUKAN');
  end if;

  if v_inv.status <> 'aktif' then
    return jsonb_build_object('ok', false, 'error', 'SUDAH_DIKLAIM');
  end if;

  -- Hari penuh yang sudah berjalan (dibatasi durasi paket)
  v_elapsed := least(
    floor(extract(epoch from (now() - v_inv.start_date)) / 86400)::int,
    v_inv.duration_days
  );
  if v_elapsed < 0 then
    v_elapsed := 0;
  end if;

  -- Hari yang belum dicairkan; <= 0 berarti sudah diklaim hari ini
  v_days_due := v_elapsed - v_inv.profit_days_paid;
  if v_days_due <= 0 then
    return jsonb_build_object('ok', false, 'error', 'BELUM_ADA_HASIL');
  end if;

  -- Hasil harian = total hasil terkunci / durasi; dibayar untuk hari yang belum dicairkan
  v_daily := v_inv.total_return / v_inv.duration_days;
  v_payout := round(v_daily * v_days_due);

  update public.investments
     set profit_paid = profit_paid + v_payout,
         profit_days_paid = v_elapsed,
         status = case when v_elapsed >= v_inv.duration_days then 'selesai' else status end
   where id = p_investment_id;

  update public.balances
     set balance = balance + v_payout,
         total_earned = total_earned + v_payout
   where user_id = v_user;

  insert into public.transactions (user_id, type, amount, description)
  values (v_user, 'klaim', v_payout,
          'Hasil harian ' || v_inv.package_name || ' (hari ke-' || v_elapsed || ')');

  return jsonb_build_object('ok', true, 'amount', v_payout, 'days', v_days_due);
end;
$$;

-- --------------------------------------------------------------------------
-- KLAIM AKHIR INVESTASI (hanya setelah end_date; anti double-claim)
-- Membayar modal + sisa hasil (total hasil dikurangi hasil harian yang sudah dicairkan)
-- --------------------------------------------------------------------------
create or replace function public.fn_claim_investment(p_investment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_inv record;
  v_remaining numeric(18,2);
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'UNAUTHENTICATED');
  end if;

  -- Kunci baris investasi (anti double-claim race condition)
  select * into v_inv from public.investments
   where id = p_investment_id and user_id = v_user
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'TIDAK_DITEMUKAN');
  end if;

  if v_inv.status = 'sudah_diklaim' then
    return jsonb_build_object('ok', false, 'error', 'SUDAH_DIKLAIM');
  end if;

  if now() < v_inv.end_date then
    return jsonb_build_object('ok', false, 'error', 'BELUM_JATUH_TEMPO');
  end if;

  -- Sisa hasil = total hasil terkunci - hasil harian yang sudah dicairkan
  v_remaining := v_inv.total_return - coalesce(v_inv.profit_paid, 0);
  if v_remaining < 0 then
    v_remaining := 0;
  end if;

  update public.investments
     set status = 'sudah_diklaim',
         claim_amount = v_inv.amount + v_remaining
   where id = p_investment_id;

  update public.balances
     set balance = balance + v_inv.amount + v_remaining,
         total_earned = total_earned + v_remaining
   where user_id = v_user;

  insert into public.transactions (user_id, type, amount, description)
  values (v_user, 'klaim', v_inv.amount + v_remaining,
          'Klaim akhir ' || v_inv.package_name || ' (rate ' || coalesce(v_inv.locked_rate, 0) || '%)');

  -- Rabat voucher: catat SATU transaksi sesuai level tertinggi yang tercapai
  if v_remaining > 0 then
    insert into public.transactions (user_id, type, amount, description)
    select v_user, 'voucher_rabat', round(v_remaining * vl.rabat_percent / 100),
           'Voucher rabat ' || vl.name || ' (' || vl.rabat_percent || '%)'
    from public.voucher_levels vl
    where vl.min_total_investment <= (
      select coalesce(sum(amount), 0) from public.investments
      where user_id = v_user and status <> 'aktif'
    )
    order by vl.min_total_investment desc
    limit 1;
  end if;

  return jsonb_build_object('ok', true, 'claim_amount', v_inv.amount + v_remaining);
end;
$$;

-- Eksekusi fungsi hanya untuk user terautentikasi
revoke execute on function public.fn_deposit(numeric),
  public.fn_withdraw(numeric),
  public.fn_create_investment(text, numeric),
  public.fn_accrue_profits(),
  public.fn_claim_profit(uuid),
  public.fn_claim_investment(uuid)
  from public, anon;
grant execute on function public.fn_deposit(numeric),
  public.fn_withdraw(numeric),
  public.fn_create_investment(text, numeric),
  public.fn_accrue_profits(),
  public.fn_claim_profit(uuid),
  public.fn_claim_investment(uuid)
  to authenticated;
