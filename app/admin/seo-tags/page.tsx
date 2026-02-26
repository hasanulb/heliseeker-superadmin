"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { TagsTable } from "./_components/tags-table"
import { useCreateTag, useSeo, useTags, useToggleTag, useUpdateSeo } from "./_hooks/use-seo-tags"
import { seoSchema, SeoFormValues, tagSchema, TagFormValues } from "./_schemas/seo.schema"

export default function SeoTagsPage() {
  const { data: seoData, isLoading: seoLoading } = useSeo()
  const { data: tagsData, isLoading: tagsLoading } = useTags()
  const updateSeoMutation = useUpdateSeo()
  const createTagMutation = useCreateTag()
  const toggleTagMutation = useToggleTag()

  const seoForm = useForm<SeoFormValues>({
    resolver: zodResolver(seoSchema),
    defaultValues: {
      metaTitle: "",
      metaDescription: "",
    },
  })

  const tagForm = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      tagName: "",
      tagType: "",
      keyword: "",
      question: "",
      linkedCategory: "",
    },
  })

  useEffect(() => {
    if (seoData?.data) {
      seoForm.reset(seoData.data)
    }
  }, [seoData?.data, seoForm])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">SEO & Tags Management</h1>
        <p className="text-sm text-muted-foreground">Maintain meta settings and searchable tags with linked categories.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {seoLoading ? (
            <p className="text-sm text-muted-foreground">Loading SEO...</p>
          ) : (
            <Form {...seoForm}>
              <form className="space-y-4" onSubmit={seoForm.handleSubmit((values) => updateSeoMutation.mutate(values))}>
                <FormField
                  control={seoForm.control}
                  name="metaTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={seoForm.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateSeoMutation.isPending}>Save SEO</Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...tagForm}>
            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={tagForm.handleSubmit(async (values) => {
                await createTagMutation.mutateAsync(values)
                tagForm.reset({ tagName: "", tagType: "", keyword: "", question: "", linkedCategory: "" })
              })}
            >
              <FormField
                control={tagForm.control}
                name="tagName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={tagForm.control}
                name="tagType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Type</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={tagForm.control}
                name="keyword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keyword</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={tagForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={tagForm.control}
                name="linkedCategory"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Linked Category (Parent/Sub)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="md:col-span-2" disabled={createTagMutation.isPending}>Add Tag</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          {tagsLoading ? (
            <p className="text-sm text-muted-foreground">Loading tags...</p>
          ) : (
            <TagsTable
              tags={tagsData?.data || []}
              onToggle={(id, enabled) => toggleTagMutation.mutate({ id, enabled })}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
