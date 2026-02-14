/**
 * Profile Data Adapter Interface
 *
 * Abstract data storage layer that hides the differences between
 * database and browser storage solutions, enabling the same code
 * to work with both database-backed deployments and GitHub Pages
 * static deployments.
 */

import { ProfileData, ProfileUpdateData } from '@/types/profile'
import { BentoItem } from '@/types/bento'

export * from './localstorage-adapter'
export * from './static-config-adapter'

/**
 * Configuration file structure for profile data
 */
export interface ProfileConfig {
  profile: {
    name?: string | null
    avatar: string | null
    bio: string | null
    username: string
    socialLinks: Record<string, string> | null
    title?: string | null
    institution?: string | null
    location?: string | null
    website?: string | null
    researchInterests?: string[]
    eventTagIds?: string[]
    seekingItems?: string[]
    offeringItems?: string[]
  }
  bentoGrid: {
    items: Array<{
      id: string
      type: string
      content: any
      layout: {
        x: number
        y: number
        w: number
        h: number
      }
    }>
  }
  metadata: {
    version: string
    lastModified: string
  }
}

/**
 * Bento item for adapter operations (simplified from BentoItem)
 */
export interface AdapterBentoItem {
  id: string
  type: string
  content: any
  position: {
    x: number
    y: number
  }
  size: {
    w: number
    h: number
  }
  imageTransform?: {
    scale?: number
    positionX?: number
    positionY?: number
  }
}

/**
 * Profile data adapter interface
 * Defines the contract for all profile data operations
 */
export interface ProfileDataAdapter {
  // Profile operations
  getProfile(): Promise<ProfileData | null>
  updateProfile(data: Partial<ProfileUpdateData>): Promise<void>

  // Bento Grid operations
  getBentoItems(): Promise<BentoItem[]>
  addBentoItem(item: Omit<AdapterBentoItem, 'id'>): Promise<AdapterBentoItem>
  updateBentoItem(id: string, updates: Partial<AdapterBentoItem>): Promise<void>
  deleteBentoItem(id: string): Promise<void>

  // Export/Import operations
  exportConfig(): ProfileConfig
  importConfig(config: ProfileConfig): Promise<void>

  // Adapter information
  getAdapterName(): string
  isAvailable(): Promise<boolean>
}