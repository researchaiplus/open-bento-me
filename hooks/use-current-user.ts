"use client";

import { useState, useEffect } from 'react';
import { LocalStorageAdapter } from '@/lib/adapters';

export interface CurrentUser {
  id: string;
  name: string;
  username: string;
  email: string;
  eventTagIds?: string[];
  profile?: {
    name?: string;       // 用户显示名称
    avatar?: string;
    bio?: string;
    title?: string;      // 职位/头衔
    institution?: string;
    location?: string;
    website?: string;
    social_links?: Record<string, string>;
    research_interests?: string[];
    eventTagIds?: string[];  // Event 标签 ID 列表
  } | null;
}

// 创建 adapter 实例用于读取 profile 数据
const localStorageAdapter = new LocalStorageAdapter();

// 请求去重 - 全局单例，避免多个组件同时请求
let ongoingRequest: Promise<CurrentUser | null> | null = null;
let cachedUser: CurrentUser | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟
const CURRENT_USER_UPDATED_EVENT = 'current-user-updated';

// 导出清除缓存的函数，供其他模块使用
export function clearCurrentUserCache() {
  cachedUser = null;
  cacheTimestamp = 0;
  ongoingRequest = null;
  void 0;
}

function mergeCurrentUser(updates: Partial<CurrentUser>): CurrentUser | null {
  if (!cachedUser) {
    return null;
  }

  const mergedProfile =
    updates.profile !== undefined
      ? {
          ...(cachedUser.profile ?? {}),
          ...(updates.profile ?? {}),
        }
      : cachedUser.profile ?? null;

  return {
    ...cachedUser,
    ...updates,
    profile: mergedProfile,
  };
}

export function broadcastCurrentUserUpdate(updates: Partial<CurrentUser>) {
  const mergedUser = mergeCurrentUser(updates);
  if (!mergedUser) {
    return;
  }

  cachedUser = mergedUser;
  cacheTimestamp = Date.now();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<{ user: CurrentUser }>(CURRENT_USER_UPDATED_EVENT, {
        detail: { user: mergedUser },
      }),
    );
  }
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        // 检查缓存是否有效
        if (cachedUser && Date.now() - cacheTimestamp < CACHE_DURATION) {
          void 0;
          setUser(cachedUser);
          setLoading(false);
          return;
        }

        // 如果已有请求正在进行，复用该请求
        if (ongoingRequest) {
          void 0;
          const userData = await ongoingRequest;
          setUser(userData);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        // API routes removed - 从 localStorage 读取 profile 数据
        let profileData = null;
        try {
          profileData = await localStorageAdapter.getProfile();
        } catch (err) {
          console.warn('Failed to load profile from localStorage:', err);
        }

        ongoingRequest = Promise.resolve({
          id: 'local-user',
          // 优先使用 name 字段，fallback 到 title，最后是默认值
          name: profileData?.name || profileData?.title || 'Local User',
          username: 'user',
          email: 'user@example.com',
          eventTagIds: profileData?.eventTagIds || [],  // 包含 Event to Go 选择
          profile: profileData ? {
            name: profileData.name ?? undefined,
            avatar: profileData.avatar ?? undefined,
            bio: profileData.bio ?? undefined,
            title: profileData.title ?? undefined,
            institution: profileData.institution ?? undefined,
            location: profileData.location ?? undefined,
            website: profileData.website ?? undefined,
            social_links: profileData.social_links ?? {},
            research_interests: profileData.research_interests ?? [],
            eventTagIds: profileData.eventTagIds ?? [],  // 也在 profile 中包含
          } : null
        });

        const userData = await ongoingRequest;
        
        // 更新缓存
        cachedUser = userData;
        cacheTimestamp = Date.now();
        
        setUser(userData);
      } catch (err) {
        console.error('Error fetching current user:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user');
        setUser(null);
      } finally {
        ongoingRequest = null;
        setLoading(false);
      }
    };

    // 监听 profile 更新事件，清除缓存并重新加载
    const handleProfileUpdate = () => {
      void 0;
      clearCurrentUserCache();
      fetchCurrentUser();
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    fetchCurrentUser();

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleCacheUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ user: CurrentUser }>).detail;
      if (!detail?.user) {
        return;
      }

      cachedUser = detail.user;
      cacheTimestamp = Date.now();
      setUser(detail.user);
    };

    window.addEventListener(CURRENT_USER_UPDATED_EVENT, handleCacheUpdate as EventListener);
    return () => {
      window.removeEventListener(CURRENT_USER_UPDATED_EVENT, handleCacheUpdate as EventListener);
    };
  }, []);

  return {
    user,
    userId: user?.id || null,
    loading,
    error
  };
} 
