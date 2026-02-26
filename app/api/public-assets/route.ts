import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "../_lib/auth"
import { list, del } from "@vercel/blob"

async function getHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const cursor = searchParams.get("cursor") || undefined
    const prefix = searchParams.get("prefix") || undefined

    const result = await list({
      limit,
      cursor,
      prefix,
      mode: "expanded",
    })

    return NextResponse.json({
      message: "Success",
      data: {
        blobs: result.blobs,
        hasMore: result.hasMore,
        cursor: result.cursor,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to list assets" },
      { status: 500 }
    )
  }
}

async function deleteHandler(req: NextRequest) {
  try {
    const body = await req.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { message: "URL is required" },
        { status: 400 }
      )
    }

    await del(url)

    return NextResponse.json({ message: "Asset deleted successfully" })
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to delete asset" },
      { status: 500 }
    )
  }
}

export const GET = withAuth(getHandler)
export const DELETE = withAuth(deleteHandler)