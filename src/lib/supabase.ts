import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

console.log('SUPABASE ENV CHECK:', {
  urlLoaded: Boolean(supabaseUrl),
  keyLoaded: Boolean(supabasePublishableKey),
  urlLength: supabaseUrl?.length ?? 0,
  keyLength: supabasePublishableKey?.length ?? 0,
})

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY belum dikonfigurasi.'
  )
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
)
