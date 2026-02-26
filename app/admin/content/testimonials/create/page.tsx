"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/input"
import { TestimonialService } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types"
import { CancelButton, LabelComponent, SubmitButton } from "@/components/custom-ui"
import { getLocaleKey, makeApiCall, validateImageCount } from "@/lib/utils"
import { TestimonialFormInputType, testimonialSchema } from "../types"
import { ContentCreateEditLayout, CustomImageInput, FormErrorMessage } from "@/components/common"
import { Textarea } from "@/components/ui/textarea"

export default function CreateTestimonial() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, startTransition] = useTransition()
  const [imageFiles, setImageFiles] = useState<File[]>([])
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

  /* ----------------------------------- Form Submission ----------------------------------------- */
  const handleSubmit = form.handleSubmit(async (values) => {
    const ok = validateImageCount(form, imageFiles.length, 1, 1);
    if (!ok) return;

    setCancelled(false)
    startTransition(async () => {
      try {
        let imgUrls = values.img_urls
        if (imageFiles.length > 0) {
          try {
            imgUrls = await makeApiCall(() => new TestimonialService().uploadImages(imageFiles), {
              afterSuccess: (paths: string[]) => paths,
              afterError: (err: string) => {
                toast({ title: "Image upload failed", description: err || "Error uploading images", variant: "destructive" })
                return
              }
            })
          } catch (err: any) {
            toast({ title: "Image upload failed", description: err.message || "Error uploading images", variant: "destructive" })
            return
          }
        }
        if (cancelled) return
        await makeApiCall(() => new TestimonialService().createTestimonial({ ...values, img_urls: imgUrls }), {
          afterSuccess: () => {
            toast({ title: "Testimonial created", description: "Testimonial added successfully!", variant: "success" })
            router.push("/admin/content/testimonials")
          },
          afterError: (err: any) => {
            if (!cancelled) toast({ title: "Error", description: err.message || "Error creating testimonial", variant: "destructive" })
          }
        })
      } catch (err: any) {
        if (!cancelled) toast({ title: "Error", description: err.message || "Error creating testimonial", variant: "destructive" })
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
        title="Add Testimonial"
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
                      onClick={() => handleRemoveLocale(locale)}
                      className="text-red-500 hover:text-red-700 text-sm border border-red-500 rounded p-1 w-6 h-6 flex items-center justify-center"
                      title={`Remove ${LocaleEnumLabel[localeKey]}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div>
                  <LabelComponent text="Name" htmlFor={`name-${locale}`} />
                  <Input id={`title-${locale}`} {...form.register(`name.${locale}` as const)} disabled={loading} />
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
            <CustomImageInput
              min={1}
              max={1}
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