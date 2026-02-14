"use client"

import { Square, RectangleHorizontal } from "lucide-react"

// 尺寸类型定义
export type CardSize = "small" | "horizontal" | "vertical" | "large"

export interface SizeToolbarProps {
  currentSize: CardSize;
  onSizeChange: (newSize: CardSize) => void;
  className?: string;
}

export function SizeToolbar({ 
  currentSize, 
  onSizeChange,
  className = ""
}: SizeToolbarProps) {
  // 统一的事件处理函数
  const handleButtonClick = (e: React.MouseEvent, size: CardSize) => {
    e.preventDefault()
    e.stopPropagation()
    onSizeChange(size)
  }

  return (
    <div 
      className={`w-[156px] h-[40px] flex items-center justify-center gap-2 p-3 rounded-lg bg-zinc-950 transition-opacity duration-200 translate-y-10 ${className}`}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
      onMouseMove={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onTouchEnd={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
    >
      <button
        onClick={(e) => handleButtonClick(e, "small")}
        onMouseDown={e => e.stopPropagation()}
        className={`p-2 rounded transition-colors ${currentSize === "small" ? "bg-white/20" : "hover:bg-white/10"}`}
        title="175 × 175"
      >
        <Square size={14} strokeWidth={2.5} className="text-white pointer-events-none scale-75" />
      </button>
      <button
        onClick={(e) => handleButtonClick(e, "vertical")}
        onMouseDown={e => e.stopPropagation()}
        className={`p-2 rounded transition-colors ${currentSize === "vertical" ? "bg-white/20" : "hover:bg-white/10"}`}
        title="175 × 390"
      >
        <RectangleHorizontal size={14} className="text-white rotate-90 pointer-events-none" />
      </button>
      <button
        onClick={(e) => handleButtonClick(e, "horizontal")}
        onMouseDown={e => e.stopPropagation()}
        className={`p-2 rounded transition-colors ${currentSize === "horizontal" ? "bg-white/20" : "hover:bg-white/10"}`}
        title="390 × 175"
      >
        <RectangleHorizontal size={14} className="text-white pointer-events-none" />
      </button>
      <button
        onClick={(e) => handleButtonClick(e, "large")}
        onMouseDown={e => e.stopPropagation()}
        className={`p-2 rounded transition-colors ${currentSize === "large" ? "bg-white/20" : "hover:bg-white/10"}`}
        title="390 × 390"
      >
        <Square size={16} className="text-white pointer-events-none" />
      </button>
    </div>
  )
} 