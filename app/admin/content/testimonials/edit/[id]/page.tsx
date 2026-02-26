"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TestimonialService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types"
import { AlertBoxComponent, CancelButton, LabelComponent, SubmitButton } from "@/components/custom-ui"
import { getLocaleKey, makeApiCall, validateImageCount } from "@/lib/utils"
import { TestimonialFormInputType, testimonialSchema } from "../../types"
import { ContentCreateEditLayout, CustomImageInputEdit, FormErrorMessage } from "@/components/common"

export default function EditService() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { toast } = useToast()
  const [loading, startTransition] = useTransition()
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [cancelled, setCancelled] = useState(false)

  const form = useForm<TestimonialFormInputType>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      img_urls: [],
      name: { en: "", ar: "" },
      role: { en: "", ar: "" },
      quote: { en: "", ar: "" },  
    },
  })

  /* ----------------------------------- Service Fetch ----------------------------------------- */
  useEffect(() => {
    async function fetchTestimonial() {
      try {
        const data :any= await new TestimonialService().getTestimonial(id)
        if (data) {
          form.reset({
            img_urls: data.img_urls || [],
            name: data.name || { en: "", ar: "" },
            role: data.role || { en: "", ar: "" },
            quote: data.quote || { en: "", ar: "" },
          })

          // Update activeLocales to include any language present in any field
          const langs = new Set<string>(["en"]);
          const fields = ["name", "role", "quote"];
          fields.forEach(field => {
            if (data[field]) {
              Object.entries(data[field]).forEach(([lang, val]) => {
                if (val && typeof val === "string" && val.trim() !== "") langs.add(lang);
              });
            }
          });

          // Only allow valid LocaleEnum values
          const validLocales = ["en", "ar"];
          setActiveLocales(Array.from(langs).filter((l): l is LocaleEnum => validLocales.includes(l)));

          setExistingImages(data.img_urls || [])
        }
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Error fetching testimonial", variant: "destructive" })
      }
    }
    if (id) fetchTestimonial()
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
    const ok = validateImageCount(form, totalImages, 1, 1);
    if (!ok) return;

    setCancelled(false)
    startTransition(async () => {
      try {
        let imgUrls = [...existingImages]
        if (imageFiles.length > 0) {
          try {
            const uploaded = await makeApiCall(() => new TestimonialService().uploadImages(imageFiles), {
              afterSuccess: (paths: string[]) => paths,
              afterError: (err: string) => {
                toast({ title: "Image upload failed", description: err || "Error uploading images", variant: "destructive" })
                return
              }
            })
            imgUrls = [...imgUrls, ...uploaded]
          } catch (err: any) {
            toast({ title: "Image upload failed", description: err.message || "Error uploading images", variant: "destructive" })
            return
          }
        }
        if (cancelled) return
        await makeApiCall(() => new TestimonialService().updateTestimonial(id, { ...values, img_urls: imgUrls }), {
          afterSuccess: () => {
            toast({ title: "Testimonial updated", description: "Testimonial updated successfully!", variant: "success" })
            router.push("/admin/content/testimonials")
          },
          afterError: (err: any) => {
            if (!cancelled) toast({ title: "Error", description: err.message || "Error updating testimonial", variant: "destructive" })
          }
        })
      } catch (err: any) {
        if (!cancelled) toast({ title: "Error", description: err.message || "Error updating testimonial", variant: "destructive" })
      }
    })
  })

  const handleCancel = () => {
    setCancelled(true)
    router.push("/admin/content/testimonials")
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

    form.setValue(`name.${locale}`, "");
    form.setValue(`role.${locale}`, "");
    form.setValue(`quote.${locale}`, "");

    form.clearErrors([
      `name.${locale}`,
      `role.${locale}`,
      `quote.${locale}`,
    ]);
  }

  /* ----------------------------------- Render ----------------------------------------- */
  return (
    <>
      <ContentCreateEditLayout
        title="Edit Testimonial"
        activeLocales={activeLocales}
        handleAddLocale={handleAddLocale}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Language Fields */}
          {activeLocales.map((locale) => {
            const localeKey = getLocaleKey(locale);
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
                  <LabelComponent text="Role" htmlFor={`role-${locale}`} />
                  <Input id={`role-${locale}`} {...form.register(`role.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`role.${locale}`} form={form} />
                </div>
                <div>
                  <LabelComponent text="Quote" htmlFor={`quote-${locale}`} />
                  <Textarea id={`quote-${locale}`} {...form.register(`quote.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`quote.${locale}`} form={form} />
                </div>
              </div>
            );
          })}

          {/* Non multilingual fields */}
          <div>
            <LabelComponent text="Images" htmlFor="img_urls" />
            <CustomImageInputEdit
              form={form}
              name="img_urls"
              existingImages={existingImages}
              onRemoveExisting={handleExistingImageRemove}
              min={1}
              max={1}
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