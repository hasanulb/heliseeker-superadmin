"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, MoreHorizontal, Edit, Trash2, GripVertical } from "lucide-react"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertBoxComponent } from "@/components/custom-ui"
import { ContentNotFound, ContentLoading } from "@/components/common"
import { ClienteleGroupWithLogos } from "./types"
import { SortableGroupCard } from "./components/SortableGroupCard"
import { useClienteleGroups, useDeleteClienteleGroup, useReorderClienteleGroups } from "@/hooks/use-clientele"

export default function ClienteleManagement() {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  // React Query hooks
  const { data: groupsData, isLoading, error } = useClienteleGroups(true)
  const groups: ClienteleGroupWithLogos[] = (groupsData ?? []) as ClienteleGroupWithLogos[]
  const deleteGroupMutation = useDeleteClienteleGroup()
  const reorderGroupsMutation = useReorderClienteleGroups()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );


  const handleGroupReorder = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = groups.findIndex((group: ClienteleGroupWithLogos) => group.group_id === active.id);
      const newIndex = groups.findIndex((group: ClienteleGroupWithLogos) => group.group_id === over.id);

      const reorderedGroups: ClienteleGroupWithLogos[] = arrayMove(groups, oldIndex, newIndex);

      // Update order_index for reordered items
      const updateItems = reorderedGroups.map((group: ClienteleGroupWithLogos, index: number) => ({
        id: group.group_id,
        order_index: index + 1
      }));

      // Save the new order to the backend
      reorderGroupsMutation.mutate(updateItems)
    }
  }

  const handleDeleteConfirmed = () => {
    if (!selectedGroupId) return
    deleteGroupMutation.mutate(selectedGroupId, {
      onSettled: () => {
        setDeleteDialogOpen(false)
        setSelectedGroupId(null)
      }
    })
  }

  // This will be handled by the SortableGroupCard component using the reorderLogos hook

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientele Management</h1>
          <p className="text-muted-foreground">
            Effortlessly manage and organize your client logos
          </p>
        </div>
        <Button onClick={() => router.push("/admin/content/clientele/groups/create")}>
          <Plus className="w-4 h-4 mr-2" />
          New Group
        </Button>
      </div>

      {/* Groups */}
      <Card>
        <CardHeader>
          <CardTitle>Client Logos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ContentLoading />
          ) : error ? (
            <ContentNotFound message="Error loading client groups. Please try again." />
          ) : groups.length === 0 ? (
            <ContentNotFound message="No client groups found. Create your first group to get started." />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleGroupReorder}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext items={groups.map((g: ClienteleGroupWithLogos) => g.group_id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {groups.map((group: ClienteleGroupWithLogos) => (
                    <SortableGroupCard
                      key={group.group_id}
                      group={group}
                      onEditGroup={() => router.push(`/admin/content/clientele/groups/edit/${group.group_id}`)}
                      onDeleteGroup={() => {
                        setSelectedGroupId(group.group_id)
                        setDeleteDialogOpen(true)
                      }}
                      onAddLogo={() => router.push(`/admin/content/clientele/logos/create?groupId=${group.group_id}`)}
                      onEditLogo={(logoId) => router.push(`/admin/content/clientele/logos/edit/${logoId}`)}
                      onDeleteLogo={() => { }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <AlertBoxComponent
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Are you absolutely sure?"
        description="This action cannot be undone. This will permanently delete the group and all its logos from the system."
        confirmText="Yes, delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirmed}
        loading={deleteGroupMutation.isPending}
      />
    </div>
  )
}