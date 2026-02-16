/**
 * 头像缓存管理工具
 * 统一管理头像URL的缓存和同步
 */

import { prefixStorageKey } from '@/lib/utils/get-site-prefix'

// Prefix cache keys with site prefix to isolate per-repo on shared origins
const AVATAR_CACHE_KEY = prefixStorageKey('userAvatarUrl')
const USER_ID_CACHE_KEY = prefixStorageKey('currentUserId')

export class AvatarCacheManager {
  private static instance: AvatarCacheManager
  private currentUserId: string | null = null

  private constructor() {
    // 初始化时读取当前用户ID
    this.currentUserId = this.getStoredUserId()
  }

  static getInstance(): AvatarCacheManager {
    if (!AvatarCacheManager.instance) {
      AvatarCacheManager.instance = new AvatarCacheManager()
    }
    return AvatarCacheManager.instance
  }

  private getStoredUserId(): string | null {
    try {
      return localStorage.getItem(USER_ID_CACHE_KEY)
    } catch {
      return null
    }
  }

  private setStoredUserId(userId: string): void {
    try {
      localStorage.setItem(USER_ID_CACHE_KEY, userId)
      this.currentUserId = userId
    } catch (error) {
      console.warn('Failed to store user ID:', error)
    }
  }

  private getStoredAvatar(): string | null {
    try {
      return localStorage.getItem(AVATAR_CACHE_KEY)
    } catch {
      return null
    }
  }

  private setStoredAvatar(avatarUrl: string): void {
    try {
      localStorage.setItem(AVATAR_CACHE_KEY, avatarUrl)
    } catch (error) {
      console.warn('Failed to store avatar URL:', error)
    }
  }

  private clearStoredData(): void {
    try {
      localStorage.removeItem(AVATAR_CACHE_KEY)
      localStorage.removeItem(USER_ID_CACHE_KEY)
      this.currentUserId = null
    } catch (error) {
      console.warn('Failed to clear stored data:', error)
    }
  }

  /**
   * 检查用户是否发生变化
   */
  checkUserChange(newUserId: string): boolean {
    const hasChanged = this.currentUserId !== null && this.currentUserId !== newUserId
    if (hasChanged) {
      void 0
      this.clearStoredData()
    }
    this.setStoredUserId(newUserId)
    return hasChanged
  }

  /**
   * 获取缓存的头像URL
   */
  getCachedAvatar(): string | null {
    return this.getStoredAvatar()
  }

  /**
   * 设置头像URL到缓存
   */
  setCachedAvatar(avatarUrl: string): void {
    this.setStoredAvatar(avatarUrl)
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.clearStoredData()
    // 通知其他组件清除缓存
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('clear-user-cache'))
      window.dispatchEvent(new CustomEvent('avatar-cache-cleared'))
    }
  }

  /**
   * 同步头像URL（API数据优先）
   */
  syncAvatar(apiAvatar: string | null, cachedAvatar: string | null = null): string | null {
    const currentCached = cachedAvatar || this.getCachedAvatar()
    
    // API数据优先
    if (apiAvatar) {
      if (apiAvatar !== currentCached) {
        void 0
        this.setCachedAvatar(apiAvatar)
        // 触发更新事件
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('avatar-updated', {
            detail: { avatarUrl: apiAvatar }
          }))
        }
      }
      return apiAvatar
    }
    
    // 如果API没有数据，使用缓存
    if (currentCached) {
      void 0
      return currentCached
    }
    
    return null
  }
}

// 导出单例实例
export const avatarCache = AvatarCacheManager.getInstance()