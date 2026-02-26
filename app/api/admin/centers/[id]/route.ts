import { NextRequest, NextResponse } from "next/server"

import { readDb, updateDb } from "@/lib/admin-panel/store"
import { CenterStatus } from "@/lib/admin-panel/types"

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const db = await readDb()
  const center = db.centers.find((item) => item.id === id)

  if (!center) {
    return NextResponse.json({ message: "Center not found" }, { status: 404 })
  }

  return NextResponse.json({ data: center })
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const payload = (await request.json()) as { status: CenterStatus; approvalNote?: string }

  const next = await updateDb((current) => ({
    ...current,
    centers: current.centers.map((item) =>
      item.id === id
        ? {
            ...item,
            status: payload.status,
            approvalNote: payload.approvalNote,
          }
        : item,
    ),
  }))

  return NextResponse.json({ data: next.centers.find((item) => item.id === id) })
}
