"use client"

import { useState, useEffect, useRef } from 'react'
import { LocalStorageAdapter, StaticConfigAdapter } from '@/lib/adapters'
import { isPublishedMode } from '@/lib/adapters/adapter-provider'

export interface User {
  id: string
  name: string
  username: string
  handle: string
  avatar: string
  bio: string
  title: string
  affiliation: string
  location: string
  research_interests: string[]
  social_links?: Record<string, string>
  eventTagIds?: string[]
  isFollowing: boolean
  followStatus: 'not_following' | 'following' | 'requested'
  followReason?: string | null
  followDate?: string | null
}

interface UseUserResult {
  user: User | null
  loading: boolean
  error: string | null
}

interface FollowRecord {
  followingId: string
}

// 缓存用户数据
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟
const userCache = new Map<string, { user: User; timestamp: number }>()

// 请求去重 - 存储正在进行中的请求
const ongoingRequests = new Map<string, Promise<User>>()

// 清除过期缓存
function clearExpiredCache() {
  const now = Date.now()
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      userCache.delete(key)
    }
  }
}

// 每分钟清理一次缓存
setInterval(clearExpiredCache, 60 * 1000)

// 监听缓存清除事件
if (typeof window !== 'undefined') {
  window.addEventListener('clear-user-cache', () => {
    void 0
    userCache.clear()
  })
}

// 使缓存失效
export function invalidateUserCache(userId: string, updates: Partial<User>) {
  const cached = userCache.get(userId)
  if (cached) {
    userCache.set(userId, {
      user: { ...cached.user, ...updates },
      timestamp: Date.now()
    })
  }
}

const USER_DATA_UPDATED_EVENT = 'user-data-updated'

interface UserDataUpdateDetail {
  identifiers: string[]
  updates: Partial<User>
}

export function broadcastUserDataUpdate(identifiers: string[], updates: Partial<User>) {
  if (!identifiers.length || Object.keys(updates).length === 0) {
    return
  }

  // 更新本地缓存
  identifiers.forEach((identifier) => {
    const cached = userCache.get(identifier)
    if (cached) {
      userCache.set(identifier, {
        user: { ...cached.user, ...updates },
        timestamp: Date.now(),
      })
    }
  })

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<UserDataUpdateDetail>(USER_DATA_UPDATED_EVENT, {
        detail: {
          identifiers,
          updates,
        },
      }),
    )
  }
}

export function useUser(userIdOrUsername: string | null | undefined): UseUserResult {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const previousUserIdRef = useRef<string | null | undefined>(null)

  useEffect(() => {
    // 如果 userIdOrUsername 没有变化，跳过执行
    if (userIdOrUsername === previousUserIdRef.current) {
      return
    }
    previousUserIdRef.current = userIdOrUsername

    if (!userIdOrUsername) {
      setUser(null)
      setLoading(false)
      setError(null)
      return
    }

    // 检查缓存
    const cached = userCache.get(userIdOrUsername)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      // 只有当用户数据真的不同时才更新状态，避免不必要的重新渲染
      setUser(prevUser => {
        if (prevUser?.id === cached.user.id) {
          return prevUser // 返回相同的引用，避免重新渲染
        }
        return cached.user
      })
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    let cancelled = false

    const fetchUser = async () => {
      try {
        // 检查是否有正在进行的请求，避免重复请求
        const existingRequest = ongoingRequests.get(userIdOrUsername)
        if (existingRequest) {
          void 0
          const userData = await existingRequest
          if (!cancelled) {
            setUser(userData)
            setLoading(false)
          }
          return
        }

        // Read profile data from the appropriate adapter based on current mode
        let profileData = null;
        try {
          if (isPublishedMode()) {
            const staticAdapter = new StaticConfigAdapter();
            await staticAdapter.loadConfig();
            profileData = await staticAdapter.getProfile();
          } else {
            const adapter = new LocalStorageAdapter();
            profileData = await adapter.getProfile();
          }
        } catch (err) {
          console.warn('Failed to load profile data:', err);
        }

        const requestPromise = Promise.resolve({
          id: 'local-user-' + userIdOrUsername,
          // 优先使用 name 字段，fallback 到 title，最后是 userIdOrUsername
          name: profileData?.name || profileData?.title || userIdOrUsername || 'User',
          username: userIdOrUsername,
          handle: userIdOrUsername,
          avatar: profileData?.avatar || '',
          bio: profileData?.bio || '',
          title: profileData?.title || '',
          affiliation: profileData?.institution || '',
          location: profileData?.location || '',
          research_interests: profileData?.research_interests || [],
          social_links: profileData?.social_links || {},
          eventTagIds: profileData?.eventTagIds || [],
          isFollowing: false,
          followStatus: 'not_following' as const,
        })
        
        ongoingRequests.set(userIdOrUsername, requestPromise)

        const userData: User = await requestPromise
        
        if (cancelled) {
          return
        }
        
        // 缓存结果
        userCache.set(userIdOrUsername, {
          user: userData,
          timestamp: Date.now()
        })

        setUser(userData)
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching user:', err)
          setError(err instanceof Error ? err.message : 'Failed to fetch user')
          setUser(null)
        }
      } finally {
        // 清除正在进行的请求
        ongoingRequests.delete(userIdOrUsername)
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchUser()

    return () => {
      cancelled = true
    }
  }, [userIdOrUsername])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleUserDataUpdate = (event: Event) => {
      if (!userIdOrUsername) {
        return
      }

      const detail = (event as CustomEvent<UserDataUpdateDetail>).detail
      if (!detail || !detail.identifiers?.length) {
        return
      }

      if (!detail.identifiers.includes(userIdOrUsername)) {
        return
      }

      setUser(prevUser => {
        if (!prevUser) {
          return prevUser
        }

        const updatedUser: User = {
          ...prevUser,
          ...detail.updates,
        }

        userCache.set(userIdOrUsername, {
          user: updatedUser,
          timestamp: Date.now(),
        })

        return updatedUser
      })
    }

    window.addEventListener(USER_DATA_UPDATED_EVENT, handleUserDataUpdate as EventListener)

    return () => {
      window.removeEventListener(USER_DATA_UPDATED_EVENT, handleUserDataUpdate as EventListener)
    }
  }, [userIdOrUsername])

  return { user, loading, error }
}

// Hook for fetching multiple users
export function useUsers(): {
  users: User[]
  loading: boolean
  error: string | null
  searchUsers: (search?: string, limit?: number) => Promise<void>
  refetch: () => Promise<void>
} {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async (search?: string, limit = 20) => {
    setLoading(true)
    setError(null)

    try {
      // API removed - return empty array
      setUsers([])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (search?: string, limit?: number) => {
    await fetchUsers(search, limit)
  }

  const refetch = async () => {
    await fetchUsers()
  }

  return { users, loading, error, searchUsers, refetch }
}

// Hook for managing current user's following list
export function useFollowingList(): {
  followingList: Set<string>
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  addToFollowing: (userId: string) => void
  removeFromFollowing: (userId: string) => void
} {
  const [followingList, setFollowingList] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFollowingList = async () => {
    setLoading(true)
    setError(null)

    try {
      // API removed - return empty list for profile-only version
      setFollowingList(new Set())
      void 0
    } catch (err) {
      console.error('Error fetching following list:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch following list')
      setFollowingList(new Set())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFollowingList()
  }, [])

  const addToFollowing = (userId: string) => {
    setFollowingList(prev => new Set([...prev, userId]))
  }

  const removeFromFollowing = (userId: string) => {
    setFollowingList(prev => {
      const newSet = new Set(prev)
      newSet.delete(userId)
      return newSet
    })
  }

  const refetch = async () => {
    await fetchFollowingList()
  }

  return { 
    followingList, 
    loading, 
    error, 
    refetch, 
    addToFollowing, 
    removeFromFollowing 
  }
} 
