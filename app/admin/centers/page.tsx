"use client"

import { useForm } from "react-hook-form"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { CentersTable } from "./_components/centers-table"
import { useCenters, useDeleteCenter, useUpdateCenterStatus } from "./_hooks/use-centers"

export default function CentersPage() {
  const filtersForm = useForm({ defaultValues: { q: "" } })
  const filters = filtersForm.watch()
  const { data, isLoading, error } = useCenters(filters)
  const centers = data?.data ?? []
  const pendingCenters = centers.filter((center) => center.approvalStatus === "pending")
  const completedCenters = centers.filter((center) => center.approvalStatus !== "pending")

  const updateStatusMutation = useUpdateCenterStatus()
  const deleteCenterMutation = useDeleteCenter()

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
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Pending Approvals</h3>
                {pendingCenters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending centers.</p>
                ) : (
                  <CentersTable
                    centers={pendingCenters}
                    onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
                    showApprovalActions
                  />
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Completed Centers</h3>
                {completedCenters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No completed centers.</p>
                ) : (
                  <CentersTable
                    centers={completedCenters}
                    onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
                    showStatusSelect
                    onDelete={(id) => {
                      if (window.confirm("Delete this center? This cannot be undone.")) {
                        deleteCenterMutation.mutate({ id })
                      }
                    }}
                    showDelete
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
