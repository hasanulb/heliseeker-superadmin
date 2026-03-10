import { NextRequest, NextResponse } from "next/server"

import { getServerSupabase } from "@/app/api/_lib/supabase"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const payload = (await request.json()) as {
    active?: boolean
    role?: string
  }

  const supabase = await getServerSupabase()
  const updates: Record<string, unknown> = {}
  if (typeof payload.active === "boolean") updates.is_active = payload.active
  if (payload.role) updates.role = payload.role

  const { data, error } = await supabase
    .from("admins")
    .update(updates)
    .eq("admin_id", id)
    .select("admin_id, auth_user_id, name, email, role, is_active, created_at")
    .single()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: {
      id: data.admin_id,
      authUserId: data.auth_user_id,
      name: data.name,
      email: data.email,
      role: data.role,
      active: data.is_active,
      createdAt: data.created_at,
    },
  })
}
