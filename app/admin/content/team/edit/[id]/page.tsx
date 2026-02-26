"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/input"
import { TeamService } from "@/services/api"
import { TeamFormInputType, teamSchema } from "../../types"
import { useToast } from "@/hooks/use-toast"
import { getLocaleKey, makeApiCall, validateImageCount } from "@/lib/utils"
import { AlertBoxComponent, CancelButton, LabelComponent, SubmitButton } from "@/components/custom-ui"
import { ContentCreateEditLayout, CustomImageInputEdit, FormErrorMessage } from "@/components/common"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"

export default function CreateTeam() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { toast } = useToast()
  const [loading, startTransition] = useTransition()
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [cancelled, setCancelled] = useState(false)
  const form = useForm<TeamFormInputType>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: { en: "", ar: "" }, position: { en: "", ar: "" }, description: { en: "", ar: "" }, img_urls: [] },
  })

  /* ----------------------------------- Team Fetch ----------------------------------------- */
  useEffect(() => {
    async function fetchTeam() {
      try {
        const data :any= await new TeamService().getTeam(id)
        if (data) {
          form.reset({
            name: data.name || { en: "", ar: "" },
            position: data.position || { en: "", ar: "" },
            description: data.description || { en: "", ar: "" },
            img_urls: data.img_urls || [],
          });

          // Update activeLocales to include any language present in any field
          const langs = new Set<string>(["en"]);
          const fields = ["name", "position", "description"];
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
        toast({ title: "Error", description: err.message || "Error fetching team", variant: "destructive" })
      }
    }
    if (id) fetchTeam()
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
            const uploaded = await makeApiCall(() => new TeamService().uploadImages(imageFiles), {
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
        await makeApiCall(() => new TeamService().updateTeam(id, { ...values, img_urls: imgUrls }), {
          afterSuccess: () => {
            toast({ title: "Team updated", description: "Team updated successfully!", variant: "success" })
            router.push("/admin/content/team")
          },
          afterError: (err: any) => {
            if (!cancelled) toast({ title: "Error", description: err.message || "Error updating team", variant: "destructive" })
          }
        })
      } catch (err: any) {
        if (!cancelled) toast({ title: "Error", description: err.message || "Error updating team", variant: "destructive" })
      }
    })
  })

  const handleCancel = () => {
    setCancelled(true)
    router.push("/admin/content/team")
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
    form.setValue(`position.${locale}`, "");
    form.setValue(`description.${locale}`, "");

    form.clearErrors([
      `name.${locale}`,
      `position.${locale}`,
      `description.${locale}`,
    ]);
  }

  /* ----------------------------------- Render ----------------------------------------- */
  return (
    <>
      <ContentCreateEditLayout
        title="Add Team Member"
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
                  <LabelComponent text="Name" htmlFor={`name_${locale}`} />
                  <Input id={`name_${locale}`} {...form.register(`name.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`name.${locale}`} form={form} />
                </div>
                <div>
                  <LabelComponent text="Position" htmlFor={`position_${locale}`} />
                  <Input id={`position_${locale}`} {...form.register(`position.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`position.${locale}`} form={form} />
                </div>
                <div>
                  <LabelComponent text="Description" htmlFor={`description_${locale}`} />
                  <Textarea id={`description_${locale}`} {...form.register(`description.${locale}` as const)} disabled={loading} />
                  <FormErrorMessage name={`description.${locale}`} form={form} />
                </div>
              </div>
            )
          })}

          {/* Non multi language fields */}
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