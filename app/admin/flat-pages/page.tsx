"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { FlatPagesTable } from "./_components/flat-pages-table"
import { useCreateFlatPage, useFlatPages, useUpdateFlatPage } from "./_hooks/use-flat-pages"
import { flatPageSchema, FlatPageFormValues } from "./_schemas/flat-page.schema"

export default function FlatPagesPage() {
  const { data, isLoading } = useFlatPages()
  const createMutation = useCreateFlatPage()
  const updateMutation = useUpdateFlatPage()

  const form = useForm<FlatPageFormValues>({
    resolver: zodResolver(flatPageSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Flat Pages Dynamic</h1>
        <p className="text-sm text-muted-foreground">Create and manage dynamic flat pages with slug and rich text content.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Flat Page</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (values) => {
                await createMutation.mutateAsync(values)
                form.reset({ title: "", slug: "", description: "" })
              })}
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
                      <Textarea rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={createMutation.isPending}>Create Page</Button>
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
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
