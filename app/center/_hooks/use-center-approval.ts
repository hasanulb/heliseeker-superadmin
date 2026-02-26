"use client"

import { useMemo } from "react"

import { useTRPC } from "@/trpc/client"

export type CenterApprovalStatus = "pending" | "active" | "deactive" | "rejected" | "blacklisted"

export function useCenterApproval() {
  const trpc = useTRPC()
  const query = trpc.centers.myProfile.useQuery()

  const status = useMemo<CenterApprovalStatus | null>(() => {
    const data = query.data?.data
    return data?.approvalStatus ?? null
  }, [query.data])

  return {
    ...query,
    status,
    isApproved: status === "active",
    isPending: status === "pending",
    isRejected: status === "rejected" || status === "blacklisted" || status === "deactive",
  }
}
