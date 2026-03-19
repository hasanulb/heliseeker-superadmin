import { Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export interface MasterTableItem {
  id: string
  name: string
  description?: string
  departmentName?: string
  ageGroupName?: string
  fromAge?: number
  toAge?: number
  unit?: string
  status?: boolean
}

interface MasterTableProps {
  items: MasterTableItem[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  showDepartment?: boolean
  showAgeGroup?: boolean
  showAgeRange?: boolean
  showStatus?: boolean
  showDescription?: boolean
  nameLabel?: string
  canEdit?: boolean
  canDelete?: boolean
}

export function MasterTable({
  items,
  onEdit,
  onDelete,
  showDepartment,
  showAgeGroup,
  showAgeRange,
  showStatus,
  showDescription = true,
  nameLabel = "Name",
  canEdit = true,
  canDelete = true,
}: MasterTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{nameLabel}</TableHead>
          {showAgeRange && (
            <>
              <TableHead>From Age</TableHead>
              <TableHead>To Age</TableHead>
              <TableHead>Unit</TableHead>
            </>
          )}
          {showDepartment && <TableHead>Department</TableHead>}
          {showAgeGroup && <TableHead>Age Group</TableHead>}
          {showDescription && <TableHead>Description</TableHead>}
          {showStatus && <TableHead>Status</TableHead>}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            {showAgeRange && (
              <>
                <TableCell>{item.fromAge ?? "-"}</TableCell>
                <TableCell>{item.toAge ?? "-"}</TableCell>
                <TableCell>{item.unit ?? "-"}</TableCell>
              </>
            )}
            {showDepartment && <TableCell>{item.departmentName || "-"}</TableCell>}
            {showAgeGroup && <TableCell>{item.ageGroupName || "-"}</TableCell>}
            {showDescription && <TableCell>{item.description || "-"}</TableCell>}
            {showStatus && (
              <TableCell>{item.status === undefined ? "-" : item.status ? "Active" : "Inactive"}</TableCell>
            )}
            <TableCell className="text-right space-x-2">
              <Button size="icon" variant="outline" onClick={() => canEdit && onEdit(item.id)} aria-label="Edit" disabled={!canEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="destructive" onClick={() => canDelete && onDelete(item.id)} aria-label="Delete" disabled={!canDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
