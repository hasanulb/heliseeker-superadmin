import { NextResponse } from "next/server"

import { getServiceRoleSupabase } from "@/app/api/_lib/supabase-admin"

export async function GET() {
  const adminSupabase = getServiceRoleSupabase()

  const [
    submittedCentersResult,
    activeCentersResult,
    rejectedCentersResult,
    centersResult,
    locationsResult,
  ] = await Promise.all([
    adminSupabase
      .from("center_profiles")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "submitted"),
    adminSupabase
      .from("center_profiles")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "active"),
    adminSupabase
      .from("center_profiles")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "rejected"),
    adminSupabase
      .from("center_profiles")
      .select("auth_user_id"),
    adminSupabase
      .from("center_settings")
      .select("auth_user_id, location"),
  ])

  const errors = [
    submittedCentersResult.error,
    activeCentersResult.error,
    rejectedCentersResult.error,
    centersResult.error,
    locationsResult.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    return NextResponse.json({ message: errors[0]?.message || "Failed to load dashboard data" }, { status: 500 })
  }

  const centerAuthIds = new Set((centersResult.data || []).map((row) => row.auth_user_id).filter(Boolean))
  const centersByLocation = Object.entries(
    (locationsResult.data || []).reduce<Record<string, number>>((acc, row) => {
      if (!row.auth_user_id || !centerAuthIds.has(row.auth_user_id)) return acc
      const location = row.location?.trim() || "Unknown"
      acc[location] = (acc[location] || 0) + 1
      return acc
    }, {}),
  ).map(([location, total]) => ({ location, total }))

  const { data: customerRows, error: customerError, count } = await adminSupabase
    .from("customer_profiles")
    .select("user_id, guardian_name, child_name, phone_number, created_at, users(id, email, user_type, created_at)", {
      count: "exact",
    })
    .eq("users.user_type", "customer")
    .order("created_at", { ascending: false })
    .limit(20)

  if (customerError) {
    return NextResponse.json({ message: customerError.message }, { status: 500 })
  }

  const users = (customerRows || []).map((item) => {
    const user = Array.isArray(item.users) ? item.users[0] : item.users
    return {
      id: user?.id || item.user_id,
      email: user?.email ?? null,
      phoneNumber: item.phone_number ?? null,
      profileName: item.guardian_name || item.child_name || null,
    }
  })

  return NextResponse.json({
    centers: {
      pending: submittedCentersResult.count ?? 0,
      submitted: submittedCentersResult.count ?? 0,
      active: activeCentersResult.count ?? 0,
      rejected: rejectedCentersResult.count ?? 0,
    },
    centersByLocation,
    totalUsers: count ?? users.length,
    users,
    seo: {
      metaTitle: "",
      metaDescription: "",
    },
  })
}
