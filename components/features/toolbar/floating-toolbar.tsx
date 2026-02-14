"use client"

import { useState } from "react"
import { Plus, X, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { EditToolbar } from "./edit-toolbar"
import { getZIndexClass } from "@/lib/utils/z-index"
import { toast } from "sonner"
import type { User } from "@/hooks/use-user"

interface FloatingToolbarProps {
  onToggleEdit: (enabled: boolean) => void
  editEnabled: boolean
  onAddLink: (url: string) => void
  onAddText: () => void
  onAddImage?: (imageUrl: string) => Promise<string>
  onUpdateImageUrl?: (cardId: string, serverUrl: string) => void
  onAddGithubRepo?: (owner: string, repo: string) => void
  onAddPeople?: (person: User) => void
  onAddSectionTitle?: () => void
  username: string
  onShareClick?: () => void
}

export function FloatingToolbar({
  onToggleEdit,
  editEnabled,
  onAddLink,
  onAddText,
  onAddImage,
  onUpdateImageUrl,
  onAddGithubRepo,
  onAddPeople,
  onAddSectionTitle,
  username,
  onShareClick
}: FloatingToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const handleStartEdit = () => {
    onToggleEdit(true)
    setIsExpanded(false)
  }

  const handleFinishEdit = () => {
    setIsExpanded(false)
    onToggleEdit(false)
  }

  const handleShare = () => {
    // Use current page URL (origin + pathname), stripping query params like ?mode=edit
    const shareUrl = window.location.origin + window.location.pathname
    // Copy profile URL to clipboard
    navigator.clipboard.writeText(shareUrl)
    // Show toast notification
    toast("URL copied to clipboard", {
      position: "top-center",
      className: "mt-8",
    })
    // Call the original onShareClick if provided
    if (onShareClick) {
      onShareClick()
    }
    setIsExpanded(false)
  }

  return (
    <div className={`fixed right-4 bottom-24 ${getZIndexClass('FLOATING_TOOLBAR')}`}>
      {/* 展开的工具栏 */}
      {isExpanded && (
        <div className={`absolute bottom-16 mb-2 ${getZIndexClass('FLOATING_TOOLBAR_CONTENT')} right-0`}>
          <div className="bg-white rounded-2xl border border-black/20 shadow-lg p-3 w-[180px] min-w-[180px] max-w-[calc(100vw-32px)] sm:transform-none transform -translate-x-[calc(100%-56px)]">
            {editEnabled ? (
              // 编辑模式下显示完整的编辑工具栏
              <EditToolbar
                editEnabled={editEnabled}
                onToggleEdit={handleFinishEdit}
                onAddLink={onAddLink}
                onAddText={onAddText}
                onAddImage={onAddImage}
                onUpdateImageUrl={onUpdateImageUrl}
                onAddGithubRepo={onAddGithubRepo}
                onAddPeople={onAddPeople}
                onAddSectionTitle={onAddSectionTitle}
                isVertical={true}
              />
            ) : (
              // 非编辑模式下显示简单菜单
              <div className="flex flex-col gap-3">
                {/* Share 按钮 */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-[#0f172a] rounded-lg hover:bg-[#020617] transition-colors"
                >
                                    <Share2 size={18} />
                  Share my site
                </button>
                
                {/* 分隔线 */}
                <div className="w-full h-px bg-[#e4e4e7]" aria-hidden="true" />
                
                {/* 编辑按钮 */}
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#0f172a] hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  {/* <Plus size={18} /> */}
                  Start Editing
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* FAB 按钮 */}
      <button
        onClick={handleToggle}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all duration-200",
          isExpanded 
            ? "bg-gray-500 hover:bg-gray-600 rotate-45" 
            : "bg-[#0f172a] hover:bg-[#020617]"
        )}
      >
        {isExpanded ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  )
} 