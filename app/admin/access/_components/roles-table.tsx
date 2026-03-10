import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Role } from "@/lib/admin-panel/types"

interface RolesTableProps {
  roles: Role[]
}

export function RolesTable({ roles }: RolesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Role</TableHead>
          <TableHead>Module Permissions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {roles.map((role) => (
          <TableRow key={role.id}>
            <TableCell className="font-medium">{role.name}</TableCell>
            <TableCell className="space-x-1">
              {role.permissions.map((permission) => (
                <Badge key={`${role.id}-${permission.module}`} variant="outline">
                  {permission.module}: {permission.view ? "V" : "-"}/{permission.create ? "C" : "-"}/{permission.edit ? "E" : "-"}
                </Badge>
              ))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
