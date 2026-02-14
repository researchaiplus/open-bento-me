"use client"

import { useState, useEffect } from "react"
import { Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/common/user-avatar"
import { useUser } from "@/context/user-context"
import { avatarCache } from "@/lib/utils/avatar-cache"
import { avatarPreloader } from "@/lib/utils/avatar-preloader"

interface ProfileAvatarProps {
  size?: number
  className?: string
  isEditable?: boolean
  onAvatarClick?: () => void
  isUpdating?: boolean
  profileAvatar?: string | null
  fallback?: string
}

export function ProfileAvatar({
  size = 140,
  className,
  isEditable = false,
  onAvatarClick,
  isUpdating = false,
  profileAvatar,
  fallback = "U"
}: ProfileAvatarProps) {
  const { avatarUrl: userAvatarUrl } = useUser()
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null)

  // 初始化头像 - 综合判断最佳 avatar 来源
  useEffect(() => {
    const initAvatar = async () => {
      // 1. 如果 profileAvatar 有有效值（非空字符串），优先使用它
      if (profileAvatar) {
        setCurrentAvatar(profileAvatar)
        avatarPreloader.preloadAvatar(profileAvatar).catch(console.warn)
        return
      }

      // 2. 使用 UserContext 中的头像（当前登录用户上传的最新头像）
      if (userAvatarUrl) {
        setCurrentAvatar(userAvatarUrl)
        return
      }

      // 3. 尝试从缓存获取
      const cachedAvatar = avatarCache.getCachedAvatar()
      if (cachedAvatar) {
        setCurrentAvatar(cachedAvatar)
        avatarPreloader.preloadAvatar(cachedAvatar).catch(console.warn)
        return
      }

      // 4. 如果 profileAvatar 是 null/undefined 且没有其他来源，显示 fallback
      setCurrentAvatar(null)
    }

    initAvatar()
  }, [userAvatarUrl, profileAvatar])

  // 监听头像更新事件 - 始终监听，以便在头像上传后立即更新显示
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent<{ avatarUrl: string }>) => {
      if (event.detail?.avatarUrl) {
        setCurrentAvatar(event.detail.avatarUrl)
      }
    }

    const handleCacheCleared = () => {
      setCurrentAvatar(null)
    }

    window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener)
    window.addEventListener('avatar-cache-cleared', handleCacheCleared)

    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener)
      window.removeEventListener('avatar-cache-cleared', handleCacheCleared)
    }
  }, [])

  return (
    <div className={cn("relative group", className)} style={{ width: size, height: size }}>
      <UserAvatar
        src={currentAvatar || ''}
        size={size}
        className={cn("w-full h-full", !className && "rounded-full")}
        showDefaultWhileLoading={false}
        priority={false}
        unoptimized={true}
        loading='lazy'
        sizes={size >= 175 ? '(min-width: 1100px) 175px, 140px' : `${size}px`}
        fallback={fallback}
      />

      {isEditable && (
        <button
          onClick={onAvatarClick}
          disabled={isUpdating}
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isUpdating && "cursor-not-allowed"
          )}
        >
          {isUpdating ? (
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </button>
      )}
    </div>
  )
}