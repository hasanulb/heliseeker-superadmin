import { NextRequest, NextResponse } from "next/server"

import { makeId, readDb, updateDb } from "@/lib/admin-panel/store"
import { StaffPermission, StaffUser } from "@/lib/admin-panel/types"

export async function GET() {
  const db = await readDb()
  return NextResponse.json({ data: db.staffUsers })
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    name: string
    email: string
    role: StaffUser["role"]
    permissions: StaffPermission[]
  }

  const staff: StaffUser = {
    id: makeId("s"),
    name: payload.name,
    email: payload.email,
    role: payload.role,
    active: true,
    permissions: payload.permissions,
  }

  await updateDb((current) => ({
    ...current,
    staffUsers: [staff, ...current.staffUsers],
  }))

  return NextResponse.json({ data: staff }, { status: 201 })
}
