import { getServerSupabase } from "@/app/api/_lib/supabase"

export async function createTRPCContext() {
  const supabase = await getServerSupabase()
  const { data } = await supabase.auth.getUser()

  return {
    supabase,
    user: data.user ?? null,
  }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>
