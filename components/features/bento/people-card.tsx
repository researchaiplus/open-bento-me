"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PeopleCardProps } from "./types"

export function PeopleCardDemo({
  user,
  isEditable = false,
  onDelete,
}: PeopleCardProps) {
  // 如果user为undefined，返回空组件
  if (!user) {
    return null;
  }

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isEditable) {
      return;
    }

    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
  }

  return (
    <div
      className={cn(
        'relative w-full h-full rounded-xl overflow-hidden border bg-card text-card-foreground transition-all',
        'hover:shadow-lg cursor-pointer group'
      )}
      onClick={handleCardClick}
    >
      <div className="relative p-3 h-full flex flex-col">
        {/* Delete Button */}
        {isEditable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* User Info */}
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="w-10 h-10 border-2 border-primary">
            <AvatarFallback className="text-sm">
              {user.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{user.name || 'Unknown'}</div>
            <div className="text-xs text-muted-foreground truncate">@{user.handle}</div>
          </div>
        </div>

        {/* Bio */}
        <div className="text-xs text-muted-foreground line-clamp-3 flex-1">
          {user.bio || 'No bio'}
        </div>
      </div>
    </div>
  );
}
