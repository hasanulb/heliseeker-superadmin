"use client"

import React, { useState, useEffect, useTransition, useRef } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProductService } from "@/services/api"
import { ProductType } from "./types";
import { formatStringToMMMMddyy, getImageUrl, makeApiCall } from "@/lib/utils";
import { LocaleEnum, LocalizedStringType } from "@/lib/types/common";
import { useToast } from "@/hooks/use-toast"
import { AlertBoxComponent } from "@/components/custom-ui"
import { ContentNotFound, ContentLoading, ContentTableHeader } from "@/components/common"

const PAGE_SIZE = 10

// Dropdown menu for each row
function ProductRowDropdownMenu({ product, router, setSelectedProductId, setDeleteDialogOpen }: {
  product: ProductType;
  router: ReturnType<typeof useRouter>;
  setSelectedProductId: (id: string) => void;
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
        <DropdownMenuItem onClick={() => router.push(`/admin/content/products/detail/${product.product_id}`)} className="cursor-pointer">
          <Eye className="w-4 h-4 mr-2" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/admin/content/products/edit/${product.product_id}`)} className="cursor-pointer">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600 cursor-pointer"
          onClick={() => {
            setSelectedProductId(product.product_id)
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


export default function ProductManagement() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<ProductType[]>([])
  const [loading, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState<{ field: string, dir: "asc" | "desc" }>({ field: "updated_at", dir: "desc" })
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  /* ----------------------------------- Fetch Products ----------------------------------------- */
  useEffect(() => {
    fetchProducts()
  }, [search, page, sort])

  const fetchProducts = () => {
    startTransition(async () => {
      await makeApiCall(() => new ProductService().getProducts({ search, page, pageSize: PAGE_SIZE, sort }),
        {
          afterSuccess: (data: any) => {
            setProducts(data.data || [])
            setTotal(data.count || 0)
            setIsInitialLoad(false)
          }, afterError: (err: any) => {
            toast({ title: "Error", description: err.message || "Error fetching products", variant: "destructive" })
            setIsInitialLoad(false)
          }
        })
    })
  }

  /* ----------------------------------- Delete ----------------------------------------- */
  const handleDeleteConfirmed = () => {
    if (!selectedProductId) return
    startTransition(async () => {
      await makeApiCall(() => new ProductService().deleteProduct(selectedProductId), {
        afterSuccess: () => {
          toast({ title: "Deleted", description: "Product deleted", variant: "success" })
          fetchProducts()
        },
        afterError: (err: any) => {
          toast({ title: "Error", description: err.message || "Error deleting product", variant: "destructive" })
        },
        afterFinally: () => {
          setDeleteDialogOpen(false)
          setSelectedProductId(null)
        }
      })
    })
  }

  /* ----------------------------------- Render ----------------------------------------- */
  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <ContentTableHeader
        title="Product Management"
        description="Create, edit, and manage your products"
        searchLabel="Search by NAME..."
        CreateButtonLabel="New Product"
        createPath="/admin/content/products/create"
        search={search} setSearch={setSearch}
        sortLabel="Updated"
        sort={sort} setSort={setSort}
        page={page} setPage={setPage} />

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || isInitialLoad ? (
            <ContentLoading />
          ) : products.length === 0 ? (
            <ContentNotFound message="No products found" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Intro</TableHead>
                    {/* <TableHead>Price AED</TableHead> */}
                    <TableHead>Image</TableHead>
                    <TableHead>Updated At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow
                      key={product.product_id}
                      onClick={() => router.push(`/admin/content/products/detail/${product.product_id}`)}
                      className="cursor-pointer hover:bg-muted transition-colors"
                    >
                      <TableCell>{(page - 1) * PAGE_SIZE + index + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium line-clamp-1">
                          {(product.name as LocalizedStringType)?.[LocaleEnum.en]}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {((product.intro as LocalizedStringType)?.[LocaleEnum.en]?.length ?? 0) > 60
                            ? (product.intro as LocalizedStringType)[LocaleEnum.en].slice(0, 60) + "..."
                            : (product.intro as LocalizedStringType)?.[LocaleEnum.en]}
                        </div>
                      </TableCell>
                      {/* <TableCell>
                        <div className="font-medium">{product.price}</div>
                      </TableCell> */}
                      <TableCell>
                        {product.img_urls && product.img_urls.length > 0 && (
                          <img
                            src={getImageUrl(product.img_urls[0])}
                            alt="Product"
                            className="h-12 w-12 object-cover rounded"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatStringToMMMMddyy(product.updated_at)}</div>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ProductRowDropdownMenu
                          product={product}
                          router={router}
                          setSelectedProductId={setSelectedProductId}
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
        description="This action cannot be undone. This will permanently delete the product from the system."
        confirmText="Yes, delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirmed}
        loading={loading}
      />
    </div>
  )
}
