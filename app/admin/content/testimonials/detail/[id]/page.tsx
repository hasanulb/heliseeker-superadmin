"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"

import { TestimonialType } from "../../types"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types"
import { TestimonialService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { LabelAndValueComponent } from "@/components/custom-ui"
import { ContentDetailLayout, ImagePreviews } from "@/components/common"
import { ImageType } from "@/lib/types"

export default function TestimonialDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { toast } = useToast()
  const [testimonial, setTestimonial] = useState<TestimonialType | null>(null)
  const [loading, startTransition] = useTransition()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    startTransition(async () => {
      async function fetchTestimonial() {
        try {
          const data:any = await new TestimonialService().getTestimonial(id)
          setTestimonial(data)
          setIsInitialLoad(false)
        } catch (err: any) {
          toast({ title: "Error", description: err.message || "Error fetching testimonial", variant: "destructive" })
          setIsInitialLoad(false)
        } finally {
          setIsInitialLoad(false)
        }
      }
      if (id) fetchTestimonial()
    })
  }, [id])

  return (
    <ContentDetailLayout
      title="Testimonial Details"
      onEdit={() => router.push(`/admin/content/testimonials/edit/${id}`)}
      loading={loading || isInitialLoad}
      notFound={!testimonial}
      notFoundMessage="Testimonial not found."
    >
      {testimonial && (
        <>
          {Object.values(LocaleEnum).map((locale) => {
            const localeKey = Object.keys(LocaleEnum).find(key => LocaleEnum[key as keyof typeof LocaleEnum] === locale) as keyof typeof LocaleEnumLabel
            return (
              <div key={locale} className="mb-6 border rounded">
                <h2 className="text-lg font-semibold border-b px-4 py-2">{LocaleEnumLabel[localeKey]}</h2>
                <div className="space-y-4 p-4">
                  <LabelAndValueComponent label="Name" value={testimonial.name?.[locale]} />
                  <LabelAndValueComponent label="Role" value={testimonial.role?.[locale]} noSpan />
                  <LabelAndValueComponent label="Quote" value={testimonial.quote?.[locale]} noSpan />
                </div>
              </div>
            )
          })}

          <div>
            <span className="text-sm font-semibold text-primary">Images:</span>
            <ImagePreviews previews={testimonial.img_urls} for_={ImageType.ViewOnly} />
          </div>
        </>
      )}
    </ContentDetailLayout>
  )
}
