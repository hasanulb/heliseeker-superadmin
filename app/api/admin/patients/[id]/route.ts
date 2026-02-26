import { NextRequest, NextResponse } from "next/server"

import { readDb, updateDb } from "@/lib/admin-panel/store"

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const db = await readDb()
  const patient = db.patients.find((item) => item.id === id)

  if (!patient) {
    return NextResponse.json({ message: "Patient not found" }, { status: 404 })
  }

  return NextResponse.json({ data: patient })
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const payload = (await request.json()) as { isActive: boolean }

  const next = await updateDb((current) => ({
    ...current,
    patients: current.patients.map((item) =>
      item.id === id
        ? {
            ...item,
            isActive: payload.isActive,
          }
        : item,
    ),
  }))

  return NextResponse.json({ data: next.patients.find((item) => item.id === id) })
}
