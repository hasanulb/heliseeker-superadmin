import { NextRequest, NextResponse } from "next/server"

import { readDb, updateDb } from "@/lib/admin-panel/store"
import { Role, StaffPermission } from "@/lib/admin-panel/types"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const payload = (await request.json()) as {
    name?: string
    permissions?: StaffPermission[]
  }

  const current = await readDb()
  const existing = current.roles.find((role) => role.id === params.id)

  if (!existing) {
    return NextResponse.json({ message: "Role not found" }, { status: 404 })
  }

  const nextRole: Role = {
    ...existing,
    name: payload.name?.trim() || existing.name,
    permissions: payload.permissions ?? existing.permissions,
  }

  await updateDb((state) => ({
    ...state,
    roles: state.roles.map((role) => (role.id === params.id ? nextRole : role)),
  }))

  return NextResponse.json({ data: nextRole })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  let deleted: Role | null = null

  await updateDb((state) => {
    const roles = state.roles.filter((role) => {
      if (role.id === params.id) {
        deleted = role
        return false
      }
      return true
    })
    return { ...state, roles }
  })

  if (!deleted) {
    return NextResponse.json({ message: "Role not found" }, { status: 404 })
  }

  return NextResponse.json({ data: deleted })
}
