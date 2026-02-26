"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"

import { ProductType } from "../../types"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types/common/locale.type"
import { ProductService } from "@/services/api/product.service"
import { useToast } from "@/hooks/use-toast"
import { LabelAndValueComponent } from "@/components/custom-ui"
import { ContentDetailLayout, ImagePreviews } from "@/components/common"
import { ImageType } from "@/lib/types"

export default function ProductDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { toast } = useToast()
  const [product, setProduct] = useState<ProductType | null>(null)
  const [loading, startTransition] = useTransition()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    startTransition(async () => {
      async function fetchProduct() {
        try {
          const data: any = await new ProductService().getProduct(id)
          setProduct(data)
          setIsInitialLoad(false)
        } catch (err: any) {
          toast({ title: "Error", description: err.message || "Error fetching product", variant: "destructive" })
          setIsInitialLoad(false)
        } finally {
          setIsInitialLoad(false)
        }
      }
      if (id) fetchProduct()
    })
  }, [id])

  return (
    <ContentDetailLayout
      title="Product Details"
      onEdit={() => router.push(`/admin/content/products/edit/${id}`)}
      loading={loading || isInitialLoad}
      notFound={!product}
      notFoundMessage="Product not found."
    >
      {product && (
        <>
          {Object.values(LocaleEnum).map((locale) => {
            const localeKey = Object.keys(LocaleEnum).find(key => LocaleEnum[key as keyof typeof LocaleEnum] === locale) as keyof typeof LocaleEnumLabel
            const features = product.key_features?.[locale] || []
            const materialsAndDimensions = product.materials_and_dimensions?.[locale]?.items || []
            const installationSteps = product.installation_steps?.[locale] || []
            return (
              <div key={locale} className="mb-6 border rounded">
                <h2 className="text-lg font-semibold border-b px-4 py-2">{LocaleEnumLabel[localeKey]}</h2>
                <div className="space-y-4 p-4">
                  <LabelAndValueComponent label="Name" value={product.name?.[locale]} />
                  <LabelAndValueComponent label="Intro" value={product.intro?.[locale]} noSpan />
                  <LabelAndValueComponent label="Description" value={product.description?.[locale]} noSpan />
                  <LabelAndValueComponent label="Key Features" noSpan
                    value={features.length === 0 ? <div className="text-gray-400 text-sm">No features</div> : (
                      <ul className="list-disc pl-5">
                        {features.map((f, idx) => (
                          <li key={idx} className="text-sm">{f}</li>
                        ))}
                      </ul>
                    )}
                  />
                  <LabelAndValueComponent label="Installation Steps" noSpan
                    value={installationSteps.length === 0 ? <div className="text-gray-400 text-sm">No steps</div> : (
                      <ul className="list-disc pl-5">
                        {installationSteps.map((step, idx) => (
                          <li key={idx} className="text-sm">{step}</li>
                        ))}
                      </ul>
                    )}
                  />
                  <LabelAndValueComponent label="Materials & Dimensions" noSpan
                    value={materialsAndDimensions.length === 0 ? <div className="text-gray-400 text-sm">No items</div> : (
                      <ul className="list-disc pl-5">
                        {materialsAndDimensions.map((m, idx) => (
                          <li key={idx} className="text-sm"><span className="font-semibold text-sm">{m.title}:</span> <span className="text-sm">{m.value}</span></li>
                        ))}
                      </ul>
                    )}
                  />
                </div>
              </div>
            )
          })}

          <LabelAndValueComponent label="Tags" value={product.tags ? product.tags.join(", ") : "No tags"} />
          <LabelAndValueComponent label="Slug" value={product.slug} />
          <div>
            <span className="text-sm font-semibold text-primary">Images:</span>
            <ImagePreviews previews={product.img_urls} for_={ImageType.ViewOnly} />
          </div>
          <LabelAndValueComponent label="Created At" value={new Date(product.created_at).toLocaleString()} />
          <LabelAndValueComponent label="Updated At" value={new Date(product.updated_at).toLocaleString()} />
        </>
      )}
    </ContentDetailLayout>
  )
}
