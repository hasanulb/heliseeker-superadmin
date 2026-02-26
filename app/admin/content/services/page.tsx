"use client"

import React, { useState, useEffect, useTransition } from "react"
import { MoreHorizontal, Edit, Trash2, Eye, ArrowUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { makeApiCall, getImageUrl, formatStringToMMMMddyy } from "@/lib/utils"
import { ServiceService } from "@/services/api/service.service"
import { ServiceType } from "./types"
import { useToast } from "@/hooks/use-toast"
import { ContentTableHeader, ContentLoading, ContentNotFound } from "@/components/common"
import { AlertBoxComponent } from "@/components/custom-ui"
import { LocaleEnum, LocalizedStringType } from "@/lib/types"

const PAGE_SIZE = 10

// Dropdown menu for each row
function ServiceRowDropdownMenu({ service, router, setSelectedServiceId, setDeleteDialogOpen, fetchServices, total }: {
  service: ServiceType;
  router: ReturnType<typeof useRouter>;
  setSelectedServiceId: (id: string) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  fetchServices: () => void;
  total: number;
}) {
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast()


  return (
    <DropdownMenu onOpenChange={open => {
      if (open && moreBtnRef.current) {
        moreBtnRef.current.focus();
      } else if (!open && moreBtnRef.current) {
        // Blur the trigger to prevent sticky ring on close (mobile & desktop)
        moreBtnRef.current.blur();
      }
    }}>
      <DropdownMenuTrigger asChild>
        <Button ref={moreBtnRef} variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/admin/content/services/detail/${service.service_id}`)} className="cursor-pointer">
          <Eye className="w-4 h-4 mr-2" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/admin/content/services/edit/${service.service_id}`)} className="cursor-pointer">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600 cursor-pointer"
          onClick={() => {
            setSelectedServiceId(service.service_id)
            setDeleteDialogOpen(true)
          }}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            const newPos = prompt("Enter new position (1 - " + total + "):");
            if (newPos) {
              const parsed = parseInt(newPos, 10);
              if (!isNaN(parsed) && parsed > 0) {
                makeApiCall(
                  () => new ServiceService().moveService(service.service_id, parsed),
                  {
                    afterSuccess: () => {
                      toast({ title: "Reordered", description: "Service moved", variant: "success" });
                      fetchServices();
                    },
                    afterError: (err: any) => {
                      toast({ title: "Error", description: err.message || "Failed to reorder", variant: "destructive" });
                    }
                  }
                );
              }
            }
          }}
          className="cursor-pointer"
        >
          <ArrowUpDown className="w-4 h-4 mr-2" />
          Reorder
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ServiceManagement() {
  const router = useRouter()
  const { toast } = useToast()
  const [services, setServices] = useState<ServiceType[]>([])
  const [loading, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState<{ field: string, dir: "asc" | "desc" }>({ field: "sort_index", dir: "asc" })
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)

  /* ----------------------------------- Fetch Services ----------------------------------------- */
  useEffect(() => {
    fetchServices()
    // eslint-disable-next-line
  }, [search, page, sort,])

  const fetchServices = () => {
    startTransition(async () => {
      await makeApiCall(() => new ServiceService().getServices({ search, page, pageSize: PAGE_SIZE, sort }), {
        afterSuccess: (data: any) => {
          setServices(data.data || [])
          setTotal(data.count || 0)
          setIsInitialLoad(false)
        }, afterError: (err: any) => {
          toast({ title: "Error", description: err.message || "Error fetching services", variant: "destructive" })
          setIsInitialLoad(false)
        }
      })
    })
  }

  /* ----------------------------------- Delete ----------------------------------------- */
  const handleDeleteConfirmed = () => {
    if (!selectedServiceId) return
    startTransition(async () => {
      await makeApiCall(() => new ServiceService().deleteService(selectedServiceId), {
        afterSuccess: () => {
          toast({ title: "Deleted", description: "Service deleted", variant: "success" })
          fetchServices()
        },
        afterError: (err: any) => {
          toast({ title: "Error", description: err.message || "Error deleting service", variant: "destructive" })
        },
        afterFinally: () => {
          setDeleteDialogOpen(false)
          setSelectedServiceId(null)
        }
      })
    })
  }

  /* ----------------------------------- Render ----------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <ContentTableHeader
        title="Service Management"
        description="Create, edit, and manage your services"
        searchLabel="Search by NAME..."
        CreateButtonLabel="New Service"
        createPath="/admin/content/services/create"
        search={search} setSearch={setSearch}
        sortLabel="Index"
        sort={sort} setSort={setSort}
        page={page} setPage={setPage} />

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Services</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || isInitialLoad ? (
            <ContentLoading />
          ) : services.length === 0 ? (
            <ContentNotFound message="No services found" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Intro</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Updated At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service, index) => (
                    <TableRow
                      key={service.service_id}
                      onClick={() => router.push(`/admin/content/services/detail/${service.service_id}`)}
                      className="cursor-pointer hover:bg-muted transition-colors"
                    >
                      {/* <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell> */}
                      <TableCell>{service.sort_index}</TableCell>
                      <TableCell>
                        {(service.title as LocalizedStringType)?.[LocaleEnum.en]}
                        {(service.sort_index === 1 || service.sort_index === 2) && (
                          <span className="inline-block rounded-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 px-2 py-0.5 text-xs font-semibold text-white shadow">
                            Shows in Home Page
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium line-clamp-1">
                          {(service.intro as LocalizedStringType)?.[LocaleEnum.en]}
                        </div>
                      </TableCell>
                      <TableCell>
                        {service.img_urls && service.img_urls.length > 0 && (
                          <img
                            src={getImageUrl(service.img_urls[0])}
                            alt={"service img"}
                            className="h-12 w-12 object-cover rounded"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {formatStringToMMMMddyy(service.updated_at)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ServiceRowDropdownMenu
                          service={service}
                          router={router}
                          setSelectedServiceId={setSelectedServiceId}
                          setDeleteDialogOpen={setDeleteDialogOpen}
                          fetchServices={fetchServices}
                          total={total}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <span>Page {page} of {Math.ceil(total / PAGE_SIZE) || 1}</span>
                <span className="text-sm text-muted-foreground">
                  Showing {services.length} of {total}
                </span>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
                  <Button variant="outline" size="sm" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertBoxComponent
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete the service from the system."
        confirmText="Yes, delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirmed}
        loading={loading}
      />
    </div>
  )
}
