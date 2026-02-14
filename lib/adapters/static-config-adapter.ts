/**
 * Static Config Adapter
 *
 * Read-only adapter that loads profile data from a static `profile-config.json` file.
 * Used in published/deployed mode (e.g., GitHub Pages) where data has been pre-baked
 * into a JSON file by the PublishService. All write operations are no-ops since the
 * published site is read-only.
 *
 * Key Features:
 * - Fetches profile and bento items from `/profile-config.json`
 * - Converts the `ProfileConfig` format into `ProfileData` and `BentoItem[]`
 * - All mutation methods (update, add, delete) are no-ops
 * - Supports `basePath` for GitHub Pages sub-path deployments
 *
 * Data Flow:
 *   PublishService.publish() → profile-config.json (on GitHub)
 *     → GitHub Actions builds static site
 *     → StaticConfigAdapter.loadConfig() fetches the JSON at runtime
 *     → Profile + BentoGrid render in read-only mode
 */

import { ProfileDataAdapter, ProfileConfig, AdapterBentoItem } from './index'
import { ProfileData, ProfileUpdateData } from '@/types/profile'
import { BentoItem } from '@/types/bento'

export class StaticConfigAdapter implements ProfileDataAdapter {
  private config: ProfileConfig | null = null
  private loaded = false
  private loadPromise: Promise<void> | null = null

  getAdapterName(): string {
    return 'StaticConfigAdapter'
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.ensureLoaded()
      return this.config !== null
    } catch {
      return false
    }
  }

  /**
   * Load profile-config.json from the static site.
   * Uses NEXT_PUBLIC_BASE_PATH for GitHub Pages sub-path deployments.
   */
  async loadConfig(): Promise<void> {
    if (this.loaded) return
    if (this.loadPromise) return this.loadPromise

    this.loadPromise = (async () => {
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
        const res = await fetch(`${basePath}/profile-config.json`, {
          cache: 'no-store', // Always get the latest version
        })

        if (!res.ok) {
          console.warn(`StaticConfigAdapter: Failed to load profile-config.json (status ${res.status})`)
          this.config = null
          return
        }

        this.config = await res.json()
      } catch (error) {
        console.warn('StaticConfigAdapter: Error loading profile-config.json:', error)
        this.config = null
      } finally {
        this.loaded = true
      }
    })()

    return this.loadPromise
  }

  /**
   * Ensure config has been loaded before accessing data.
   */
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      await this.loadConfig()
    }
  }

  // ── Profile operations ──────────────────────────────────────────────

  async getProfile(): Promise<ProfileData | null> {
    await this.ensureLoaded()
    if (!this.config?.profile) return null

    const p = this.config.profile
    return {
      id: 'published-profile',
      name: p.name || null,
      bio: p.bio || null,
      avatar: p.avatar || null,
      title: p.title || null,
      institution: p.institution || null,
      location: p.location || null,
      website: p.website || null,
      userId: 'published-user',
      createdAt: this.config.metadata?.lastModified || new Date().toISOString(),
      updatedAt: this.config.metadata?.lastModified || new Date().toISOString(),
      // Support both camelCase (from export) and snake_case
      social_links: p.socialLinks || (p as any).social_links || {},
      research_interests: p.researchInterests || (p as any).research_interests || [],
      is_verified: false,
      eventTagIds: p.eventTagIds || [],
      seeking_items: p.seekingItems || (p as any).seeking_items || [],
      offering_items: p.offeringItems || (p as any).offering_items || [],
    }
  }

  /** No-op: published site is read-only */
  async updateProfile(_data: Partial<ProfileUpdateData>): Promise<void> {
    // no-op in published mode
  }

  // ── Bento Grid operations ───────────────────────────────────────────

  async getBentoItems(): Promise<BentoItem[]> {
    await this.ensureLoaded()
    if (!this.config?.bentoGrid?.items) return []

    return this.config.bentoGrid.items.map((item) => ({
      id: item.id,
      userId: 'published-user',
      type: item.type || 'text',
      width: item.layout?.w || 1,
      height: item.layout?.h || 1,
      position: {
        x: item.layout?.x || 0,
        y: item.layout?.y || 0,
      },
      layout: null,
      metadata: item.content || {},
      // url may be stored at top-level or inside content (for link cards)
      url: item.content?.url || null,
      className: null,
      createdAt: new Date(this.config?.metadata?.lastModified || Date.now()),
      updatedAt: new Date(this.config?.metadata?.lastModified || Date.now()),
      // Image transform fields from content
      image_scale: item.content?.image_scale,
      image_position_x: item.content?.image_position_x,
      image_position_y: item.content?.image_position_y,
      eventTagIds: item.content?.eventTagIds || [],
      // GitHub/HuggingFace repository fields (pre-baked by PublishService)
      owner: item.content?.owner,
      repo: item.content?.repo,
      platform: item.content?.platform,
      savedDescription: item.content?.savedDescription,
      language: item.content?.language,
      languageColor: item.content?.languageColor,
      stars: item.content?.stars,
      topics: item.content?.topics,
      category: item.content?.category,
      downloads: item.content?.downloads,
      likes: item.content?.likes,
    }))
  }

  /** No-op: published site is read-only */
  async addBentoItem(_item: Omit<AdapterBentoItem, 'id'>): Promise<AdapterBentoItem> {
    // Return a dummy item — this should never be called in published mode
    return { id: 'noop', type: 'text', content: {}, position: { x: 0, y: 0 }, size: { w: 1, h: 1 } }
  }

  /** No-op: published site is read-only */
  async updateBentoItem(_id: string, _updates: Partial<AdapterBentoItem>): Promise<void> {
    // no-op
  }

  /** No-op: published site is read-only */
  async deleteBentoItem(_id: string): Promise<void> {
    // no-op
  }

  // ── Export/Import ───────────────────────────────────────────────────

  exportConfig(): ProfileConfig {
    // Return the loaded config as-is, or an empty config
    return this.config || {
      profile: {
        avatar: null,
        bio: null,
        username: 'anonymous',
        socialLinks: {},
      },
      bentoGrid: { items: [] },
      metadata: {
        version: '1.0.0',
        lastModified: new Date().toISOString(),
      },
    }
  }

  /** No-op: published site is read-only */
  async importConfig(_config: ProfileConfig): Promise<void> {
    // no-op
  }
}
