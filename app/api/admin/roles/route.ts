import { NextRequest, NextResponse } from "next/server"

import { makeId, readDb, updateDb } from "@/lib/admin-panel/store"
import { Role, StaffPermission } from "@/lib/admin-panel/types"

export async function GET() {
  const db = await readDb()
  return NextResponse.json({ data: db.roles })
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    name: string
    permissions: StaffPermission[]
  }

  const role: Role = {
    id: makeId("r"),
    name: payload.name,
    permissions: payload.permissions,
  }

  await updateDb((current) => ({
    ...current,
    roles: [role, ...current.roles],
  }))

  return NextResponse.json({ data: role }, { status: 201 })
}
