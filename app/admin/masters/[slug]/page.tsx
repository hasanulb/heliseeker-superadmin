"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useCreateMasterItem, useDeleteMasterItem, useMasterItems, useUpdateMasterItem } from "../_hooks/use-masters"
import { MasterTable } from "../_components/master-table"

const masterConfig = {
  departments: {
    title: "Departments",
    description: "Create and manage departments shown in the center portal dropdown.",
    nameLabel: "Department Name",
  },
  languages: {
    title: "Languages",
    description: "Create and manage supported languages for centers.",
    nameLabel: "Language Name",
  },
  services: {
    title: "Services",
    description: "Create and manage services listed in the center portal dropdown.",
    nameLabel: "Service Name",
  },
  specializations: {
    title: "Specializations",
    description: "Create and manage specializations for center listings.",
    nameLabel: "Specialization Name",
  },
  "age-groups": {
    title: "Age Groups",
    description: "Create and manage age group ranges available in the portal.",
    nameLabel: "Age Group Name",
  },
} as const

type MasterKey = keyof typeof masterConfig

const masterItemSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  departmentId: z.string().optional(),
  ageGroupId: z.string().optional(),
})

type MasterFormValues = z.infer<typeof masterItemSchema>

export default function MasterPage({ params }: { params: { slug: string } }) {
  const config = masterConfig[params.slug as MasterKey]
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data, isLoading } = useMasterItems(params.slug)
  const createMutation = useCreateMasterItem(params.slug)
  const updateMutation = useUpdateMasterItem(params.slug)
  const deleteMutation = useDeleteMasterItem(params.slug)

  const departmentQuery = useMasterItems("departments")
  const ageGroupQuery = useMasterItems("age-groups")

  const form = useForm<MasterFormValues>({
    resolver: zodResolver(masterItemSchema),
    defaultValues: { name: "", description: "", departmentId: "", ageGroupId: "none" },
  })

  useEffect(() => {
    if (!editingId) {
      form.reset({ name: "", description: "", departmentId: "", ageGroupId: "none" })
      return
    }

    const current = (data?.data || []).find((item) => item.id === editingId)
    if (!current) return
    form.reset({
      name: current.service_name ?? current.name ?? "",
      description: current.description ?? "",
      departmentId: current.department_id ?? "",
      ageGroupId: current.age_group_id ?? "none",
    })
  }, [editingId, form, data?.data])

  const items = useMemo(() => {
    if (!config) return []
    const departments = departmentQuery.data?.data || []
    const ageGroups = ageGroupQuery.data?.data || []
    const departmentMap = new Map(departments.map((item) => [item.id, item.name]))
    const ageGroupMap = new Map(ageGroups.map((item) => [item.id, item.name]))

    return (data?.data || []).map((item) => ({
      id: item.id,
      name: item.service_name ?? item.name ?? "",
      description: item.description ?? "",
      departmentName: item.department_id ? departmentMap.get(item.department_id) : undefined,
      ageGroupName: item.age_group_id ? ageGroupMap.get(item.age_group_id) : undefined,
    }))
  }, [data?.data, departmentQuery.data?.data, ageGroupQuery.data?.data])

  if (!config) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Masters</h1>
        <p className="text-sm text-muted-foreground">Unknown master type.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{config.title}</h1>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? `Edit ${config.title}` : `Create ${config.title}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={form.handleSubmit(async (values) => {
                if (params.slug === "services" && !values.departmentId) {
                  form.setError("departmentId", { message: "Department is required." })
                  return
                }
                const payload =
                  params.slug === "services"
                    ? {
                        service_name: values.name,
                        description: values.description || undefined,
                        department_id: values.departmentId || undefined,
                        age_group_id: values.ageGroupId === "none" ? undefined : values.ageGroupId,
                      }
                    : {
                        name: values.name,
                        description: values.description || undefined,
                      }

                if (editingId) {
                  await updateMutation.mutateAsync({ id: editingId, ...payload })
                  setEditingId(null)
                } else {
                  await createMutation.mutateAsync(payload)
                }
                form.reset({ name: "", description: "", departmentId: "", ageGroupId: "none" })
              })}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{config.nameLabel}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {params.slug === "services" && (
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(departmentQuery.data?.data || []).map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {params.slug === "services" && (
                <FormField
                  control={form.control}
                  name="ageGroupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Group (Optional)</FormLabel>
                      <Select value={field.value || "none"} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select age group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No age group</SelectItem>
                          {(ageGroupQuery.data?.data || []).map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex items-center gap-2 md:col-span-2">
                <Button type="submit">
                  {editingId ? "Update" : "Create"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{config.title} Table</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading {config.title.toLowerCase()}...</p>
          ) : (
            <MasterTable
              items={items}
              onEdit={(id) => setEditingId(id)}
              onDelete={(id) => {
                if (window.confirm("Delete this item? This cannot be undone.")) {
                  deleteMutation.mutate({ id })
                }
              }}
              showDepartment={params.slug === "services"}
              showAgeGroup={params.slug === "services"}
              nameLabel={config.nameLabel}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
