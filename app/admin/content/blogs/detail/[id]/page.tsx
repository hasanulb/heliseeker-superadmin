"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"

import { BlogType } from "../../types"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types/common/locale.type"
import { BlogService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { LabelAndValueComponent, BlogContentRenderer } from "@/components/custom-ui"
import { ContentDetailLayout, ImagePreviews } from "@/components/common"
import { ImageType } from "@/lib/types"

export default function BlogDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { toast } = useToast()
  const [blog, setBlog] = useState<BlogType | null>(null)
  const [loading, startTransition] = useTransition()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    startTransition(async () => {
      async function fetchService() {
        try {
          const data:any = await new BlogService().getBlog(id)
          setBlog(data)
          setIsInitialLoad(false)
        } catch (err: any) {
          toast({ title: "Error", description: err.message || "Error fetching blog", variant: "destructive" })
          setIsInitialLoad(false)
        } finally {
          setIsInitialLoad(false)
        }
      }
      if (id) fetchService()
    })
  }, [id])

  return (
    <ContentDetailLayout
      title="Blog Details"
      onEdit={() => router.push(`/admin/content/blogs/edit/${id}`)}
      loading={loading || isInitialLoad}
      notFound={!blog}
      notFoundMessage="Blog not found."
    >
      {blog && (
        <>
          {Object.values(LocaleEnum).map((locale) => {
            const localeKey = Object.keys(LocaleEnum).find(key => LocaleEnum[key as keyof typeof LocaleEnum] === locale) as keyof typeof LocaleEnumLabel
            return (
              <div key={locale} className="mb-6 border rounded">
                <h2 className="text-lg font-semibold border-b px-4 py-2">{LocaleEnumLabel[localeKey]}</h2>
                <div className="space-y-4 p-4">
                  <LabelAndValueComponent label="Title" value={blog.title?.[locale]} />
                  <LabelAndValueComponent label="Hero Title" value={blog.hero_title?.[locale]} />
                  <LabelAndValueComponent label="Content" noSpan
                    value={<BlogContentRenderer htmlContent={blog?.content?.[locale] || ""} />}
                  />
                </div>
              </div>
            )
          })}

          <LabelAndValueComponent label="Author" value={blog.author} />
          <LabelAndValueComponent label="Tags" value={blog.tags?.join(", ")} />
          <LabelAndValueComponent label="Slug" value={blog.slug} />
          <LabelAndValueComponent label="Published At" value={new Date(blog.published_at || "").toLocaleString()} />
          <LabelAndValueComponent label="Status" value={blog.status} />
          <LabelAndValueComponent label="Created At" value={new Date(blog.created_at).toLocaleString()} />
          <LabelAndValueComponent label="Updated At" value={new Date(blog.updated_at).toLocaleString()} />
          <div>
            <span className="text-sm font-semibold text-primary">Images:</span>
            <ImagePreviews previews={blog?.img_urls || []} for_={ImageType.ViewOnly} />
          </div>
        </>
      )}
    </ContentDetailLayout>
  )
}
