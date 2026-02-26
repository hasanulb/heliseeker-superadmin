"use client"

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { ClientLogoType } from '../types';
import { getImageUrl } from '@/lib/utils';

interface SortableLogoItemProps {
  logo: ClientLogoType;
  onEdit: () => void;
  onDelete: () => void;
  loading?: boolean;
}

export const SortableLogoItem: React.FC<SortableLogoItemProps> = ({
  logo,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: logo.client_logo_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <Card className="w-32 h-32 relative hover:shadow-md transition-shadow">
        <CardContent className="p-2 h-full flex flex-col">
          {/* Logo Image */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded overflow-hidden">
            <img
              src={getImageUrl(logo.img_url)}
              alt={logo.name || "Client logo"}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Logo Name (if provided) */}
          {logo.name && (
            <div className="mt-2 text-xs text-center text-muted-foreground truncate">
              {logo.name}
            </div>
          )}

          {/* Controls - Show on hover */}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-3 h-3" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
                  onClick={onDelete}
                  disabled={loading}
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