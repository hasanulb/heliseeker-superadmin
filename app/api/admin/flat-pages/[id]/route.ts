import { NextRequest, NextResponse } from "next/server"

import { updateDb } from "@/lib/admin-panel/store"

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const payload = (await request.json()) as {
    title?: string
    slug?: string
    description?: string
    enabled?: boolean
  }

  const next = await updateDb((current) => ({
    ...current,
    flatPages: current.flatPages.map((item) =>
      item.id === id
        ? {
            ...item,
            title: payload.title ?? item.title,
            slug: payload.slug ?? item.slug,
            description: payload.description ?? item.description,
            enabled: payload.enabled ?? item.enabled,
            updatedAt: new Date().toISOString(),
          }
        : item,
    ),
  }))

  return NextResponse.json({ data: next.flatPages.find((item) => item.id === id) })
}
