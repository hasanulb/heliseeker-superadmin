import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "../_lib/auth"
import { put } from "@vercel/blob"

const MAX_FILE_SIZE_BYTES = 6 * 1024 * 1024 // 6MB
const BASE_FOLDER = "client-logos"

async function postHandler(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll("files")

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: "No files provided" },
        { status: 400 }
      )
    }

    const uploads = files.map(async (entry) => {
      if (!(entry instanceof File)) {
        throw new Error("Invalid file input")
      }
      const file = entry as File
      if (!file.type || !file.type.startsWith("image/")) {
        throw new Error("Only image uploads are allowed")
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error("File too large. Max size is 6MB.")
      }

      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin"
      const safeNamePart = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "")
        .slice(0, 80)
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      const pathname = `${BASE_FOLDER}/${unique}-${
        safeNamePart || "logo"
      }.${ext}`

      const blob = await put(pathname, file, {
        access: "public",
        addRandomSuffix: false,
        multipart: true,
        contentType: file.type,
      })

      return blob.url
    })

    const urls = await Promise.all(uploads)

    return NextResponse.json({ message: "Uploaded", urls })
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || "Failed to upload" },
      { status: 500 }
    )
  }
}

export const POST = withAuth(postHandler)
