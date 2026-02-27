import { NextRequest, NextResponse } from "next/server"

import { makeId, readDb, updateDb } from "@/lib/admin-panel/store"
import { FilterKind, SearchFilterItem } from "@/lib/admin-panel/types"

export async function GET() {
  const db = await readDb()
  return NextResponse.json({ data: db.searchFilters })
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    kind: FilterKind
    name: string
    description?: string
    parentId?: string
  }

  const item: SearchFilterItem = {
    id: makeId("f"),
    kind: payload.kind,
    name: payload.name,
    description: payload.description,
    parentId: payload.parentId,
    enabled: true,
    order: Date.now(),
  }

  await updateDb((current) => ({
    ...current,
    searchFilters: [...current.searchFilters, item],
  }))

  return NextResponse.json({ data: item }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const payload = (await request.json()) as {
    id: string
    enabled?: boolean
    name?: string
    description?: string
  }

  const next = await updateDb((current) => ({
    ...current,
    searchFilters: current.searchFilters.map((item) =>
      item.id === payload.id
        ? {
            ...item,
            enabled: payload.enabled ?? item.enabled,
            name: payload.name ?? item.name,
            description: payload.description ?? item.description,
          }
        : item,
    ),
  }))

  return NextResponse.json({ data: next.searchFilters.find((item) => item.id === payload.id) })
}

export async function DELETE(request: NextRequest) {
  const payload = (await request.json()) as { id: string }

  const next = await updateDb((current) => ({
    ...current,
    searchFilters: current.searchFilters.filter((item) => item.id !== payload.id),
  }))

  return NextResponse.json({ data: next.searchFilters })
}
