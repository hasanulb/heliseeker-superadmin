"use client"

import React, { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, Plus, Upload } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { clientLogoSchema, ClientLogoFormInputType, ClienteleGroupType } from "../../types"
import { CustomImageInput } from "@/components/common/form/custom-image-input.component"
import { useClienteleGroups, useCreateClientLogo } from "@/hooks/use-clientele"

export default function CreateClientLogo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [files, setFiles] = useState<File[]>([])

  const preselectedGroupId = searchParams.get('groupId')

  // React Query hooks
  const { data: groups = [], isLoading: groupsLoading } = useClienteleGroups(false)
  const createLogoMutation = useCreateClientLogo()

  const form = useForm<ClientLogoFormInputType>({
    resolver: zodResolver(clientLogoSchema),
    defaultValues: {
      name: "",
      img_url: "",
      group_id: preselectedGroupId || "",
    },
  })

  const canSubmit = Boolean(form.watch('group_id')) && files.length > 0 && !createLogoMutation.isPending

  const onSubmit = (data: ClientLogoFormInputType) => {
    if (files.length === 0) {
      form.setError("img_url", { message: "Please select a logo image." })
      return
    }

    createLogoMutation.mutate(
      { ...data, files },
      {
        onSuccess: () => {
          router.push("/admin/content/clientele")
        }
      }
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
          <h1 className="text-3xl font-bold tracking-tight">Add Client Logo</h1>
          <p className="text-muted-foreground">
            Add a new client logo to a group
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
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groups.map((group: ClienteleGroupType) => (
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

              <FormField
                control={form.control}
                name="img_url"
                render={() => (
                  <FormItem>
                    <FormLabel>Logo Image *</FormLabel>
                    <CustomImageInput
                      min={1}
                      max={1}
                      onChange={setFiles}
                      form={form}
                      name="img_url"
                    />
                    <FormMessage />
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Size recommendations:</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Optimal dimensions: 200x100px to 400x200px</li>
                        <li>Maintain aspect ratio for best display</li>
                        <li>Use transparent PNG for logos without backgrounds</li>
                        <li>Max file size: 2MB</li>
                      </ul>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={createLogoMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmit} aria-disabled={!canSubmit}>
                  {createLogoMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Add Logo"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}