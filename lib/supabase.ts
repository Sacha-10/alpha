import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from 
  '@supabase/auth-helpers-nextjs'

export function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export function getSupabaseClient() {
  return createClientComponentClient()
}