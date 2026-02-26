"use client"

import React, { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ContentLoading } from "@/components/common"
import { clienteleGroupSchema, ClienteleGroupFormInputType, ClienteleGroupType } from "../../../types"
import { useClienteleGroup, useUpdateClienteleGroup } from "@/hooks/use-clientele"

interface EditClienteleGroupProps {
  params: { id: string }
}

export default function EditClienteleGroup({ params }: EditClienteleGroupProps) {
  const router = useRouter()

  // React Query hooks
  const { data: group, isLoading, error } = useClienteleGroup(params.id)
  const updateGroupMutation = useUpdateClienteleGroup(params.id)

  const form = useForm<ClienteleGroupFormInputType>({
    resolver: zodResolver(clienteleGroupSchema),
    defaultValues: {
      group_name: "",
    },
  })

  // Update form when group data loads
  useEffect(() => {
    if (group) {
      form.reset({
        group_name: group.group_name,
      })
    }
  }, [group, form])

  const onSubmit = (data: ClienteleGroupFormInputType) => {
    updateGroupMutation.mutate(data, {
      onSuccess: () => {
        router.push("/admin/content/clientele")
      }
    })
  }

  if (isLoading) {
    return <ContentLoading />
  }

  if (error || !group) {
    return (
      <div className="space-y-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Group not found</h1>
          <p className="text-muted-foreground">The requested group could not be found.</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Client Group</h1>
          <p className="text-muted-foreground">
            Update group details
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Group Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="group_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Construction Partners, Technology Clients..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={updateGroupMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateGroupMutation.isPending}>
                  {updateGroupMutation.isPending ? "Updating..." : "Update Group"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}