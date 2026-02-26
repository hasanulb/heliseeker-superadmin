"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Eye } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LeadSourceEnum, LeadType } from "./types"
import { ContentNotFound, ContentLoading, ContentTableHeader } from "@/components/common"
import { useLeads } from "@/hooks/use-leads"

const PAGE_SIZE = 10

// Dropdown menu for each row
function LeadRowDropdownMenu({ lead, router }: {
  lead: LeadType;
  router: ReturnType<typeof useRouter>;
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
        <DropdownMenuItem onClick={() => router.push(`/admin/leads/detail/${lead.lead_id}`)} className="cursor-pointer">
          <Eye className="w-4 h-4 mr-2" />
          View
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function LeadManagement() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ field: string, dir: "asc" | "desc" }>({ field: "created_at", dir: "desc" })
  const { data, isLoading, error, isFetching } = useLeads({
    search,
    source: status,
    page,
    pageSize: PAGE_SIZE,
    sort,
  })
  const leads: LeadType[] = data?.data || []
  const total: number = data?.count || 0

  /* ----------------------------------- Render ----------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <ContentTableHeader
        title="Lead Management"
        description="Create, edit, and manage your leads"
        searchLabel="Search leads..."
        search={search}
        setSearch={setSearch}
        page={page}
        setPage={setPage}
        customButtons={
          <>
            <Select value={status} onValueChange={v => { setStatus(v === "all" ? "" : v); setPage(1) }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer">All Sources</SelectItem>
                <SelectItem value={LeadSourceEnum.COST_ESTIMATION} className="cursor-pointer">Cost Estimation</SelectItem>
                <SelectItem value={LeadSourceEnum.CONTACT_US} className="cursor-pointer">Contact Us</SelectItem>
                <SelectItem value={LeadSourceEnum.FOOTER} className="cursor-pointer">Footer</SelectItem>
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
                <SelectItem value="created_at:desc" className="cursor-pointer">Newest</SelectItem>
                <SelectItem value="created_at:asc" className="cursor-pointer">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </>
        } />

      {/* Blog Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ContentLoading />
          ) : error ? (
            <ContentNotFound message="Error loading leads. Please try again." />
          ) : leads.length === 0 ? (
            <ContentNotFound message="No leads found" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead, index) => (
                  <TableRow
                    key={lead.lead_id}
                    onClick={() => router.push(`/admin/leads/detail/${lead.lead_id}`)}
                    className="cursor-pointer hover:bg-muted transition-colors"
                  >
                    <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{lead.first_name || <span className="text-gray-400"> N/A</span>}</div>
                    </TableCell>
                    <TableCell>{lead.last_name || <span className="text-gray-400"> N/A</span>}</TableCell>
                    <TableCell>{lead.email || <span className="text-gray-400"> N/A</span>}</TableCell>
                    <TableCell>{lead.mobile || <span className="text-gray-400"> N/A</span>}</TableCell>
                    <TableCell>
                      {lead.source ? (
                        <Badge
                          variant="outline"
                          className={
                            `whitespace-nowrap ` + (
                              lead.source === LeadSourceEnum.COST_ESTIMATION
                                ? "border-green-500 text-green-500"
                                : lead.source === LeadSourceEnum.CONTACT_US
                                  ? "border-purple-one text-purple-one"
                                  : lead.source === LeadSourceEnum.FOOTER
                                    ? "border-yellow-500 text-yellow-500"
                                    : ""
                            )
                          }
                        >
                          {lead.source.charAt(0).toUpperCase() + lead.source.slice(1)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400"> N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{lead.created_at ? lead.created_at.split("T")[0] : <span className="text-gray-400"> N/A</span>}</TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LeadRowDropdownMenu
                        lead={lead}
                        router={router}
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
    </div>
  )
}
