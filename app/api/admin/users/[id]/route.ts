import { NextRequest, NextResponse } from "next/server"

import { getServiceRoleSupabase } from "@/app/api/_lib/supabase-admin"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = (await request.json()) as {
    name?: string
    email?: string
    isVerified?: boolean
    isActive?: boolean
  }

  const supabase = getServiceRoleSupabase()
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, auth_user_id")
    .eq("id", params.id)
    .single()

  if (userError || !userRow) {
    return NextResponse.json({ message: userError?.message || "User not found" }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}
  if (typeof payload.isVerified === "boolean") updates.is_verified = payload.isVerified
  if (payload.email) updates.email = payload.email.trim().toLowerCase()

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from("users").update(updates).eq("id", params.id)
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
  }

  if (payload.name || typeof payload.isActive === "boolean") {
    if (!userRow.auth_user_id) {
      return NextResponse.json({ message: "Missing auth user id for customer profile" }, { status: 400 })
    }
    const profileUpdates: Record<string, unknown> = {
      user_id: params.id,
      auth_user_id: userRow.auth_user_id,
    }
    if (payload.name) {
      profileUpdates.guardian_name = payload.name.trim()
    }
    if (typeof payload.isActive === "boolean") {
      profileUpdates.is_active = payload.isActive
    }

    const { error } = await supabase
      .from("customer_profiles")
      .upsert(profileUpdates, { onConflict: "auth_user_id" })

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
  }

  if (payload.email && userRow.auth_user_id) {
    const { error } = await supabase.auth.admin.updateUserById(userRow.auth_user_id, {
      email: payload.email.trim().toLowerCase(),
    })
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getServiceRoleSupabase()

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, auth_user_id")
    .eq("id", params.id)
    .single()

  if (userError || !userRow) {
    return NextResponse.json({ message: userError?.message || "User not found" }, { status: 404 })
  }

  const { error: profileError } = await supabase.from("customer_profiles").delete().eq("user_id", params.id)
  if (profileError) {
    return NextResponse.json({ message: profileError.message }, { status: 500 })
  }

  const { error: deleteUserError } = await supabase.from("users").delete().eq("id", params.id)
  if (deleteUserError) {
    return NextResponse.json({ message: deleteUserError.message }, { status: 500 })
  }

  if (userRow.auth_user_id) {
    const { error: authError } = await supabase.auth.admin.deleteUser(userRow.auth_user_id)
    if (authError) {
      return NextResponse.json({ message: authError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
