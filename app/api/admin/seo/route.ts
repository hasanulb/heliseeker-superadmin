import { NextRequest, NextResponse } from "next/server"

import { readDb, updateDb } from "@/lib/admin-panel/store"

export async function GET() {
  const db = await readDb()
  return NextResponse.json({ data: db.seo })
}

export async function PATCH(request: NextRequest) {
  const payload = (await request.json()) as {
    metaTitle: string
    metaDescription: string
  }

  const next = await updateDb((current) => ({
    ...current,
    seo: {
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
    },
  }))

  return NextResponse.json({ data: next.seo })
}
