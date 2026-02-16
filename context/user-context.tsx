"use client"

/**
 * UserContext — 开源版本
 *
 * 功能说明:
 * - 管理用户状态（头像、用户数据）
 * - 从 LocalStorageAdapter 读取 profile 数据（不依赖后端 API）
 * - 提供 updateAvatar / updateUser 方法供子组件调用
 * - 通过 CustomEvent 广播头像更新事件
 */

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useReducer, useRef } from "react"
import { validateFile } from '@/lib/utils/file-validation'
import { toast } from "sonner"
import { avatarCache } from "@/lib/utils/avatar-cache"
import { avatarPreloader } from "@/lib/utils/avatar-preloader"
import { LocalStorageAdapter, StaticConfigAdapter } from "@/lib/adapters"
import { isPublishedMode, isEditModeOnPublishedSite, seedLocalStorageFromStaticConfig } from "@/lib/adapters/adapter-provider"
import { prefixStorageKey } from "@/lib/utils/get-site-prefix"

// 定义 Action 类型
type UserAction = 
  | { type: 'UPDATE_AVATAR'; payload: string }
  | { type: 'SET_UPDATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_USER'; payload: any }
  | { type: 'INIT_USER'; payload: { avatarUrl: string | null; user: any } }

interface UserState {
  avatarUrl: string | null
  isUpdatingAvatar: boolean
  updateError: string | null
  user: {
    handle?: string
    [key: string]: any
  }
}

interface UserContextType extends UserState {
  updateAvatar: (file: File) => Promise<string>
  updateUser: (user: any) => void
}

// 初始状态
const initialState: UserState = {
  avatarUrl: null,  // 初始为null，在客户端useEffect中加载缓存
  isUpdatingAvatar: false,
  updateError: null,
  user: {}
}

// Reducer 函数
function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'UPDATE_AVATAR':
      return {
        ...state,
        avatarUrl: action.payload || null
      }
    case 'SET_UPDATING':
      return {
        ...state,
        isUpdatingAvatar: action.payload
      }
    case 'SET_ERROR':
      return {
        ...state,
        updateError: action.payload
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      }
    case 'INIT_USER':
      return {
        ...state,
        avatarUrl: action.payload.avatarUrl || null,
        user: action.payload.user
      }
    default:
      return state
  }
}

// localStorage 安全包装
const storage = {
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.warn("localStorage failed, using in-memory storage instead", error)
      return false
    }
  },
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn("Failed to retrieve from localStorage", error)
      return null
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn("Failed to remove from localStorage", error)
      return false
    }
  }
}

const UserContext = createContext<UserContextType>({
  ...initialState,
  updateAvatar: async () => "",
  updateUser: () => {}
})

// Hook: 获取当前用户上下文
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export function UserProvider({ children }: { children: ReactNode }) {
  // 使用 lazy initializer 以便首帧就能读取缓存头像
  const [state, dispatch] = useReducer(userReducer, undefined, () => {
    try {
      const cachedAvatar = avatarCache.getCachedAvatar()
      return {
        ...initialState,
        avatarUrl: cachedAvatar || null,
      }
    } catch {
      return initialState
    }
  })

  // 立即初始化缓存的头像（同步操作）
  useEffect(() => {
    const cachedAvatar = avatarCache.getCachedAvatar()
    if (cachedAvatar && !state.avatarUrl) {
      dispatch({
        type: 'UPDATE_AVATAR',
        payload: cachedAvatar
      })
      // 预加载头像
      avatarPreloader.preloadAvatar(cachedAvatar).catch(console.warn)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 用户数据获取函数 — 根据模式从不同 adapter 读取 profile 数据
  // Published mode: StaticConfigAdapter (reads from profile-config.json)
  // Edit mode on published site: LocalStorageAdapter, seeded from profile-config.json if empty
  // Edit mode (local dev): LocalStorageAdapter (reads from localStorage)
  const initializeUser = useCallback(async () => {
    try {
      // Choose adapter based on current mode
      let adapter: LocalStorageAdapter | StaticConfigAdapter
      if (isPublishedMode()) {
        // Pure published mode: read-only, data from profile-config.json
        const staticAdapter = new StaticConfigAdapter()
        await staticAdapter.loadConfig()
        adapter = staticAdapter
      } else if (isEditModeOnPublishedSite()) {
        // Edit mode on published site: seed localStorage from profile-config.json if empty
        const lsAdapter = new LocalStorageAdapter()
        await seedLocalStorageFromStaticConfig(lsAdapter)
        adapter = lsAdapter
      } else {
        // Normal edit mode (local dev)
        adapter = new LocalStorageAdapter()
      }
      const profileData = await adapter.getProfile()

      // 确定头像 URL：优先使用 adapter profile 中的 avatar，其次是 avatarCache
      const profileAvatar = profileData?.avatar || null
      const cachedAvatar = avatarCache.getCachedAvatar()
      const finalAvatarUrl = profileAvatar || cachedAvatar || null

      // 如果 profile 中有 avatar，同步到 avatarCache 使其保持一致
      if (profileAvatar) {
        avatarCache.setCachedAvatar(profileAvatar)
      }

      // 预加载头像
      if (finalAvatarUrl) {
        avatarPreloader.preloadAvatar(finalAvatarUrl).catch(console.warn)
      }

      // 初始化用户状态
      dispatch({
        type: 'INIT_USER',
        payload: {
          avatarUrl: finalAvatarUrl,
          user: profileData ? {
            id: profileData.id || 'local-user',
            name: profileData.name || profileData.title || 'Local User',
            profile: {
              avatar: profileData.avatar,
              bio: profileData.bio,
              title: profileData.title,
              institution: profileData.institution,
              location: profileData.location,
              website: profileData.website,
              social_links: profileData.social_links,
              research_interests: profileData.research_interests,
            }
          } : {}
        }
      })
    } catch (error) {
      console.error('[UserContext] Failed to initialize user from localStorage:', error)

      // 回退：使用本地存储的头像缓存
      const fallbackAvatar = storage.getItem(prefixStorageKey("userAvatarUrl"))
      dispatch({
        type: 'INIT_USER',
        payload: {
          avatarUrl: fallbackAvatar || null,
          user: {}
        }
      })
    }
  }, [])

  // 初始化用户数据
  useEffect(() => {
    initializeUser()
  }, [initializeUser])

  // 监听用户登录/登出事件（保留以兼容可能的外部触发）
  useEffect(() => {
    const handleUserLogin = () => {
      initializeUser()
    }

    const handleUserLogout = () => {
      // 使用缓存管理器清除所有缓存
      avatarCache.clearCache()

      // 重置状态
      dispatch({
        type: 'INIT_USER',
        payload: {
          avatarUrl: null,
          user: {}
        }
      })
    }

    window.addEventListener('user-login', handleUserLogin)
    window.addEventListener('user-logout', handleUserLogout)

    return () => {
      window.removeEventListener('user-login', handleUserLogin)
      window.removeEventListener('user-logout', handleUserLogout)
    }
  }, [initializeUser])

  // updateAvatar: 将 File 转为 base64 data URL 并持久化到 adapter
  const updateAvatar = useCallback(async (file: File): Promise<string> => {
    dispatch({ type: 'SET_UPDATING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      // 将图片转换为 base64 数据 URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve(e.target?.result as string)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const newAvatarUrl = dataUrl

      // 保存到本地存储
      storage.setItem(prefixStorageKey("userAvatarUrl"), newAvatarUrl)

      // 更新状态 — 对于 data: URL 不需要 cache-busting 参数
      dispatch({ type: 'UPDATE_AVATAR', payload: newAvatarUrl })

      // 触发自定义事件通知其他组件
      const event = new CustomEvent('avatar-updated', {
        detail: { avatarUrl: newAvatarUrl }
      })
      window.dispatchEvent(event)

      // 持久化到 adapter profile (localStorage) 以便刷新后仍能加载
      // Skip in published mode — read-only
      if (!isPublishedMode()) {
        try {
          const adapter = new LocalStorageAdapter()
          await adapter.updateProfile({ avatar: newAvatarUrl })
        } catch (error) {
          console.error('[UserContext] Failed to update adapter profile with new avatar:', error)
        }
      }

      // 同步到 avatarCache
      avatarCache.setCachedAvatar(newAvatarUrl)

      return newAvatarUrl
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update avatar'
      console.error('[UserContext] Avatar update error:', message)
      dispatch({ type: 'SET_ERROR', payload: message })
      throw error
    } finally {
      dispatch({ type: 'SET_UPDATING', payload: false })
    }
  }, [])

  // updateUser: 直接更新用户数据
  const updateUser = useCallback((newUser: any) => {
    dispatch({ type: 'UPDATE_USER', payload: newUser })
  }, [])

  // 监听头像更新事件（其他组件触发的）
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent<{ avatarUrl: string }>) => {
      if (event.detail?.avatarUrl) {
        dispatch({ type: 'UPDATE_AVATAR', payload: event.detail.avatarUrl })
      }
    }

    window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener)
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener)
    }
  }, [])

  return (
    <UserContext.Provider value={{ 
      ...state,
      updateAvatar, 
      updateUser 
    }}>
      {children}
    </UserContext.Provider>
  )
}
