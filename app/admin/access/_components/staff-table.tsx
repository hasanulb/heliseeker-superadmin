import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StaffUserRow } from "../_types"

interface StaffTableProps {
  users: StaffUserRow[]
  onToggleStatus: (id: string, active: boolean) => void
  canEdit?: boolean
}

export function StaffTable({ users, onToggleStatus, canEdit = true }: StaffTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell className="capitalize">{user.role.replace("_", " ")}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={user.active}
                  disabled={!canEdit}
                  onCheckedChange={(checked) => {
                    if (canEdit) onToggleStatus(user.id, checked)
                  }}
                />
                <span>{user.active ? "Active" : "Disabled"}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
