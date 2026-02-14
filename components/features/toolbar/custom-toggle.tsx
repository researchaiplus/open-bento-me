"use client"

import type * as React from "react"
import { Power, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// 创建自定义开关组件
// Create custom toggle component
interface CustomToggleProps extends React.HTMLAttributes<HTMLButtonElement> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
}

export function CustomToggle({ checked, onCheckedChange, label, className, ...props }: CustomToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              role="switch"
              aria-checked={checked}
              onClick={() => onCheckedChange(!checked)}
              className={cn(
                "relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 ease-in-out",
                checked ? "bg-[#16a34a]" : "bg-zinc-200",
                className,
              )}
              style={{
                // 添加自定义过渡效果
                // Add custom transition effect
                transition: "background-color 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              {...props}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md",
                  checked ? "translate-x-7 scale-105 shadow-lg" : "translate-x-1 scale-100",
                )}
                style={{
                  // 添加弹性伸缩效果
                  // Add elastic stretching effect
                  transition: "all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transformOrigin: checked ? "left center" : "right center",
                }}
              >
                <span
                  className={cn(
                    "transition-opacity duration-300 ease-in-out absolute",
                    checked ? "opacity-100 rotate-0" : "opacity-0 rotate-90",
                  )}
                >
                  <X size={14} />
                </span>
                <span
                  className={cn(
                    "transition-opacity duration-300 ease-in-out absolute",
                    checked ? "opacity-0 rotate-90" : "opacity-100 rotate-0",
                  )}
                >
                  <Power size={14} />
                </span>
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={6}
            className="bg-[#0f172a] text-white border-[#0f172a] -translate-y-[8px]"
          >
            <p>{label || (checked ? "Finish Edit" : "Edit")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* 添加右侧文字，仅在开关关闭时显示 */}
      {/* Add text on the right side, only when switch is OFF */}
      {!checked && <span className="text-sm font-medium text-[#0f172a]">{label || "Edit"}</span>}
    </div>
  )
}

