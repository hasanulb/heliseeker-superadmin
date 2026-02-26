"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"

import { ServiceType } from "../../types"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types"
import { ServiceService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { LabelAndValueComponent } from "@/components/custom-ui"
import { ContentDetailLayout, ImagePreviews } from "@/components/common"
import { ImageType } from "@/lib/types"

export default function ServiceDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { toast } = useToast()
  const [service, setService] = useState<ServiceType | null>(null)
  const [loading, startTransition] = useTransition()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    startTransition(async () => {
      async function fetchService() {
        try {
          const data:any = await new ServiceService().getService(id)
          setService(data)
          setIsInitialLoad(false)
        } catch (err: any) {
          toast({ title: "Error", description: err.message || "Error fetching service", variant: "destructive" })
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
      title="Service Details"
      onEdit={() => router.push(`/admin/content/services/edit/${id}`)}
      loading={loading || isInitialLoad}
      notFound={!service}
      notFoundMessage="Service not found."
    >
      {service && (
        <>
          {Object.values(LocaleEnum).map((locale) => {
            const localeKey = Object.keys(LocaleEnum).find(key => LocaleEnum[key as keyof typeof LocaleEnum] === locale) as keyof typeof LocaleEnumLabel
            const serviceFeatures = service.service_features?.[locale].items || []
            return (
              <div key={locale} className="mb-6 border rounded">
                <h2 className="text-lg font-semibold border-b px-4 py-2">{LocaleEnumLabel[localeKey]}</h2>
                <div className="space-y-4 p-4">
                  <LabelAndValueComponent label="Name" value={service.title?.[locale]} />
                  <LabelAndValueComponent label="Intro" value={service.intro?.[locale]} noSpan />
                  <LabelAndValueComponent label="Image Description" value={service.image_description?.[locale]} noSpan />
                  <LabelAndValueComponent label="Paragraph One" noSpan
                    value={<>
                      <LabelAndValueComponent value={service.paragraph_one?.[locale].title} label="Title" noSpan />
                      <LabelAndValueComponent value={service.paragraph_one?.[locale].description} label="Description" noSpan />
                    </>}
                  />
                  <LabelAndValueComponent label="Paragraph Two" noSpan
                    value={<>
                      <LabelAndValueComponent value={service.paragraph_two?.[locale].title} label="Title" noSpan />
                      <LabelAndValueComponent value={service.paragraph_two?.[locale].description} label="Description" noSpan />
                    </>}
                  />
                  <LabelAndValueComponent label="Materials & Dimensions" noSpan
                    value={serviceFeatures.length === 0 ? <div className="text-gray-400 text-sm">No items</div> : (
                      <ul className="list-disc pl-5">
                        {serviceFeatures.map((m, idx) => (
                          <li key={idx} className="text-sm"><span className="font-semibold text-sm text-orange-500">{m.title}:</span> <span className="text-sm">{m.description}</span></li>
                        ))}
                      </ul>
                    )}
                  />
                </div>
              </div>
            )
          })}

          <LabelAndValueComponent label="Slug" value={service.slug} />
          <LabelAndValueComponent label="Created At" value={new Date(service.created_at).toLocaleString()} />
          <LabelAndValueComponent label="Updated At" value={new Date(service.updated_at).toLocaleString()} />
          <div>
            <span className="text-sm font-semibold text-primary">Images:</span>
            <ImagePreviews previews={service.img_urls} for_={ImageType.ViewOnly} />
          </div>
        </>
      )}
    </ContentDetailLayout>
  )
}
