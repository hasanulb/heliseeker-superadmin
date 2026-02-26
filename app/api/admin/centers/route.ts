import { NextRequest, NextResponse } from "next/server"

import { makeId, readDb, updateDb } from "@/lib/admin-panel/store"
import { Center, CenterStatus, ReferralType } from "@/lib/admin-panel/types"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status")
  const referralType = searchParams.get("referralType")
  const query = searchParams.get("q")?.toLowerCase() || ""

  const db = await readDb()
  const data = db.centers.filter((center) => {
    const statusMatched = status ? center.status === status : true
    const referralMatched = referralType ? center.referralType === referralType : true
    const queryMatched = query
      ? center.name.toLowerCase().includes(query) || center.city.toLowerCase().includes(query)
      : true

    return statusMatched && referralMatched && queryMatched
  })

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as {
    name: string
    department: string
    city: string
    referralType: ReferralType
  }

  const center: Center = {
    id: makeId("c"),
    name: payload.name,
    department: payload.department,
    city: payload.city,
    referralType: payload.referralType,
    status: "pending",
    createdAt: new Date().toISOString(),
  }

  await updateDb((current) => ({
    ...current,
    centers: [center, ...current.centers],
  }))

  return NextResponse.json({ data: center }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const payload = (await request.json()) as {
    id: string
    status: CenterStatus
    approvalNote?: string
  }

  const updated = await updateDb((current) => ({
    ...current,
    centers: current.centers.map((center) =>
      center.id === payload.id
        ? {
            ...center,
            status: payload.status,
            approvalNote: payload.approvalNote,
          }
        : center,
    ),
  }))

  const center = updated.centers.find((item) => item.id === payload.id)
  return NextResponse.json({ data: center })
}
