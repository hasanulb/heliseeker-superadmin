import { NextRequest, NextResponse } from "next/server"

import { makeId, readDb, updateDb } from "@/lib/admin-panel/store"
import { TagItem } from "@/lib/admin-panel/types"

export async function GET() {
  const db = await readDb()
  return NextResponse.json({ data: db.tags })
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as Omit<TagItem, "id" | "enabled"> & { enabled?: boolean }

  const tag: TagItem = {
    id: makeId("t"),
    tagName: payload.tagName,
    tagType: payload.tagType,
    keyword: payload.keyword,
    question: payload.question,
    linkedCategory: payload.linkedCategory,
    enabled: payload.enabled ?? true,
  }

  await updateDb((current) => ({
    ...current,
    tags: [tag, ...current.tags],
  }))

  return NextResponse.json({ data: tag }, { status: 201 })
}
