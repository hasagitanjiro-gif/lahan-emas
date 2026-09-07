import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Pakai || (bukan ??) agar string kosong dari env yang belum diisi juga tertangkap.
// Tanpa ini, createClient('') melempar Invalid URL dan seluruh halaman jadi hitam.
const URL_AKTIF = supabaseUrl || 'https://placeholder.supabase.co'
const KEY_AKTIF = supabaseAnonKey || 'placeholder-anon-key'

if (URL_AKTIF === 'https://placeholder.supabase.co') {
  console.warn(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi. Isi env di Vercel atau file .env lalu deploy ulang.'
  )
}

export const supabase = createClient(URL_AKTIF, KEY_AKTIF,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
