"use client"

import { Square, Minus } from "lucide-react"

// NeedBoard 专用尺寸类型：horizontal (820x175) 或 square (390x390)
export type CardSize = "horizontal" | "square" | "small" | "vertical" | "large" // 保留其他类型以兼容

export interface NeedBoardSizeToolbarProps {
  currentSize: CardSize;
  onSizeChange: (newSize: CardSize) => void;
  className?: string;
}

export function NeedBoardSizeToolbar({ 
  currentSize, 
  onSizeChange,
  className = ""
}: NeedBoardSizeToolbarProps) {
  // 统一的事件处理函数
  const handleButtonClick = (e: React.MouseEvent, size: CardSize) => {
    e.preventDefault()
    e.stopPropagation()
    onSizeChange(size)
  }

  return (
    <div 
      className={`w-[88px] h-[40px] flex items-center justify-center gap-2 p-3 rounded-lg bg-zinc-950 transition-opacity duration-200 translate-y-10 ${className}`}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
      onMouseMove={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
    >
      {/* Horizontal: 横版 820x175 (w:4, h:2) */}
      <button
        onClick={(e) => handleButtonClick(e, "horizontal")}
        onMouseDown={e => e.stopPropagation()}
        className={`p-2 rounded transition-colors ${currentSize === "horizontal" || currentSize === "small" ? "bg-white/20" : "hover:bg-white/10"}`}
        aria-label="Horizontal layout (820x175)"
      >
        <Minus size={14} strokeWidth={3} className="text-white pointer-events-none" />
      </button>
      
      {/* Square: 正方形 390x390 (w:2, h:4) */}
      <button
        onClick={(e) => handleButtonClick(e, "square")}
        onMouseDown={e => e.stopPropagation()}
        className={`p-2 rounded transition-colors ${currentSize === "square" ? "bg-white/20" : "hover:bg-white/10"}`}
        aria-label="Square layout (390x390)"
      >
        <Square size={16} className="text-white pointer-events-none" />
      </button>
    </div>
  )
} 
