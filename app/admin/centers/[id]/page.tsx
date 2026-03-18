"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Check, ExternalLink, Loader2, X } from "lucide-react"

import { BackButton } from "@/components/custom-ui"
import { ContentLoading, ContentNotFound } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { formatStringToMMMMddyy } from "@/lib/utils"
import { useTRPC } from "@/trpc/client"

import { useUpdateCenterStatus } from "../_hooks/use-centers"
import type { CenterApprovalStatus } from "../_types"

const formatDate = (value?: string | null) => (value ? formatStringToMMMMddyy(value) : "—")
const renderValue = (value?: string | number | null) => (value === null || value === undefined || value === "" ? "—" : value)

type AttachmentPreviewKind = "pdf" | "image" | "other"

type AttachmentPreview = {
  url: string
  name?: string | null
  kind: AttachmentPreviewKind
}

function getAttachmentPreviewKind(url: string, name?: string | null): AttachmentPreviewKind {
  const getExtension = (value?: string | null) => {
    if (!value) return null
    const cleaned = value.split("?")[0].split("#")[0]
    const parts = cleaned.toLowerCase().split(".")
    if (parts.length < 2) return null
    return parts.pop() ?? null
  }

  const ext = getExtension(name) ?? getExtension(url)
  if (!ext) return "other"
  if (ext === "pdf") return "pdf"
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(ext)) return "image"
  return "other"
}

export default function CenterDetailPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const trpc = useTRPC()
  const { toast } = useToast()
  const [updatingStatus, setUpdatingStatus] = useState<CenterApprovalStatus | null>(null)
  const [preview, setPreview] = useState<AttachmentPreview | null>(null)

  const centerQuery = useQuery({
    ...trpc.centers.byId.queryOptions({ id: id ?? "" }),
    enabled: Boolean(id),
  })

  const updateStatusMutation = useUpdateCenterStatus()
  const center = centerQuery.data?.data
  const onboarding = center?.onboarding
  const languages = onboarding?.operations?.languageSupported ?? []
  const isUpdating = updateStatusMutation.isPending
  const isApproving = isUpdating && updatingStatus === "active"
  const isRejecting = isUpdating && updatingStatus === "rejected"

  const handleUpdateStatus = async (status: CenterApprovalStatus) => {
    if (!center?.id) return

    setUpdatingStatus(status)
    try {
      await updateStatusMutation.mutateAsync({ id: center.id, status })
      await centerQuery.refetch()
      toast({
        title: "Status updated",
        description:
          status === "rejected"
            ? "Rejected successfully. In-app notification and rejection email flow were triggered."
            : status === "active"
              ? "Approved successfully. In-app notification and approval email flow were triggered."
              : `Center status changed to ${status}.`,
        variant: "success",
      })
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : "Failed to update center status"
      toast({
        title: "Status update failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleOpenAttachment = (url?: string | null, name?: string | null) => {
    if (!url) return
    const kind = getAttachmentPreviewKind(url, name)
    if (kind === "other") {
      window.open(url, "_blank", "noopener,noreferrer")
      return
    }
    setPreview({ url, name, kind })
  }

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

              {center.approvalStatus === "submitted" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Approval Decision</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-end gap-2">
                    <Button type="button" onClick={() => handleUpdateStatus("active")} disabled={isUpdating}>
                      {isApproving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      {isApproving ? "Processing..." : "Approve"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleUpdateStatus("rejected")}
                      disabled={isUpdating}
                    >
                      {isRejecting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      {isRejecting ? "Processing..." : "Reject"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="border-t pt-6" />

              <Card>
                <CardHeader>
                  <CardTitle>Departments</CardTitle>
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
                  <CardTitle>Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {onboarding.services?.length ? (
                    onboarding.services.map((service) => (
                      <div key={service.id} className="space-y-2 rounded-md border p-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{service.serviceName}</p>
                            <p className="text-xs text-muted-foreground">Department: {service.departmentName || "—"}</p>
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

              <Card>
                <CardHeader>
                  <CardTitle>Specialists</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {onboarding.specialists?.length ? (
                    onboarding.specialists.map((specialist) => (
                      <div key={specialist.id} className="space-y-4 rounded-md border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-base font-semibold">{specialist.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {specialist.designation}
                              {specialist.department ? ` • ${specialist.department}` : ""}
                              {specialist.yearsOfExperience !== null && specialist.yearsOfExperience !== undefined
                                ? ` • ${specialist.yearsOfExperience} yrs exp`
                                : ""}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold">Education</p>
                            {specialist.education?.length ? (
                              <div className="space-y-2">
                                {specialist.education.map((education, educationIndex) => (
                                  <div key={educationIndex} className="rounded-md bg-muted/30 p-3">
                                    <p className="font-medium">
                                      {education.degree} • {education.university}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {education.fromDate ? formatDate(education.fromDate) : "—"}
                                      {education.toDate ? ` - ${formatDate(education.toDate)}` : ""}
                                    </p>
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs text-muted-foreground">Certificates (Attachments)</p>
                                      {education.certificates?.length ? (
                                        <ul className="list-disc pl-5">
                                          {education.certificates.map((certificate, certificateIndex) => (
                                            <li key={certificateIndex} className="break-words">
                                              <button
                                                type="button"
                                                onClick={() => handleOpenAttachment(certificate.dataUrl, certificate.name)}
                                                className="text-blue-600 hover:underline text-left"
                                              >
                                                {certificate.name || "Attachment"}
                                              </button>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-xs text-muted-foreground">—</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No education provided.</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-semibold">Experience</p>
                            {specialist.experience?.length ? (
                              <div className="space-y-2">
                                {specialist.experience.map((experience, experienceIndex) => (
                                  <div key={experienceIndex} className="rounded-md bg-muted/30 p-3">
                                    <p className="font-medium">
                                      {experience.title} • {experience.organization}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {experience.fromDate ? formatDate(experience.fromDate) : "—"}
                                      {experience.toDate ? ` - ${formatDate(experience.toDate)}` : ""}
                                    </p>
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs text-muted-foreground">Certificates (Attachments)</p>
                                      {experience.certificates?.length ? (
                                        <ul className="list-disc pl-5">
                                          {experience.certificates.map((certificate, certificateIndex) => (
                                            <li key={certificateIndex} className="break-words">
                                              <button
                                                type="button"
                                                onClick={() => handleOpenAttachment(certificate.dataUrl, certificate.name)}
                                                className="text-blue-600 hover:underline text-left"
                                              >
                                                {certificate.name || "Attachment"}
                                              </button>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="text-xs text-muted-foreground">—</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No experience provided.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No specialists provided.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      <Dialog open={Boolean(preview)} onOpenChange={(open) => (!open ? setPreview(null) : undefined)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0">
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <DialogTitle className="truncate">{preview?.name || "Attachment Preview"}</DialogTitle>
                {preview?.url ? (
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                  >
                    Open in new tab <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              {preview?.kind === "image" ? (
                <div className="flex h-full w-full items-center justify-center bg-muted/20 p-4">
                  <img
                    src={preview.url}
                    alt={preview.name || "Attachment"}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")}
                    className="max-h-full max-w-full cursor-zoom-in rounded-md border object-contain"
                  />
                </div>
              ) : preview?.kind === "pdf" ? (
                <iframe title={preview?.name || "PDF Preview"} src={preview.url} className="h-full w-full" />
              ) : (
                <div className="p-4 text-sm text-muted-foreground">Preview not available. Use “Open in new tab”.</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
