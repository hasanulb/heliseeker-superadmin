"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"

import { ProjectType } from "../../types"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types/common/locale.type"
import { ProjectService } from "@/services/api/project.service"
import { useToast } from "@/hooks/use-toast"
import { LabelAndValueComponent } from "@/components/custom-ui"
import { ContentDetailLayout, ImagePreviews } from "@/components/common"
import { ImageType } from "@/lib/types"

export default function ProjectDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { toast } = useToast()
  const [project, setProject] = useState<ProjectType | null>(null)
  const [loading, startTransition] = useTransition()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    startTransition(async () => {
      async function fetchProject() {
        try {
          const data:any = await new ProjectService().getProject(id)
          setProject(data)
          setIsInitialLoad(false)
        } catch (err: any) {
          toast({ title: "Error", description: err.message || "Error fetching project", variant: "destructive" })
          setIsInitialLoad(false)
        } finally {
          setIsInitialLoad(false)
        }
      }
      if (id) fetchProject()
    })
  }, [id])

  return (
    <ContentDetailLayout
      title="Project Details"
      onEdit={() => router.push(`/admin/content/projects/edit/${id}`)}
      loading={loading || isInitialLoad}
      notFound={!project}
      notFoundMessage="Project not found."
    >
      {project && (
        <>
          {Object.values(LocaleEnum).map((locale) => {
            const localeKey = Object.keys(LocaleEnum).find(key => LocaleEnum[key as keyof typeof LocaleEnum] === locale) as keyof typeof LocaleEnumLabel
            return (
              <div key={locale} className="mb-6 border rounded">
                <h2 className="text-lg font-semibold border-b px-4 py-2">{LocaleEnumLabel[localeKey]}</h2>
                <div className="space-y-4 p-4">
                  <LabelAndValueComponent label="Name" value={project.title?.[locale]} />
                  <LabelAndValueComponent label="Intro" value={project.description?.[locale]} noSpan />
                  <LabelAndValueComponent label="Type" value={project.type?.[locale]} />
                </div>
              </div>
            )
          })}
          <LabelAndValueComponent label="Area" value={project.area || ""} />
          <LabelAndValueComponent label="Location" value={project.location || ""} />
          <LabelAndValueComponent label="Slug" value={project.slug} />
          <LabelAndValueComponent label="Created At" value={new Date(project.created_at).toLocaleString()} />
          <LabelAndValueComponent label="Updated At" value={new Date(project.updated_at).toLocaleString()} />
          <div>
            <span className="text-sm font-semibold text-primary">Images:</span>
            <ImagePreviews previews={project.img_urls} for_={ImageType.ViewOnly} />
          </div>
        </>
      )}
    </ContentDetailLayout>
  )
}
