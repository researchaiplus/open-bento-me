"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { avatarPreloader } from "@/lib/utils/avatar-preloader"

interface UserAvatarProps {
  src: string
  alt?: string
  className?: string
  size?: number
  fallback?: string
  showDefaultWhileLoading?: boolean // 是否在加载时显示默认头像
  priority?: boolean
  unoptimized?: boolean
  loading?: 'eager' | 'lazy'
  sizes?: string
}

export function UserAvatar({ src, alt = "", className, size = 40, fallback, showDefaultWhileLoading = true, priority = false, unoptimized = true, loading = 'lazy', sizes }: UserAvatarProps) {
  const [error, setError] = useState(false)
  const [imageKey, setImageKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  // 添加调试日志
  // useEffect(() => {
  //     error,
  //     imageKey,
  //     src,
  //     imageSrc: getImageSrc()
  //   })
  // }, [error, imageKey, src])

  // 设置客户端挂载状态
  useEffect(() => {
    setMounted(true)
  }, [])

  // 当src变化时重置加载状态
  useEffect(() => {
    if (src) {
      // 如果图片已经预加载，则不显示加载状态
      const isPreloaded = avatarPreloader.isPreloaded(src)
      setIsLoading(!isPreloaded)
      setError(false)
      
      if (isPreloaded) {
        void 0
      }
    }
  }, [src])

  // 处理头像更新和缓存清除事件
  useEffect(() => {
    const handleAvatarUpdate = () => {
      setImageKey(Date.now())
      setError(false)
      setIsLoading(true)
    }

    const handleCacheCleared = () => {
      void 0
      setImageKey(Date.now())
      setError(false)
      setIsLoading(true)
    }

    window.addEventListener('avatar-updated', handleAvatarUpdate)
    window.addEventListener('avatar-cache-cleared', handleCacheCleared)
    
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate)
      window.removeEventListener('avatar-cache-cleared', handleCacheCleared)
    }
  }, [])

  // 获取图片源的函数
  const getImageSrc = useCallback(() => {
    if (!src) {
      return null
    }

    // data: URLs (base64) must never have cache-busting params appended — they are self-contained
    if (src.startsWith('data:')) {
      return src
    }

    // 只有在发生错误后重新加载时才添加缓存破坏参数
    if (src.startsWith('http')) {
      if (imageKey > 0) {
        const url = new URL(src)
        url.searchParams.set('t', imageKey.toString())
        return url.toString()
      }
      return src
    }

    // 如果是相对路径，只在需要时添加缓存破坏参数
    return imageKey > 0 ? `${src}?t=${imageKey}` : src
  }, [src, imageKey])

  const handleError = () => {
    void 0
    setError(true)
    setIsLoading(false)
  }

  const handleLoad = () => {
    setIsLoading(false)
    setError(false)
  }

  const renderNeutralPlaceholder = () => (
    <div
      className={cn(
        "h-full w-full bg-zinc-200 dark:bg-zinc-800",
        className
      )}
      style={{ width: size, height: size }}
    />
  )

  const shouldShowImage = !error && !!src
  const isPending = isLoading && !!src

  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden",
        !className && "rounded-full",
        className
      )}
      style={{ width: size, height: size }}
    >
      {shouldShowImage && mounted ? (
        <Image
          src={getImageSrc() || ''}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
          width={size}
          height={size}
          onError={handleError}
          onLoad={handleLoad}
          priority={priority}
          unoptimized={unoptimized}
          loading={loading}
          sizes={sizes || `${size}px`}
        />
      ) : (
        // 占位策略：
        // - 加载中且不希望显示默认图时，显示中性占位
        // - 发生错误时，如果允许显示默认图则显示默认图；否则也显示中性占位
        isPending && !showDefaultWhileLoading ? (
          renderNeutralPlaceholder()
        ) : error ? (
          showDefaultWhileLoading ? (
            <Image
              src="/icons/default-avatar.png"
              alt="Default avatar"
              className="aspect-square h-full w-full object-cover"
              width={size}
              height={size}
              priority={priority}
              unoptimized={unoptimized}
              loading={loading}
              sizes={sizes || `${size}px`}
            />
          ) : (
            renderNeutralPlaceholder()
          )
        ) : (
          // src 为空：根据 showDefaultWhileLoading 决定显示默认图还是中性占位
          showDefaultWhileLoading ? (
            <Image
              src="/icons/default-avatar.png"
              alt="Default avatar"
              className="aspect-square h-full w-full object-cover"
              width={size}
              height={size}
              priority={priority}
              unoptimized={unoptimized}
              loading={loading}
              sizes={sizes || `${size}px`}
            />
          ) : (
            renderNeutralPlaceholder()
          )
        )
      )}
    </div>
  )
}

