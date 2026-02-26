"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ProjectService } from "@/services/api"
import { ProjectFormInput, projectSchema } from "../types"
import { useToast } from "@/hooks/use-toast"
import { makeApiCall, getLocaleKey, validateImageCount } from "@/lib/utils"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types/common"
import { ContentCreateEditLayout, CustomImageInput, FormErrorMessage } from "@/components/common"
import { CancelButton, LabelComponent, SubmitButton } from "@/components/custom-ui"

export default function CreateProject() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [cancelled, setCancelled] = useState(false)
  const form = useForm<ProjectFormInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      img_urls: [],
      title: { en: "", ar: "" },
      location: "",
      description: { en: "", ar: "" },
      type: { en: "", ar: "" },
      area: "",
      slug: null,
    },
  })

  /* ----------------------------------- Form Submission ----------------------------------------- */
  const handleSubmit = form.handleSubmit(async (values) => {
    const ok = validateImageCount(form, imageFiles.length, 1, 5);
    if (!ok) return;

    setLoading(true)
    setCancelled(false)
    let imgUrls = values.img_urls
    if (imageFiles.length > 0) {
      imgUrls = await makeApiCall(() => new ProjectService().uploadImages(imageFiles), {
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

    await makeApiCall(() => new ProjectService().createProject({ ...values, img_urls: imgUrls }), {
      afterSuccess: () => {
        toast({ title: "Project created", description: "Project added successfully!", variant: "success" })
        router.push("/admin/content/projects")
      },
      afterError: (err: any) => {
        if (!cancelled) toast({ title: "Error", description: err.message || "Error creating project", variant: "destructive" })
      },
      afterFinally: () => {
        setLoading(false)
      }
    })
  })

  const handleCancel = () => {
    setCancelled(true)
    router.push("/admin/content/projects")
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
    form.setValue(`description.${locale}`, "");
    form.setValue(`type.${locale}`, "");

    form.clearErrors([
      `title.${locale}`,
      `description.${locale}`,
      `type.${locale}`,
    ]);
  }

  /* ----------------------------------- Render ----------------------------------------- */
  return (
    <>
      <ContentCreateEditLayout
        title="Add Project"
        activeLocales={activeLocales}
        handleAddLocale={handleAddLocale}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Multilingual Fields */}
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
                  <LabelComponent text="Title" htmlFor={`title_${locale}`} />
                  <Input id={`title_${locale}`} {...form.register(`title.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`title.${locale}`} form={form} />
                </div>
                <div>
                  <LabelComponent text="Description" htmlFor={`description_${locale}`} />
                  <Textarea id={`description_${locale}`} {...form.register(`description.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`description.${locale}`} form={form} />
                </div>
                <div>
                  <LabelComponent text="Type" htmlFor={`type_${locale}`} />
                  <Input id={`type_${locale}`} {...form.register(`type.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`type.${locale}`} form={form} />
                </div>
              </div>
            )
          })}

          {/* Non multi language fields */}
          <div>
            <LabelComponent text="Slug" htmlFor="slug" />
            <Input id="slug" {...form.register("slug" as const)} disabled={loading} />
            <FormErrorMessage name="slug" form={form} />
          </div>
          <div>
            <LabelComponent text="Location" htmlFor="location" optional />
            <Input id="location" {...form.register("location" as const)} disabled={loading} />
            <FormErrorMessage name="location" form={form} />
          </div>
          <div>
            <LabelComponent text="Area" htmlFor="area" />
            <Input id="area" {...form.register("area" as const)} disabled={loading} />
            <FormErrorMessage name="area" form={form} />
          </div>
          <div>
            <LabelComponent text="Images" htmlFor="img_urls" />
            <CustomImageInput
              min={1}
              max={5}
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
      </ContentCreateEditLayout>
    </>
  )
}