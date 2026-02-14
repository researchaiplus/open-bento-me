"use client"

import { useState } from "react"
import { Trash } from "lucide-react"
import { SizeToolbar, type CardSize } from "./size-toolbar"
import TextareaAutosize from 'react-textarea-autosize'
import type { TextCardProps } from "./types"

export function TextCard({ 
  text = "", 
  onDelete,
  isEditable = false,
  onTextChange,
  size = "small",
  onSizeChange,
  isResizable = false
}: TextCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isToolbarClicked, setIsToolbarClicked] = useState(false)

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    if (onTextChange) {
      onTextChange(newText)
    }
  }

  // 根据卡片尺寸计算最大行数
  const getMaxLines = () => {
    switch (size) {
      case 'small':
      case 'horizontal':
        return 5; // 减少一行以确保完整显示
      case 'vertical':
      case 'large':
        return 14; // 减少一行以确保完整显示
      default:
        return 5;
    }
  }

  // 统一的文本样式
  const textStyles = {
    fontSize: '16px',
    lineHeight: '1.5',
  } as const

  // 计算文本容器的最大高度
  const getMaxHeight = () => {
    const lineHeight = 24; // 16px * 1.5 = 24px
    return getMaxLines() * lineHeight;
  }

  return (
    <div
      className={`group relative flex pt-6 pb-4 px-5 flex-col items-start gap-2 rounded-[24px] border border-black/[0.06] bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow duration-200 ${getSizeClassName()}`}
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
          aria-label="Delete text card"
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

      {/* Text content */}
      <div className="w-full h-full">
        <div className="relative w-full h-full">
          {/* 显示文本 */}
          <div
            className={`w-full transition-opacity duration-200 ${isEditable && isHovered ? 'opacity-0' : 'opacity-100'}`}
            style={{
              ...textStyles,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: getMaxLines(),
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxHeight: `${getMaxHeight()}px`,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal',
            }}
          >
            <div className={`${text ? '' : 'text-gray-400'} break-words`}>
              {text || "Add note..."}
            </div>
          </div>

          {/* 编辑区域 */}
          {isEditable && (
            <div 
              className={`absolute inset-0 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="relative w-full h-full bg-gray-100/90 rounded">
                <TextareaAutosize
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Add note..."
                  className="w-full resize-none outline-none border-none p-0 bg-transparent placeholder:text-gray-400"
                  style={textStyles}
                  maxRows={getMaxLines()}
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

// 注意：卡片的尺寸由父组件通过 GridLayout 控制
function getSizeClassName() {
  return "w-full h-full" // 让卡片填充网格单元格
} 