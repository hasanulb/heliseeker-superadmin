"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BlogService } from "@/services/api"
import { makeApiCall } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { BlogStatusEnum, BlogType } from "./types"
import { AlertBoxComponent } from "@/components/custom-ui"
import { ContentNotFound, ContentLoading, ContentTableHeader } from "@/components/common"

const PAGE_SIZE = 10

// Dropdown menu for each row
function BlogRowDropdownMenu({ blog, router, setSelectedBlogId, setDeleteDialogOpen }: {
  blog: BlogType;
  router: ReturnType<typeof useRouter>;
  setSelectedBlogId: (id: string) => void;
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
        <DropdownMenuItem onClick={() => router.push(`/admin/content/blogs/detail/${blog.blog_id}`)} className="cursor-pointer">
          <Eye className="w-4 h-4 mr-2" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/admin/content/blogs/edit/${blog.blog_id}`)} className="cursor-pointer">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600 cursor-pointer"
          onClick={() => {
            setSelectedBlogId(blog.blog_id)
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

export default function BlogManagement() {
  const { toast } = useToast()
  const router = useRouter()
  const [posts, setPosts] = useState<BlogType[]>([])
  const [loading, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState<{ field: string, dir: "asc" | "desc" }>({ field: "published_at", dir: "desc" })
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null)

  /* ----------------------------------- Fetch Blogs ----------------------------------------- */
  useEffect(() => {
    fetchBlogs()
  }, [search, page, sort, status])

  const fetchBlogs = () => {
    startTransition(async () => {
      await makeApiCall(() => new BlogService().getBlogs({ search, page, pageSize: PAGE_SIZE, sort, status }),
        {
          afterSuccess: (data: any) => {
            setPosts(data.data || [])
            setTotal(data.count || 0)
            setIsInitialLoad(false)
          }, afterError: (err: any) => {
            toast({ title: "Error", description: err.message || "Error fetching blogs", variant: "destructive" })
            setIsInitialLoad(false)
          }
        })
    })
  }

  /* ----------------------------------- Delete ----------------------------------------- */
  const handleDeleteConfirmed = () => {
    if (!selectedBlogId) return
    startTransition(async () => {
      await makeApiCall(() => new BlogService().deleteBlog(selectedBlogId), {
        afterSuccess: () => {
          toast({ title: "Deleted", description: "Blog deleted", variant: "success" })
          fetchBlogs()
        },
        afterError: (err: any) => {
          toast({ title: "Error", description: err.message || "Error deleting blog", variant: "destructive" })
        },
        afterFinally: () => {
          setDeleteDialogOpen(false)
          setSelectedBlogId(null)
        }
      })
    })
  }

  /* ----------------------------------- Render ----------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <ContentTableHeader
        title="Blog Management"
        description="Create, edit, and manage your blog posts"
        searchLabel="Search posts..."
        CreateButtonLabel="New Post"
        createPath="/admin/content/blogs/create"
        search={search}
        setSearch={setSearch}
        page={page}
        setPage={setPage}
        customButtons={
          <>
            <Select value={status} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={BlogStatusEnum.DRAFT}>Draft</SelectItem>
                <SelectItem value={BlogStatusEnum.PUBLISHED}>Published</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort.field + ":" + sort.dir} onValueChange={v => {
              const [field, dir] = v.split(":");
              setSort({ field, dir: dir as "asc" | "desc" })
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published_at:desc">Newest</SelectItem>
                <SelectItem value="published_at:asc">Oldest</SelectItem>
                <SelectItem value="title:asc">Title A-Z</SelectItem>
                <SelectItem value="title:desc">Title Z-A</SelectItem>
              </SelectContent>
            </Select>
          </>
        } />

      {/* Blog Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || isInitialLoad ? (
            <ContentLoading />
          ) : posts.length === 0 ? (
            <ContentNotFound message="No posts found" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post, index) => (
                  <TableRow
                    key={post.blog_id}
                    onClick={() => router.push(`/admin/content/blogs/detail/${post.blog_id}`)}
                    className="cursor-pointer hover:bg-muted transition-colors"
                  >
                    <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{post.title?.en}</div>
                    </TableCell>
                    <TableCell>{post.author}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          post.status === BlogStatusEnum.PUBLISHED
                            ? "border-green-500 text-green-500"
                            : post.status === BlogStatusEnum.DRAFT
                            ? "border-purple-one text-purple-one"
                            : ""
                        }
                      >
                        {post.status
                          ? post.status.charAt(0).toUpperCase() + post.status.slice(1)
                          : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>{post.published_at?.split("T")[0]}</TableCell>
                    <TableCell>{post.tags?.join(", ")}</TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <BlogRowDropdownMenu
                        blog={post}
                        router={router}
                        setSelectedBlogId={setSelectedBlogId}
                        setDeleteDialogOpen={setDeleteDialogOpen}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <span>Page {page} of {Math.ceil(total / PAGE_SIZE) || 1}</span>
            <div className="space-x-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertBoxComponent
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete the blog from the system."
        confirmText="Yes, delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirmed}
        loading={loading}
      />
    </div>
  )
}
