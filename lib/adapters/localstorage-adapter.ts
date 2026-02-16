/**
 * LocalStorage Adapter
 *
 * Adapter implementation that uses browser localStorage and IndexedDB
 * for offline-first data storage in GitHub Pages deployment.
 */

import { ProfileDataAdapter, ProfileConfig, AdapterBentoItem } from './index'
import { ProfileData, ProfileUpdateData } from '@/types/profile'
import { BentoItem } from '@/types/bento'
import { getSitePrefix } from '@/lib/utils/get-site-prefix'

const STORAGE_KEYS = {
  PROFILE: 'profile:profile',
  BENTO_ITEMS: 'profile:bento-items',
  METADATA: 'profile:metadata',
}

export interface LocalStorageAdapterOptions {
  namespace?: string
}

export class LocalStorageAdapter implements ProfileDataAdapter {
  private namespace: string

  constructor(options: LocalStorageAdapterOptions = {}) {
    // Include site prefix in namespace to isolate data per repo on shared origins
    // e.g., on lizabethli.github.io/liz-test → namespace = "liz-test:profile"
    // on lizabethli.github.io/liz → namespace = "liz:profile"
    // local dev (no prefix) → namespace = "profile"
    const sitePrefix = getSitePrefix()
    const base = options.namespace || 'profile'
    this.namespace = sitePrefix ? `${sitePrefix}:${base}` : base
  }

  getAdapterName(): string {
    return 'LocalStorageAdapter'
  }

  private isClient(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isClient()) {
      return false
    }
    try {
      const testKey = `${this.namespace}:test`
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      return false
    }
  }

  // Generate unique ID for new items
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Profile operations
  async getProfile(): Promise<ProfileData | null> {
    if (!this.isClient()) {
      return null
    }

    try {
      const data = localStorage.getItem(`${this.namespace}:${STORAGE_KEYS.PROFILE}`)
      if (!data) {
        return null
      }

      const profile = JSON.parse(data)
      return {
        id: profile.id || 'local-profile',
        name: profile.name || null,  // 用户显示名称
        bio: profile.bio || null,
        avatar: profile.avatar || null,
        title: profile.title || null,
        institution: profile.institution || null,
        location: profile.location || null,
        website: profile.website || null,
        userId: profile.userId || 'local-user',
        createdAt: profile.createdAt || new Date().toISOString(),
        updatedAt: profile.updatedAt || new Date().toISOString(),
        // Support both snake_case (from updateProfile) and camelCase (legacy/imported data)
        social_links: profile.social_links || profile.socialLinks || {},
        research_interests: profile.research_interests || profile.researchInterests || [],
        is_verified: false,
        eventTagIds: profile.eventTagIds || [],
        seeking_items: profile.seekingItems || [],
        offering_items: profile.offeringItems || [],
      }
    } catch (error) {
      console.error('Error fetching profile from localStorage:', error)
      return null
    }
  }

  async updateProfile(data: Partial<ProfileUpdateData>): Promise<void> {
    if (!this.isClient()) {
      return
    }

    try {
      const existing = await this.getProfile()
      const updated: ProfileData = {
        id: existing?.id || 'local-profile',
        name: data.name ?? existing?.name ?? null,  // 用户显示名称
        bio: data.bio ?? existing?.bio ?? null,
        avatar: data.avatar ?? existing?.avatar ?? null,
        title: data.title ?? existing?.title ?? null,
        institution: data.institution ?? existing?.institution ?? null,
        location: data.location ?? existing?.location ?? null,
        website: data.website ?? existing?.website ?? null,
        userId: existing?.userId || 'local-user',
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        social_links: data.social_links ?? existing?.social_links ?? {},
        research_interests: data.research_interests ?? existing?.research_interests ?? [],
        is_verified: existing?.is_verified || false,
        eventTagIds: data.eventTagIds ?? existing?.eventTagIds ?? [],  // 正确更新 eventTagIds
        seeking_items: data.seeking_items ?? existing?.seeking_items ?? [],
        offering_items: data.offering_items ?? existing?.offering_items ?? [],
      }

      localStorage.setItem(
        `${this.namespace}:${STORAGE_KEYS.PROFILE}`,
        JSON.stringify(updated)
      )
    } catch (error) {
      console.error('Error updating profile in localStorage:', error)
      throw error
    }
  }

  // Bento Grid operations
  async getBentoItems(): Promise<BentoItem[]> {
    if (!this.isClient()) {
      return []
    }

    try {
      const data = localStorage.getItem(`${this.namespace}:${STORAGE_KEYS.BENTO_ITEMS}`)
      if (!data) {
        return []
      }

      const items = JSON.parse(data)
      return items.map((item: any) => ({
        id: item.id,
        userId: item.userId || 'local-user',
        type: item.type || 'text',
        width: item.w || item.width || item.size?.w || 1,
        height: item.h || item.height || item.size?.h || 1,
        position: {
          x: item.x || item.position?.x || 0,
          y: item.y || item.position?.y || 0,
        },
        layout: null,
        metadata: item.metadata || item.content || {},
        // url may be stored at top-level or inside content (for link cards)
        url: item.url || item.content?.url || null,
        className: item.className || null,
        createdAt: new Date(item.createdAt || Date.now()),
        updatedAt: new Date(item.updatedAt || Date.now()),
        image_scale: item.imageTransform?.scale || item.image_scale,
        image_position_x: item.imageTransform?.positionX || item.image_position_x,
        image_position_y: item.imageTransform?.positionY || item.image_position_y,
        eventTagIds: item.eventTagIds || [],
        // 保留所有其他字段
        text: item.text,
        savedTitle: item.savedTitle,
        savedImage: item.savedImage,
        imageUrl: item.imageUrl,
        // GitHub/HuggingFace 仓库相关字段
        owner: item.owner || item.content?.owner,
        repo: item.repo || item.content?.repo,
        platform: item.platform || item.content?.platform,
        savedDescription: item.savedDescription || item.content?.savedDescription,
        language: item.language || item.content?.language,
        languageColor: item.languageColor || item.content?.languageColor,
        stars: item.stars ?? item.content?.stars,
        topics: item.topics || item.content?.topics,
        category: item.category || item.content?.category,
        downloads: item.downloads ?? item.content?.downloads,
        likes: item.likes ?? item.content?.likes,
      }))
    } catch (error) {
      console.error('Error fetching bento items from localStorage:', error)
      return []
    }
  }

  async addBentoItem(item: Omit<AdapterBentoItem, 'id'>): Promise<AdapterBentoItem> {
    try {
      const existingItems = await this.getBentoItems()
      const newItem: AdapterBentoItem = {
        id: this.generateId(),
        type: item.type,
        content: item.content,
        position: item.position,
        size: item.size,
        imageTransform: item.imageTransform,
      }

      const newItems = [...existingItems.map(this.bentoToAdapter), newItem]
      localStorage.setItem(
        `${this.namespace}:${STORAGE_KEYS.BENTO_ITEMS}`,
        JSON.stringify(newItems)
      )

      return newItem
    } catch (error) {
      console.error('Error adding bento item to localStorage:', error)
      throw error
    }
  }

  async updateBentoItem(id: string, updates: Partial<AdapterBentoItem> | any): Promise<void> {
    try {
      const existingItems = await this.getBentoItems()
      const itemIndex = existingItems.findIndex(item => item.id === id)

      if (itemIndex === -1) {
        throw new Error(`Bento item with id ${id} not found`)
      }

      const existingItem = this.bentoToAdapter(existingItems[itemIndex])

      // 特殊处理：合并 content/metadata 字段
      // 如果 updates 包含 metadata（来自 handleItemUpdate），需要与现有的 content 合并
      let mergedContent = existingItem.content;
      if (updates.content) {
        mergedContent = { ...existingItem.content, ...updates.content };
      } else if ((updates as any).metadata) {
        // handleItemUpdate 传递的是 metadata 字段，需要合并到 content
        mergedContent = { ...existingItem.content, ...(updates as any).metadata };
      }

      // 处理 BoxUpdateInput 格式的字段，转换为 AdapterBentoItem 格式
      const updatePayload: Partial<AdapterBentoItem> = {};
      
      // 转换 width/height 到 size.w/size.h
      if ((updates as any).width !== undefined || (updates as any).height !== undefined) {
        updatePayload.size = {
          w: (updates as any).width ?? existingItem.size.w,
          h: (updates as any).height ?? existingItem.size.h,
        };
      } else if (updates.size) {
        updatePayload.size = updates.size;
      }
      
      // 转换 position 字段（BoxUpdateInput 可能有复杂的 position 对象）
      if ((updates as any).position) {
        const pos = (updates as any).position;
        // 如果 position 有 x 和 y，提取它们
        if (pos.x !== undefined || pos.y !== undefined) {
          updatePayload.position = {
            x: pos.x ?? existingItem.position.x,
            y: pos.y ?? existingItem.position.y,
          };
        }
      } else if (updates.position) {
        updatePayload.position = updates.position;
      }
      
      // 处理其他字段
      if (updates.type) updatePayload.type = updates.type;
      if (updates.imageTransform) updatePayload.imageTransform = updates.imageTransform;

      // Build the final updated AdapterBentoItem with merged content
      const updatedItem: AdapterBentoItem = {
        ...existingItem,
        ...updatePayload,
        id,
        content: mergedContent,
        // 确保 size 和 position 字段存在
        size: updatePayload.size || existingItem.size,
        position: updatePayload.position || existingItem.position,
      }

      // Convert all existing BentoItems back to AdapterBentoItem format for storage
      const newItems = [...existingItems.map(this.bentoToAdapter)]
      // IMPORTANT: updatedItem is already in AdapterBentoItem format (has .content, not .metadata),
      // so we must NOT call bentoToAdapter() on it again — that would read .metadata (undefined)
      // and wipe all content data to {}.
      newItems[itemIndex] = updatedItem

      localStorage.setItem(
        `${this.namespace}:${STORAGE_KEYS.BENTO_ITEMS}`,
        JSON.stringify(newItems)
      )
    } catch (error) {
      console.error('Error updating bento item in localStorage:', error)
      throw error
    }
  }

  /**
   * Batch update positions and sizes for multiple bento items in a single read-write cycle.
   * This avoids race conditions caused by concurrent individual updateBentoItem calls,
   * where each call reads ALL items, updates one, and writes ALL back — the last writer wins.
   */
  async batchUpdatePositions(
    updates: Array<{ id: string; x: number; y: number; w: number; h: number }>
  ): Promise<void> {
    try {
      const existingItems = await this.getBentoItems()
      // Convert all to adapter format for storage
      const adapterItems = existingItems.map(item => this.bentoToAdapter(item))

      // Apply all position/size updates
      for (const update of updates) {
        const idx = adapterItems.findIndex(item => item.id === update.id)
        if (idx === -1) continue
        adapterItems[idx] = {
          ...adapterItems[idx],
          position: { x: update.x, y: update.y },
          size: { w: update.w, h: update.h },
        }
      }

      localStorage.setItem(
        `${this.namespace}:${STORAGE_KEYS.BENTO_ITEMS}`,
        JSON.stringify(adapterItems)
      )
    } catch (error) {
      console.error('Error batch updating bento items in localStorage:', error)
      throw error
    }
  }

  async deleteBentoItem(id: string): Promise<void> {
    try {
      const existingItems = await this.getBentoItems()
      const filteredItems = existingItems.filter(item => item.id !== id)

      localStorage.setItem(
        `${this.namespace}:${STORAGE_KEYS.BENTO_ITEMS}`,
        JSON.stringify(filteredItems.map(this.bentoToAdapter))
      )
    } catch (error) {
      console.error('Error deleting bento item from localStorage:', error)
      throw error
    }
  }

  /**
   * Get metadata from localStorage (version, lastModified).
   * Used by seedLocalStorageFromStaticConfig to compare timestamps.
   */
  async getMetadata(): Promise<{ version: string; lastModified: string } | null> {
    if (!this.isClient()) return null
    try {
      const data = localStorage.getItem(`${this.namespace}:${STORAGE_KEYS.METADATA}`)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  /**
   * Update metadata in localStorage.
   * Called after successful publish to record the published timestamp.
   */
  async updateMetadata(metadata: { version: string; lastModified: string }): Promise<void> {
    if (!this.isClient()) return
    localStorage.setItem(
      `${this.namespace}:${STORAGE_KEYS.METADATA}`,
      JSON.stringify(metadata)
    )
  }

  // Export/Import operations
  exportConfig(): ProfileConfig {
    const profileData = localStorage.getItem(`${this.namespace}:${STORAGE_KEYS.PROFILE}`)
    const bentoData = localStorage.getItem(`${this.namespace}:${STORAGE_KEYS.BENTO_ITEMS}`)

    const profile = profileData ? JSON.parse(profileData) : {}
    const bentoItems = bentoData ? JSON.parse(bentoData) : []

    return {
      profile: {
        name: profile.name || null,
        avatar: profile.avatar || null,
        bio: profile.bio || null,
        username: profile.username || 'anonymous',
        socialLinks: profile.socialLinks || {},
        title: profile.title || null,
        institution: profile.institution || null,
        location: profile.location || null,
        website: profile.website || null,
        researchInterests: profile.researchInterests || [],
        eventTagIds: profile.eventTagIds || [],
        seekingItems: profile.seeking_items || profile.seekingItems || [],
        offeringItems: profile.offering_items || profile.offeringItems || [],
      },
      bentoGrid: {
        items: bentoItems.map((item: AdapterBentoItem) => ({
          id: item.id,
          type: item.type,
          content: item.content,
          layout: {
            x: item.position.x,
            y: item.position.y,
            w: item.size.w,
            h: item.size.h,
          },
        })),
      },
      metadata: {
        version: '1.0.0',
        lastModified: new Date().toISOString(),
      },
    }
  }

  async importConfig(config: ProfileConfig): Promise<void> {
    try {
      // Import profile data
      localStorage.setItem(
        `${this.namespace}:${STORAGE_KEYS.PROFILE}`,
        JSON.stringify(config.profile)
      )

      // Import bento items
      localStorage.setItem(
        `${this.namespace}:${STORAGE_KEYS.BENTO_ITEMS}`,
        JSON.stringify(
          config.bentoGrid.items.map(item => ({
            id: item.id,
            type: item.type,
            content: item.content,
            position: {
              x: item.layout.x,
              y: item.layout.y,
            },
            size: {
              w: item.layout.w,
              h: item.layout.h,
            },
          }))
        )
      )

      // Update metadata
      localStorage.setItem(
        `${this.namespace}:${STORAGE_KEYS.METADATA}`,
        JSON.stringify(config.metadata)
      )
    } catch (error) {
      console.error('Error importing config to localStorage:', error)
      throw error
    }
  }

  // Helper to convert BentoItem to AdapterBentoItem
  private bentoToAdapter(item: BentoItem): AdapterBentoItem {
    return {
      id: item.id,
      type: item.type,
      content: item.metadata || {},
      position: {
        x: item.position?.x || 0,
        y: item.position?.y || 0,
      },
      size: {
        w: item.width || 1,
        h: item.height || 1,
      },
      imageTransform: {
        scale: item.image_scale || undefined,
        positionX: item.image_position_x || undefined,
        positionY: item.image_position_y || undefined,
      },
    }
  }
}
