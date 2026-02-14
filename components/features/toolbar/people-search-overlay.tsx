"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, Check, X, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Portal } from "@radix-ui/react-portal"
import { getZIndexClass } from "@/lib/utils/z-index"
import { useUserSearch } from "@/hooks/use-user-search"
import type { User } from "@/hooks/use-user"

interface PeopleSearchOverlayProps {
  onClose: () => void
  onSelect: (users: User[]) => void
}

export function PeopleSearchOverlay({
  onClose,
  onSelect,
}: PeopleSearchOverlayProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const {
    users,
    loading,
    error,
    hasMore,
    searchTerm,
    isInitialLoading,
    searchUsers,
    loadMore,
    setSearchTerm
  } = useUserSearch()

  // 处理搜索输入
  const handleSearchChange = useCallback((value: string) => {
    setInputValue(value)
    
    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // 设置新的定时器进行防抖搜索
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(value.trim())
    }, 300)
  }, [searchUsers])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // 切换用户选择状态
  const toggleUser = useCallback((user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === user.id)
      if (isSelected) {
        return prev.filter(u => u.id !== user.id)
      } else if (prev.length < 4) {
        return [...prev, user]
      }
      return prev
    })
  }, [])

  // 处理滚动加载
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    
    // 当滚动到底部附近时触发加载更多
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loading) {
      loadMore()
    }
  }, [hasMore, loading, loadMore])

  // 确认选择
  const handleConfirm = useCallback(() => {
    onSelect(selectedUsers)
    onClose()
  }, [selectedUsers, onSelect, onClose])

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && selectedUsers.length > 0) {
      handleConfirm()
    }
  }, [onClose, handleConfirm, selectedUsers.length])

  // 点击背景关闭
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  // 阻止事件冒泡
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  return (
    <Portal>
      <div 
        className={`fixed inset-0 bg-black/20 flex items-center justify-center ${getZIndexClass('MODAL_OVERLAY')}`}
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div 
          className="w-[500px] bg-white rounded-xl border border-zinc-200 shadow-lg overflow-hidden"
          onClick={stopPropagation}
        >
          {/* 头部 */}
          <div className="p-4 border-b border-zinc-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-zinc-900">Add researchers</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search by name or use @ to search for usernames..."
                value={inputValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            
            {/* 搜索提示 */}
            <div className="mt-2 text-xs text-zinc-500">
              {searchTerm ? (
                searchTerm.startsWith('@') ? 
                  `Searching username: ${searchTerm.slice(1)}` : 
                  `Searching name: ${searchTerm}`
              ) : (
                "Your following users"
              )}
            </div>
          </div>

          {/* 用户列表 */}
          <div className="relative">
            {isInitialLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                <span className="ml-2 text-sm text-zinc-500">Loading...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <div className="text-sm text-red-500 mb-2">Loading failed</div>
                <div className="text-xs text-zinc-500">{error}</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => searchUsers(searchTerm)}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : users.length === 0 && !loading ? (
              <div className="p-8 text-center">
                <div className="text-sm text-zinc-500">
                  {searchTerm ? "No matching users found" : "You haven't followed anyone yet"}
                </div>
                {searchTerm && (
                  <div className="mt-1 text-xs text-zinc-400">
                    Try adjusting the search term or use @ to search for usernames
                  </div>
                )}
              </div>
            ) : (
              <div 
                ref={scrollRef}
                className="max-h-[400px] overflow-y-auto"
                onScroll={handleScroll}
              >
                <div className="p-2">
                  {users.map(user => {
                    const isSelected = selectedUsers.find(u => u.id === user.id)
                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleUser(user)}
                        disabled={!isSelected && selectedUsers.length >= 4}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 transition-colors text-left ${
                          isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                        } ${!isSelected && selectedUsers.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-zinc-900 truncate">
                              {user.name}
                            </span>
                            {user.username && (
                              <span className="text-xs text-zinc-500 flex-shrink-0">
                                @{user.username}
                              </span>
                            )}
                          </div>
                          {(user.title || user.bio) && (
                            <div className="text-xs text-zinc-500 truncate mt-0.5">
                              {user.title}{user.title && user.bio ? ' · ' : ''}{user.bio}
                            </div>
                          )}
                          {user.affiliation && (
                            <div className="text-xs text-zinc-400 truncate mt-0.5">
                              {user.affiliation}
                            </div>
                          )}
                        </div>
                        
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
                  
                  {/* 加载更多指示器 */}
                  {loading && users.length > 0 && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                      <span className="ml-2 text-xs text-zinc-500">Loading more...</span>
                    </div>
                  )}
                  
                  {/* 到底了的提示 */}
                  {!hasMore && users.length > 0 && !loading && (
                    <div className="text-center p-4 text-xs text-zinc-400">
                      All results displayed
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 底部操作栏 */}
          <div className="p-4 border-t border-zinc-100 bg-zinc-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-600">
                Selected {selectedUsers.length}/4 researchers
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} size="sm">
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirm} 
                  disabled={selectedUsers.length === 0}
                  size="sm"
                >
                  Confirm
                </Button>
              </div>
            </div>
            
            {/* 已选择的用户预览 */}
            {selectedUsers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div 
                    key={user.id}
                    className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-zinc-200"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-xs">{user.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-zinc-700">{user.name}</span>
                    <button
                      onClick={() => toggleUser(user)}
                      className="h-4 w-4 flex items-center justify-center hover:bg-zinc-100 rounded-full"
                    >
                      <X className="h-3 w-3 text-zinc-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
} 