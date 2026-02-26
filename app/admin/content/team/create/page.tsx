"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/input"
import { TeamService } from "@/services/api"
import { TeamFormInputType, teamSchema } from "../types"
import { useToast } from "@/hooks/use-toast"
import { getLocaleKey, makeApiCall, validateImageCount } from "@/lib/utils"
import { CancelButton, LabelComponent, SubmitButton } from "@/components/custom-ui"
import { ContentCreateEditLayout, CustomImageInput, FormErrorMessage } from "@/components/common"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types"
import { Textarea } from "@/components/ui/textarea"

export default function CreateTeam() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, startTransition] = useTransition()
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [cancelled, setCancelled] = useState(false)
  const form = useForm<TeamFormInputType>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: { en: "", ar: "" }, position: { en: "", ar: "" }, description: { en: "", ar: "" }, img_urls: [] },
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
            imgUrls = await makeApiCall(() => new TeamService().uploadImages(imageFiles), {
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
        await makeApiCall(() => new TeamService().createTeam({ ...values, img_urls: imgUrls }), {
          afterSuccess: () => {
            toast({ title: "Team created", description: "Team added successfully!", variant: "success" })
            router.push("/admin/content/team")
          },
          afterError: (err: any) => {
            if (!cancelled) toast({ title: "Error", description: err.message || "Error creating team", variant: "destructive" })
          }
        })
      } catch (err: any) {
        if (!cancelled) toast({ title: "Error", description: err.message || "Error creating team", variant: "destructive" })
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
                      onClick={() => handleRemoveLocale(locale)}
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
      </ContentCreateEditLayout>
    </>
  )
} 