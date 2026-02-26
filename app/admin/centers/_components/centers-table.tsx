"use client"

import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CenterApprovalStatus, CenterProfile } from "../_types"

interface CentersTableProps {
  centers: CenterProfile[]
  onUpdateStatus: (id: string, status: CenterApprovalStatus) => void
  onDelete?: (id: string) => void
  showApprovalActions?: boolean
  showStatusSelect?: boolean
  showDelete?: boolean
}

const statuses: CenterApprovalStatus[] = ["pending", "active", "deactive", "rejected", "blacklisted"]

export function CentersTable({
  centers,
  onUpdateStatus,
  onDelete,
  showApprovalActions = false,
  showStatusSelect = false,
  showDelete = false,
}: CentersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Center</TableHead>
          <TableHead>Contact Email</TableHead>
          <TableHead>Contact Phone</TableHead>
          <TableHead>Status</TableHead>
          {(showApprovalActions || showStatusSelect || showDelete) && (
            <TableHead className="text-right">Actions</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {centers.map((center) => (
          <TableRow key={center.id}>
            <TableCell className="font-medium">{center.centerName}</TableCell>
            <TableCell>{center.contactEmail || "—"}</TableCell>
            <TableCell>{center.contactPhone || "—"}</TableCell>
            <TableCell className="capitalize">{center.approvalStatus}</TableCell>
            {(showApprovalActions || showStatusSelect || showDelete) && (
              <TableCell className="text-right space-x-2">
                {showApprovalActions && center.approvalStatus === "pending" && (
                  <>
                    <Button size="sm" onClick={() => onUpdateStatus(center.id, "active")}>
                      <Check className="h-4 w-4 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onUpdateStatus(center.id, "rejected")}>
                      <X className="h-4 w-4 mr-1" />Reject
                    </Button>
                  </>
                )}
                {showStatusSelect && (
                  <Select value={center.approvalStatus} onValueChange={(value) => onUpdateStatus(center.id, value as CenterApprovalStatus)}>
                    <SelectTrigger className="inline-flex w-[140px]">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status} className="capitalize">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {showDelete && onDelete && (
                  <Button size="sm" variant="outline" onClick={() => onDelete(center.id)}>
                    Delete
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
