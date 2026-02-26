"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ProjectService } from "@/services/api"
import { ProjectFormInput, projectSchema } from "../../types"
import { useToast } from "@/hooks/use-toast"
import { makeApiCall, getLocaleKey, validateImageCount } from "@/lib/utils"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types"
import { ContentCreateEditLayout, CustomImageInputEdit, FormErrorMessage } from "@/components/common"
import { AlertBoxComponent, CancelButton, LabelComponent, SubmitButton } from "@/components/custom-ui"

export default function EditProject() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
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

  /* ----------------------------------- Project Fetch ----------------------------------------- */
  useEffect(() => {
    async function fetchProject() {
      try {
        const data:any = await new ProjectService().getProject(id)
        if (data) {
          form.reset({
            title: data.title || { en: "", ar: "" },
            location: data.location || "",
            description: data.description || { en: "", ar: "" },
            type: data.type || { en: "", ar: "" },
            area: data.area,
            slug: data.slug,
            img_urls: data.img_urls || [],
          })

          // Update activeLocales to include any language present in any field
          const langs = new Set<string>(["en"]);
          const fields = ["title", "description", "type" ];
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
        toast({ title: "Error", description: err.message || "Error fetching project", variant: "destructive" })
      }
    }
    if (id) fetchProject()
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
    const ok = validateImageCount(form, totalImages, 1, 5);
    if (!ok) return;

    setLoading(true)
    setCancelled(false)
    let imgUrls = [...existingImages]
    if (imageFiles.length > 0) {
      const uploaded = await makeApiCall(() => new ProjectService().uploadImages(imageFiles), {
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
    await makeApiCall(() => new ProjectService().updateProject(id, { ...values, img_urls: imgUrls }), {
      afterSuccess: () => {
        toast({ title: "Project updated", description: "Project updated successfully!", variant: "success" })
        router.push("/admin/content/projects")
      },
      afterError: (err: any) => {
        if (!cancelled) toast({ title: "Error", description: err.message || "Error updating project", variant: "destructive" })
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
        title="Edit Project"
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
                      onClick={() => handleDeleteLocaleAlert(locale)}
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
            <LabelComponent text="Location" htmlFor="location" optional/>
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
            <CustomImageInputEdit
              form={form}
              name="img_urls"
              existingImages={existingImages}
              onRemoveExisting={handleExistingImageRemove}
              min={1}
              max={5}
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