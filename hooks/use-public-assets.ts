"use client"

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

export interface PublicAsset {
  size: number
  uploadedAt: Date
  pathname: string
  contentType: string
  contentDisposition: string
  url: string
  downloadUrl: string
}

export interface PublicAssetsResponse {
  blobs: PublicAsset[]
  hasMore: boolean
  cursor?: string
}

export function usePublicAssets(
  limit: number = 50,
  cursor?: string,
  prefix?: string
) {
  return useQuery({
    queryKey: ["public_assets", { limit, cursor, prefix }],
    queryFn: async (): Promise<PublicAssetsResponse> => {
      const params = new URLSearchParams()
      params.append("limit", limit.toString())
      if (cursor) params.append("cursor", cursor)
      if (prefix) params.append("prefix", prefix)

      const res = await fetch(`/api/public-assets?${params}`, {
        credentials: "include",
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Failed to fetch assets")
      return result.data
    },
  })
}

export function useUploadPublicAssets() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (files: File[]): Promise<{ urls: string[] }> => {
      if (!files || files.length === 0) {
        throw new Error("No files provided")
      }

      const formData = new FormData()
      files.forEach((file) => {
        formData.append("files", file)
      })

      const res = await fetch("/api/public-assets/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Failed to upload files")
      return result
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["public_assets"] })
      toast({
        title: "Success",
        description: `${data.urls.length} file${data.urls.length > 1 ? "s" : ""} uploaded successfully`,
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error uploading files",
        variant: "destructive",
      })
    },
  })
}

export function useDeletePublicAsset() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("/api/public-assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Failed to delete asset")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public_assets"] })
      toast({
        title: "Success",
        description: "Asset deleted successfully",
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error deleting asset",
        variant: "destructive",
      })
    },
  })
}

export function useBulkDeletePublicAssets() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (urls: string[]) => {
      const promises = urls.map(url =>
        fetch("/api/public-assets", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ url }),
        }).then(res => {
          if (!res.ok) {
            return res.json().then(result => {
              throw new Error(result.message || "Failed to delete asset")
            })
          }
        })
      )

      await Promise.all(promises)
      return { count: urls.length }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["public_assets"] })
      toast({
        title: "Success",
        description: `${data.count} asset${data.count > 1 ? "s" : ""} deleted successfully`,
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error deleting assets",
        variant: "destructive",
      })
    },
  })
}