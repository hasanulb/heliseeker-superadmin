import { NextRequest, NextResponse } from "next/server"

import { updateDb } from "@/lib/admin-panel/store"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const payload = (await request.json()) as {
    tagName?: string
    tagType?: string
    keyword?: string
    question?: string
    linkedCategory?: string
    enabled?: boolean
  }

  const next = await updateDb((current) => ({
    ...current,
    tags: current.tags.map((item) =>
      item.id === id
        ? {
            ...item,
            tagName: payload.tagName ?? item.tagName,
            tagType: payload.tagType ?? item.tagType,
            keyword: payload.keyword ?? item.keyword,
            question: payload.question ?? item.question,
            linkedCategory: payload.linkedCategory ?? item.linkedCategory,
            enabled: payload.enabled ?? item.enabled,
          }
        : item,
    ),
  }))

  return NextResponse.json({ data: next.tags.find((item) => item.id === id) })
}
