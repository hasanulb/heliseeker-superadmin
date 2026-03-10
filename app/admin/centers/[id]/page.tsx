"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"

import { BackButton } from "@/components/custom-ui"
import { ContentLoading, ContentNotFound } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatStringToMMMMddyy } from "@/lib/utils"
import { useTRPC } from "@/trpc/client"

const formatDate = (value?: string | null) => (value ? formatStringToMMMMddyy(value) : "—")
const renderValue = (value?: string | number | null) => (value === null || value === undefined || value === "" ? "—" : value)

export default function CenterDetailPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const trpc = useTRPC()

  const centerQuery = useQuery({
    ...trpc.centers.byId.queryOptions({ id: id ?? "" }),
    enabled: Boolean(id),
  })

  const center = centerQuery.data?.data
  const onboarding = center?.onboarding
  const languages = onboarding?.operations?.languageSupported ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Center Details</h1>
          <p className="text-sm text-muted-foreground">Full onboarding data for this center.</p>
        </div>
        <BackButton />
      </div>

      {centerQuery.isLoading ? (
        <ContentLoading />
      ) : centerQuery.isError ? (
        <ContentNotFound message={centerQuery.error?.message || "Failed to load center."} />
      ) : !center ? (
        <ContentNotFound message="Center not found." />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {center.centerName}
                <Badge className="capitalize" variant="outline">
                  {center.approvalStatus}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Center Name</p>
                <p className="font-medium">{center.centerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Contact Email</p>
                <p className="font-medium">{center.contactEmail || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Contact Phone</p>
                <p className="font-medium">{center.contactPhone || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Approval Status</p>
                <p className="font-medium capitalize">{center.approvalStatus}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs text-muted-foreground">Approval Note</p>
                <p className="font-medium">{center.approvalNote || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Submitted On</p>
                <p className="font-medium">{formatDate(center.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(center.updatedAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Decision Date</p>
                <p className="font-medium">{formatDate(center.decidedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {!onboarding ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                No onboarding details available for this center yet.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Onboarding: Basic Info</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Center Name</p>
                    <p className="font-medium">{renderValue(onboarding.basicInfo?.centerName)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Short Description</p>
                    <p className="font-medium">{renderValue(onboarding.basicInfo?.shortDescription)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium">{renderValue(onboarding.basicInfo?.location)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Commercial Registration #</p>
                    <p className="font-medium">
                      {renderValue(onboarding.basicInfo?.commercialRegistrationNumber)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Website</p>
                    <p className="font-medium">{renderValue(onboarding.basicInfo?.website)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Official Email</p>
                    <p className="font-medium">{renderValue(onboarding.basicInfo?.officialEmail)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{renderValue(onboarding.basicInfo?.phoneNumber)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium">{renderValue(onboarding.basicInfo?.address)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Onboarding: Operations</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs text-muted-foreground">Languages Supported</p>
                    <p className="font-medium">{languages.length ? languages.join(", ") : "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Therapist Count</p>
                    <p className="font-medium">{renderValue(onboarding.operations?.therapistCount)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Center Contact Number</p>
                    <p className="font-medium">{renderValue(onboarding.operations?.centerContactNumber)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Manager Name</p>
                    <p className="font-medium">{renderValue(onboarding.operations?.managerName)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Manager Email</p>
                    <p className="font-medium">{renderValue(onboarding.operations?.managerEmail)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Manager Phone</p>
                    <p className="font-medium">{renderValue(onboarding.operations?.managerPhone)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Manager Primary</p>
                    <p className="font-medium">
                      {onboarding.operations?.managerPrimary === null || onboarding.operations?.managerPrimary === undefined
                        ? "—"
                        : onboarding.operations?.managerPrimary
                          ? "Yes"
                          : "No"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Marketing Rep Name</p>
                    <p className="font-medium">{renderValue(onboarding.operations?.marketingRepName)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Marketing Rep Email</p>
                    <p className="font-medium">{renderValue(onboarding.operations?.marketingRepEmail)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Marketing Rep Phone</p>
                    <p className="font-medium">{renderValue(onboarding.operations?.marketingRepPhone)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Marketing Rep Primary</p>
                    <p className="font-medium">
                      {onboarding.operations?.marketingRepPrimary === null ||
                      onboarding.operations?.marketingRepPrimary === undefined
                        ? "—"
                        : onboarding.operations?.marketingRepPrimary
                          ? "Yes"
                          : "No"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Onboarding: Customize</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 text-sm md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Primary Accent Color</p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-4 w-4 rounded border" style={{ backgroundColor: onboarding.customize?.primaryAccentColor || "#ffffff" }} />
                      <p className="font-medium">{renderValue(onboarding.customize?.primaryAccentColor)}</p>
                    </div>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-xs text-muted-foreground">Logo</p>
                    {onboarding.customize?.logoUrl ? (
                      <img
                        src={onboarding.customize.logoUrl}
                        alt={`${center.centerName} logo`}
                        className="h-20 w-20 rounded-full border object-cover"
                      />
                    ) : (
                      <p className="font-medium">—</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Onboarding: Departments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {onboarding.departments?.length ? (
                    onboarding.departments.map((department) => (
                      <div key={department.id} className="flex items-start justify-between gap-4 rounded-md border p-3">
                        <div>
                          <p className="font-medium">{department.name}</p>
                          <p className="text-xs text-muted-foreground">{department.description || "—"}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {department.status || "—"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No departments provided.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Onboarding: Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {onboarding.services?.length ? (
                    onboarding.services.map((service) => (
                      <div key={service.id} className="space-y-2 rounded-md border p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{service.serviceName}</p>
                            <p className="text-xs text-muted-foreground">
                              Department: {service.departmentName || "—"}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {service.status || "—"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Description</p>
                          <p className="font-medium">{service.description || "—"}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No services provided.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
