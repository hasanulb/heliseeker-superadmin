"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ServiceService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types"
import { CancelButton, LabelComponent, SubmitButton } from "@/components/custom-ui"
import { getLocaleKey, makeApiCall, validateImageCount } from "@/lib/utils"
import { ServiceFormInputType, serviceSchema } from "../types"
import { ContentCreateEditLayout, CustomImageInput, FormErrorMessage } from "@/components/common"

export default function CreateService() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [cancelled, setCancelled] = useState(false)

  const form = useForm<ServiceFormInputType>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      img_urls: [],
      title: { en: "", ar: "" },
      intro: { en: "", ar: "" },
      image_description: { en: "", ar: "" },
      paragraph_one: { en: { title: "", description: "" }, ar: { title: "", description: "" } },
      paragraph_two: { en: { title: "", description: "" }, ar: { title: "", description: "" } },
      service_features: { en: { items: [] }, ar: { items: [] } },
      slug: null,
    },
  })

  /* ----------------------------------- Form Submission ----------------------------------------- */
  const handleSubmit = form.handleSubmit(async (values) => {
    const ok = validateImageCount(form, imageFiles.length, 4, 6);
    if (!ok) return;

    setLoading(true)
    setCancelled(false)
    let imgUrls = values.img_urls
    if (imageFiles.length > 0) {
      imgUrls = await makeApiCall(() => new ServiceService().uploadImages(imageFiles), {
        afterSuccess: (paths: string[]) => paths,
        afterError: (err: string) => {
          toast({ title: "Image upload failed", description: err || "Error uploading images", variant: "destructive" })
          return
        },
        afterFinally: () => {
          setLoading(false)
        }
      })
    }
    if (cancelled) return
    await makeApiCall(() => new ServiceService().createService({ ...values, img_urls: imgUrls }), {
      afterSuccess: () => {
        toast({ title: "Service created", description: "Service added successfully!", variant: "success" })
        router.push("/admin/content/services")
      },
      afterError: (err: any) => {
        if (!cancelled) toast({ title: "Error", description: err.message || "Error creating service", variant: "destructive" })
      },
      afterFinally: () => {
        setLoading(false)
      }
    })
  })

  const handleCancel = () => {
    setCancelled(true)
    router.push("/admin/content/services")
  }

  /* ----------------------------------- Multilingual Support ----------------------------------------- */
  const [activeLocales, setActiveLocales] = useState<LocaleEnum[]>([LocaleEnum.en]);

  const handleAddLocale = (locale: LocaleEnum) => {
    if (!activeLocales.includes(locale)) {
      setActiveLocales([...activeLocales, locale]);
    }
  };

  const handleRemoveLocale = (locale: LocaleEnum) => {
    setActiveLocales(activeLocales.filter(l => l !== locale));

    form.setValue(`title.${locale}`, "");
    form.setValue(`intro.${locale}`, "");
    form.setValue(`image_description.${locale}`, "");
    form.setValue(`paragraph_one.${locale}`, { title: "", description: "" });
    form.setValue(`paragraph_two.${locale}`, { title: "", description: "" });
    form.setValue(`service_features.${locale}`, { items: [] });

    form.clearErrors([
      `title.${locale}`,
      `intro.${locale}`,
      `image_description.${locale}`,
      `paragraph_one.${locale}`,
      `paragraph_two.${locale}`,
      `service_features.${locale}`,
    ]);
  }

  /* ----------------------------------- Render ----------------------------------------- */
  return (
    <>
      <ContentCreateEditLayout
        title="Add Service"
        activeLocales={activeLocales}
        handleAddLocale={handleAddLocale}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Language Fields */}
          {activeLocales.map((locale) => {
            const localeKey = getLocaleKey(locale);
            const serviceFeatures = form.watch(`service_features.${locale}`) || [];
            return (
              <div key={locale} className="border rounded p-4 mb-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold">{LocaleEnumLabel[localeKey]}</h2>
                  {locale !== LocaleEnum.en && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLocale(locale)}
                      className="text-red-500 hover:text-red-700 text-sm border border-red-500 rounded p-1 w-6 h-6 flex items-center justify-center"
                      title={`Remove ${LocaleEnumLabel[localeKey]}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div>
                  <LabelComponent text="Title" htmlFor={`title-${locale}`} />
                  <Input id={`title-${locale}`} {...form.register(`title.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`title.${locale}`} form={form} />
                </div>
                <div>
                  <LabelComponent text="Intro" htmlFor={`intro-${locale}`} />
                  <Input id={`intro-${locale}`} {...form.register(`intro.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`intro.${locale}`} form={form} />
                </div>
                <div>
                  <LabelComponent text="Image Description" htmlFor={`image_description-${locale}`} />
                  <Input id={`image_description-${locale}`} {...form.register(`image_description.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`image_description.${locale}`} form={form} />
                </div>
                <div>
                  <LabelComponent text="Paragraph One" htmlFor={`paragraph_one-${locale}`} />
                  <div className="border rounded p-4 mb-4 space-y-2">
                    <Input id={`paragraph_one-${locale}`} placeholder="Title" {...form.register(`paragraph_one.${locale}.title` as const)} disabled={loading} />
                    <FormErrorMessage name={`paragraph_one.${locale}.title`} form={form} />
                    <Textarea id={`paragraph_one-${locale}`} placeholder="Description" {...form.register(`paragraph_one.${locale}.description` as const)} disabled={loading} />
                    <FormErrorMessage name={`paragraph_one.${locale}.description`} form={form} />
                  </div>
                </div>
                <div>
                  <LabelComponent text="Paragraph Two" htmlFor={`paragraph_two-${locale}`} />
                  <div className="border rounded p-4 mb-4 space-y-2">
                    <Input id={`paragraph_two-${locale}`} placeholder="Title" {...form.register(`paragraph_two.${locale}.title` as const)} disabled={loading} />
                    <FormErrorMessage name={`paragraph_two.${locale}.title`} form={form} />
                    <Textarea id={`paragraph_two-${locale}`} placeholder="Description" {...form.register(`paragraph_two.${locale}.description` as const)} disabled={loading} />
                    <FormErrorMessage name={`paragraph_two.${locale}.description`} form={form} />
                  </div>
                </div>

                {/* Service Features */}
                <div>
                  <LabelComponent text="Service Features" htmlFor={`service_features-${locale}`} optional />
                  <div key={locale + "-service_features"} className="border rounded p-4 space-y-2">
                    {serviceFeatures.items.map((item: { title: string; description: string }, idx: number) => (
                      <div key={idx} className="flex w-full gap-2 mb-2">
                        <div className="flex-1">
                          <Input placeholder="Title" {...form.register(`service_features.${locale}.items.${idx}.title` as const)} disabled={loading} />
                          <FormErrorMessage name={`service_features.${locale}.items.${idx}.title`} form={form} />
                        </div>
                        <div className="flex-1">
                          <Input placeholder="Description" {...form.register(`service_features.${locale}.items.${idx}.description` as const)} disabled={loading} />
                          <FormErrorMessage name={`service_features.${locale}.items.${idx}.description`} form={form} />
                        </div>
                        <Button type="button" variant="destructive" onClick={() => {
                          const items = [...(serviceFeatures.items || [])];
                          items.splice(idx, 1);
                          form.setValue(`service_features.${locale}` as const, { items });
                        }}>Remove</Button>
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" onClick={() => {
                        const items = [...(serviceFeatures.items || [])];
                        items.push({ title: "", description: "" });
                        form.setValue(`service_features.${locale}` as const, { items });
                      }}>Add Item</Button>
                    </div>
                  </div>
                  <FormErrorMessage name={`service_features.${locale}.items`} form={form} />
                </div>
              </div>
            );
          })}

          {/* Non multilingual fields */}
          <div>
            <LabelComponent text="Slug" htmlFor="slug" />
            <Input id="slug" {...form.register("slug" as const)} disabled={loading} />
            <FormErrorMessage name="slug" form={form} />
          </div>

          <div>
            <LabelComponent text="Images" htmlFor="img_urls" />
            <CustomImageInput
              min={4}
              max={6}
              form={form}
              name="img_urls"
              onChange={(files) => {
                setImageFiles(files);
                form.setValue("img_urls", files.map(file => file.name), { shouldValidate: false });
              }}
            />
            <FormErrorMessage name="img_urls" form={form} />
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="flex justify-end gap-2">
            <SubmitButton loading={loading} LoadingText="Creating..." DefaultText="Create" />
            <CancelButton handleCancel={handleCancel} loading={loading} />
          </div>
        </form>
      </ContentCreateEditLayout >
    </>
  )
}