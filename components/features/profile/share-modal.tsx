"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Download, Link2 } from "lucide-react"
import { toast } from "sonner"
import {
  ProfileShareCardCompact,
  ProfileShareCardLarge,
  ProfileShareCardStandard,
} from "./ProfileShareCards"
import type { SocialLinks } from "@/types/social-links"

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    name: string
    username?: string
    bio?: string
    avatar?: string
    offerings?: string[]
    seeking?: string[]
    socialLinks?: SocialLinks
  }
}

const SHARE_WINDOW_FEATURES = "width=600,height=400"

/**
 * Get the shareable profile URL from the current browser location.
 * Uses origin + pathname so it works in all deployment scenarios:
 * - Local dev: http://localhost:3000/profile
 * - GitHub Pages: https://user.github.io/repo-name/profile/
 * - Custom domain: https://mydomain.com/profile/
 * Query params (e.g. ?mode=edit) are stripped automatically.
 */
function getProfileShareUrl(): string {
  if (typeof window === "undefined") return ""
  return window.location.origin + window.location.pathname
}

export function ShareModal({ open, onOpenChange, user }: ShareModalProps) {
  const [profileUrl, setProfileUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [cardHeight, setCardHeight] = useState<number | null>(null)
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const scaledCardRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Generate the correct profile share URL based on current mode
  useEffect(() => {
    if (typeof window === "undefined") return
    setProfileUrl(getProfileShareUrl())
  }, [])

  const safeProfileUrl = useMemo(() => {
    if (profileUrl) return profileUrl
    if (typeof window !== "undefined") {
      return getProfileShareUrl()
    }
    return ""
  }, [profileUrl])

  const normalizedOfferings = (user.offerings ?? [])
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => item.length > 0)
    .slice(0, 2)

  const normalizedSeeking = (user.seeking ?? [])
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => item.length > 0)
    .slice(0, 2)

  const hasCollaborationDetails = normalizedOfferings.length > 0 || normalizedSeeking.length > 0
  const hasBioContent = Boolean(user.bio?.trim())

  type Variant = "large" | "standard" | "compact"
  const variant: Variant = hasCollaborationDetails ? "large" : hasBioContent ? "standard" : "compact"

  const cardProps = {
    name: user.name,
    username: user.username,
    bio: user.bio,
    avatarUrl: user.avatar,
    profileUrl: safeProfileUrl,
    socialLinks: user.socialLinks,
    offerings: normalizedOfferings,
    seeking: normalizedSeeking,
  }

  const fileName =
    (user.username?.trim().replace(/[^a-zA-Z0-9-_]/g, "-") || "researcher-profile") + "-card.png"

  // Measure card height after render
  useEffect(() => {
    if (!open || !scaledCardRef.current || !cardContainerRef.current) {
      setCardHeight(null)
      return
    }

    const measureCard = () => {
      const scaledCard = scaledCardRef.current
      if (!scaledCard) return

      // Get the actual rendered height of the scaled card
      const rect = scaledCard.getBoundingClientRect()
      setCardHeight(rect.height)
    }

    // Measure after a short delay to ensure card is rendered
    const timeoutId = setTimeout(measureCard, 100)
    
    // Also measure on window resize
    window.addEventListener('resize', measureCard)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', measureCard)
    }
  }, [open, variant, normalizedOfferings.length, normalizedSeeking.length, user.bio])

  const resetCopiedLater = () => {
    window.setTimeout(() => setCopied(false), 2000)
  }

  const resetDownloadedLater = () => {
    window.setTimeout(() => setDownloaded(false), 2000)
  }

  const handleCopyLink = async () => {
    if (!safeProfileUrl) {
      toast.error("Profile link unavailable")
      return
    }

    // Prefer modern Clipboard API when available
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(safeProfileUrl)
        setCopied(true)
        resetCopiedLater()
        return
      } catch {
        // fall through to legacy method
      }
    }

    try {
      const textArea = document.createElement("textarea")
      textArea.value = safeProfileUrl
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand("copy")
      document.body.removeChild(textArea)
      if (!successful) {
        throw new Error("Copy command failed")
      }
      setCopied(true)
      resetCopiedLater()
    } catch (error) {
      console.error("Failed to copy link", error)
      toast.error("Failed to copy link")
    }
  }

  const handleDownload = async () => {
    if (!cardRef.current) return
    if (typeof window === "undefined") return

    setDownloading(true)
    try {
      const htmlToImage = await import("html-to-image")
      const node = cardRef.current

      // Temporarily remove scale transform to capture at full resolution
      const parentElement = scaledCardRef.current
      const originalTransform = parentElement?.style.transform
      const originalPosition = parentElement?.style.position
      const originalTop = parentElement?.style.top
      const originalLeft = parentElement?.style.left

      // Remove transform for capture
      if (parentElement) {
        parentElement.style.transform = 'none'
        parentElement.style.position = 'relative'
        parentElement.style.top = '0'
        parentElement.style.left = '0'
      }

      // Wait for layout to update
      await new Promise(resolve => setTimeout(resolve, 50))

      // Use html-to-image to convert the card to blob
      const blob = await htmlToImage.toBlob(node, {
        quality: 1.0,
        pixelRatio: 2, // 2x resolution for better quality
        backgroundColor: "#ffffff",
        width: node.offsetWidth,
        height: node.offsetHeight,
        cacheBust: true,
        skipAutoScale: false,
      })

      // Restore transform
      if (parentElement) {
        parentElement.style.transform = originalTransform || 'translate(-50%, -50%) scale(0.6)'
        parentElement.style.position = originalPosition || 'absolute'
        parentElement.style.top = originalTop || '50%'
        parentElement.style.left = originalLeft || '50%'
      }

      if (!blob) {
        throw new Error("Failed to create blob")
      }

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = fileName
      link.href = url
      link.click()
      URL.revokeObjectURL(url)

      setDownloaded(true)
      resetDownloadedLater()
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download card")
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = (target: "facebook" | "x" | "linkedin" | "email") => {
    if (typeof window === "undefined" || !safeProfileUrl) return
    const encodedUrl = encodeURIComponent(safeProfileUrl)

    switch (target) {
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          "_blank",
          SHARE_WINDOW_FEATURES,
        )
        break
      case "x":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent("Check out my ResearcherNexus profile")}`,
          "_blank",
          SHARE_WINDOW_FEATURES,
        )
        break
      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
          "_blank",
          SHARE_WINDOW_FEATURES,
        )
        break
      case "email":
        window.location.href = `mailto:?subject=${encodeURIComponent("Check out my ResearcherNexus profile")}&body=${encodedUrl}`
        break
    }
  }

  const renderCardPreview = () => {
    if (variant === "large") {
      return (
        <ProfileShareCardLarge
          ref={cardRef}
          {...cardProps}
          offerings={normalizedOfferings}
          seeking={normalizedSeeking}
        />
      )
    }

    if (variant === "standard") {
      return <ProfileShareCardStandard ref={cardRef} {...cardProps} />
    }

    return <ProfileShareCardCompact ref={cardRef} {...cardProps} />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[600px] w-full max-w-[900px] overflow-hidden border-none p-0 sm:rounded-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Share Profile Card</DialogTitle>
          <DialogDescription>
            Download the card image or copy the share link to share your profile with others.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-full w-full flex-col sm:flex-row">
          <div
            ref={cardContainerRef}
            className="h-[260px] w-full flex flex-col items-center justify-center bg-muted p-6 shrink-0 overflow-hidden sm:h-full sm:w-[450px]"
            style={{
              position: 'relative',
            }}
          >
            <div
              ref={scaledCardRef}
              className="flex items-center justify-center"
              style={{
                transformOrigin: 'center center',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(0.6)',
              }}
            >
              {renderCardPreview()}
            </div>
          </div>

          <div className="flex-1 h-full flex flex-col p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-foreground mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '20px', lineHeight: '1.2' }}>
                Share Profile Card
              </h2>
              <p className="text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px', lineHeight: '1.5' }}>
                Download the card image or copy the share link to share your profile with others
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Download Card Button */}
              <div className="flex flex-col gap-2">
                <label className="text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '1.5' }}>
                  Download Card
                </label>
                <Button
                  onClick={handleDownload}
                  variant={downloaded ? "default" : "outline"}
                  disabled={downloading}
                  className="w-full justify-start gap-3 h-12 transition-all duration-300"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px' }}
                >
                  {downloading ? (
                    <>
                      <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Downloading...</span>
                    </>
                  ) : downloaded ? (
                    <>
                      <Check className="size-4 shrink-0" />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download className="size-4 shrink-0" />
                      <span>Download as Image (PNG)</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Copy Link Section */}
              <div className="flex flex-col gap-2">
                <label className="text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '1.5' }}>
                  Share Link
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      readOnly
                      value={safeProfileUrl}
                      className="w-full h-12 px-4 pr-10 bg-muted text-foreground border border-border outline-none"
                      style={{ 
                        fontFamily: 'Inter, sans-serif', 
                        fontWeight: 400, 
                        fontSize: '14px',
                        borderRadius: 'var(--radius-button)'
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Link2 className="size-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    variant={copied ? "default" : "outline"}
                    className="h-12 px-6 gap-2 shrink-0"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px' }}
                  >
                    {copied ? (
                      <>
                        <Check className="size-4" />
                        Copied
                      </>
                    ) : (
                      'Copy'
                    )}
                  </Button>
                </div>
              </div>

              {/* Share Options */}
              {/* <div className="flex flex-col gap-2">
                <label className="text-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: '14px', lineHeight: '1.5' }}>
                  Quick Share
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="h-12 gap-2 justify-start"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px' }}
                    onClick={() => handleShare("facebook")}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M10 0C4.477 0 0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.879V12.89h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.989C16.343 19.129 20 14.99 20 10c0-5.523-4.477-10-10-10z"
                        fill="#1877F2"
                      />
                    </svg>
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 gap-2 justify-start"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px' }}
                    onClick={() => handleShare("x")}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M15.751 2.001h2.927L12.366 9.33l7.634 10.099h-5.887l-4.575-5.985-5.233 5.985H1.376l6.75-7.715L1 2.001h6.035l4.135 5.467 4.581-5.467zm-1.025 15.42h1.621L5.823 3.655H4.084l10.642 13.766z"
                        fill="#000000"
                      />
                    </svg>
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 gap-2 justify-start"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px' }}
                    onClick={() => handleShare("linkedin")}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M18.5 0h-17C.675 0 0 .675 0 1.5v17c0 .825.675 1.5 1.5 1.5h17c.825 0 1.5-.675 1.5-1.5v-17c0-.825-.675-1.5-1.5-1.5zM5.933 17H2.967V7.5h2.966V17zM4.45 6.195c-.95 0-1.717-.77-1.717-1.717 0-.95.77-1.72 1.717-1.72.95 0 1.717.77 1.717 1.72 0 .947-.767 1.717-1.717 1.717zM17 17h-2.963v-4.62c0-1.103-.022-2.52-1.537-2.52-1.54 0-1.776 1.2-1.776 2.442V17H7.76V7.5h2.844v1.3h.04c.397-.75 1.364-1.54 2.808-1.54 3.003 0 3.558 1.977 3.558 4.548V17z"
                        fill="#0A66C2"
                      />
                    </svg>
                    LinkedIn
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 gap-2 justify-start"
                    style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '14px' }}
                    onClick={() => handleShare("email")}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                        fill="#EA4335"
                      />
                    </svg>
                    Email
                  </Button>
                </div>
              </div> */}
            </div>

            {/* Footer Note */}
            {/* <div className="pt-4 mt-4 border-t border-border">
              <p className="text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', lineHeight: '1.5' }}>
                Sharing this profile indicates your agreement to ResearcherNexus's terms of use and privacy policy
              </p>
            </div> */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
