import { upload } from "@vercel/blob/client"
import { api } from "./http"

export class ProjectService {
  constructor() {}

  private async convertToWebP(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()

      reader.onloadend = () => {
        img.src = reader.result as string
      }

      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject("Canvas context not available")

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Convert image to WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob) // Return the WebP image as Blob
            } else {
              reject("Error converting image to WebP")
            }
          },
          "image/webp",
          0.85 // quality setting (0 to 1)
        )
      }

      img.onerror = (error) => {
        reject("Error loading image")
      }

      reader.onerror = () => {
        reject("Error reading file")
      }

      reader.readAsDataURL(file)
    })
  }

  async createProject(data: any) {
    return await api.post(`/api/projects`, data)
  }

  async updateProject(project_id: string, data: any) {
    return await api.patch(`/api/projects/${project_id}`, data)
  }

  async deleteProject(project_id: string) {
    return await api.delete<{ project_id: string }>(
      `/api/projects/${project_id}`
    )
  }

  async getProject(project_id: string) {
    return await api.get(`/api/projects/${project_id}`)
  }

  async getProjects({
    search = "",
    page = 1,
    pageSize = 10,
    sort = { field: "created_at", dir: "desc" },
  }) {
    const params = new URLSearchParams({
      search,
      page: String(page),
      pageSize: String(pageSize),
      sortField: String(sort.field),
      sortDir: String(sort.dir),
    })
    return await api.get<{ data: any[]; count: number }>(
      `/api/projects?${params.toString()}`
    )
  }

  async uploadImages(files: File[]): Promise<string[]> {
    const uploadedUrls: string[] = []

    for (const file of files) {
      try {
        // Convert the image to WebP
        const webpBlob = await this.convertToWebP(file)

        // Create a new file with the WebP blob
        const webpFile = new File(
          [webpBlob],
          `${file.name.split(".")[0]}.webp`,
          {
            type: "image/webp",
            lastModified: Date.now(),
          }
        )

        // Upload directly to Vercel Blob using client-side upload
        const blob = await upload(webpFile.name, webpFile, {
          access: "public",
          handleUploadUrl: "/api/blob-upload",
        })

        uploadedUrls.push(blob.url)
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error)
        throw new Error(
          `Failed to upload ${file.name}: ${(error as Error).message}`
        )
      }
    }

    return uploadedUrls
  }
}
