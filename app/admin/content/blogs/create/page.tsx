"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import dynamic from "next/dynamic"

// Dynamic import to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })
import 'react-quill-new/dist/quill.snow.css'

import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { makeApiCall, getLocaleKey, validateImageCount } from "@/lib/utils"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types/common"
import { BlogFormInputType, blogSchema, BlogStatusEnum, BlogStatusType } from "../types"
import { BlogService } from "@/services/api/blog.service"
import { CancelButton, LabelComponent } from "@/components/custom-ui"
import { ContentCreateEditLayout, CustomImageInput, FormErrorMessage } from "@/components/common"
import { Button } from "@/components/ui/button"
import { AlertBoxComponent } from "@/components/custom-ui/alert-box.component"

// Rich text editor configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'script': 'sub' }, { 'script': 'super' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    ['clean']
  ],
}

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'script', 'indent', 'direction',
  'color', 'background', 'align', 'link', 'image', 'video'
]

export default function CreateBlog() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [cancelled, setCancelled] = useState(false)

  const form = useForm<BlogFormInputType>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: { en: "", ar: "" },
      hero_title: { en: "", ar: "" },
      content: { en: "", ar: "" }, // This will now store HTML content
      img_urls: [],
      tags: [],
      status: BlogStatusEnum.DRAFT,
      slug: null,
      author: "",
      published_at: null,
    },
  })

  /* ----------------------------------- Form Submission ----------------------------------------- */
  const handleSubmitWithMode = (mode: BlogStatusType) => {
    return async (e?: React.FormEvent) => {
      const ok = validateImageCount(form, imageFiles.length, 1, 5);
      if (!ok) return;

      if (e) {
        e.preventDefault();
      }

      form.setValue("status", mode);

      const isValid = await form.trigger();
      if (!isValid) {
        return;
      }

      const values = form.getValues();

      setLoading(true);
      setCancelled(false);
      console.log("Form Values:", values);
      let imgUrls = values.img_urls;
      if (imageFiles.length > 0) {
        imgUrls = await makeApiCall(() => new BlogService().uploadImages(imageFiles), {
          afterSuccess: (paths: string[]) => paths,
          afterError: (err: string) => {
            console.log("Image upload error:", err);
            toast({ title: "Image upload failed", description: err || "Error uploading images", variant: "destructive" })
            return;
          },
          afterFinally: () => {
            setLoading(false)
          }
        })
      }
      if (cancelled) return;

      const payload = {
        ...values,
        img_urls: imgUrls,
        status: mode,
      };

      if (mode === BlogStatusEnum.PUBLISHED) {
        payload.published_at = null;
      }

      await makeApiCall(() => new BlogService().createBlog(payload), {
        afterSuccess: () => {
          toast({
            title: mode === BlogStatusEnum.PUBLISHED ? "Blog published" : "Draft saved",
            description: mode === BlogStatusEnum.PUBLISHED ? "Blog published successfully!" : "Draft saved successfully!",
            variant: "success"
          });
          router.push("/admin/content/blogs");
        },
        afterError: (err: any) => {
          toast({ title: "Error", description: err?.message || "Something went wrong", variant: "destructive" });
        },
        afterFinally: () => {
          setLoading(false)
        }
      });
    };
  };

  /* ----------------------------------- Back/Cancel ----------------------------------------- */
  // Custom back/cancel logic with alert
  const [showDraftAlert, setShowDraftAlert] = useState(false);
  const [pendingBack, setPendingBack] = useState(false);

  const getAnyTitleFilled = () => {
    const titles = form.getValues("title") || {};
    return Object.values(titles).some((v) => typeof v === "string" && v.trim() !== "");
  };

  // Helper function to check if HTML content is empty
  const isHtmlEmpty = (html: string): boolean => {
    if (!html || html.trim() === "") return true;

    // Remove HTML tags and check if there's actual content
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    if (textContent === "") return true;

    // Check for common empty rich text patterns
    const emptyPatterns = [
      /^<p><br><\/p>$/,
      /^<p><br\/><\/p>$/,
      /^<p>\s*<\/p>$/,
      /^<div><br><\/div>$/,
      /^<div><br\/><\/div>$/,
      /^<div>\s*<\/div>$/,
    ];

    return emptyPatterns.some(pattern => pattern.test(html.trim()));
  };

  const getAnyContentFilled = () => {
    const contents = form.getValues("content") || {};
    return Object.values(contents).some((v) => typeof v === "string" && !isHtmlEmpty(v));
  };

  const handleBack = () => {
    if (getAnyTitleFilled() || getAnyContentFilled()) {
      setShowDraftAlert(true);
      setPendingBack(true);
    } else {
      router.push("/admin/content/blogs");
    }
  };

  const handleDraftConfirm = async () => {
    setShowDraftAlert(false);
    await handleSubmitWithMode(BlogStatusEnum.DRAFT)();
    setPendingBack(false);
  };

  const handleDraftCancel = () => {
    setShowDraftAlert(false);
    setPendingBack(false);
    form.reset();
    router.push("/admin/content/blogs");
  };

  const handleCancel = handleBack;

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
    form.setValue(`hero_title.${locale}`, "");
    form.setValue(`content.${locale}`, "");
    form.clearErrors([`title.${locale}`, `hero_title.${locale}`, `content.${locale}`]);
  }

  /* ----------------------------------- Render ----------------------------------------- */
  return (
    <>
      <ContentCreateEditLayout
        title="Add Blog"
        activeLocales={activeLocales}
        handleAddLocale={handleAddLocale}
        onBack={handleBack}
      >
        <form onSubmit={handleSubmitWithMode(BlogStatusEnum.PUBLISHED)} className="space-y-4">
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
                  <LabelComponent text="Title" htmlFor={`title-${locale}`} />
                  <Input
                    id={`title-${locale}`}
                    {...form.register(`title.${locale}` as const)}
                    disabled={loading}
                  />
                  <FormErrorMessage name={`title.${locale}`} form={form} />
                </div>

                <div>
                  <LabelComponent text="Hero Title" htmlFor={`hero_title-${locale}`} />
                  <Input
                    id={`hero_title-${locale}`}
                    {...form.register(`hero_title.${locale}` as const)}
                    disabled={loading}
                  />
                  <FormErrorMessage name={`hero_title.${locale}`} form={form} />
                </div>

                <div>
                  <LabelComponent text="Content" htmlFor={`content-${locale}`} />
                  <Controller
                    name={`content.${locale}` as const}
                    control={form.control}
                    render={({ field }) => (
                      <ReactQuill
                        theme="snow"
                        value={field.value}
                        onChange={field.onChange}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Write your blog content here..."
                        style={{ minHeight: '200px' }}
                      />
                    )}
                  />
                  <FormErrorMessage name={`content.${locale}`} form={form} />
                </div>
              </div>
            )
          })}

          {/* Non Multilingual Fields */}
          <div>
            <LabelComponent text="Slug" htmlFor="slug" />
            <Input id="slug" {...form.register("slug")} disabled={loading} />
            <FormErrorMessage name="slug" form={form} />
          </div>

          <div>
            <LabelComponent text="Author" htmlFor="author" optional />
            <Input id="author" {...form.register("author")} disabled={loading} />
            <FormErrorMessage name="author" form={form} />
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
            <Button
              variant="secondary"
              type="button"
              disabled={loading}
              onClick={handleSubmitWithMode(BlogStatusEnum.DRAFT)}
            >
              {loading ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={handleSubmitWithMode(BlogStatusEnum.PUBLISHED)}
            >
              {loading ? "Publishing..." : "Publish"}
            </Button>
            <CancelButton handleCancel={handleCancel} loading={loading} />
          </div>
        </form>
      </ContentCreateEditLayout>

      <AlertBoxComponent
        open={showDraftAlert}
        onOpenChange={(open: boolean) => setShowDraftAlert(open)}
        title="Unsaved Changes"
        description="You have entered a title or content. Do you want to save as draft before leaving?"
        confirmText="Save as Draft"
        cancelText="Discard"
        onConfirm={handleDraftConfirm}
        onDiscard={handleDraftCancel}
      />
    </>
  )
}