"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import "react-quill-new/dist/quill.snow.css"

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

import { FlatPagesTable } from "./_components/flat-pages-table"
import { useCreateFlatPage, useDeleteFlatPage, useEditFlatPage, useFlatPages, useUpdateFlatPage } from "./_hooks/use-flat-pages"
import { flatPageSchema, FlatPageFormValues } from "./_schemas/flat-page.schema"

export default function FlatPagesPage() {
  const { data, isLoading } = useFlatPages()
  const createMutation = useCreateFlatPage()
  const updateMutation = useUpdateFlatPage()
  const editMutation = useEditFlatPage()
  const deleteMutation = useDeleteFlatPage()
  const [editingPageId, setEditingPageId] = useState<string | null>(null)

  const form = useForm<FlatPageFormValues>({
    resolver: zodResolver(flatPageSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
    },
  })

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        ["link", "clean"],
      ],
    }),
    [],
  )

  const quillFormats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "color",
      "background",
      "list",
      "bullet",
      "blockquote",
      "code-block",
      "link",
    ],
    [],
  )

  useEffect(() => {
    if (!editingPageId) return
    const page = data?.data?.find((item) => item.id === editingPageId)
    if (page) {
      form.reset({
        title: page.title,
        slug: page.slug,
        description: page.description,
      })
    }
  }, [editingPageId, data?.data, form])

  const handleSave = async (values: FlatPageFormValues) => {
    if (editingPageId) {
      await editMutation.mutateAsync({ id: editingPageId, ...values })
      setEditingPageId(null)
      form.reset({ title: "", slug: "", description: "" })
      return
    }
    await createMutation.mutateAsync(values)
    form.reset({ title: "", slug: "", description: "" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Flat Pages Dynamic</h1>
        <p className="text-sm text-muted-foreground">Create and manage dynamic flat pages with slug and rich text content.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingPageId ? "Edit Flat Page" : "Create New Flat Page"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(handleSave)}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Rich Text)</FormLabel>
                    <FormControl>
                      <div className="rounded-md border border-input bg-background [&_.ql-container]:rounded-b-md [&_.ql-toolbar]:rounded-t-md [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-black">
                        <ReactQuill
                          theme="snow"
                          value={field.value || ""}
                          onChange={field.onChange}
                          modules={quillModules}
                          formats={quillFormats}
                          placeholder="Write page content..."
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={createMutation.isPending || editMutation.isPending}>
                  {editingPageId ? "Update Page" : "Create Page"}
                </Button>
                {editingPageId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingPageId(null)
                      form.reset({ title: "", slug: "", description: "" })
                    }}
                    disabled={createMutation.isPending || editMutation.isPending}
                  >
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
          <CardTitle>Flat Pages</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading pages...</p>
          ) : (
            <FlatPagesTable
              pages={data?.data || []}
              onToggle={(id, enabled) => updateMutation.mutate({ id, enabled })}
              onEdit={(page) => setEditingPageId(page.id)}
              onDelete={(page) => {
                if (!window.confirm("Delete this page? This cannot be undone.")) return
                deleteMutation.mutate({ id: page.id })
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
