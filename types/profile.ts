// Profile API 响应类型
export interface ProfileData {
  id: string
  name: string | null          // 用户显示名称（与 title/职位不同）
  bio: string | null
  avatar: string | null
  title: string | null         // 职位/头衔 (e.g. "Professor", "PhD Student")
  institution: string | null
  location: string | null
  website: string | null
  userId: string
  createdAt: string
  updatedAt: string
  social_links: Record<string, string> | null
  research_interests: string[]
  is_verified: boolean
  eventTagIds?: string[]       // Event 标签 ID 列表
  
  // 协作选项
  seeking_items: string[]      // SeekingOption 枚举值数组
  offering_items: string[]     // OfferingOption 枚举值数组
}

// Profile 更新请求类型
export interface ProfileUpdateData {
  name?: string | null          // 用户显示名称
  bio?: string | null
  avatar?: string | null
  title?: string | null         // 职位/头衔
  institution?: string | null
  location?: string | null
  website?: string | null
  social_links?: Record<string, string> | null
  research_interests?: string[]
  is_verified?: boolean
  eventTagIds?: string[]       // Event 标签 ID 列表
  
  // 协作选项
  seeking_items?: string[]     // 更新用户想要的东西
  offering_items?: string[]   // 更新用户提供的东西
}

// 添加字段类型定义
export type ProfileField = keyof ProfileUpdateData

// 添加批量更新类型
export interface ProfileBatchUpdate {
  updates: ProfileUpdateData
  onSuccess?: () => void
  onError?: (error: Error) => void
} 