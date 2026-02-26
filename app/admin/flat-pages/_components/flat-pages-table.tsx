import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FlatPage } from "@/lib/admin-panel/types"

interface FlatPagesTableProps {
  pages: FlatPage[]
  onToggle: (id: string, enabled: boolean) => void
}

export function FlatPagesTable({ pages, onToggle }: FlatPagesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Rich Text Description</TableHead>
          <TableHead>Enabled</TableHead>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
