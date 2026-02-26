"use client"

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { TeamType } from '../types';
import { LocaleEnum, LocalizedStringType } from '@/lib/types';
import { getImageUrl } from '@/lib/utils';

interface SortableTeamCardProps {
  team: TeamType;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const SortableTeamCard: React.FC<SortableTeamCardProps> = ({
  team,
  onView,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: team.team_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const name = (team.name as LocalizedStringType)?.[LocaleEnum.en] || 'Unnamed';
  const position = (team.position as LocalizedStringType)?.[LocaleEnum.en] || '';
  const imageUrl = team.img_urls?.[0] ? getImageUrl(team.img_urls[0]) : null;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="relative hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="cursor-grab active:cursor-grabbing p-1 touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </Button>

            {imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={imageUrl}
                  alt={name}
                  className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{name}</h3>
              <p className="text-sm text-muted-foreground truncate">{position}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView} className="cursor-pointer">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
                  onClick={onDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
