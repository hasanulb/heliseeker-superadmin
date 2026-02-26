import { NextRequest, NextResponse } from "next/server"

import { readDb } from "@/lib/admin-panel/store"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.toLowerCase() || ""
  const db = await readDb()

  const data = db.patients.filter((patient) => {
    if (!query) return true
    return patient.name.toLowerCase().includes(query) || patient.email.toLowerCase().includes(query)
  })

  return NextResponse.json({ data })
}
