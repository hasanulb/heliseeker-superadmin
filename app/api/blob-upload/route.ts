import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { withAuth } from "../_lib/auth"

async function postHandler(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname
        /* clientPayload */
      ) => {
        // Generate a client token for the browser to upload the file
        // Make sure to authenticate and authorize users before generating the token.
        // Otherwise, you're allowing anonymous uploads.

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ],
          addRandomSuffix: true,
          // callbackUrl: 'https://example.com/api/blob-upload',
          // optional, `callbackUrl` is automatically computed when hosted on Vercel
          tokenPayload: JSON.stringify({
            // optional, sent to your server on upload completion
            // you could pass a user id from auth, or a value from clientPayload
            uploadedAt: new Date().toISOString(),
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Called by Vercel API on client upload completion
        // Use tools like ngrok if you want this to work locally

        console.log("blob upload completed", blob, tokenPayload)

        try {
          // Run any logic after the file upload completed
          // const { userId } = JSON.parse(tokenPayload);
          // await db.update({ avatar: blob.url, userId });

          // For now, just log the successful upload
          // You can add database updates here if needed
          console.log(`Successfully uploaded: ${blob.url}`)
        } catch (error) {
          throw new Error("Could not process uploaded blob")
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // The webhook will retry 5 times waiting for a 200
    )
  }
}

export const POST = withAuth(postHandler)
