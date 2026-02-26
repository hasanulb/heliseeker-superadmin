import { NextRequest, NextResponse } from "next/server"

import { makeId, readDb, updateDb } from "@/lib/admin-panel/store"
import { FlatPage } from "@/lib/admin-panel/types"

export async function GET() {
  const db = await readDb()
  return NextResponse.json({ data: db.flatPages })
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    title: string
    slug: string
    description: string
  }

  const page: FlatPage = {
    id: makeId("fp"),
    title: payload.title,
    slug: payload.slug,
    description: payload.description,
    enabled: true,
    updatedAt: new Date().toISOString(),
  }

  await updateDb((current) => ({
    ...current,
    flatPages: [page, ...current.flatPages],
  }))

  return NextResponse.json({ data: page }, { status: 201 })
}
