import { NextResponse } from "next/server"

import { readDb } from "@/lib/admin-panel/store"

export async function GET() {
  const db = await readDb()

  const pendingCenters = db.centers.filter((center) => center.status === "pending").length
  const activeCenters = db.centers.filter((center) => center.status === "active").length
  const rejectedCenters = db.centers.filter((center) => center.status === "rejected").length

  return NextResponse.json({
    centers: {
      pending: pendingCenters,
      active: activeCenters,
      rejected: rejectedCenters,
    },
    totalPatients: db.patients.length,
    seo: db.seo,
  })
}
