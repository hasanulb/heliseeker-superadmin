"use client"

import React, { useState, useEffect, useTransition } from "react"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { makeApiCall, getImageUrl, formatStringToMMMMddyy } from "@/lib/utils"
import { TestimonialService } from "@/services/api/testimonial.service"
import { TestimonialType } from "./types"
import { useToast } from "@/hooks/use-toast"
import { ContentTableHeader, ContentLoading, ContentNotFound } from "@/components/common"
import { AlertBoxComponent } from "@/components/custom-ui"
import { LocaleEnum, LocalizedStringType } from "@/lib/types"

const PAGE_SIZE = 10

// Dropdown menu for each row
function TestimonialRowDropdownMenu({ testimonial, router, setSelectedTestimonialId, setDeleteDialogOpen }: {
  testimonial: TestimonialType;
  router: ReturnType<typeof useRouter>;
  setSelectedTestimonialId: (id: string) => void;
  setDeleteDialogOpen: (open: boolean) => void;
}) {
  const moreBtnRef = useRef<HTMLButtonElement>(null);
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
        <DropdownMenuItem onClick={() => router.push(`/admin/content/testimonials/detail/${testimonial.testimonial_id}`)} className="cursor-pointer">
          <Eye className="w-4 h-4 mr-2" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/admin/content/testimonials/edit/${testimonial.testimonial_id}`)} className="cursor-pointer">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600 cursor-pointer"
          onClick={() => {
            setSelectedTestimonialId(testimonial.testimonial_id)
            setDeleteDialogOpen(true)
          }}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function TestimonialManagement() {
  const router = useRouter()
  const { toast } = useToast()
  const [testimonials, setTestimonials] = useState<TestimonialType[]>([])
  const [loading, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState<{ field: string, dir: "asc" | "desc" }>({ field: "updated_at", dir: "desc" })
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTestimonialId, setSelectedTestimonialId] = useState<string | null>(null)

  /* ----------------------------------- Fetch Services ----------------------------------------- */
  useEffect(() => {
    fetchTestimonials()
    // eslint-disable-next-line
  }, [search, page, sort])

  const fetchTestimonials = () => {
    startTransition(async () => {
      await makeApiCall(() => new TestimonialService().getTestimonials({ search, page, pageSize: PAGE_SIZE, sort }), {
        afterSuccess: (data: any) => {
          setTestimonials(data.data || [])
          setTotal(data.count || 0)
          setIsInitialLoad(false)
        }, afterError: (err: any) => {
          toast({ title: "Error", description: err.message || "Error fetching testimonials", variant: "destructive" })
          setIsInitialLoad(false)
        }
      })
    })
  }

  /* ----------------------------------- Delete ----------------------------------------- */
  const handleDeleteConfirmed = () => {
    if (!selectedTestimonialId) return
    startTransition(async () => {
      await makeApiCall(() => new TestimonialService().deleteTestimonial(selectedTestimonialId), {
        afterSuccess: () => {
          toast({ title: "Deleted", description: "Testimonial deleted", variant: "success" })
          fetchTestimonials()
        },
        afterError: (err: any) => {
          toast({ title: "Error", description: err.message || "Error deleting service", variant: "destructive" })
        },
        afterFinally: () => {
          setDeleteDialogOpen(false)
          setSelectedTestimonialId(null)
        }
      })
    })
  }

  /* ----------------------------------- Render ----------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <ContentTableHeader
        title="Testimonial Management"
        description="Create, edit, and manage your testimonials"
        searchLabel="Search by NAME..."
        CreateButtonLabel="New Testimonial"
        createPath="/admin/content/testimonials/create"
        search={search} setSearch={setSearch}
        sortLabel="Updated"
        sort={sort} setSort={setSort}
        page={page} setPage={setPage} />

      {/* Testimonials Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Testimonials</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || isInitialLoad ? (
            <ContentLoading />
          ) : testimonials.length === 0 ? (
            <ContentNotFound message="No testimonials found" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Updated At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonials.map((testimonial, index) => (
                    <TableRow
                      key={testimonial.testimonial_id}
                      onClick={() => router.push(`/admin/content/testimonials/detail/${testimonial.testimonial_id}`)}
                      className="cursor-pointer hover:bg-muted transition-colors"
                    >
                      <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                      <TableCell>
                        {(testimonial.name as LocalizedStringType)?.[LocaleEnum.en]}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium line-clamp-1">
                          {(testimonial.role as LocalizedStringType)?.[LocaleEnum.en]}
                        </div>
                      </TableCell>
                      <TableCell>
                        {testimonial.img_urls && testimonial.img_urls.length > 0 && (
                          <img
                            src={getImageUrl(testimonial.img_urls[0])}
                            alt={"service img"}
                            className="h-12 w-12 object-cover rounded"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {formatStringToMMMMddyy(testimonial.updated_at)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TestimonialRowDropdownMenu
                          testimonial={testimonial}
                          router={router}
                          setSelectedTestimonialId={setSelectedTestimonialId}
                          setDeleteDialogOpen={setDeleteDialogOpen}
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
                  Showing {testimonials.length} of {total}
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
        description="This action cannot be undone. This will permanently delete the testimonial from the system."
        confirmText="Yes, delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirmed}
        loading={loading}
      />
    </div>
  )
}
