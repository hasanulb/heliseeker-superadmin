"use client"

import { useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToggleUserActive, useUsers } from "./_hooks/use-users"
import { useRequirePermission } from "@/app/admin/access/_hooks/use-access"

export default function UsersPage() {
  const access = useRequirePermission("customers", "view")
  const [query, setQuery] = useState("")
  const { data, isLoading } = useUsers(query)
  const activeMutation = useToggleUserActive()

  const canEdit = access.can("customers", "edit")

  if (!access.isReady) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="text-sm text-muted-foreground">Manage customer accounts from the users table.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search user by name or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.data || []).filter((user) => user.userType === "customer").map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.isActive}
                          disabled={!canEdit}
                          onCheckedChange={(checked) => {
                            if (canEdit) {
                              activeMutation.mutate({ id: user.id, isActive: checked })
                            }
                          }}
                        />
                        <span>{user.isActive ? "Unblocked" : "Blocked"}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
