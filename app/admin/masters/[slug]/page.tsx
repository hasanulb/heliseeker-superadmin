"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { use, useMemo, useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useCreateMasterItem, useDeleteMasterItem, useMasterItems, useUpdateMasterItem } from "../_hooks/use-masters"
import { MasterTable } from "../_components/master-table"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import { useRequirePermission } from "@/app/admin/access/_hooks/use-access"

const masterConfig = {
  departments: {
    title: "Departments",
    description: "Create and manage departments shown in the center portal dropdown.",
    nameLabel: "Department Name",
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

export default function MasterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const config = masterConfig[slug as MasterKey]
  const [editingId, setEditingId] = useState<string | null>(null)
  const [tableQuery, setTableQuery] = useState("")

  const { data, isLoading } = useMasterItems(slug)
  const createMutation = useCreateMasterItem(slug)
  const updateMutation = useUpdateMasterItem(slug)
  const deleteMutation = useDeleteMasterItem(slug)

  const departmentQuery = useMasterItems("departments")
  const ageGroupQuery = useMasterItems("age-groups")

  const form = useForm<MasterFormValues>({
    resolver: zodResolver(masterItemSchema),
    defaultValues: { name: "", description: "", departmentId: "", ageGroupId: "none" },
  })

  const moduleKey =
    slug === "departments"
      ? "department"
      : slug === "services"
      ? "service"
      : slug === "specializations"
      ? "specialization"
      : "ageGroup"

  const access = useRequirePermission(moduleKey, "view")

  if (!access.isReady) {
    return <p className="text-sm text-muted-foreground">Loading...</p>
  }

  useEffect(() => {
    let active = true
    const checkSession = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()
      if (!active) return
      if (error || !data?.user) {
        toast({
          title: "Session expired",
          description: "Please log in again.",
          variant: "destructive",
        })
        router.push("/login")
      }
    }
    checkSession()
    return () => {
      active = false
    }
  }, [router, toast])

  const entityLabel = config?.title?.endsWith("s")
    ? config.title.slice(0, -1)
    : config?.title || "Item"

  const handleAuthError = (err: any) => {
    const message = err?.message || "Error"
    if (/not authenticated|unauthorized/i.test(message)) {
      toast({
        title: "Session expired",
        description: "Please log in again.",
        variant: "destructive",
      })
      router.push("/login")
      return true
    }
    return false
  }

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

  const filteredItems = useMemo(() => {
    if (!tableQuery.trim()) return items
    const term = tableQuery.trim().toLowerCase()
    return items.filter((item) =>
      [item.name, item.description, item.departmentName, item.ageGroupName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    )
  }, [items, tableQuery])

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

      {access.can(moduleKey, "create") && (
        <Card>
        <CardHeader>
          <CardTitle>{editingId ? `Edit ${config.title}` : `Create ${config.title}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={form.handleSubmit(async (values) => {
                if (slug === "services" && !values.departmentId) {
                  form.setError("departmentId", { message: "Department is required." })
                  return
                }
                const payload =
                  slug === "services"
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

                try {
                  if (editingId) {
                    await updateMutation.mutateAsync({ id: editingId, ...payload })
                    toast({
                      title: "Updated",
                      description: `${entityLabel} updated successfully.`,
                      variant: "success",
                    })
                    setEditingId(null)
                  } else {
                    await createMutation.mutateAsync(payload)
                    toast({
                      title: "Created",
                      description: `${entityLabel} created successfully.`,
                      variant: "success",
                    })
                  }
                  form.reset({ name: "", description: "", departmentId: "", ageGroupId: "none" })
                } catch (err: any) {
                  if (handleAuthError(err)) return
                  toast({
                    title: "Error",
                    description: err?.message || `Failed to save ${entityLabel.toLowerCase()}.`,
                    variant: "destructive",
                  })
                }
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

              {slug === "services" && (
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

              {slug !== "specializations" && (
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
              )}

              {slug === "services" && (
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
      )}

      <Card>
        <CardHeader>
          <CardTitle>{config.title} Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder={`Search ${config.title.toLowerCase()}`}
              value={tableQuery}
              onChange={(event) => setTableQuery(event.target.value)}
            />
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading {config.title.toLowerCase()}...</p>
          ) : (
            <MasterTable
              items={filteredItems}
              onEdit={(id) => setEditingId(id)}
              onDelete={(id) => {
                if (window.confirm("Delete this item? This cannot be undone.")) {
                  deleteMutation.mutateAsync({ id })
                    .then(() => {
                      toast({
                        title: "Deleted",
                        description: `${entityLabel} deleted successfully.`,
                        variant: "success",
                      })
                    })
                    .catch((err: any) => {
                      if (handleAuthError(err)) return
                      toast({
                        title: "Error",
                        description: err?.message || `Failed to delete ${entityLabel.toLowerCase()}.`,
                        variant: "destructive",
                      })
                    })
                }
              }}
              canEdit={access.can(moduleKey, "edit")}
              canDelete={access.can(moduleKey, "edit")}
              showDepartment={slug === "services"}
              showAgeGroup={slug === "services"}
              showDescription={slug !== "specializations"}
              nameLabel={config.nameLabel}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
