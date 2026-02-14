"use client"

import { useState } from "react"
import { Trash } from "lucide-react"

interface SectionTitleCardProps {
  text: string
  isEditable?: boolean
  onTextChange?: (newText: string) => void
  onDelete?: () => void
}

export function SectionTitleCard({
  text,
  isEditable = false,
  onTextChange,
  onDelete,
}: SectionTitleCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isClicked, setIsClicked] = useState(false)

  // 统一的文本样式
  const textStyles = "text-xl font-semibold"
  const placeholderStyles = "text-zinc-400 text-xl font-semibold"

  const showEditArea = isEditable && (isHovered || isClicked)

  return (
    <div
      className={`group relative flex items-center pt-4 pb-4 px-5 rounded-[24px] transition-all duration-200 w-full h-full
        ${showEditArea ? 'bg-white shadow-[0px_4px_10px_0px_rgba(0,0,0,0.10)]' : 'bg-transparent'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        if (!isClicked) setIsClicked(false)
      }}
      onClick={() => {
        if (isEditable) setIsClicked(true)
      }}
    >
      {/* Delete button */}
      {showEditArea && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          onMouseDown={e => e.stopPropagation()}
          className="absolute -top-3 -left-3 z-50 flex items-center gap-2 p-2 rounded-[60px] border border-[rgba(0,0,0,0.06)] bg-white shadow-[0px_4px_10px_0px_rgba(0,0,0,0.10)] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Delete section title"
        >
          <Trash size={16} className="text-zinc-900" />
        </button>
      )}

      {/* Title input */}
      <div className="w-full">
        <div className="relative w-full">
          {/* Display text */}
          <div
            className={`w-full transition-opacity duration-200 ${showEditArea ? 'opacity-0' : 'opacity-100'}`}
          >
            <div className={text ? textStyles : placeholderStyles}>
              {text || "Add a title..."}
            </div>
          </div>

          {/* Edit area */}
          {isEditable && (
            <div 
              className={`absolute inset-0 flex items-center transition-opacity duration-200 ${showEditArea ? 'opacity-100' : 'opacity-0'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full bg-zinc-100/90 rounded">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => onTextChange?.(e.target.value)}
                  placeholder="Add a title..."
                  className={`w-full bg-transparent outline-none border-none py-1 px-0 placeholder:text-zinc-400 ${textStyles}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.currentTarget.blur()
                      setIsClicked(false)
                    }
                  }}
                  onBlur={() => setIsClicked(false)}
                  onMouseDown={e => e.stopPropagation()}
                  onMouseMove={e => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 