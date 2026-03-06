import { NextRequest, NextResponse } from "next/server"

import { getServerSupabase } from "@/app/api/_lib/supabase"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.toLowerCase() || ""
  const supabase = await getServerSupabase()

  const { data, error } = await supabase
    .from("users")
    .select("id, email, user_type, is_verified, created_at, customer_profiles(guardian_name, child_name)")
    .eq("user_type", "customer")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  const normalized = (data || []).map((item) => {
    const profile = Array.isArray(item.customer_profiles) ? item.customer_profiles[0] : item.customer_profiles
    const name = profile?.guardian_name || profile?.child_name || item.email || "Customer"
    return {
      id: item.id,
      name,
      email: item.email,
      isVerified: item.is_verified,
      createdAt: item.created_at,
    }
  })

  const filtered = query
    ? normalized.filter((user) => {
        const haystack = `${user.name ?? ""} ${user.email ?? ""}`.toLowerCase()
        return haystack.includes(query)
      })
    : normalized

  return NextResponse.json({ data: filtered })
}
