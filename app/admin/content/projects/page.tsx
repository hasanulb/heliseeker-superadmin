"use client"

import { useState, useEffect, useTransition, useRef } from "react"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatStringToMMMMddyy, getImageUrl, makeApiCall } from "@/lib/utils"
import { ProjectService } from "@/services/api"
import { ProjectType } from "./types"
import { useToast } from "@/hooks/use-toast"
import { ContentTableHeader, ContentNotFound, ContentLoading } from "@/components/common"
import { AlertBoxComponent } from "@/components/custom-ui"
import { LocaleEnum, LocalizedStringType } from "@/lib/types"

const PAGE_SIZE = 10

// Dropdown menu for each row
function ProjectRowDropdownMenu({ project, router, setSelectedProjectId, setDeleteDialogOpen }: {
  project: ProjectType;
  router: ReturnType<typeof useRouter>;
  setSelectedProjectId: (id: string) => void;
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
        <DropdownMenuItem onClick={() => router.push(`/admin/content/projects/detail/${project.project_id}`)} className="cursor-pointer">
          <Eye className="w-4 h-4 mr-2" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/admin/content/projects/edit/${project.project_id}`)} className="cursor-pointer">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600 cursor-pointer"
          onClick={() => {
            setSelectedProjectId(project.project_id)
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

export default function ProjectManagement() {
  const router = useRouter()
  const { toast } = useToast()
  const [projects, setProjects] = useState<ProjectType[]>([])
  const [loading, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState<{ field: string, dir: "asc" | "desc" }>({ field: "updated_at", dir: "desc" })
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  /* ----------------------------------- Fetch Projects ----------------------------------------- */
  useEffect(() => {
    fetchProjects()
  }, [search, page, sort])

  const fetchProjects = () => {
    startTransition(async () => {
      await makeApiCall(() => new ProjectService().getProjects({ search, page, pageSize: PAGE_SIZE, sort }), {
        afterSuccess: (data: any) => {
          setProjects(data.data || [])
          setTotal(data.count || 0)
          setIsInitialLoad(false)
        }, afterError: (err: any) => {
          toast({ title: "Error", description: err.message || "Error fetching projects", variant: "destructive" })
          setIsInitialLoad(false)
        }
      })
    })
  }

  /* ----------------------------------- Delete ----------------------------------------- */
  const handleDeleteConfirmed = () => {
    if (!selectedProjectId) return
    startTransition(async () => {
      await makeApiCall(() => new ProjectService().deleteProject(selectedProjectId), {
        afterSuccess: () => {
          toast({ title: "Deleted", description: "Project deleted", variant: "success" })
          fetchProjects()
        },
        afterError: (err: any) => {
          toast({ title: "Error", description: err.message || "Error deleting project", variant: "destructive" })
        },
        afterFinally: () => {
          setDeleteDialogOpen(false)
          setSelectedProjectId(null)
        }
      })
    })
  }

  /* ----------------------------------- Render ----------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <ContentTableHeader
        title="Project Management"
        description="Create, edit, and manage your projects"
        searchLabel="Search by NAME..."
        CreateButtonLabel="New Project"
        createPath="/admin/content/projects/create"
        search={search} setSearch={setSearch}
        sortLabel="Updated"
        sort={sort} setSort={setSort}
        page={page} setPage={setPage} />

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || isInitialLoad ? (
            <ContentLoading />
          ) : projects.length === 0 ? (
            <ContentNotFound message="No projects found" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Updated At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project, index) => (
                    <TableRow
                      key={project.project_id}
                      onClick={() => router.push(`/admin/content/projects/detail/${project.project_id}`)}
                      className="cursor-pointer hover:bg-muted transition-colors"
                    >
                      <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium line-clamp-1">
                          {(project.title as LocalizedStringType)?.[LocaleEnum.en]}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium line-clamp-1">{project.location}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{project.area}</div>
                      </TableCell>
                      <TableCell>
                        {project.img_urls && project.img_urls.length > 0 && (
                          <img
                            src={getImageUrl(project.img_urls[0])}
                            alt="Project"
                            className="h-12 w-12 object-cover rounded"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatStringToMMMMddyy(project.updated_at)}</div>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ProjectRowDropdownMenu
                          project={project}
                          router={router}
                          setSelectedProjectId={setSelectedProjectId}
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
        description="This action cannot be undone. This will permanently delete the project from the system."
        confirmText="Yes, delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirmed}
        loading={loading}
      />
    </div>
  )
}
