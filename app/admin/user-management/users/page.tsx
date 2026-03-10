"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

import { StaffTable } from "@/app/admin/access/_components/staff-table"
import { useCreateStaffUser, useStaffUsers, useUpdateStaffUser } from "@/app/admin/access/_hooks/use-staff"
import { useRoles } from "@/app/admin/access/_hooks/use-roles"
import { createStaffSchema, CreateStaffFormValues } from "@/app/admin/access/_schemas/staff.schema"
import { useRequirePermission } from "@/app/admin/access/_hooks/use-access"

export default function StaffUsersPage() {
  const access = useRequirePermission("userManagement", "view")
  const { toast } = useToast()
  const { data, isLoading } = useStaffUsers()
  const { data: rolesData, isLoading: rolesLoading } = useRoles()
  const createMutation = useCreateStaffUser()
  const updateMutation = useUpdateStaffUser()
  const roles = rolesData?.data || []

  const form = useForm<CreateStaffFormValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      name: "",
      email: "",
      role: roles[0]?.name || "manager",
    },
  })

  useEffect(() => {
    if (roles.length === 0) return
    const current = form.getValues("role")
    const exists = roles.some((role) => role.name === current)
    if (!exists) {
      form.setValue("role", roles[0].name, { shouldValidate: true })
    }
  }, [roles, form])

  if (!access.isReady) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="text-sm text-muted-foreground">Create staff users for the admin panel.</p>
      </div>

      {access.can("userManagement", "create") && (
        <Card>
        <CardHeader>
          <CardTitle>Create Staff User</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  const response = await createMutation.mutateAsync({
                    name: values.name,
                    email: values.email,
                    role: values.role,
                  })
                  toast({
                    title: "User created",
                    description: `Invite email sent. Temporary password: ${response.tempPassword}`,
                    variant: "success",
                  })
                  form.reset({ name: "", email: "", role: "operator" })
                } catch (err: any) {
                  toast({
                    title: "Error",
                    description: err?.message || "Failed to create user",
                    variant: "destructive",
                  })
                }
              })}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={rolesLoading || roles.length === 0}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={rolesLoading ? "Loading roles..." : "Select role"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.name}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={createMutation.isPending}>Create Staff</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Staff Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading staff users...</p>
          ) : (
            <StaffTable
              users={data?.data || []}
              canEdit={access.can("userManagement", "edit")}
              onToggleStatus={(id, active) => updateMutation.mutate({ id, active })}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
