"use client"

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { upload as blobClientUpload } from "@vercel/blob/client"
import {
  ClienteleGroupFormInputType,
  ClientLogoFormInputType,
  ReorderRequestType,
} from "@/app/admin/content/clientele/types"
import {
  ClienteleGroupType,
  ClientLogoType,
  ClienteleGroupWithLogos,
} from "@/app/admin/content/clientele/types"

// Groups Hooks
export function useClienteleGroups(includeLogos: boolean = false) {
  return useQuery({
    queryKey: ["clientele_groups", { includeLogos }],
    queryFn: async () => {
      const url = `/api/clientele-groups${
        includeLogos ? "?includeLogos=true" : ""
      }`
      const res = await fetch(url, { credentials: "include" })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Failed to fetch groups")
      return result.data
    },
  })
}

export function useClienteleGroup(id: string) {
  return useQuery({
    queryKey: ["clientele_group", id],
    queryFn: async () => {
      const res = await fetch(`/api/clientele-groups/${id}`, {
        credentials: "include",
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Failed to fetch group")
      return result.data
    },
    enabled: !!id,
  })
}

export function useCreateClienteleGroup() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: ClienteleGroupFormInputType) => {
      const res = await fetch("/api/clientele-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Failed to create group")
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientele_groups"] })
      toast({
        title: "Success",
        description: "Group created successfully",
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error creating group",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateClienteleGroup(id: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationKey: ["clientele", "update", "group", id],
    mutationFn: async (data: ClienteleGroupFormInputType) => {
      const res = await fetch(`/api/clientele-groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Failed to update group")
      return result.data
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["clientele_groups"] })
      const prevWithLogos = queryClient.getQueryData<ClienteleGroupWithLogos[]>(
        ["clientele_groups", { includeLogos: true }]
      )
      const prevWithoutLogos = queryClient.getQueryData<ClienteleGroupType[]>([
        "clientele_groups",
        { includeLogos: false },
      ])
      const prevDetail = queryClient.getQueryData<ClienteleGroupWithLogos>([
        "clientele_group",
        id,
      ])

      if (prevWithLogos) {
        const next = prevWithLogos.map((g) =>
          g.group_id === id ? { ...g, ...data } : g
        )
        queryClient.setQueryData(
          ["clientele_groups", { includeLogos: true }],
          next
        )
      }
      if (prevWithoutLogos) {
        const next = prevWithoutLogos.map((g) =>
          g.group_id === id ? { ...g, ...data } : g
        )
        queryClient.setQueryData(
          ["clientele_groups", { includeLogos: false }],
          next
        )
      }
      if (prevDetail) {
        const next = { ...prevDetail, ...data }
        queryClient.setQueryData(["clientele_group", id], next)
      }

      return { prevWithLogos, prevWithoutLogos, prevDetail }
    },
    onError: (error: any, _vars, ctx) => {
      if (ctx) {
        if (ctx.prevWithLogos)
          queryClient.setQueryData(
            ["clientele_groups", { includeLogos: true }],
            ctx.prevWithLogos
          )
        if (ctx.prevWithoutLogos)
          queryClient.setQueryData(
            ["clientele_groups", { includeLogos: false }],
            ctx.prevWithoutLogos
          )
        if (ctx.prevDetail)
          queryClient.setQueryData(["clientele_group", id], ctx.prevDetail)
      }
      toast({
        title: "Error",
        description: error?.message || "Error updating group",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Group updated successfully",
        variant: "success",
      })
    },
    onSettled: () => {
      if (
        queryClient.isMutating({
          mutationKey: ["clientele", "update", "group", id],
        }) === 1
      ) {
        queryClient.invalidateQueries({ queryKey: ["clientele_groups"] })
        queryClient.invalidateQueries({ queryKey: ["clientele_group", id] })
      }
    },
  })
}

export function useDeleteClienteleGroup() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationKey: ["clientele", "delete", "group"],
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clientele-groups/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result?.message || "Failed to delete group")
    },
    onMutate: async (groupId) => {
      await queryClient.cancelQueries({ queryKey: ["clientele_groups"] })
      const prevWithLogos = queryClient.getQueryData<ClienteleGroupWithLogos[]>(
        ["clientele_groups", { includeLogos: true }]
      )
      const prevWithoutLogos = queryClient.getQueryData<ClienteleGroupType[]>([
        "clientele_groups",
        { includeLogos: false },
      ])
      const prevDetail = queryClient.getQueryData<ClienteleGroupWithLogos>([
        "clientele_group",
        groupId,
      ])
      const prevLogos = queryClient.getQueryData<ClientLogoType[]>([
        "client_logos",
        groupId,
      ])

      if (prevWithLogos) {
        const next = prevWithLogos.filter((g) => g.group_id !== groupId)
        queryClient.setQueryData(
          ["clientele_groups", { includeLogos: true }],
          next
        )
      }
      if (prevWithoutLogos) {
        const next = prevWithoutLogos.filter((g) => g.group_id !== groupId)
        queryClient.setQueryData(
          ["clientele_groups", { includeLogos: false }],
          next
        )
      }
      if (prevDetail) {
        queryClient.removeQueries({ queryKey: ["clientele_group", groupId] })
      }
      if (prevLogos) {
        queryClient.removeQueries({ queryKey: ["client_logos", groupId] })
      }

      return { prevWithLogos, prevWithoutLogos, prevDetail, prevLogos, groupId }
    },
    onError: (error: any, _id, ctx) => {
      if (ctx) {
        if (ctx.prevWithLogos)
          queryClient.setQueryData(
            ["clientele_groups", { includeLogos: true }],
            ctx.prevWithLogos
          )
        if (ctx.prevWithoutLogos)
          queryClient.setQueryData(
            ["clientele_groups", { includeLogos: false }],
            ctx.prevWithoutLogos
          )
        if (ctx.prevDetail)
          queryClient.setQueryData(
            ["clientele_group", ctx.groupId],
            ctx.prevDetail
          )
        if (ctx.prevLogos)
          queryClient.setQueryData(["client_logos", ctx.groupId], ctx.prevLogos)
      }
      toast({
        title: "Error",
        description: error?.message || "Error deleting group",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Group and all its logos deleted",
        variant: "success",
      })
    },
    onSettled: (_d, _e, groupId) => {
      if (
        queryClient.isMutating({
          mutationKey: ["clientele", "delete", "group"],
        }) === 1
      ) {
        queryClient.invalidateQueries({ queryKey: ["clientele_groups"] })
        if (groupId) {
          queryClient.invalidateQueries({ queryKey: ["client_logos", groupId] })
          queryClient.invalidateQueries({
            queryKey: ["clientele_group", groupId],
          })
        }
      }
    },
  })
}

export function useReorderClienteleGroups() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationKey: ["clientele", "reorder", "groups"],
    mutationFn: async (items: ReorderRequestType["items"]) => {
      const response = await fetch("/api/clientele-groups/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message)
      }

      return response.json()
    },
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ["clientele_groups"] })

      const previousWithLogos = queryClient.getQueryData<
        ClienteleGroupWithLogos[]
      >(["clientele_groups", { includeLogos: true }])
      const previousWithoutLogos = queryClient.getQueryData<
        ClienteleGroupType[]
      >(["clientele_groups", { includeLogos: false }])

      const orderMap = new Map(items.map((i) => [i.id, i.order_index]))

      if (previousWithLogos) {
        const updated = previousWithLogos
          .map((g) => ({
            ...g,
            order_index: orderMap.get(g.group_id) ?? g.order_index,
          }))
          .sort((a, b) => a.order_index - b.order_index)
        queryClient.setQueryData(
          ["clientele_groups", { includeLogos: true }],
          updated
        )
      }

      if (previousWithoutLogos) {
        const updated = previousWithoutLogos
          .map((g) => ({
            ...g,
            order_index: orderMap.get(g.group_id) ?? g.order_index,
          }))
          .sort((a, b) => a.order_index - b.order_index)
        queryClient.setQueryData(
          ["clientele_groups", { includeLogos: false }],
          updated
        )
      }

      return { previousWithLogos, previousWithoutLogos }
    },
    onError: (error: any, _variables, context) => {
      if (context) {
        if (context.previousWithLogos) {
          queryClient.setQueryData(
            ["clientele_groups", { includeLogos: true }],
            context.previousWithLogos
          )
        }
        if (context.previousWithoutLogos) {
          queryClient.setQueryData(
            ["clientele_groups", { includeLogos: false }],
            context.previousWithoutLogos
          )
        }
      }
      toast({
        title: "Error",
        description: error?.message || "Error reordering groups",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Groups reordered successfully",
        variant: "success",
      })
    },
    onSettled: () => {
      if (
        queryClient.isMutating({
          mutationKey: ["clientele", "reorder", "groups"],
        }) === 1
      ) {
        queryClient.invalidateQueries({ queryKey: ["clientele_groups"] })
      }
    },
  })
}

export function useClientLogos(groupId?: string) {
  return useQuery({
    queryKey: ["client_logos", groupId ?? null],
    queryFn: async () => {
      const url = `/api/client-logos${
        groupId ? `?groupId=${encodeURIComponent(groupId)}` : ""
      }`
      const res = await fetch(url, { credentials: "include" })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Failed to fetch logos")
      return result.data
    },
    enabled: !!groupId,
  })
}

export function useClientLogo(id: string) {
  return useQuery({
    queryKey: ["client_logo", id],
    queryFn: async () => {
      const res = await fetch(`/api/client-logos/${id}`, {
        credentials: "include",
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Failed to fetch logo")
      return result.data
    },
    enabled: !!id,
  })
}

export function useCreateClientLogo() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: ClientLogoFormInputType & { files?: File[] }) => {
      let logoData = { ...data }

      // Upload image via Vercel Blob client if files are provided
      if (data.files && data.files.length > 0) {
        const [file] = data.files
        if (!file.type.startsWith("image/")) {
          throw new Error("Please upload images only.")
        }

        const blob = await blobClientUpload(`client-logos/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          multipart: true,
          onUploadProgress: () => {},
        })

        logoData.img_url = blob.url
      }

      // Remove files from the data before sending to API
      const { files, ...logoDataWithoutFiles } = logoData

      const res = await fetch("/api/client-logos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(logoDataWithoutFiles),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Failed to create logo")
      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientele_groups"] })
      queryClient.invalidateQueries({ queryKey: ["client_logos"] })
      toast({
        title: "Success",
        description: "Logo added successfully",
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error creating logo",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateClientLogo(id: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationKey: ["clientele", "update", "logo", id],
    mutationFn: async (data: ClientLogoFormInputType & { files?: File[] }) => {
      let logoData = { ...data }

      // Upload new image via Vercel Blob client if files are provided
      if (data.files && data.files.length > 0) {
        const [file] = data.files
        if (!file.type.startsWith("image/")) {
          throw new Error("Please upload images only.")
        }

        const blob = await blobClientUpload(`client-logos/${file.name}`, file, {
          access: "public",
          handleUploadUrl: "/api/blob/upload",
          multipart: true,
        })

        logoData.img_url = blob.url
      }

      // Remove files from the data before sending to API
      const { files, ...logoDataWithoutFiles } = logoData

      const res = await fetch(`/api/client-logos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(logoDataWithoutFiles),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.message || "Failed to update logo")
      return result.data
    },
    onMutate: async (data) => {
      const newGroupId = data.group_id
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["clientele_groups"] }),
        queryClient.cancelQueries({ queryKey: ["client_logos", newGroupId] }),
      ])

      const prevGroupsWithLogos = queryClient.getQueryData<
        ClienteleGroupWithLogos[]
      >(["clientele_groups", { includeLogos: true }])
      const prevGroupDetailNew =
        queryClient.getQueryData<ClienteleGroupWithLogos>([
          "clientele_group",
          newGroupId,
        ])

      // Find old group id by searching
      let oldGroupId: string | undefined
      if (prevGroupsWithLogos) {
        for (const g of prevGroupsWithLogos) {
          if ((g.client_logos || []).some((l) => l.client_logo_id === id)) {
            oldGroupId = g.group_id
            break
          }
        }
      }
      const prevGroupDetailOld = oldGroupId
        ? queryClient.getQueryData<ClienteleGroupWithLogos>([
            "clientele_group",
            oldGroupId,
          ])
        : undefined
      const prevLogosOld = oldGroupId
        ? queryClient.getQueryData<ClientLogoType[]>([
            "client_logos",
            oldGroupId,
          ])
        : undefined
      const prevLogosNew = queryClient.getQueryData<ClientLogoType[]>([
        "client_logos",
        newGroupId,
      ])

      // Update groups with logos
      if (prevGroupsWithLogos) {
        const next = prevGroupsWithLogos.map((g) => {
          if (
            g.group_id === oldGroupId &&
            oldGroupId &&
            oldGroupId !== newGroupId
          ) {
            return {
              ...g,
              client_logos: (g.client_logos || []).filter(
                (l) => l.client_logo_id !== id
              ),
            }
          }
          if (g.group_id === newGroupId) {
            const existing = g.client_logos || []
            const has = existing.some((l) => l.client_logo_id === id)
            const updatedLogo: ClientLogoType = {
              client_logo_id: id,
              group_id: newGroupId,
              name: data.name,
              img_url:
                (data as any).img_url ||
                (existing.find((l) => l.client_logo_id === id)?.img_url ?? ""),
              order_index: has
                ? existing.find((l) => l.client_logo_id === id)?.order_index ??
                  existing.length + 1
                : existing.length + 1,
              created_at:
                existing.find((l) => l.client_logo_id === id)?.created_at ??
                new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            const nextLogos = has
              ? existing.map((l) =>
                  l.client_logo_id === id ? { ...l, ...updatedLogo } : l
                )
              : [...existing, updatedLogo]
            return { ...g, client_logos: nextLogos }
          }
          return g
        })
        queryClient.setQueryData(
          ["clientele_groups", { includeLogos: true }],
          next
        )
      }

      // Update group detail caches
      if (prevGroupDetailOld && oldGroupId && oldGroupId !== newGroupId) {
        const next = {
          ...prevGroupDetailOld,
          client_logos: (prevGroupDetailOld.client_logos || []).filter(
            (l) => l.client_logo_id !== id
          ),
        }
        queryClient.setQueryData(["clientele_group", oldGroupId], next)
      }
      if (prevGroupDetailNew) {
        const existing = prevGroupDetailNew.client_logos || []
        const has = existing.some((l) => l.client_logo_id === id)
        const updatedLogo: Partial<ClientLogoType> = {
          client_logo_id: id,
          group_id: newGroupId,
          name: data.name,
        }
        const nextLogos = has
          ? existing.map((l) =>
              l.client_logo_id === id
                ? ({ ...l, ...updatedLogo } as ClientLogoType)
                : l
            )
          : [
              ...existing,
              {
                ...(updatedLogo as ClientLogoType),
                img_url:
                  existing.find((l) => l.client_logo_id === id)?.img_url ?? "",
                order_index: existing.length + 1,
                created_at:
                  existing.find((l) => l.client_logo_id === id)?.created_at ??
                  new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]
        queryClient.setQueryData(["clientele_group", newGroupId], {
          ...prevGroupDetailNew,
          client_logos: nextLogos,
        })
      }

      // Update standalone lists
      if (prevLogosOld && oldGroupId && oldGroupId !== newGroupId) {
        queryClient.setQueryData(
          ["client_logos", oldGroupId],
          prevLogosOld.filter((l) => l.client_logo_id !== id)
        )
      }
      if (prevLogosNew) {
        const has = prevLogosNew.some((l) => l.client_logo_id === id)
        const updatedLogo: Partial<ClientLogoType> = {
          client_logo_id: id,
          group_id: newGroupId,
          name: data.name,
        }
        const next = has
          ? prevLogosNew.map((l) =>
              l.client_logo_id === id
                ? ({ ...l, ...updatedLogo } as ClientLogoType)
                : l
            )
          : [
              ...prevLogosNew,
              {
                ...(updatedLogo as ClientLogoType),
                img_url:
                  prevLogosNew.find((l) => l.client_logo_id === id)?.img_url ??
                  "",
                order_index: prevLogosNew.length + 1,
                created_at:
                  prevLogosNew.find((l) => l.client_logo_id === id)
                    ?.created_at ?? new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]
        queryClient.setQueryData(["client_logos", newGroupId], next)
      }

      return {
        prevGroupsWithLogos,
        prevGroupDetailOld,
        prevGroupDetailNew,
        prevLogosOld,
        prevLogosNew,
        oldGroupId,
        newGroupId,
      }
    },
    onError: (error: any, _vars, ctx) => {
      if (ctx) {
        if (ctx.prevGroupsWithLogos)
          queryClient.setQueryData(
            ["clientele_groups", { includeLogos: true }],
            ctx.prevGroupsWithLogos
          )
        if (ctx.oldGroupId)
          queryClient.setQueryData(
            ["clientele_group", ctx.oldGroupId],
            ctx.prevGroupDetailOld
          )
        if (ctx.newGroupId)
          queryClient.setQueryData(
            ["clientele_group", ctx.newGroupId],
            ctx.prevGroupDetailNew
          )
        if (ctx.oldGroupId)
          queryClient.setQueryData(
            ["client_logos", ctx.oldGroupId],
            ctx.prevLogosOld
          )
        queryClient.setQueryData(
          ["client_logos", ctx.newGroupId],
          ctx.prevLogosNew
        )
      }
      toast({
        title: "Error",
        description: error?.message || "Error updating logo",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logo updated successfully",
        variant: "success",
      })
    },
    onSettled: () => {
      if (
        queryClient.isMutating({
          mutationKey: ["clientele", "update", "logo", id],
        }) === 1
      ) {
        queryClient.invalidateQueries({ queryKey: ["clientele_groups"] })
      }
    },
  })
}

export function useDeleteClientLogo() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationKey: ["clientele", "delete", "logo"],
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/client-logos/${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result?.message || "Failed to delete logo")
    },
    onMutate: async (logoId) => {
      await queryClient.cancelQueries({ queryKey: ["clientele_groups"] })
      const prevGroupsWithLogos = queryClient.getQueryData<
        ClienteleGroupWithLogos[]
      >(["clientele_groups", { includeLogos: true }])

      // Find group id where this logo exists
      let groupId: string | undefined
      if (prevGroupsWithLogos) {
        for (const g of prevGroupsWithLogos) {
          if ((g.client_logos || []).some((l) => l.client_logo_id === logoId)) {
            groupId = g.group_id
            break
          }
        }
      }

      const prevGroupDetail = groupId
        ? queryClient.getQueryData<ClienteleGroupWithLogos>([
            "clientele_group",
            groupId,
          ])
        : undefined
      const prevLogosList = groupId
        ? queryClient.getQueryData<ClientLogoType[]>(["client_logos", groupId])
        : undefined

      if (prevGroupsWithLogos) {
        const next = prevGroupsWithLogos.map((g) =>
          g.group_id === groupId
            ? {
                ...g,
                client_logos: (g.client_logos || []).filter(
                  (l) => l.client_logo_id !== logoId
                ),
              }
            : g
        )
        queryClient.setQueryData(
          ["clientele_groups", { includeLogos: true }],
          next
        )
      }
      if (groupId && prevGroupDetail) {
        const next = {
          ...prevGroupDetail,
          client_logos: (prevGroupDetail.client_logos || []).filter(
            (l) => l.client_logo_id !== logoId
          ),
        }
        queryClient.setQueryData(["clientele_group", groupId], next)
      }
      if (groupId && prevLogosList) {
        queryClient.setQueryData(
          ["client_logos", groupId],
          prevLogosList.filter((l) => l.client_logo_id !== logoId)
        )
      }

      return { prevGroupsWithLogos, prevGroupDetail, prevLogosList, groupId }
    },
    onError: (error: any, _id, ctx) => {
      if (ctx) {
        if (ctx.prevGroupsWithLogos)
          queryClient.setQueryData(
            ["clientele_groups", { includeLogos: true }],
            ctx.prevGroupsWithLogos
          )
        if (ctx.groupId && ctx.prevGroupDetail)
          queryClient.setQueryData(
            ["clientele_group", ctx.groupId],
            ctx.prevGroupDetail
          )
        if (ctx.groupId && ctx.prevLogosList)
          queryClient.setQueryData(
            ["client_logos", ctx.groupId],
            ctx.prevLogosList
          )
      }
      toast({
        title: "Error",
        description: error?.message || "Error deleting logo",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logo deleted successfully",
        variant: "success",
      })
    },
    onSettled: (_d, _e, _id, ctx) => {
      if (
        queryClient.isMutating({
          mutationKey: ["clientele", "delete", "logo"],
        }) === 1
      ) {
        queryClient.invalidateQueries({ queryKey: ["clientele_groups"] })
        if (ctx?.groupId) {
          queryClient.invalidateQueries({
            queryKey: ["client_logos", ctx.groupId],
          })
          queryClient.invalidateQueries({
            queryKey: ["clientele_group", ctx.groupId],
          })
        }
      }
    },
  })
}

export function useBulkCreateClientLogos() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationKey: ["clientele", "bulk-create", "logos"],
    mutationFn: async ({
      groupId,
      items,
    }: {
      groupId: string
      items: { file: File; name?: string }[]
    }) => {
      if (!groupId) throw new Error("Missing groupId")
      if (!items || items.length === 0) throw new Error("No files to upload")

      // Validate files (type only; size handled by Blob with multipart)
      const invalid = items.find(({ file }) => !file.type.startsWith("image/"))
      if (invalid) throw new Error("Please upload images only.")

      // Upload all files to Vercel Blob in parallel (bounded concurrency)
      const concurrency = 6
      const results: Array<{ url: string }> = []
      let index = 0
      async function worker() {
        while (index < items.length) {
          const i = index++
          const { file } = items[i]
          const blob = await blobClientUpload(`client-logos/${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/blob/upload",
            multipart: true,
          })
          results[i] = blob
        }
      }
      const workers = Array.from(
        { length: Math.min(concurrency, items.length) },
        () => worker()
      )
      await Promise.all(workers)

      // Create logos sequentially to preserve order_index assignment
      for (let i = 0; i < items.length; i++) {
        const body = {
          group_id: groupId,
          img_url: results[i].url,
          name: items[i].name,
        }
        const res = await fetch("/api/client-logos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        })
        const result = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(result?.message || "Failed to create logo")
      }

      return { count: items.length }
    },
    onSuccess: (_data, variables) => {
      // Refresh impacted caches
      queryClient.invalidateQueries({ queryKey: ["clientele_groups"] })
      if (variables?.groupId) {
        queryClient.invalidateQueries({
          queryKey: ["client_logos", variables.groupId],
        })
        queryClient.invalidateQueries({
          queryKey: ["clientele_group", variables.groupId],
        })
      }
      toast({
        title: "Success",
        description: "Logos added successfully",
        variant: "success",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Error adding logos",
        variant: "destructive",
      })
    },
  })
}

export function useReorderClientLogos() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationKey: ["clientele", "reorder", "logos"],
    mutationFn: async ({
      groupId,
      items,
    }: {
      groupId: string
      items: ReorderRequestType["items"]
    }) => {
      const response = await fetch("/api/client-logos/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.message)
      }

      return response.json()
    },
    // Optimistic update
    onMutate: async ({ groupId, items }) => {
      // Cancel potentially conflicting queries
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["clientele_groups"] }),
        queryClient.cancelQueries({ queryKey: ["clientele_group", groupId] }),
        queryClient.cancelQueries({ queryKey: ["client_logos", groupId] }),
      ])

      const previousGroupsWithLogos = queryClient.getQueryData<
        ClienteleGroupWithLogos[]
      >(["clientele_groups", { includeLogos: true }])
      const previousGroupDetail =
        queryClient.getQueryData<ClienteleGroupWithLogos>([
          "clientele_group",
          groupId,
        ])
      const previousLogosList = queryClient.getQueryData<ClientLogoType[]>([
        "client_logos",
        groupId,
      ])

      const orderMap = new Map(items.map((i) => [i.id, i.order_index]))

      // Update groups list with embedded logos
      if (previousGroupsWithLogos) {
        const updatedGroups = previousGroupsWithLogos.map((g) => {
          if (g.group_id !== groupId) return g
          const updatedLogos = (g.client_logos || [])
            .map((logo) => ({
              ...logo,
              order_index:
                orderMap.get(logo.client_logo_id) ?? logo.order_index,
            }))
            .sort((a, b) => a.order_index - b.order_index)
          return { ...g, client_logos: updatedLogos }
        })
        queryClient.setQueryData(
          ["clientele_groups", { includeLogos: true }],
          updatedGroups
        )
      }

      // Update group detail
      if (previousGroupDetail) {
        const updatedDetail: ClienteleGroupWithLogos = {
          ...previousGroupDetail,
          client_logos: (previousGroupDetail.client_logos || [])
            .map((logo) => ({
              ...logo,
              order_index:
                orderMap.get(logo.client_logo_id) ?? logo.order_index,
            }))
            .sort((a, b) => a.order_index - b.order_index),
        }
        queryClient.setQueryData(["clientele_group", groupId], updatedDetail)
      }

      // Update standalone logos list
      if (previousLogosList) {
        const updatedLogos = previousLogosList
          .map((logo) => ({
            ...logo,
            order_index: orderMap.get(logo.client_logo_id) ?? logo.order_index,
          }))
          .sort((a, b) => a.order_index - b.order_index)
        queryClient.setQueryData(["client_logos", groupId], updatedLogos)
      }

      return {
        previousGroupsWithLogos,
        previousGroupDetail,
        previousLogosList,
        groupId,
      }
    },
    onError: (error: any, _variables, context) => {
      if (context) {
        if (context.previousGroupsWithLogos) {
          queryClient.setQueryData(
            ["clientele_groups", { includeLogos: true }],
            context.previousGroupsWithLogos
          )
        }
        if (context.previousGroupDetail) {
          queryClient.setQueryData(
            ["clientele_group", context.groupId],
            context.previousGroupDetail
          )
        }
        if (context.previousLogosList) {
          queryClient.setQueryData(
            ["client_logos", context.groupId],
            context.previousLogosList
          )
        }
      }
      toast({
        title: "Error",
        description: error?.message || "Error reordering logos",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      // no-op here; do invalidation in onSettled with limited scope
      toast({
        title: "Success",
        description: "Logos reordered successfully",
        variant: "success",
      })
    },
    onSettled: (_data, _error, variables) => {
      if (!variables) return
      if (
        queryClient.isMutating({
          mutationKey: ["clientele", "reorder", "logos"],
        }) === 1
      ) {
        queryClient.invalidateQueries({ queryKey: ["clientele_groups"] })
        queryClient.invalidateQueries({
          queryKey: ["client_logos", variables.groupId],
        })
        queryClient.invalidateQueries({
          queryKey: ["clientele_group", variables.groupId],
        })
      }
    },
  })
}
