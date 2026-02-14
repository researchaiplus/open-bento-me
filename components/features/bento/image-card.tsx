"use client"

import { useState } from "react"
import { Trash } from "lucide-react"
import { SizeToolbar, type CardSize } from "./size-toolbar"
import type { ImageCardProps } from "./types"
import { EditableImage } from "../../common/editable-image"

export function ImageCard({
  itemId,
  imageUrl,
  onDelete,
  isEditable = false,
  size = "small",
  onSizeChange,
  onImageChange,
  onEditStart,
  onEditEnd,
  isResizable = false,
  cropShape = "square",
  initialScale,
  initialPosition,
  onTransformChange
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isToolbarClicked, setIsToolbarClicked] = useState(false)

  // Only blob: URLs are truly temporary (in-memory, lost on refresh)
  // data: URLs are persistent base64 encoded images stored in localStorage
  const isUploading = Boolean(
    imageUrl && imageUrl.startsWith('blob:')
  )

  // 获取尺寸类名
  const getSizeClassName = () => {
    return "w-full h-full" // 让卡片填充网格单元格
  }

  return (
    <div
      className={`group relative ${getSizeClassName()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsToolbarClicked(false)
      }}
    >
      {/* Delete button */}
      {isHovered && isEditable && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          onMouseDown={e => e.stopPropagation()}
          className="absolute -top-3 -left-3 z-50 flex items-center gap-2 p-2 rounded-[60px] border border-[rgba(0,0,0,0.06)] bg-white shadow-[0px_4px_10px_0px_rgba(0,0,0,0.10)] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Delete image"
        >
          <Trash size={16} className="text-zinc-900" />
        </button>
      )}

      {/* Size toolbar */}
      {isHovered && isEditable && onSizeChange && (
        <div 
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-50 opacity-0 group-hover:opacity-100"
          onMouseDown={(e) => {
            e.stopPropagation()
            setIsToolbarClicked(true)
          }}
        >
          <SizeToolbar 
            currentSize={size} 
            onSizeChange={(newSize) => {
              setIsToolbarClicked(true)
              onSizeChange(newSize)
            }} 
          />
        </div>
      )}

      {/* 图片容器 - 内层容器应用 overflow-hidden */}
      <div className="relative w-full h-full flex rounded-[24px] border border-black/[0.06] bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow duration-200 overflow-hidden">
        <EditableImage
          imageUrl={imageUrl}
          isEditable={isEditable}
          onImageChange={onImageChange}
          className="w-full h-full"
          altText="Uploaded image"
          cropShape={cropShape}
          initialScale={initialScale}
          initialPosition={initialPosition}
          onTransformChange={onTransformChange}
        />

        {isUploading && (
          <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-black/45 px-4">
            <div className="w-full max-w-[220px]">
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                <div className="image-upload-progress absolute inset-0" />
              </div>
              <p className="mt-2 text-center text-xs font-medium tracking-wide text-white/90">
                Uploading image...
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .image-upload-progress {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.75) 50%, rgba(255, 255, 255, 0.2) 100%);
          background-size: 200% 100%;
          animation: imageUploadProgress 1.3s ease-in-out infinite;
        }

        @keyframes imageUploadProgress {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  )
}
