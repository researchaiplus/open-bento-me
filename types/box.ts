/**
 * Box type definitions for the open-source static version.
 * Replaces the previous Prisma-based types with standalone definitions.
 */

// Box metadata - flexible key-value store for card-specific data
export interface BoxMetadata {
  imageUrl?: string
  savedImage?: string
  savedTitle?: string | null
  url?: string
  [key: string]: any  // 允许任意字符串键
}

// Box types matching the original Prisma BoxType enum
// Note: PAPER and PROJECT types have been removed
export type BoxType =
  | 'GITHUB'
  | 'IMAGE'
  | 'PEOPLE'
  | 'TEXT'
  | 'LINK'
  | 'SECTION_TITLE'
  | 'NEED'

// Box interface - standalone definition replacing Prisma's generated type
export interface Box {
  id: string
  type: BoxType
  title: string | null
  content: string | null
  url: string | null
  metadata: BoxMetadata
  position_x: number
  position_y: number
  width: number
  height: number
  image_scale: number | null
  image_position_x: number | null
  image_position_y: number | null
  order: number
  userId: string | null
  createdAt: Date
  updatedAt: Date
  eventTagIds?: string[]
}
