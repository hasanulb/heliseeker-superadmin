import { NextRequest, NextResponse } from "next/server"

import { updateDb } from "@/lib/admin-panel/store"

export async function PATCH(request: NextRequest) {
  const payload = (await request.json()) as { orderedIds: string[] }

  const next = await updateDb((current) => {
    const rank = new Map(payload.orderedIds.map((id, index) => [id, index + 1]))

    return {
      ...current,
      searchFilters: current.searchFilters.map((item) => ({
        ...item,
        order: rank.get(item.id) ?? item.order,
      })),
    }
  })

  return NextResponse.json({ data: next.searchFilters })
}
