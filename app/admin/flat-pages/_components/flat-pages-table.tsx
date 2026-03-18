import { Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FlatPage } from "@/lib/admin-panel/types"

interface FlatPagesTableProps {
  pages: FlatPage[]
  onToggle: (id: string, enabled: boolean) => void
  onEdit?: (page: FlatPage) => void
  onDelete?: (page: FlatPage) => void
  canEdit?: boolean
  canDelete?: boolean
}

export function FlatPagesTable({
  pages,
  onToggle,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: FlatPagesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Rich Text Description</TableHead>
          <TableHead>Enabled</TableHead>
          {(onEdit || onDelete) && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {pages.map((page) => (
          <TableRow key={page.id}>
            <TableCell className="font-medium">{page.title}</TableCell>
            <TableCell>{page.slug}</TableCell>
            <TableCell className="max-w-md truncate">{page.description}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch checked={page.enabled} onCheckedChange={(checked) => onToggle(page.id, checked)} />
                <span>{page.enabled ? "Enabled" : "Disabled"}</span>
              </div>
            </TableCell>
            {(onEdit || onDelete) && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onEdit && (
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => onEdit(page)}
                      aria-label="Edit page"
                      disabled={!canEdit}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => onDelete(page)}
                      aria-label="Delete page"
                      disabled={!canDelete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
