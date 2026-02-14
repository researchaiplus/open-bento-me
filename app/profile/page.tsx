"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Zap } from "lucide-react"
import { Profile } from "@/components/features/profile/profile"
import { BentoGrid } from "@/components/features/bento/BentoGrid"
import { useBentoGrid } from "@/hooks/useBentoGrid"
import { useIsMobile } from "@/hooks/use-mobile"
import { SiteSharingToggle } from "@/components/features/toolbar/site-sharing-toggle"
import { Portal } from "@/components/ui/portal"
import { getZIndexClass } from "@/lib/utils/z-index"
import { extractCollaborationTags } from "@/lib/share-card/extract-collaboration-tags"
import { isPublishedMode } from "@/lib/adapters/adapter-provider"

export default function ProfilePage() {
  // Detect if we're in published (read-only) mode
  // Published mode = data from profile-config.json, no toolbar, no editing
  const [isPublished, setIsPublished] = useState(false)
  useEffect(() => {
    setIsPublished(isPublishedMode())
  }, [])

  const [isEditMode, setIsEditMode] = useState(false)
  const isMobile = useIsMobile()
  const {
    items,
    isLoading,
    handleLayoutChange,
    handleItemUpdate,
    handleDeleteItem,
    handleAddLink,
    handleAddText,
    handleAddImage,
    handleAddGithubRepo,
    handleAddPeople,
    handleAddSectionTitle,
    handleAddNeed,
  } = useBentoGrid()

  // Extract NeedBoard data for sharing (convert tag IDs to tag names)
  const { offering: offerings, seeking } = useMemo(() => extractCollaborationTags(items), [items]);

  // Check if there's a NeedBoard card
  const hasNeedBoard = useMemo(() => items.some((item) => item.type === 'need'), [items]);

  // Handle image URL update (convert blob: URL to data: URL after upload)
  const handleUpdateImageUrl = useCallback((cardId: string, dataUrl: string) => {
    handleItemUpdate(cardId, { imageUrl: dataUrl });
  }, [handleItemUpdate]);

  // Force edit mode off when in published mode or on mobile
  useEffect(() => {
    if ((isMobile || isPublished) && isEditMode) {
      setIsEditMode(false)
    }
  }, [isMobile, isEditMode, isPublished])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white">
      <div className="flex min-h-screen">
        {/* Left Panel - Profile Card */}
        <div className="hidden lg:block w-80 p-6">
          <div className="sticky top-6">
            <Profile isEditable={isEditMode} shareOfferings={offerings} shareSeeking={seeking} />
          </div>
        </div>

        {/* Right Panel - Bento Grid */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">My Profile</h2>

              {/* Powered by Research AI+ - pill badge style with brand link */}
              <a
                href="https://github.com/researchaiplus/open-bento-me"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm hover:border-gray-300 hover:shadow transition-colors cursor-pointer"
              >
                {/* Lightning: orange stroke (outer), yellow fill (inner) */}
                <Zap
                  className="w-3 h-3 flex-shrink-0 stroke-amber-600 fill-amber-200"
                  strokeWidth={2}
                />
                <span className="text-xs font-medium text-slate-600">Powered by</span>
                <img
                  src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/icons/Vector.svg`}
                  alt="Research AI+"
                  className="h-5 object-contain flex-shrink-0 -mt-1.5"
                />
              </a>
            </div>

            <BentoGrid
              items={items}
              isEditable={isEditMode}
              onLayoutChange={handleLayoutChange}
              onItemUpdate={handleItemUpdate}
              onItemDelete={handleDeleteItem}
            />
          </div>
        </div>

        {/* Mobile Profile - Show at top on mobile */}
        {isMobile && (
          <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm p-4">
            <Profile isEditable={isEditMode} shareOfferings={offerings} shareSeeking={seeking} />
          </div>
        )}
      </div>

      {/* Bottom Toolbar - hidden in published (read-only) mode */}
      {!isPublished && (
        <Portal>
          <div className={`fixed bottom-8 left-0 right-0 flex justify-center ${getZIndexClass('BOTTOM_TOOLBAR')} pointer-events-none`}>
            <div className="pointer-events-auto">
              <SiteSharingToggle
                username=""
                onShareClick={() => void 0}
                onEditToggle={setIsEditMode}
                defaultEditEnabled={isEditMode}
                onAddLink={handleAddLink}
                onAddText={handleAddText}
                onAddImage={handleAddImage}
                onUpdateImageUrl={handleUpdateImageUrl}
                onAddGithubRepo={handleAddGithubRepo}
                onAddPeople={(person) => void 0}
                onAddSectionTitle={handleAddSectionTitle}
                onAddNeed={handleAddNeed}
                hasNeedBoard={hasNeedBoard}
                offerings={offerings}
                seeking={seeking}
                key={String(offerings?.length) + '-' + String(seeking?.length)}
              />
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
