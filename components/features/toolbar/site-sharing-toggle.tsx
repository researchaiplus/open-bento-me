"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { CustomToggle } from "./custom-toggle"
import { EditToolbar } from "./edit-toolbar"
import type { User } from "@/hooks/use-user"
import { ShareModal } from "../profile/share-modal"
import { useUser } from "@/context/user-context"
import { PublishButton } from "@/components/profile/publish-button"
import { LocalStorageAdapter } from "@/lib/adapters"

interface SiteSharingToggleProps {
  onShareClick: () => void
  onEditToggle: (enabled: boolean) => void
  defaultEditEnabled?: boolean
  onAddLink: (url: string) => void
  onAddText: () => void
  onAddImage?: (imageUrl: string) => Promise<string>
  onUpdateImageUrl?: (cardId: string, serverUrl: string) => void
  onAddGithubRepo?: (owner: string, repo: string) => void
  onAddPeople?: (person: User) => void
  onAddSectionTitle?: () => void
  onAddNeed?: () => void
  username: string
  hasNeedBoard?: boolean
  offerings?: string[]
  seeking?: string[]
}

export function SiteSharingToggle({
  onShareClick,
  onEditToggle,
  defaultEditEnabled = false,
  onAddLink,
  onAddText,
  onAddImage,
  onUpdateImageUrl,
  onAddGithubRepo,
  onAddPeople,
  onAddSectionTitle,
  onAddNeed,
  username,
  hasNeedBoard = false,
  offerings = [],
  seeking = [],
}: SiteSharingToggleProps) {
  const [editEnabled, setEditEnabled] = useState(defaultEditEnabled)
  const [showShareModal, setShowShareModal] = useState(false)
  const { user, avatarUrl } = useUser()

  // Sync with prop changes
  useEffect(() => {
    setEditEnabled(defaultEditEnabled)
  }, [defaultEditEnabled])

  const handleToggleChange = (checked: boolean) => {
    setEditEnabled(checked)
    onEditToggle(checked)
  }

  // Memoize shareableUser to ensure consistent reference - must be called before any early returns
  // Use user name from context (localStorage profile) as the display name and username fallback
  const shareableUser = useMemo(() => ({
    name: user?.name || username || "Researcher",
    username: user?.name || username || "researcher",
    bio: user?.bio,
    avatar: avatarUrl || (user?.avatar ? user.avatar : undefined),
    offerings,
    seeking,
  }), [user, username, avatarUrl, offerings, seeking]);

  // Create adapter instance for publishing (must be before early return to satisfy React hooks rules)
  const adapterRef = useRef(new LocalStorageAdapter())

  if (editEnabled) {
    return (
      <div className="mt-4">
        <EditToolbar
          editEnabled={editEnabled}
          onToggleEdit={handleToggleChange}
          onAddLink={onAddLink}
          onAddText={onAddText}
          onAddImage={onAddImage}
          onUpdateImageUrl={onUpdateImageUrl}
          onAddGithubRepo={onAddGithubRepo}
          onAddPeople={onAddPeople}
          onAddSectionTitle={onAddSectionTitle}
          onAddNeed={onAddNeed}
          hasNeedBoard={hasNeedBoard}
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-4 rounded-2xl border border-black/20 bg-white p-3 h-[60px] shadow-[0px_25px_61.5px_0px_rgba(0,0,0,0.10)]">
        <PublishButton adapter={adapterRef.current}>
          <button
            className="whitespace-nowrap rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white transition-colors h-9"
          >
            Publish
          </button>
        </PublishButton>
        <div className="h-6 w-px bg-[#e4e4e7]" aria-hidden="true" />
        <button
          onClick={() => handleToggleChange(true)}
          className="whitespace-nowrap rounded-lg bg-[rgb(22,163,74)] hover:bg-[rgb(20,143,65)] px-4 py-2 text-sm font-medium text-white transition-colors h-9"
        >
          Edit
        </button>
      </div>

      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        user={shareableUser}
      />
    </>
  )
}
