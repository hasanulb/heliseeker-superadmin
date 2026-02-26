import { NextResponse } from "next/server"
import { withAuth } from "../../_lib/auth"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"

async function postHandler(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/svg+xml",
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ purpose: "client-logo" }),
        }
      },
      onUploadCompleted: async ({ blob }) => {
        try {
          // Optionally persist or log upload completion.
          // We keep DB writes in the logo create endpoints to preserve ordering.
          console.log("Vercel Blob upload completed:", blob.url)
        } catch (_e) {
          throw new Error("Post-upload hook failed")
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Blob client upload error" },
      { status: 400 }
    )
  }
}

export const POST = withAuth(postHandler)
