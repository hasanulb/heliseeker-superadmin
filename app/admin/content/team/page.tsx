"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

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
import { makeApiCall } from "@/lib/utils"
import { TeamService } from "@/services/api/team.service"
import { TeamType } from "./types"
import { useToast } from "@/hooks/use-toast"
import { ContentLoading, ContentNotFound } from "@/components/common"
import { AlertBoxComponent } from "@/components/custom-ui"
import { SortableTeamCard } from "./components/SortableTeamCard"
import { useTeams, useReorderTeams } from "@/hooks/use-team"

export default function TeamManagement() {
  const router = useRouter()
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [loading, startTransition] = useTransition()

  const { data: teams, isLoading, error } = useTeams()
  const reorderTeamsMutation = useReorderTeams()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTeamReorder = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id && teams) {
      const oldIndex = teams.findIndex((team: TeamType) => team.team_id === active.id);
      const newIndex = teams.findIndex((team: TeamType) => team.team_id === over.id);

      const reorderedTeams: TeamType[] = arrayMove(teams, oldIndex, newIndex);

      const updateItems = reorderedTeams.map((team: TeamType, index: number) => ({
        id: team.team_id,
        order_index: index + 1
      }));

      reorderTeamsMutation.mutate(updateItems)
    }
  }

  const handleDeleteConfirmed = () => {
    if (!selectedTeamId) return
    startTransition(async () => {
      await makeApiCall(() => new TeamService().deleteTeam(selectedTeamId), {
        afterSuccess: () => {
          toast({ title: "Deleted", description: "Team member deleted", variant: "success" })
        },
        afterError: (err: any) => {
          toast({ title: "Error", description: err.message || "Error deleting team member", variant: "destructive" })
        },
        afterFinally: () => {
          setDeleteDialogOpen(false)
          setSelectedTeamId(null)
        }
      })
    })
  }

  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Drag and drop to reorder team members
          </p>
        </div>
        <Button onClick={() => router.push("/admin/content/team/create")}>
          <Plus className="w-4 h-4 mr-2" />
          New Team Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ContentLoading />
          ) : error ? (
            <ContentNotFound message="Error loading team members. Please try again." />
          ) : !teams || teams.length === 0 ? (
            <ContentNotFound message="No team members found. Create your first team member to get started." />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleTeamReorder}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={teams.map((t: TeamType) => t.team_id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {teams.map((team: TeamType) => (
                    <SortableTeamCard
                      key={team.team_id}
                      team={team}
                      onView={() => router.push(`/admin/content/team/detail/${team.team_id}`)}
                      onEdit={() => router.push(`/admin/content/team/edit/${team.team_id}`)}
                      onDelete={() => {
                        setSelectedTeamId(team.team_id)
                        setDeleteDialogOpen(true)
                      }}
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
        description="This action cannot be undone. This will permanently delete the team member from the system."
        confirmText="Yes, delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirmed}
        loading={loading}
      />
    </div>
  )
}
