"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { RolesTable } from "./_components/roles-table"
import { useCreateRole, useDeleteRole, useRoles, useUpdateRole } from "./_hooks/use-roles"
import { createRoleSchema, CreateRoleFormValues } from "./_schemas/role.schema"
import { useRequirePermission } from "@/app/admin/access/_hooks/use-access"
import { Role } from "@/lib/admin-panel/types"

const MODULES = [
  { key: "centers", label: "Centers" },
  { key: "department", label: "Department" },
  { key: "service", label: "Service" },
  { key: "specialization", label: "Specialization" },
  { key: "ageGroup", label: "Age Group" },
  { key: "flatPages", label: "Flat Pages" },
  { key: "customers", label: "Customers" },
  { key: "userManagement", label: "User Management" },
  { key: "userRoles", label: "User Roles" },
]

export default function AccessManagementPage() {
  const access = useRequirePermission("userRoles", "view")
  const { data, isLoading } = useRoles()
  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()
  const deleteMutation = useDeleteRole()
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [search, setSearch] = useState("")

  const buildPermissions = useMemo(
    () => (role?: Role | null) =>
      MODULES.map((module) => {
        const current = role?.permissions.find((permission) => permission.module === module.key)
        return {
          module: module.key,
          view: current?.view ?? false,
          create: current?.create ?? false,
          edit: current?.edit ?? false,
        }
      }),
    [],
  )

  const form = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      permissions: buildPermissions(null),
    },
  })

  useEffect(() => {
    if (editingRole) {
      form.reset({ name: editingRole.name, permissions: buildPermissions(editingRole) })
    } else {
      form.reset({ name: "", permissions: buildPermissions(null) })
    }
  }, [editingRole, form, buildPermissions])

  if (!access.isReady) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  const roles = data?.data || []
  const filteredRoles = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return roles
    return roles.filter((role) => {
      const permissionText = role.permissions.map((permission) => permission.module).join(" ")
      return role.name.toLowerCase().includes(term) || permissionText.toLowerCase().includes(term)
    })
  }, [roles, search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="text-sm text-muted-foreground">Create roles and assign module-level access for staff users.</p>
      </div>

      {access.can("userRoles", "create") && (
        <Card>
        <CardHeader>
          <CardTitle>{editingRole ? "Edit Role" : "Create Role"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (values) => {
                const permissions = values.permissions.filter(
                  (permission) => permission.view || permission.create || permission.edit,
                )
                if (editingRole) {
                  await updateMutation.mutateAsync({
                    id: editingRole.id,
                    name: values.name,
                    permissions,
                  })
                  setEditingRole(null)
                } else {
                  await createMutation.mutateAsync({
                    name: values.name,
                    permissions,
                  })
                }
                form.reset({ name: "", permissions: buildPermissions(null) })
              })}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="permissions"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Module Permissions</FormLabel>
                    <div className="grid gap-2 rounded-md border p-3">
                      <div className="grid grid-cols-[1fr_repeat(3,_80px)] items-center text-xs font-semibold text-muted-foreground">
                        <span>Module</span>
                        <span className="text-center">View</span>
                        <span className="text-center">Create</span>
                        <span className="text-center">Edit</span>
                      </div>
                      {MODULES.map((module, index) => {
                        const current = field.value[index]
                        return (
                          <div key={module.key} className="grid grid-cols-[1fr_repeat(3,_80px)] items-center gap-2 py-1">
                            <span className="text-sm">{module.label}</span>
                            <div className="flex justify-center">
                              <Checkbox
                                checked={current?.view || false}
                                onCheckedChange={(checked) => {
                                  const next = [...field.value]
                                  next[index] = { ...current, module: module.key, view: Boolean(checked) }
                                  field.onChange(next)
                                }}
                              />
                            </div>
                            <div className="flex justify-center">
                              <Checkbox
                                checked={current?.create || false}
                                onCheckedChange={(checked) => {
                                  const next = [...field.value]
                                  next[index] = { ...current, module: module.key, create: Boolean(checked) }
                                  field.onChange(next)
                                }}
                              />
                            </div>
                            <div className="flex justify-center">
                              <Checkbox
                                checked={current?.edit || false}
                                onCheckedChange={(checked) => {
                                  const next = [...field.value]
                                  next[index] = { ...current, module: module.key, edit: Boolean(checked) }
                                  field.onChange(next)
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
                {editingRole && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingRole(null)}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search roles by name or module"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading roles...</p>
          ) : (
            <RolesTable
              roles={filteredRoles}
              canEdit={access.can("userRoles", "edit")}
              canDelete={access.can("userRoles", "edit")}
              onEdit={(role) => setEditingRole(role)}
              onDelete={(role) => {
                if (!access.can("userRoles", "edit")) return
                if (window.confirm("Delete this role? This cannot be undone.")) {
                  deleteMutation.mutate({ id: role.id })
                  if (editingRole?.id === role.id) {
                    setEditingRole(null)
                  }
                }
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
