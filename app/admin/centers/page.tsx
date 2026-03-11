"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

import { CentersTable } from "./_components/centers-table"
import { useCenters, useUpdateCenterStatus } from "./_hooks/use-centers"
import { CenterApprovalStatus } from "./_types"

export default function CentersPage() {
  const { toast } = useToast()
  const [updatingCenterId, setUpdatingCenterId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<CenterApprovalStatus | null>(null)
  const [statusFilter, setStatusFilter] = useState<"pending" | "completed">("pending")

  const filtersForm = useForm({ defaultValues: { q: "" } })
  const filters = filtersForm.watch()
  const { data, isLoading, error } = useCenters(filters)
  const centers = data?.data ?? []
  const pendingCenters = centers.filter((center) => center.approvalStatus === "submitted")
  const completedCenters = centers.filter(
    (center) => center.approvalStatus !== "submitted",
  )
  const visibleCenters = statusFilter === "pending" ? pendingCenters : completedCenters

  const updateStatusMutation = useUpdateCenterStatus()
  const handleUpdateStatus = async (id: string, status: CenterApprovalStatus) => {
    setUpdatingCenterId(id)
    setUpdatingStatus(status)

    try {
      await updateStatusMutation.mutateAsync({ id, status })
      toast({
        title: "Status updated",
        description:
          status === "rejected"
            ? "Rejected successfully. In-app notification and rejection email flow were triggered."
            : status === "active"
              ? "Approved successfully. In-app notification and approval email flow were triggered."
              : `Center status changed to ${status}.`,
        variant: "success",
      })
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : "Failed to update center status"
      toast({
        title: "Status update failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setUpdatingCenterId(null)
      setUpdatingStatus(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Center Management</h1>
        <p className="text-sm text-muted-foreground">
          Review center onboarding requests. Only approved centers can access portal features.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Center Onboarding</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
            >
              Pending ({pendingCenters.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={statusFilter === "completed" ? "default" : "outline"}
              onClick={() => setStatusFilter("completed")}
            >
              Completed ({completedCenters.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-1">
            <Input
              placeholder="Search name/email/phone"
              value={filters.q}
              onChange={(e) => filtersForm.setValue("q", e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">Total centers: {centers.length}</p>

          {error ? (
            <p className="text-sm text-destructive">Failed to load centers: {error.message}</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading centers...</p>
          ) : (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {statusFilter === "pending" ? "Pending Approvals" : "Completed Centers"}
              </h3>
              {visibleCenters.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {statusFilter === "pending" ? "No pending centers." : "No completed centers."}
                </p>
              ) : (
                <CentersTable
                  centers={visibleCenters}
                  onUpdateStatus={handleUpdateStatus}
                  showApprovalActions={statusFilter === "pending"}
                  showStatusSelect={statusFilter === "completed"}
                  updatingCenterId={updatingCenterId}
                  updatingStatus={updatingStatus}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
