"use client"

import React, { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { ClienteleGroupWithLogos, ClientLogoType } from '../types';
import { SortableLogoItem } from './SortableLogoItem';
import { useBulkCreateClientLogos, useDeleteClientLogo, useReorderClientLogos } from '@/hooks/use-clientele';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable';

import { restrictToHorizontalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface SortableGroupCardProps {
  group: ClienteleGroupWithLogos;
  onEditGroup: () => void;
  onDeleteGroup: () => void;
  onAddLogo: () => void;
  onEditLogo: (logoId: string) => void;
  onDeleteLogo: () => void;
}

export const SortableGroupCard: React.FC<SortableGroupCardProps> = ({
  group,
  onEditGroup,
  onDeleteGroup,
  onAddLogo,
  onEditLogo,
  onDeleteLogo,
}) => {
  const deleteLogoMutation = useDeleteClientLogo()
  const reorderLogosMutation = useReorderClientLogos()
  const bulkCreateMutation = useBulkCreateClientLogos()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.group_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const logoSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleLogoReorder = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = group.client_logos.findIndex((logo) => logo.client_logo_id === active.id);
      const newIndex = group.client_logos.findIndex((logo) => logo.client_logo_id === over.id);

      const reorderedLogos = arrayMove(group.client_logos, oldIndex, newIndex);

      // Update order_index for reordered logos
      const updateItems = reorderedLogos.map((logo, index) => ({
        id: logo.client_logo_id,
        order_index: index + 1
      }));

      reorderLogosMutation.mutate({ groupId: group.group_id, items: updateItems });
    }
  };

  const handleDeleteLogo = (logoId: string) => {
    deleteLogoMutation.mutate(logoId)
  }

  // Multi-upload modal state
  const [uploadOpen, setUploadOpen] = useState(false)
  const [draftEntries, setDraftEntries] = useState<{ id: string; file: File; name: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startUploadWithFiles = (files: File[]) => {
    const unique = files.filter((f, i, arr) => arr.findIndex(ff => ff.name === f.name && ff.size === f.size && ff.type === f.type) === i)
    const now = Date.now()
    const entries = unique.map((f, idx) => ({
      id: `${f.name}-${f.size}-${idx}-${now}`,
      file: f,
      name: f.name.replace(/\.[^.]+$/, ''),
    }))
    setDraftEntries(entries)
    setUploadOpen(true)
  }

  const onDropFiles = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
    if (files.length) startUploadWithFiles(files)
  }

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))
    if (files.length) startUploadWithFiles(files)
    // reset input to allow re-pick same files
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDraftReorder = (event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = draftEntries.findIndex(e => e.id === String(active.id))
    const newIndex = draftEntries.findIndex(e => e.id === String(over.id))
    setDraftEntries(prev => arrayMove(prev, oldIndex, newIndex))
  }

  const submitBulkCreate = () => {
    if (!draftEntries.length) return
    bulkCreateMutation.mutate({ groupId: group.group_id, items: draftEntries.map(e => ({ file: e.file, name: e.name })) }, {
      onSettled: () => {
        setUploadOpen(false)
        setDraftEntries([])
      }
    })
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="relative">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="cursor-grab active:cursor-grabbing p-1"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="w-4 h-4" />
              </Button>
              <CardTitle className="text-lg">{group.group_name}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} className="hidden" type="file" accept="image/*" multiple onChange={onPickFiles} />
              <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Logos
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEditGroup} className="cursor-pointer">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Group
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={onDeleteGroup}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Group
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent onDragOver={(e) => e.preventDefault()} onDrop={onDropFiles}>
          {group.client_logos && group.client_logos.length > 0 ? (
            <DndContext
              sensors={logoSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleLogoReorder}
              modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={group.client_logos.map(logo => logo.client_logo_id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex flex-wrap gap-4">
                  {group.client_logos.map((logo) => (
                    <SortableLogoItem
                      key={logo.client_logo_id}
                      logo={logo}
                      onEdit={() => onEditLogo(logo.client_logo_id)}
                      onDelete={() => handleDeleteLogo(logo.client_logo_id)}
                      loading={deleteLogoMutation.isPending}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No logos in this group yet.</p>
              <p className="text-sm">Click "Add Logos" or drag-and-drop images here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk upload modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add multiple logos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Rename and reorder before uploading.</p>
            <Separator />
            <div className="max-h-[50vh] overflow-y-auto border rounded-md">
              <DndContext sensors={logoSensors} collisionDetection={closestCenter} onDragEnd={handleDraftReorder}>
                <SortableContext items={draftEntries.map(e => e.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                    {draftEntries.map((entry, idx) => (
                      <DraftSortableCard
                        key={entry.id}
                        id={entry.id}
                        index={idx}
                        file={entry.file}
                        name={entry.name}
                        onNameChange={(val) => setDraftEntries(prev => prev.map((e, i) => i === idx ? { ...e, name: val } : e))}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={bulkCreateMutation.isPending}>Cancel</Button>
            <Button onClick={submitBulkCreate} disabled={!draftEntries.length || bulkCreateMutation.isPending}>
              {bulkCreateMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Draggable card for draft upload items
function DraftSortableCard({ id, index, file, name, onNameChange }: { id: string; index: number; file: File; name: string; onNameChange: (v: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  } as React.CSSProperties
  return (
    <div ref={setNodeRef} style={style} className="border rounded p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">#{index + 1}</span>
        <button className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="aspect-square bg-gray-50 rounded flex items-center justify-center overflow-hidden mb-2">
        <img src={URL.createObjectURL(file)} className="object-contain max-w-full max-h-full" alt="preview" />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`name-${id}`}>Name</Label>
        <Input id={`name-${id}`} value={name} onChange={(e) => onNameChange(e.target.value)} />
      </div>
    </div>
  )
}