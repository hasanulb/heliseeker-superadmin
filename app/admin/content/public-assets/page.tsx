"use client"

import React, { useState, useRef, useMemo } from "react"
import { Upload, Download, Trash2, Copy, ExternalLink, Folder, Home } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertBoxComponent } from "@/components/custom-ui"
import { ContentNotFound, ContentLoading } from "@/components/common"
import { useToast } from "@/hooks/use-toast"
import {
  usePublicAssets,
  useUploadPublicAssets,
  useDeletePublicAsset,
  useBulkDeletePublicAssets,
  PublicAsset
} from "@/hooks/use-public-assets"

export default function PublicAssetsManagement() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteMode, setDeleteMode] = useState<'single' | 'bulk'>('single')
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentFolder, setCurrentFolder] = useState<string>("") // Empty string = root

  const { data, isLoading, error } = usePublicAssets()
  const uploadMutation = useUploadPublicAssets()
  const deleteMutation = useDeletePublicAsset()
  const bulkDeleteMutation = useBulkDeletePublicAssets()

  console.log(data)

  const assets: PublicAsset[] = data?.blobs || []

  // Build folder hierarchy and filter assets
  const { folders, filteredAssets, breadcrumbs } = useMemo(() => {
    // Get all unique folders
    const allFolders = new Set<string>()
    assets.forEach(asset => {
      const parts = asset.pathname.split('/')
      for (let i = 1; i <= parts.length - 1; i++) {
        allFolders.add(parts.slice(0, i).join('/'))
      }
    })

    // Filter assets by current folder and search
    const assetsInCurrentFolder = assets.filter(asset => {
      const assetFolder = asset.pathname.substring(0, asset.pathname.lastIndexOf('/')) || ""
      return assetFolder === currentFolder
    })

    const searchFiltered = assetsInCurrentFolder.filter(asset =>
      searchQuery === "" ||
      asset.pathname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.url.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Get immediate subfolders of current folder
    const subfolders = Array.from(allFolders)
      .filter(folder => {
        if (currentFolder === "") {
          return !folder.includes('/')
        }
        return folder.startsWith(currentFolder + '/') &&
               folder.split('/').length === currentFolder.split('/').length + 1
      })
      .sort()

    // Build breadcrumbs
    const breadcrumbParts = currentFolder ? currentFolder.split('/') : []
    const breadcrumbs = [{ name: 'Root', path: '' }]
    breadcrumbParts.forEach((part, index) => {
      const path = breadcrumbParts.slice(0, index + 1).join('/')
      breadcrumbs.push({ name: part, path })
    })

    return {
      folders: subfolders,
      filteredAssets: searchFiltered,
      breadcrumbs
    }
  }, [assets, currentFolder, searchQuery])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive",
      })
      return
    }

    try {
      await uploadMutation.mutateAsync(selectedFiles)
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  }

  const handleSingleDelete = (url: string) => {
    setAssetToDelete(url)
    setDeleteMode('single')
    setDeleteDialogOpen(true)
  }

  const handleBulkDelete = () => {
    if (selectedAssets.size === 0) {
      toast({
        title: "No assets selected",
        description: "Please select assets to delete",
        variant: "destructive",
      })
      return
    }
    setDeleteMode('bulk')
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirmed = async () => {
    try {
      if (deleteMode === 'single' && assetToDelete) {
        await deleteMutation.mutateAsync(assetToDelete)
      } else if (deleteMode === 'bulk') {
        await bulkDeleteMutation.mutateAsync(Array.from(selectedAssets))
        setSelectedAssets(new Set())
      }
      setDeleteDialogOpen(false)
      setAssetToDelete(null)
    } catch (error) {
      // Error handling is done in the mutations
    }
  }

  const handleSelectAsset = (url: string) => {
    const newSelected = new Set(selectedAssets)
    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      newSelected.add(url)
    }
    setSelectedAssets(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set())
    } else {
      setSelectedAssets(new Set(filteredAssets.map(asset => asset.url)))
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
        variant: "success",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy URL to clipboard",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileType = (asset: PublicAsset) => {
    // Try contentType first if available
    if (asset.contentType) {
      if (asset.contentType.startsWith('image/')) return 'Image'
      if (asset.contentType.startsWith('video/')) return 'Video'
      if (asset.contentType.startsWith('audio/')) return 'Audio'
      if (asset.contentType.includes('pdf')) return 'PDF'
      if (asset.contentType.includes('text/')) return 'Text'
    }

    // Fall back to file extension from pathname or URL
    const filename = asset.pathname || asset.url
    if (!filename) return 'File'

    const ext = filename.toLowerCase().split('.').pop()
    if (!ext) return 'File'

    // Image extensions
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'Image'

    // Video extensions
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'].includes(ext)) return 'Video'

    // Audio extensions
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(ext)) return 'Audio'

    // Document extensions
    if (ext === 'pdf') return 'PDF'
    if (['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts'].includes(ext)) return 'Text'

    return 'File'
  }

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Public Assets</h1>
          <p className="text-muted-foreground">
            Manage your blob storage files and get shareable links
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file-upload">Select Files</Label>
            <Input
              id="file-upload"
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="cursor-pointer"
            />
          </div>
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({selectedFiles.length}):</Label>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <Badge key={index} variant="outline">
                    {file.name} ({formatFileSize(file.size)})
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploadMutation.isPending}
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploadMutation.isPending ? "Uploading..." : "Upload Files"}
          </Button>
        </CardContent>
      </Card>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 1 && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <span>/</span>}
              <button
                onClick={() => setCurrentFolder(crumb.path)}
                className="hover:text-foreground transition-colors"
              >
                {index === 0 ? (
                  <Home className="w-4 h-4" />
                ) : (
                  crumb.name
                )}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Assets List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>
              {currentFolder ? `${currentFolder}/` : 'Root'} ({filteredAssets.length + folders.length})
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
              />
              {selectedAssets.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedAssets.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ContentLoading />
          ) : error ? (
            <ContentNotFound message="Error loading assets. Please try again." />
          ) : filteredAssets.length === 0 && folders.length === 0 ? (
            <ContentNotFound message="No assets found. Upload your first file to get started." />
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              {filteredAssets.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedAssets.size === filteredAssets.length && filteredAssets.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium">
                    Select all visible assets
                  </Label>
                </div>
              )}

              {/* Folders and Assets Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Folders */}
                {folders.map((folder) => (
                  <Card
                    key={folder}
                    className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setCurrentFolder(folder)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Folder className="w-8 h-8 text-blue-500" />
                          <Badge variant="outline">Folder</Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium truncate" title={folder}>
                            {folder.split('/').pop()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {assets.filter(a => a.pathname.startsWith(folder + '/')).length} items
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Assets */}
                {filteredAssets.map((asset) => (
                  <Card key={asset.url} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header with checkbox and type */}
                        <div className="flex items-center justify-between">
                          <Checkbox
                            checked={selectedAssets.has(asset.url)}
                            onCheckedChange={() => handleSelectAsset(asset.url)}
                          />
                          <Badge variant="secondary">
                            {getFileType(asset)}
                          </Badge>
                        </div>

                        {/* Preview for images */}
                        {getFileType(asset) === 'Image' && (
                          <div className="aspect-video relative overflow-hidden rounded-md bg-muted">
                            <img
                              src={asset.url}
                              alt={asset.pathname}
                              className="object-cover w-full h-full"
                              loading="lazy"
                            />
                          </div>
                        )}

                        {/* File info */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium truncate" title={asset.pathname}>
                            {asset.pathname.split('/').pop()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(asset.size)} • {new Date(asset.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* URL display */}
                        <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                          {asset.url}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(asset.url)}
                            className="flex-1 min-w-0"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="flex-1 min-w-0"
                          >
                            <a href={asset.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Open
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="flex-1 min-w-0"
                          >
                            <a href={asset.downloadUrl} download>
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSingleDelete(asset.url)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertBoxComponent
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Are you absolutely sure?"
        description={
          deleteMode === 'single'
            ? "This action cannot be undone. This will permanently delete the asset from blob storage."
            : `This action cannot be undone. This will permanently delete ${selectedAssets.size} asset${selectedAssets.size > 1 ? 's' : ''} from blob storage.`
        }
        confirmText="Yes, delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirmed}
        loading={deleteMutation.isPending || bulkDeleteMutation.isPending}
      />
    </div>
  )
}