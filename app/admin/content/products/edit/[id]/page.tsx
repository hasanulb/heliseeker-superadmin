"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ProductService } from "@/services/api"
import { ProductFormInputType, productSchema } from "../../types"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types"
import { AlertBoxComponent, CancelButton, LabelComponent, SubmitButton } from "@/components/custom-ui"
import { useToast } from "@/hooks/use-toast"
import { getLocaleKey, makeApiCall, validateImageCount } from "@/lib/utils"
import { ContentCreateEditLayout, CustomImageInputEdit, FormErrorMessage } from "@/components/common"

export default function EditProduct() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { toast } = useToast();
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [cancelled, setCancelled] = useState(false)
  const [activeLocales, setActiveLocales] = useState<LocaleEnum[]>([LocaleEnum.en]);
  const form = useForm<ProductFormInputType>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      img_urls: [],
      name: { en: "", ar: "" },
      intro: { en: "", ar: "" },
      description: { en: "", ar: "" },
      tags: [],
      key_features: { en: [], ar: [] },
      installation_steps: { en: [], ar: [] },
      materials_and_dimensions: { en: { items: [] }, ar: { items: [] } },
      slug: null
    },
  })

  /* ----------------------------------- Product Fetch ----------------------------------------- */
  useEffect(() => {
    async function fetchProduct() {
      try {
        const data: any = await new ProductService().getProduct(id)
        if (data) {
          form.reset({
            name: data.name || { en: "", ar: "" },
            intro: data.intro || { en: "", ar: "" },
            description: data.description || { en: "", ar: "" },
            slug: data.slug,
            tags: data.tags || [],
            img_urls: data.img_urls || [],
            key_features: data.key_features || { en: [], ar: [] },
            installation_steps: data.installation_steps || { en: [], ar: [] },
            materials_and_dimensions: data.materials_and_dimensions || { en: { items: [] }, ar: { items: [] } }
          })

          // Update activeLocales to include any language present in any field
          const langs = new Set<string>(["en"]);
          const fields = ["name", "intro", "description"];
          fields.forEach(field => {
            if (data[field]) {
              Object.entries(data[field]).forEach(([lang, val]) => {
                if (val && typeof val === "string" && val.trim() !== "") langs.add(lang);
              });
            }
          });

          if (data.key_features) {
            Object.entries(data.key_features).forEach(([lang, arr]) => {
              if (Array.isArray(arr) && arr.length > 0 && arr.some((item: string) => item && item.trim() !== "")) langs.add(lang);
            });
          }

          if (data.materials_and_dimensions) {
            Object.entries(data.materials_and_dimensions).forEach(([lang, obj]) => {
              if (
                obj &&
                typeof obj === "object" &&
                Array.isArray((obj as { items?: any[] }).items) &&
                (obj as { items: { title?: string; value?: string }[] }).items.length > 0 &&
                (obj as { items: { title?: string; value?: string }[] }).items.some((item: { title?: string; value?: string }) => item.title || item.value)
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
        toast({ title: "Error", description: err.message || "Error fetching product", variant: "destructive" })
      }
    }
    if (id) fetchProduct()
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
    const ok = validateImageCount(form, totalImages, 1, 20);
    if (!ok) return;

    setLoading(true)
    setCancelled(false)
    let imgUrls = [...existingImages]
    if (imageFiles.length > 0) {
      const uploaded = await makeApiCall(() => new ProductService().uploadImages(imageFiles), {
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
    await makeApiCall(() => new ProductService().updateProduct(id, { ...values, img_urls: imgUrls }), {
      afterSuccess: () => {
        toast({ title: "Product updated", description: "Product updated successfully!", variant: "success" })
        router.push("/admin/content/products")
      },
      afterError: (err: any) => {
        if (!cancelled) toast({ title: "Error", description: err.message || "Error updating product", variant: "destructive" })
      },
      afterFinally: () => {
        setLoading(false)
      }
    })
  })

  const handleCancel = () => {
    setCancelled(true)
    router.push("/admin/content/products")
  }

  /* ----------------------------------- Multilingual Support ----------------------------------------- */
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

    form.setValue(`name.${locale}`, "");
    form.setValue(`intro.${locale}`, "");
    form.setValue(`description.${locale}`, "");
    form.setValue(`key_features.${locale}`, []);
    form.setValue(`installation_steps.${locale}`, []);
    form.setValue(`materials_and_dimensions.${locale}`, { items: [] });

    form.clearErrors([
      `name.${locale}`,
      `intro.${locale}`,
      `description.${locale}`,
      `key_features.${locale}`,
      `installation_steps.${locale}`,
      `materials_and_dimensions.${locale}`
    ]);
  }

  /* ----------------------------------- Render ----------------------------------------- */
  return (
    <>
      <ContentCreateEditLayout
        title="Edit Product"
        activeLocales={activeLocales}
        handleAddLocale={handleAddLocale}
      >
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Multilingual Fields */}
          {activeLocales.map((locale) => {
            const localeKey = getLocaleKey(locale);
            const features = form.watch(`key_features.${locale}`) || [];
            const materialsAndDimensions = form.watch(`materials_and_dimensions.${locale}`) || [];
            const installationSteps = form.watch(`installation_steps.${locale}`) || [];
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
                  <LabelComponent text="Name" htmlFor={`name-${locale}`} />
                  <Input id={`name-${locale}`} {...form.register(`name.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`name.${locale}`} form={form} />
                </div>
                <div>
                  <LabelComponent text="Intro" htmlFor={`intro-${locale}`} />
                  <Textarea id={`intro-${locale}`} {...form.register(`intro.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`intro.${locale}`} form={form} />
                </div>
                <div>
                  <LabelComponent text="Description" htmlFor={`description-${locale}`} />
                  <Textarea id={`description-${locale}`} {...form.register(`description.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`description.${locale}`} form={form} />
                </div>

                {/* Key Features */}
                <div>
                  <LabelComponent text="Key Features" htmlFor={`key_features-${locale}`} />
                  <div key={locale + "-features"} className="border rounded p-4 space-y-2">
                    {features.map((item, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <Input placeholder="Feature" {...form.register(`key_features.${locale}.${idx}` as const)} disabled={loading} />
                        <Button type="button" variant="destructive" onClick={() => {
                          const features = [...(form.getValues(`key_features.${locale}`) || [])];
                          features.splice(idx, 1);
                          form.setValue(`key_features.${locale}` as const, features);
                        }}>Remove</Button>
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" onClick={() => {
                        const features = [...(form.getValues(`key_features.${locale}`) || [])];
                        features.push("");
                        form.setValue(`key_features.${locale}` as const, features);
                      }}>Add Feature</Button>
                    </div>
                  </div>
                  <FormErrorMessage name={`key_features.${locale}`} form={form} />
                </div>

                {/* Installation Steps */}
                <div>
                  <LabelComponent text="Installation Steps" htmlFor={`installation_steps-${locale}`} />
                  <div key={locale + "-steps"} className="border rounded p-4 space-y-2">
                    {installationSteps.map((step, idx) => (
                      <div key={idx} className="flex gap-2 mb-2 items-start">
                        <div className="pt-2 text-gray-500 font-semibold">{idx + 1}.</div>
                        <Input
                          className="flex-1"
                          placeholder={`Step ${idx + 1}`}
                          {...form.register(`installation_steps.${locale}.${idx}` as const)}
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            const steps = [...installationSteps];
                            steps.splice(idx, 1);
                            form.setValue(`installation_steps.${locale}` as const, steps);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const steps = [...installationSteps];
                          steps.push("");
                          form.setValue(`installation_steps.${locale}` as const, steps);
                        }}
                      >
                        Add Step
                      </Button>
                    </div>
                  </div>
                  <FormErrorMessage name={`installation_steps.${locale}`} form={form} />
                </div>

                {/* Materials & Dimensions */}
                <div>
                  <LabelComponent text="Materials & Dimensions" htmlFor={`materials_and_dimensions-${locale}`} optional />
                  <div key={locale + "-materials"} className="border rounded p-4 space-y-2">
                    {materialsAndDimensions.items.map((item: { title: string; value: string }, idx: number) => (
                      <div key={idx} className="flex w-full gap-2 mb-2">
                        <div className="flex-1">
                          <Input placeholder="Title" {...form.register(`materials_and_dimensions.${locale}.items.${idx}.title` as const)} disabled={loading} />
                          <FormErrorMessage name={`materials_and_dimensions.${locale}.items.${idx}.title`} form={form} />
                        </div>
                        <div className="flex-1">
                          <Input placeholder="Value" {...form.register(`materials_and_dimensions.${locale}.items.${idx}.value` as const)} disabled={loading} />
                          <FormErrorMessage name={`materials_and_dimensions.${locale}.items.${idx}.value`} form={form} />
                        </div>
                        <Button type="button" variant="destructive" onClick={() => {
                          const items = [...(materialsAndDimensions.items || [])];
                          items.splice(idx, 1);
                          form.setValue(`materials_and_dimensions.${locale}.items` as const, items);
                        }}>Remove</Button>
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" onClick={() => {
                        const items = [...(materialsAndDimensions.items || [])];
                        items.push({ title: "", value: "" });
                        form.setValue(`materials_and_dimensions.${locale}.items` as const, items);
                      }}>Add Item</Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Non Multi Language Fields */}
          <div>
            <LabelComponent text="Slug" htmlFor="slug" />
            <Input id="slug" {...form.register("slug" as const)} disabled={loading} />
            <FormErrorMessage name="slug" form={form} />
          </div>
          <div>
            <LabelComponent text="Tags (comma separated)" htmlFor="tags" optional />
            <Input id="tags" {...form.register("tags", {
              setValueAs: v => typeof v === 'string' ? v.split(",").map((s: string) => s.trim()).filter(Boolean) : Array.isArray(v) ? v : []
            })} disabled={loading} />
            <FormErrorMessage name="tags" form={form} />
          </div>
          <div>
            <LabelComponent text="Images" htmlFor="img_urls" />
            <CustomImageInputEdit
              form={form}
              name="img_urls"
              existingImages={existingImages}
              onRemoveExisting={handleExistingImageRemove}
              min={1}
              max={20}
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
      </ContentCreateEditLayout>

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