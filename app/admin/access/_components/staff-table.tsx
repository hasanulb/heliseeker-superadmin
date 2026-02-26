import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StaffUser } from "@/lib/admin-panel/types"

interface StaffTableProps {
  users: StaffUser[]
  onToggleStatus: (id: string, active: boolean) => void
}

export function StaffTable({ users, onToggleStatus }: StaffTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Module Permissions</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell className="capitalize">{user.role.replace("_", " ")}</TableCell>
            <TableCell className="space-x-1">
              {user.permissions.map((permission) => (
                <Badge key={`${user.id}-${permission.module}`} variant="outline">
                  {permission.module}: {permission.view ? "V" : "-"}/{permission.create ? "C" : "-"}/{permission.edit ? "E" : "-"}
                </Badge>
              ))}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch checked={user.active} onCheckedChange={(checked) => onToggleStatus(user.id, checked)} />
                <span>{user.active ? "Active" : "Disabled"}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
