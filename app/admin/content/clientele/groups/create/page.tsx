"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { clienteleGroupSchema, ClienteleGroupFormInputType } from "../../types"
import { useCreateClienteleGroup } from "@/hooks/use-clientele"

export default function CreateClienteleGroup() {
  const router = useRouter()
  const createGroupMutation = useCreateClienteleGroup()

  const form = useForm<ClienteleGroupFormInputType>({
    resolver: zodResolver(clienteleGroupSchema),
    defaultValues: {
      group_name: "",
    },
  })

  const onSubmit = (data: ClienteleGroupFormInputType) => {
    createGroupMutation.mutate(data, {
      onSuccess: () => {
        router.push("/admin/content/clientele")
      }
    })
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
          <h1 className="text-3xl font-bold tracking-tight">Create Client Group</h1>
          <p className="text-muted-foreground">
            Create a new group to organize client logos
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
                  disabled={createGroupMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createGroupMutation.isPending}>
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}