import { NextRequest, NextResponse } from "next/server"

import { updateDb } from "@/lib/admin-panel/store"
import { StaffPermission } from "@/lib/admin-panel/types"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const payload = (await request.json()) as {
    active?: boolean
    role?: "super_admin" | "manager" | "operator"
    permissions?: StaffPermission[]
  }

  const next = await updateDb((current) => ({
    ...current,
    staffUsers: current.staffUsers.map((item) =>
      item.id === id
        ? {
            ...item,
            active: payload.active ?? item.active,
            role: payload.role ?? item.role,
            permissions: payload.permissions ?? item.permissions,
          }
        : item,
    ),
  }))

  return NextResponse.json({ data: next.staffUsers.find((item) => item.id === id) })
}
