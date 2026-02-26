import { createClient } from '@supabase/supabase-js'

export function getServiceRoleSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE

  const missing: string[] = []
  if (!supabaseUrl) missing.push('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)')
  if (!serviceRoleKey) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)')
  }

  if (missing.length > 0) {
    throw new Error(`Missing required env: ${missing.join(', ')}`)
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
