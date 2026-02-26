"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ServiceService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types"
import { AlertBoxComponent, CancelButton, LabelComponent, SubmitButton } from "@/components/custom-ui"
import { getLocaleKey, makeApiCall, validateImageCount } from "@/lib/utils"
import { ServiceFormInputType, serviceSchema } from "../../types"
import { ContentCreateEditLayout, CustomImageInputEdit, FormErrorMessage } from "@/components/common"

export default function EditService() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
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

  /* ----------------------------------- Service Fetch ----------------------------------------- */
  useEffect(() => {
    async function fetchService() {
      try {
        const data:any= await new ServiceService().getService(id)
        if (data) {
          form.reset({
            title: data.title || { en: "", ar: "" },
            intro: data.intro || { en: "", ar: "" },
            image_description: data.image_description || { en: "", ar: "" },
            paragraph_one: data.paragraph_one || { en: { title: "", description: "" }, ar: { title: "", description: "" } },
            paragraph_two: data.paragraph_two || { en: { title: "", description: "" }, ar: { title: "", description: "" } },
            service_features: data.service_features || { en: { items: [] }, ar: { items: [] } },
            img_urls: data.img_urls || [],
            slug: data.slug || null,
          })

          // Update activeLocales to include any language present in any field
          const langs = new Set<string>(["en"]);
          const fields = ["title", "intro", "image_description", "paragraph_one", "paragraph_two", "service_features"];
          fields.forEach(field => {
            if (data[field]) {
              Object.entries(data[field]).forEach(([lang, val]) => {
                if (val && typeof val === "string" && val.trim() !== "") langs.add(lang);
              });
            }
          });

          if (data.service_features) {
            Object.entries(data.service_features).forEach(([lang, obj]) => {
              if (
                obj &&
                typeof obj === "object" &&
                Array.isArray((obj as { items?: any[] }).items) &&
                (obj as { items: { title?: string; description?: string }[] }).items.length > 0 &&
                (obj as { items: { title?: string; description?: string }[] }).items.some((item: { title?: string; description?: string }) => item.title || item.description)
              ) {
                langs.add(lang);
              }
            });
          }

          // Only allow valid LocaleEnum values
          const validLocales = ["en", "ar"];
          setActiveLocales(Array.from(langs).filter((l): l is LocaleEnum => validLocales.includes(l)));

          setExistingImages(data.img_urls || [])
        }
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Error fetching service", variant: "destructive" })
      }
    }
    if (id) fetchService()
  }, [id])

  /* ----------------------------------- Image Handlers ----------------------------------------- */
  const handleExistingImageRemove = (idx: number) => {
    const newPreviews = existingImages.filter((_, i) => i !== idx);
    setExistingImages(newPreviews);

    const allCurrent = [
      ...newPreviews.map(url => url), // existing
      ...imageFiles.map(file => file.name) // selected
    ];
    form.setValue("img_urls", allCurrent, { shouldValidate: true });
  }

  /* ----------------------------------- Form Submission ----------------------------------------- */
  const handleSubmit = form.handleSubmit(async (values) => {
    const totalImages = imageFiles.length + existingImages.length;
    const ok = validateImageCount(form, totalImages, 4, 6);
    if (!ok) return;

    setCancelled(false)
    setLoading(true)
    let imgUrls = [...existingImages]
    if (imageFiles.length > 0) {
      const uploaded = await makeApiCall(() => new ServiceService().uploadImages(imageFiles), {
        afterSuccess: (paths: string[]) => paths,
        afterError: (err: string) => {
          toast({ title: "Image upload failed", description: err || "Error uploading images", variant: "destructive" })
          return
        },
        afterFinally: () => {
          setLoading(false)
        }
      })
      imgUrls = [...imgUrls, ...uploaded]
    }

    if (cancelled) return

    await makeApiCall(() => new ServiceService().updateService(id, { ...values, img_urls: imgUrls }), {
      afterSuccess: () => {
        toast({ title: "Service updated", description: "Service updated successfully!", variant: "success" })
        router.push("/admin/content/services")
      },
      afterError: (err: any) => {
        if (!cancelled) toast({ title: "Error", description: err.message || "Error updating service", variant: "destructive" })
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

  // Delete Locale Alert
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [localeToDelete, setLocaleToDelete] = useState<LocaleEnum | null>(null);

  const handleDeleteLocaleAlert = (locale: LocaleEnum) => {
    setLocaleToDelete(locale);
    setDeleteDialogOpen(true);
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
        title="Edit Service"
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
                      onClick={() => handleDeleteLocaleAlert(locale)}
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
            <CustomImageInputEdit
              form={form}
              name="img_urls"
              existingImages={existingImages}
              onRemoveExisting={handleExistingImageRemove}
              min={4}
              max={6}
              onChange={(files) => {
                setImageFiles(files);
                form.setValue("img_urls", files.map(file => file.name), { shouldValidate: false });
              }}
            />
            <FormErrorMessage name="img_urls" form={form} />
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="flex justify-end gap-2">
            <SubmitButton loading={loading} LoadingText="Saving..." DefaultText="Save" />
            <CancelButton handleCancel={handleCancel} loading={loading} />
          </div>
        </form>
      </ContentCreateEditLayout >

      {/* Delete Locale Dialog */}
      <AlertBoxComponent
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Are you absolutely sure?"
        description={`This action cannot be undone. This will reset ${LocaleEnumLabel[localeToDelete!]} data from the form.`}
        confirmText="Yes, remove"
        cancelText="Cancel"
        onConfirm={() => handleRemoveLocale(localeToDelete!)}
        loading={loading}
      />
    </>
  )
} 