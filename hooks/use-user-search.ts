"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import type { User } from './use-user'

interface UseUserSearchResult {
  users: User[]
  loading: boolean
  error: string | null
  hasMore: boolean
  searchTerm: string
  isInitialLoading: boolean
  searchUsers: (term: string) => Promise<void>
  loadMore: () => Promise<void>
  reset: () => void
  setSearchTerm: (term: string) => void
}

const INITIAL_LOAD_SIZE = 10
const LOAD_MORE_SIZE = 5

export function useUserSearch(): UseUserSearchResult {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [offset, setOffset] = useState(0)
  const [isSearchMode, setIsSearchMode] = useState(false)
  
  // 用于取消过期的请求
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentRequestIdRef = useRef(0)

  // 重置状态
  const reset = useCallback(() => {
    setUsers([])
    setOffset(0)
    setHasMore(true)
    setError(null)
    setIsSearchMode(false)
  }, [])

  // 获取关注的用户列表
  const fetchFollowingUsers = useCallback(async (offset: number, limit: number, signal?: AbortSignal) => {
    const params = new URLSearchParams({
      following: 'true',
      offset: offset.toString(),
      limit: limit.toString()
    })

    const response = await fetch(`/api/users?${params}`, { signal })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch following users: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }, [])

  // 搜索用户
  const searchUsersAPI = useCallback(async (search: string, offset: number, limit: number, signal?: AbortSignal) => {
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
      excludeCurrentUser: 'true'
    })

    // 如果搜索词以@开头，搜索用户名
    if (search.startsWith('@')) {
      const username = search.slice(1)
      if (username) {
        params.append('searchUsername', username)
      }
    } else if (search) {
      // 否则搜索姓名
      params.append('searchName', search)
    }

    const response = await fetch(`/api/users?${params}`, { signal })
    
    if (!response.ok) {
      throw new Error(`Failed to search users: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }, [])

  // 执行搜索或获取关注列表
  const performSearch = useCallback(async (term: string, isLoadMore = false) => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller
    const requestId = ++currentRequestIdRef.current

    try {
      const isSearch = term.trim() !== ''
      const currentOffset = isLoadMore ? offset : 0
      const limit = isLoadMore ? LOAD_MORE_SIZE : INITIAL_LOAD_SIZE

      if (!isLoadMore) {
        setLoading(true)
        setError(null)
        if (!isSearch) {
          setIsInitialLoading(true)
        }
      } else {
        setLoading(true)
      }

      let data
      if (isSearch) {
        data = await searchUsersAPI(term, currentOffset, limit, controller.signal)
        setIsSearchMode(true)
      } else {
        data = await fetchFollowingUsers(currentOffset, limit, controller.signal)
        setIsSearchMode(false)
      }

      // 检查请求是否已经过期
      if (requestId !== currentRequestIdRef.current) {
        return
      }

      const newUsers = data.users || []
      
      if (isLoadMore) {
        setUsers(prev => [...prev, ...newUsers])
      } else {
        setUsers(newUsers)
      }

      setOffset(currentOffset + newUsers.length)
      setHasMore(newUsers.length === limit)

    } catch (err) {
      // 检查是否是取消的请求
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      console.error('Error in performSearch:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
      
      if (!isLoadMore) {
        setUsers([])
        setOffset(0)
        setHasMore(false)
      }
    } finally {
      // 只有当前请求才更新loading状态
      if (requestId === currentRequestIdRef.current) {
        setLoading(false)
        setIsInitialLoading(false)
      }
    }
  }, [offset, searchUsersAPI, fetchFollowingUsers])

  // 搜索用户
  const searchUsers = useCallback(async (term: string) => {
    setSearchTerm(term)
    reset()
    await performSearch(term, false)
  }, [reset, performSearch])

  // 加载更多
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    await performSearch(searchTerm, true)
  }, [loading, hasMore, searchTerm, performSearch])

  // 初始加载关注的用户
  useEffect(() => {
    searchUsers('')
  }, []) // 只在组件挂载时执行一次

  // 清理函数
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    users,
    loading,
    error,
    hasMore,
    searchTerm,
    isInitialLoading,
    searchUsers,
    loadMore,
    reset,
    setSearchTerm
  }
} 