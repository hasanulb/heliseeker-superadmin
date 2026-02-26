import { ArrowDown, ArrowUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchFilterItem } from "@/lib/admin-panel/types"

interface FilterListProps {
  items: SearchFilterItem[]
  onToggle: (id: string, enabled: boolean) => void
  onReorder: (next: SearchFilterItem[]) => void
}

export function FilterList({ items, onToggle, onReorder }: FilterListProps) {
  const ordered = [...items].sort((a, b) => a.order - b.order)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Kind</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Parent</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Reorder</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordered.map((item, index) => (
          <TableRow key={item.id}>
            <TableCell>{item.kind}</TableCell>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.description || "-"}</TableCell>
            <TableCell>{item.parentId || "-"}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch checked={item.enabled} onCheckedChange={(checked) => onToggle(item.id, checked)} />
                <span>{item.enabled ? "Enabled" : "Disabled"}</span>
              </div>
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button
                size="icon"
                variant="outline"
                disabled={index === 0}
                onClick={() => {
                  const next = [...ordered]
                  ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                  onReorder(next)
                }}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                disabled={index === ordered.length - 1}
                onClick={() => {
                  const next = [...ordered]
                  ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
                  onReorder(next)
                }}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
