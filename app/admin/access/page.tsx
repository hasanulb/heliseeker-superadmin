"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { StaffTable } from "./_components/staff-table"
import { useCreateStaffUser, useStaffUsers, useUpdateStaffUser } from "./_hooks/use-staff"
import { createStaffSchema, CreateStaffFormValues } from "./_schemas/staff.schema"

const MODULES = ["dashboard", "centers", "patients", "searchFilters", "flatPages", "seoTags"]

export default function AccessManagementPage() {
  const { data, isLoading } = useStaffUsers()
  const createMutation = useCreateStaffUser()
  const updateMutation = useUpdateStaffUser()

  const form = useForm<CreateStaffFormValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "operator",
      modules: ["centers"],
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">User Roles & Access Management</h1>
        <p className="text-sm text-muted-foreground">Create staff users and assign module-level view/create/edit access.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Staff User</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (values) => {
                await createMutation.mutateAsync({
                  name: values.name,
                  email: values.email,
                  role: values.role,
                  permissions: values.modules.map((module) => ({
                    module,
                    view: true,
                    create: true,
                    edit: values.role !== "operator",
                  })),
                })
                form.reset({ name: "", email: "", role: "operator", modules: ["centers"] })
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
                      <Select defaultValue={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="operator">Operator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="modules"
                render={() => (
                  <FormItem>
                    <FormLabel>Module Access</FormLabel>
                    <div className="grid gap-2 md:grid-cols-3">
                      {MODULES.map((module) => (
                        <FormField
                          key={module}
                          control={form.control}
                          name="modules"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 rounded border p-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value.includes(module)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, module])
                                    } else {
                                      field.onChange(field.value.filter((value) => value !== module))
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="m-0 capitalize">{module}</FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={createMutation.isPending}>Create Staff</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

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
              onToggleStatus={(id, active) => updateMutation.mutate({ id, active })}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
