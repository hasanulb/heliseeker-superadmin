import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TagItem } from "@/lib/admin-panel/types"

interface TagsTableProps {
  tags: TagItem[]
  onToggle: (id: string, enabled: boolean) => void
}

export function TagsTable({ tags, onToggle }: TagsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tag Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Keyword</TableHead>
          <TableHead>Question</TableHead>
          <TableHead>Linked Category</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tags.map((tag) => (
          <TableRow key={tag.id}>
            <TableCell className="font-medium">{tag.tagName}</TableCell>
            <TableCell>{tag.tagType}</TableCell>
            <TableCell>{tag.keyword}</TableCell>
            <TableCell>{tag.question}</TableCell>
            <TableCell>{tag.linkedCategory}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch checked={tag.enabled} onCheckedChange={(checked) => onToggle(tag.id, checked)} />
                <span>{tag.enabled ? "Enable" : "Disable"}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
