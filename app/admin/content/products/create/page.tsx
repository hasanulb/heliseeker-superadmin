"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ProductService } from "@/services/api/product.service"
import { CancelButton, SubmitButton, LabelComponent } from "@/components/custom-ui"
import { ProductFormInputType, productSchema } from "../types"
import { LocaleEnum, LocaleEnumLabel } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { getLocaleKey, makeApiCall, validateImageCount } from "@/lib/utils"
import { ContentCreateEditLayout, CustomImageInput, FormErrorMessage } from "@/components/common"

export default function CreateProduct() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [cancelled, setCancelled] = useState(false)
    const form = useForm<ProductFormInputType>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            img_urls: [],
            name: { en: "", ar: "" },
            intro: { en: "", ar: "" },
            description: { en: "", ar: "" },
            tags: [],
            installation_steps: { en: [], ar: [] },
            key_features: { en: [], ar: [] },
            materials_and_dimensions: { en: { items: [] }, ar: { items: [] } },
            slug: null
        },
    })

    /* ----------------------------------- Form Submission ----------------------------------------- */
    const handleSubmit = form.handleSubmit(async (values) => {
        const ok = validateImageCount(form, imageFiles.length, 1, 20);
        if (!ok) return;

        setLoading(true)
        setCancelled(false)
        let imgUrls = values.img_urls
        if (imageFiles.length > 0) {
            imgUrls = await makeApiCall(() => new ProductService().uploadImages(imageFiles), {
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
        await makeApiCall(() => new ProductService().createProduct({ ...values, img_urls: imgUrls }), {
            afterSuccess: () => {
                toast({ title: "Product created", description: "Product added successfully!", variant: "success" })
                router.push("/admin/content/products")
            },
            afterError: (err: any) => {
                if (!cancelled) toast({ title: "Error", description: err.message || "Error creating product", variant: "destructive" })
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
    const [activeLocales, setActiveLocales] = useState<LocaleEnum[]>([LocaleEnum.en]);

    const handleAddLocale = (locale: LocaleEnum) => {
        if (!activeLocales.includes(locale)) {
            setActiveLocales([...activeLocales, locale]);
        }
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
                title="Add Product"
                activeLocales={activeLocales}
                handleAddLocale={handleAddLocale}
            >
                {/* Content */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Multilingual Fields */}
                    {activeLocales.map((locale) => {
                        const localeKey = getLocaleKey(locale);
                        const features = form.watch(`key_features.${locale}`) || [];
                        const installationSteps = form.watch(`installation_steps.${locale}`) || [];
                        const materialsAndDimensions = form.watch(`materials_and_dimensions.${locale}`) || [];
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

                    {/* Non multi language fields */}
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
                        <CustomImageInput
                            min={1}
                            max={20}
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