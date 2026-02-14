"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { getZIndexClass } from "@/lib/utils/z-index"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  width?: number
  height?: number
}

export function Modal({ isOpen, onClose, children, className, width, height }: ModalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Close on escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  const overlayClass = getZIndexClass('MODAL_OVERLAY')
  const contentClass = getZIndexClass('MODAL_CONTENT')

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-black/50 overflow-auto py-10",
        overlayClass,
      )}
    >
      <div
        className={cn(
          "relative mx-auto bg-white rounded-lg shadow-lg overflow-hidden border border-zinc-200",
          contentClass,
          className,
        )}
        style={{
          width: width ? `${width}px` : "auto",
          height: height ? `${height}px` : "auto",
          maxWidth: "95vw",
          maxHeight: "90vh",
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
