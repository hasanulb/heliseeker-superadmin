"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ContentLoading } from "@/components/common"
import { getImageUrl } from "@/lib/utils"
import { clientLogoSchema, ClientLogoFormInputType, ClientLogoType, ClienteleGroupType, ClienteleGroupWithLogos } from "../../../types"
import { CustomImageInput } from "@/components/common/form/custom-image-input.component"
import { useClientLogo, useClienteleGroup, useClienteleGroups, useUpdateClientLogo } from "@/hooks/use-clientele"

interface EditClientLogoProps {
  params: { id: string }
}

export default function EditClientLogo({ params }: EditClientLogoProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [files, setFiles] = useState<File[]>([])

  const { data: logo, isLoading: logoLoading, error: logoError } = useClientLogo(params.id)
  const { data: groups = [], isLoading: groupsLoading } = useClienteleGroups(true)
  const { data: selectedGroup, isLoading: selectedGroupLoading } = useClienteleGroup(logo?.group_id || '')
  const updateLogoMutation = useUpdateClientLogo(params.id)

  const form = useForm<ClientLogoFormInputType>({
    resolver: zodResolver(clientLogoSchema),
    defaultValues: {
      name: logo?.name || "",
      img_url: logo?.img_url || "",
      group_id: logo?.group_id || "",
    },
  })

  useEffect(() => {
    if (logo && !groupsLoading) {
      form.reset({
        name: logo.name || "",
        img_url: logo.img_url,
        group_id: logo.group_id,
      }, { keepErrors: false })
      form.clearErrors('group_id')
    }
  }, [logo, groupsLoading])

  const onSubmit = async (data: ClientLogoFormInputType) => {
    updateLogoMutation.mutate(
      { ...data, files },
      {
        onSuccess: () => {
          router.push("/admin/content/clientele")
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err?.message || "Error updating logo", variant: "destructive" })
        }
      }
    )
  }

  if (logoLoading || groupsLoading || selectedGroupLoading) {
    return <ContentLoading />
  }

  if (!logo || logoError) {
    return (
      <div className="space-y-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Logo not found</h1>
          <p className="text-muted-foreground">The requested logo could not be found.</p>
          <Button onClick={() => router.push("/admin/content/clientele")} className="mt-4">
            Back to Clientele
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Client Logo</h1>
          <p className="text-muted-foreground">
            Update logo details
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Logo Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="group_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={groupsLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedGroup?.group_name || "Select a group"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(groups as ClienteleGroupWithLogos[]).map((group) => (
                          <SelectItem key={group.group_id} value={group.group_id}>
                            {group.group_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., ABC Construction Company"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      This name won't be shown on the website, it's just for your reference.
                    </p>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Logo Image *
                </label>

                {/* Current Image */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Image:</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={getImageUrl(logo.img_url)}
                      alt={logo.name || "Client logo"}
                      className="w-24 h-12 object-contain border rounded"
                    />
                    <div className="text-sm text-muted-foreground">
                      {logo.name || "Current logo"}
                    </div>
                  </div>
                </div>

                {/* New Image Upload */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Upload New Image (Optional):</p>
                  <CustomImageInput
                    min={0}
                    max={1}
                    onChange={setFiles}
                    form={form}
                    name="img_url"
                  />
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Size recommendations:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Optimal dimensions: 200x100px to 400x200px</li>
                    <li>Maintain aspect ratio for best display</li>
                    <li>Use transparent PNG for logos without backgrounds</li>
                    <li>Max file size: 2MB</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={updateLogoMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateLogoMutation.isPending}>
                  {updateLogoMutation.isPending ? "Updating..." : "Update Logo"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}