"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { MapPin, Plus, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { EVENT_TAG_NAME_TO_ID, EVENT_TAG_ID_TO_NAME } from "@/lib/event-tags"

// First, add the Dialog imports at the top of the file with the other imports
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// Update the imports to include the SocialLinksManager component
import SocialLinksManager from "@/components/features/profile/social-links-manager"
import { getZIndexClass } from "@/lib/utils/z-index"

// 在文件顶部添加导入
import { useUser } from "@/context/user-context"
import { ProfileAvatar } from "@/components/features/profile/profile-avatar"
import { ImageCropper } from "@/components/common/image-cropper"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { useUser as useUserHook, broadcastUserDataUpdate, type User as CachedUser } from '@/hooks/use-user'
import { useCurrentUser, broadcastCurrentUserUpdate, type CurrentUser } from '@/hooks/use-current-user'
import { toast } from 'sonner'
import type { ProfileUpdateData } from '@/types/profile'
import type { SocialLinks } from "@/types/social-links"
import { buildSocialUrl, normalizeSocialLinks } from "@/lib/socialLinks"
import { EventTagSelector } from "./event-tags-selector"
import { ShareModal } from "./share-modal"
import { LocalStorageAdapter } from '@/lib/adapters'
import { isPublishedMode } from '@/lib/adapters/adapter-provider'

const EVENT_NAME_TO_ID = EVENT_TAG_NAME_TO_ID
const EVENT_ID_TO_NAME = EVENT_TAG_ID_TO_NAME

type NormalizeWebsiteOptions = {
  logOnInvalid?: boolean
}

const normalizeWebsiteUrl = (
  value?: string | null,
  options: NormalizeWebsiteOptions = {},
): string | null => {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const hasProtocol = /^https?:\/\//i.test(trimmed)
  const hasProtocolRelative = /^\/\//.test(trimmed)
  const candidate = hasProtocol
    ? trimmed
    : hasProtocolRelative
      ? `https:${trimmed}`
      : `https://${trimmed}`

  try {
    const url = new URL(candidate)
    return url.toString()
  } catch (error) {
    if (options.logOnInvalid) {
      console.warn('[Profile] Ignoring invalid website URL:', value, error)
    }
    return null
  }
}

const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  email: "",
  googleScholar: "",
  researchGate: "",
  orcid: "",
  github: "",
  linkedin: "",
  twitter: "",
  bluesky: "",
  medium: "",
  youtube: "",
  spotify: "",
  discord: "",
}

// 添加用户数据接口
interface UserData {
  username: string
  name: string
  bio: string
  profileImage?: string
  website?: string
  affiliation?: string
  location?: string
  socialLinks?: SocialLinks
  tags?: string[]
}

interface ProfileProps {
  isPublicView?: boolean
  userData?: UserData
  isEditable?: boolean
  profileUserId?: string // 个人资料页面的用户ID
  shareOfferings?: string[]
  shareSeeking?: string[]
}

// 更新组件定义，添加 props
export function Profile({
  isPublicView = false,
  userData,
  isEditable = true,
  profileUserId,
  shareOfferings = [],
  shareSeeking = [],
}: ProfileProps) {
  const { user: currentUser } = useCurrentUser()
  const usernameForProfile = currentUser?.username
  const { user: profileUser, loading: isProfileLoading, error: profileError } = useUserHook(usernameForProfile)
  const { updateAvatar, isUpdatingAvatar } = useUser() // 这个是来自context的useUser

  // 适配数据结构：将 useUser 返回的数据转换为 useProfile 的格式
  type ProfileData = {
    bio: string | null
    avatar: string | null | undefined
    title: string | null
    institution: string | null
    location: string | null
    website: string
    social_links: Record<string, string>
    research_interests: string[]
    eventTagIds?: string[]
  }

  const profile = useMemo<ProfileData | null>(() => {
    if (profileUser) {
      return {
        bio: profileUser.bio,
        avatar: profileUser.avatar,
        title: profileUser.title,
        institution: profileUser.affiliation,
        location: profileUser.location,
        website: '',
        social_links: profileUser.social_links || {},
        research_interests: profileUser.research_interests || [],
        eventTagIds: profileUser.eventTagIds || [],
      }
    }

    if (currentUser?.profile) {
      return {
        bio: currentUser.profile.bio,
        avatar: currentUser.profile.avatar,
        title: currentUser.profile.title,
        institution: currentUser.profile.institution,
        location: currentUser.profile.location,
        website: currentUser.profile.website || '',
        social_links: currentUser.profile.social_links || {},
        research_interests: currentUser.profile.research_interests || [],
        eventTagIds: currentUser?.eventTagIds || [],
      }
    }

    return null
  }, [profileUser, currentUser])

  const isLoading = isProfileLoading
  const error = profileError

  // 使用从缓存API获取的用户信息
  const [currentUserInfo, setCurrentUserInfo] = useState<{ id: string; name: string | null; username: string } | null>(null)

  // ProfileAvatar组件现在处理头像状态，这里不再需要本地状态

  // 使用缓存的用户信息 - 只在profileUser首次加载时设置
  useEffect(() => {
    if (isPublicView || currentUserInfo) return

    const source = profileUser || currentUser
    if (!source) return

    setCurrentUserInfo({
      id: source.id,
      name: source.name,
      username: source.username || usernameForProfile || ''
    })
    setName(source.name || "")
  }, [isPublicView, profileUser, currentUser, currentUserInfo, usernameForProfile])

  const cacheIdentifiers = useMemo(() => {
    const identifiers = new Set<string>()

    if (currentUserInfo?.username) identifiers.add(currentUserInfo.username)
    if (currentUserInfo?.id) identifiers.add(currentUserInfo.id)
    if (currentUser?.username) identifiers.add(currentUser.username)
    if (currentUser?.id) identifiers.add(currentUser.id)
    if (profileUser?.username) identifiers.add(profileUser.username)
    if (profileUser?.id) identifiers.add(profileUser.id)

    return Array.from(identifiers).filter((value): value is string => Boolean(value))
  }, [currentUserInfo, profileUser, currentUser])

  const syncUserCachesAfterProfileUpdate = useCallback(
    (userUpdates: Partial<CachedUser>, profileUpdates?: Partial<CurrentUser['profile']>) => {
      const hasUserUpdates = Object.keys(userUpdates).length > 0
      const hasProfileUpdates = !!(profileUpdates && Object.keys(profileUpdates).length > 0)

      if (hasUserUpdates && cacheIdentifiers.length > 0) {
        broadcastUserDataUpdate(cacheIdentifiers, userUpdates)
      }

      const currentUserPayload: Partial<CurrentUser> = {}
      if (userUpdates.name !== undefined) {
        currentUserPayload.name = userUpdates.name
      }
      if (hasProfileUpdates) {
        currentUserPayload.profile = profileUpdates
      }

      if (Object.keys(currentUserPayload).length > 0) {
        broadcastCurrentUserUpdate(currentUserPayload)
      }
    },
    [cacheIdentifiers],
  )

  // 修改头像上传完成的处理函数
  const handleCropComplete = async (croppedImageUrl: string) => {
    setShowCropper(false)
    setTempImageUrl(null)

    try {
      // 首先将 base64 转换为 File 对象
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'avatar.png', { type: 'image/png' })

      // 上传到图片服务器
      if (updateAvatar) {
        const newAvatarUrl = await updateAvatar(file)

        // 同步缓存 - updateAvatar 已经处理了本地存储和状态更新
        syncUserCachesAfterProfileUpdate(
          { avatar: newAvatarUrl },
          { avatar: newAvatarUrl },
        )
      }
    } catch (error) {
      console.error("Failed to update avatar:", error)
      setUploadError("Failed to update avatar")
      toast.error("Failed to update avatar")
      // ProfileAvatar组件会处理错误状态
    }
  }

  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [bio, setBio] = useState(profile?.bio || "")
  const bioTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTagValue, setNewTagValue] = useState("")
  const [tags, setTags] = useState(profile?.research_interests || userData?.tags || [])
  const tagInputRef = useRef<HTMLInputElement>(null)
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null)
  const [editingTagValue, setEditingTagValue] = useState("")
  const tagEditInputRef = useRef<HTMLInputElement>(null)
  const MAX_TAGS = 5

  // 添加裁剪相关的状态
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)

  // 事件标签状态
  const [events, setEvents] = useState<string[]>([])

  const handleEventsChange = useCallback(async (newEvents: string[]) => {
    setEvents(newEvents);

    // Skip writes in published (read-only) mode
    if (isPublishedMode()) return;

    const eventTagIds = newEvents
      .map(name => EVENT_NAME_TO_ID[name] || name)
      .filter(Boolean);

    // 立即保存 eventTagIds 到 adapter，确保刷新后不丢失
    try {
      const adapter = new LocalStorageAdapter()
      await adapter.updateProfile({ eventTagIds })
      
      // 同步更新缓存
      syncUserCachesAfterProfileUpdate(
        { eventTagIds },
        { eventTagIds }
      )
    } catch (error) {
      console.error('Failed to save event tags:', error)
    }
  }, [syncUserCachesAfterProfileUpdate]);

  // Add these new state variables for the profile info fields
  type EditableField =
    | "name"
    | "website"
    | "affiliation"
    | "location"
    | "title"
    | "bio"
    | "social_links"
    | "research_interests"

  const [website, setWebsite] = useState(profile?.website || "")
  const [affiliation, setAffiliation] = useState(profile?.institution || "")
  const [location, setLocation] = useState(profile?.location || "")
  const [name, setName] = useState(profileUser?.name || currentUser?.name || "")
  const [title, setTitle] = useState(profile?.title || "")
  const [editingField, setEditingField] = useState<EditableField | null>(null)
  const fieldInputRef = useRef<HTMLInputElement>(null)

  // Then, add a new state for controlling the dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false)

  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => normalizeSocialLinks(DEFAULT_SOCIAL_LINKS))
  const socialLinksRef = useRef<SocialLinks>(normalizeSocialLinks(DEFAULT_SOCIAL_LINKS)) // 用于保存时获取最新值
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false)
  const hasPendingChangesRef = useRef(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  
  // 防抖保存相关
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedStateRef = useRef<string>('')
  const isSavingRef = useRef(false)
  const pendingSaveRef = useRef(false)
  const isComposingRef = useRef(false) // 输入法合成状态
  const SAVE_DEBOUNCE_DELAY = 800 // 800ms 防抖延迟

  // Profile 数据 adapter 实例
  const profileAdapterRef = useRef(new LocalStorageAdapter())

  const editingFieldRef = useRef<EditableField | null>(null)
  useEffect(() => {
    editingFieldRef.current = editingField
  }, [editingField])

  const markPendingChanges = useCallback(() => {
    hasPendingChangesRef.current = true
    setHasPendingChanges(true)
  }, [])

  // 使用 ref 追踪是否已经初始化过，避免重复更新导致编辑内容丢失
  // 使用 profile?.id 作为标识，当 profile 变化时重新初始化
  const initializedProfileIdRef = useRef<string | null>(null)
  const prevIsEditableRef = useRef(isEditable)

  // 当 profile 数据加载完成时初始化状态
  // 当 profile.id 变化时会重新初始化（例如刷新页面后重新获取数据）
  useEffect(() => {
    let isMounted = true

    const initializeProfileState = async () => {
      if (!profile || isPublicView) {
        return
      }

      const currentProfileId = profile.institution + '|' + profile.location + '|' + profile.bio?.substring(0, 10)

      if (initializedProfileIdRef.current === currentProfileId || editingField) {
        return
      }

      initializedProfileIdRef.current = currentProfileId

      const newBio = profile.bio || ""
      const newTags = profile.research_interests || []
      const newWebsite = profile.website || ""
      const newAffiliation = profile.institution || ""
      const newLocation = profile.location || ""
      const newTitle = profile.title || ""
      const newSocialLinks = profile.social_links
        ? { ...DEFAULT_SOCIAL_LINKS, ...profile.social_links as Record<string, string> }
        : DEFAULT_SOCIAL_LINKS
      const normalizedSocialLinks = normalizeSocialLinks(newSocialLinks)

      setBio(newBio)
      setTags(newTags)
      setWebsite(newWebsite)
      setAffiliation(newAffiliation)
      setLocation(newLocation)
      setTitle(newTitle)
      setSocialLinks(normalizedSocialLinks)
      socialLinksRef.current = normalizedSocialLinks
      hasPendingChangesRef.current = false
      setHasPendingChanges(false)

      const initialStateHash = JSON.stringify({
        name: (currentUser?.name || profileUser?.name || "").trim(),
        bio: newBio.trim(),
        affiliation: newAffiliation.trim(),
        location: newLocation.trim(),
        title: newTitle.trim(),
        website: newWebsite.trim(),
        tags: newTags.sort().join(','),
        socialLinks: JSON.stringify(normalizedSocialLinks)
      })
      lastSavedStateRef.current = initialStateHash

      // API removed - use local state only for profile-only version
      const eventTagIds = (profile as any).eventTagIds || []

      if (isMounted) {
        const eventNames = (eventTagIds || []).map((id: string) => EVENT_ID_TO_NAME[id] || id).filter(Boolean)
        setEvents(eventNames)

        void 0
      }
    }

    initializeProfileState()

    return () => {
      isMounted = false
    }
  }, [profile, isPublicView, editingField, currentUser, profileUser]) // 添加 editingField，避免编辑时重置

  useEffect(() => {
    if (profile || currentUser) {
      setHasLoadedProfile(true)
    }
  }, [profile, currentUser])

  // 处理字段编辑
  const handleEditField = useCallback((field: EditableField) => {
    if (isPublicView || !isEditable) return
    // 如果点击的是当前正在编辑的字段，不做任何操作
    if (editingField === field) return
    
    setEditingField(field)
  }, [isPublicView, isEditable, editingField])

  // 生成当前状态的哈希值，用于检测变化
  const getCurrentStateHash = useCallback(() => {
    // 使用 ref 获取最新的 socialLinks 值，确保状态更新后能正确检测变化
    const currentSocialLinks = socialLinksRef.current
    const mergedSocialLinks = { ...DEFAULT_SOCIAL_LINKS, ...currentSocialLinks }
    const normalizedLinks = normalizeSocialLinks(mergedSocialLinks)
    const normalizedWebsiteForHash = normalizeWebsiteUrl(website) || ''
    const state = {
      name: name.trim(),
      bio: bio.trim(),
      affiliation: affiliation.trim(),
      location: location.trim(),
      title: title.trim(),
      website: normalizedWebsiteForHash,
      tags: tags.sort().join(','),
      events: events.sort().join(','),  // 包含 events 以便检测变化
      socialLinks: JSON.stringify(normalizedLinks)
    }
    return JSON.stringify(state)
  }, [name, bio, affiliation, location, title, website, tags, events])

  // 实时保存函数（乐观更新）
  const saveProfileDraft = useCallback(async (skipDebounce = false) => {
    if (isPublicView || isPublishedMode()) return

    if (isSavingRef.current) {
      pendingSaveRef.current = true
      return
    }

    const currentStateHash = getCurrentStateHash()

    // 如果状态没有变化，跳过保存
    if (currentStateHash === lastSavedStateRef.current) {
      if (hasPendingChangesRef.current) {
        hasPendingChangesRef.current = false
        setHasPendingChanges(false)
      }
      return
    }

    isSavingRef.current = true
    setIsSavingProfile(true)

    // 在保存开始时，记录当前正在编辑的字段，避免保存完成后覆盖正在输入的内容
    const editingFieldAtSaveStart = editingFieldRef.current

    // 乐观更新：先更新缓存，让UI立即反映变化
    const trimmedName = name.trim()
    const existingName = currentUserInfo?.name ?? currentUser?.name ?? profileUser?.name ?? ""

    // 使用 ref 获取最新的 socialLinks 值，确保保存时使用最新的数据
    const currentSocialLinks = socialLinksRef.current
    const mergedSocialLinks = { ...DEFAULT_SOCIAL_LINKS, ...currentSocialLinks }
    const normalizedLinks = normalizeSocialLinks(mergedSocialLinks)
    const hasSocialLinks = Object.values(normalizedLinks).some((link) => Boolean(link && link.trim()))
    const socialLinksPayload = hasSocialLinks ? normalizedLinks : null
    const normalizedWebsiteForPayload = normalizeWebsiteUrl(website, {
      logOnInvalid: Boolean(website.trim()),
    })

    const toNullable = (value: string) => {
      if (!value) return null
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    }

    // 将 events 状态转换为 eventTagIds
    const eventTagIds = events
      .map(name => EVENT_NAME_TO_ID[name] || name)
      .filter(Boolean)

    const profilePayload: ProfileUpdateData = {
      name: toNullable(name),  // 保存用户显示名称
      bio: toNullable(bio),
      institution: toNullable(affiliation),
      location: toNullable(location),
      title: toNullable(title),
      website: normalizedWebsiteForPayload,
      social_links: socialLinksPayload,
      research_interests: tags,
      eventTagIds,  // 保存 Event to Go 选择
    }

    // 乐观更新缓存（包含 name 和 eventTagIds 字段）
    const userCacheUpdates: Partial<CachedUser> = {
      name: trimmedName || existingName,  // 使用用户输入的 name
      bio: profilePayload.bio || "",
      affiliation: profilePayload.institution || "",
      location: profilePayload.location || "",
      title: profilePayload.title || "",
      social_links: socialLinksPayload || {},
      research_interests: tags,
      eventTagIds: eventTagIds  // 同步 Event to Go 选择
    }

    const profileUpdates: Partial<CurrentUser['profile']> = {
      name: toNullable(name) || undefined,
      bio: profilePayload.bio || "",
      institution: profilePayload.institution || "",
      location: profilePayload.location || "",
      title: profilePayload.title || "",
      website: normalizedWebsiteForPayload || "",
      social_links: socialLinksPayload || undefined,
      research_interests: tags,
      eventTagIds: eventTagIds  // 同步 Event to Go 选择
    }

    syncUserCachesAfterProfileUpdate(userCacheUpdates, profileUpdates)

    try {
      // 保存 Profile 数据到 adapter（本地存储）
      await profileAdapterRef.current.updateProfile(profilePayload)

      // 更新已保存状态哈希
      lastSavedStateRef.current = getCurrentStateHash()
      hasPendingChangesRef.current = false
      setHasPendingChanges(false)
    } catch (error) {
      console.error('Failed to save profile:', error)
      // 保存失败时不显示错误提示，避免打断用户输入
      // 只在控制台记录错误
    } finally {
      isSavingRef.current = false
      setIsSavingProfile(false)

      if (pendingSaveRef.current) {
        pendingSaveRef.current = false
        void saveProfileDraft(true)
      }
    }
  }, [isPublicView, currentUserInfo, currentUser, profileUser, name, bio, affiliation, location, title, website, tags, events, syncUserCachesAfterProfileUpdate, getCurrentStateHash, profileAdapterRef])

  // 防抖保存函数
  const debouncedSave = useCallback(() => {
    // 如果正在输入法合成中，不触发保存
    if (isComposingRef.current) {
      void 0
      return
    }

    // 清除之前的定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // 设置新的定时器
    saveTimeoutRef.current = setTimeout(() => {
      saveProfileDraft(true)
    }, SAVE_DEBOUNCE_DELAY)
  }, [saveProfileDraft])

  // 监听编辑模式变化，退出编辑模式时立即保存（如果有未保存的更改）
  useEffect(() => {
    const wasEditable = prevIsEditableRef.current
    const isCurrentlyEditable = isEditable

    if (wasEditable && !isCurrentlyEditable) {
      // 清除防抖定时器，立即保存
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      // 立即保存任何未保存的更改
      saveProfileDraft(true)
      setEditingField(null)
    }

    prevIsEditableRef.current = isEditable
  }, [isEditable, saveProfileDraft])

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // 处理研究兴趣更新 (实时保存)
  const handleResearchInterestsChange = (interests: string[]) => {
    setTags(interests)
    markPendingChanges()
    // 触发防抖保存
    debouncedSave()
  }

  // 处理取消编辑
  const handleCancelEdit = () => {
    // 恢复到原始值
    switch (editingField) {
      case "name":
        setName(currentUserInfo?.name || "")
        break
      case "website":
        setWebsite(profile?.website || "")
        break
      case "affiliation":
        setAffiliation(profile?.institution || "")
        break
      case "location":
        setLocation(profile?.location || "")
        break
      case "title":
        setTitle(profile?.title || "")
        break
      case "bio":
        setBio(profile?.bio || "")
        break
    }
    setEditingField(null)
  }

  // Helper function to check if any social links exist
  const hasSocialLinks = Object.values(socialLinks).some((link) => link && link.trim() !== "")

  // 格式化链接函数
  const formatLink = (platform: keyof SocialLinks, handle: string): string => {
    return buildSocialUrl(platform, handle)
  }

  // Function to handle editing a field (实时保存)
  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    setter(e.target.value)
    markPendingChanges()
    // 触发防抖保存（会自动检查输入法状态）
    debouncedSave()
  }

  // 输入法合成事件处理
  const handleCompositionStart = () => {
    void 0
    isComposingRef.current = true
  }

  const handleCompositionEnd = () => {
    void 0
    isComposingRef.current = false
    // 输入法合成结束后，立即保存一次，确保最终文字被提交
    void saveProfileDraft(true)
  }

  // Helper function to auto-resize textarea height
  const adjustTextareaHeight = useCallback(() => {
    if (bioTextareaRef.current && editingField === "bio") {
      const textarea = bioTextareaRef.current;
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Calculate the new height (min based on one line, max 240px)
      const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 24;
      const minHeight = lineHeight + 8; // Add some padding
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), 240);
      textarea.style.height = `${newHeight}px`;
    }
  }, [editingField]);

  // Effect to focus when editing bio
  useEffect(() => {
    if (editingField === "bio" && bioTextareaRef.current) {
      const textarea = bioTextareaRef.current;
      // 将光标移到末尾
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      // Adjust height when entering edit mode
      adjustTextareaHeight();
    }
  }, [editingField, adjustTextareaHeight]);

  // Effect to auto-resize textarea height when bio content changes
  useEffect(() => {
    if (editingField === "bio") {
      adjustTextareaHeight();
    }
  }, [bio, editingField, adjustTextareaHeight]);

  // Function to handle bio textarea changes (实时保存)
  const handleBioChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    setter(e.target.value)
    markPendingChanges()
    // Adjust height immediately when content changes
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      adjustTextareaHeight();
    }, 0);
  }

  // Function to handle key press in field inputs
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // 输入法合成中不处理快捷键，避免误触发 blur/提交
    const anyEvent = e as unknown as { nativeEvent?: { isComposing?: boolean } }
    if (anyEvent?.nativeEvent?.isComposing || isComposingRef.current) {
      return
    }
    if (e.key === "Enter" && !(e.shiftKey || e.metaKey || e.ctrlKey || e.altKey)) {
      e.preventDefault()
      ;(e.target as HTMLElement).blur()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  const handleFieldBlur = (field: EditableField) => () => {
    // 合成进行中忽略 blur，等合成结束后由保存逻辑接管
    if (isComposingRef.current) {
      return
    }
    
    // 如果有未保存的更改，先触发保存
    if (hasPendingChangesRef.current) {
      // 立即保存（跳过防抖），保存完成后再清除编辑状态
      void saveProfileDraft(true).then(() => {
        // 保存完成后再清除编辑状态
        setEditingField(prev => (prev === field ? null : prev))
      })
    } else {
      // 没有未保存的更改，直接清除编辑状态
      setEditingField(prev => (prev === field ? null : prev))
    }
  }

  const handleBioBlur = () => {
    if (isComposingRef.current) {
      return
    }
    handleFieldBlur("bio")()
    if (hasPendingChangesRef.current) {
      void saveProfileDraft(true)
    }
  }

  // Effect to focus the input when editing a field
  useEffect(() => {
    if (editingField && fieldInputRef.current) {
      fieldInputRef.current.focus()
    }
  }, [editingField])

  const handleTagClick = (index: number) => {
    if (isPublicView || !isEditable) return
    setEditingTagIndex(index)
    setEditingTagValue(tags[index])
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddTag()
    } else if (e.key === "Escape") {
      setIsAddingTag(false)
      setNewTagValue("")
    }
  }

  useEffect(() => {
    if (isAddingTag && tagInputRef.current) {
      tagInputRef.current.focus()
    }
  }, [isAddingTag])

  useEffect(() => {
    if (editingTagIndex !== null && tagEditInputRef.current) {
      tagEditInputRef.current.focus()
    }
  }, [editingTagIndex])

  const handleAvatarClick = () => {
    if (isPublicView) return
    fileInputRef.current?.click()
  }

  // 修改 handleFileChange 函数以支持裁剪
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 检查文件是否为图片
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        // 设置临时图像URL并显示裁剪器
        setTempImageUrl(e.target?.result as string)
        setShowCropper(true)
      }
      reader.readAsDataURL(file)

      // 重置文件输入，以便用户可以再次选择同一文件
      event.target.value = ""
    }
  }

  // 处理裁剪完成
  const handleCropCancel = () => {
    setShowCropper(false)
    setTempImageUrl(null)
  }

  // 添加回 handleTagEditKeyDown 函数
  const handleTagEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTagEdit()
    } else if (e.key === "Escape") {
      setEditingTagIndex(null)
      setEditingTagValue("")
    }
  }

  // 标签相关函数
  const handleAddTag = () => {
    if (newTagValue.trim() && tags.length < MAX_TAGS) {
      const newTags = [...tags, newTagValue.trim()]
      handleResearchInterestsChange(newTags)
      setNewTagValue("")
    }
    setIsAddingTag(false)
  }

  const handleDeleteTag = (index: number) => {
    const newTags = tags.filter((_: string, i: number) => i !== index)
    handleResearchInterestsChange(newTags)
  }

  const handleTagEdit = () => {
    if (editingTagIndex !== null && editingTagValue.trim()) {
      const newTags = [...tags]
      newTags[editingTagIndex] = editingTagValue.trim()
      handleResearchInterestsChange(newTags)
    }
    setEditingTagIndex(null)
    setEditingTagValue("")
  }

  // 如果是公开视图，使用传入的数据渲染
  if (isPublicView && userData) {
    // ... 保持现有的公开视图渲染逻辑
  }

  // 优化：只在首次加载且没有任何数据时显示骨架屏
  // 如果已经有部分数据（如从 currentUser 来的），则渐进式显示
  const showSkeletonLoader = !currentUser && isLoading && !isPublicView;

  // 如果有错误，显示错误状态（但仍保留已有数据的显示）
  if (error && !isPublicView && !profile && !currentUser) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-500">Error loading profile: {error}</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[366px] mx-auto flex flex-col gap-6">
      {/* 头像和事件标签容器 */}
      <div className="flex gap-5 items-center w-full">
        {/* 头像 */}
        <ProfileAvatar
          size={140}
          className="w-[140px] h-[140px] shrink-0 rounded-[78px] overflow-hidden"
          isEditable={!isPublicView && isEditable}
          onAvatarClick={handleAvatarClick}
          isUpdating={isUpdatingAvatar}
          profileAvatar={profile?.avatar || currentUser?.profile?.avatar}
          fallback={currentUserInfo?.name || currentUser?.name || profile?.title || "U"}
        />

        {/* 事件标签 */}
        <EventTagSelector
          events={events}
          isEditable={!isPublicView && isEditable}
          onEventsChange={handleEventsChange}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {uploadError && (
        <div className="text-red-500 text-sm">
          {uploadError}
        </div>
      )}

      {/* 图像裁剪器 */}
      {tempImageUrl && (
        <ImageCropper
          imageUrl={tempImageUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          open={showCropper}
        />
      )}

      {/* Name */}
      <div className="w-full">
        <h2
          className={cn(
            "text-2xl font-medium leading-[1.5] text-foreground",
            (!isPublicView && isEditable) && "cursor-pointer hover:bg-zinc-50 rounded p-1 -m-1",
            isLoading && "opacity-60 transition-opacity duration-200"
          )}
          onMouseDown={(e) => {
            // 使用 onMouseDown 而不是 onClick，确保在 onBlur 之前设置新的 editingField
            e.preventDefault()
            handleEditField("name")
          }}
        >
          {editingField === "name" ? (
            <input
              ref={fieldInputRef}
              type="text"
              value={name}
              onChange={(e) => handleFieldChange(e, setName)}
              onBlur={handleFieldBlur("name")}
              onKeyDown={handleInputKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              className="text-2xl font-medium leading-[1.5] w-full focus:outline-none focus:ring-0 bg-transparent text-foreground z-[0]"
              placeholder="Your name..."
            />
          ) : (
            <span>
              {name || currentUser?.name || (isLoading ? (
                <span className="text-muted-foreground animate-pulse">Loading...</span>
              ) : (
                <span className="text-muted-foreground">Your name...</span>
              ))}
            </span>
          )}
        </h2>
      </div>

      {/* Share Button - 只在非公开视图时显示 */}
      {!isPublicView && (currentUserInfo || currentUser) && (
        <>
          <button
            onClick={() => setShowShareModal(true)}
            className="bg-primary rounded-[60px] h-[42px] w-full px-3 flex gap-1.5 items-center justify-center hover:opacity-90 transition-opacity"
          >
            <ShareIcon />
            <span className="text-primary-foreground">
              Share my site
            </span>
          </button>
          
          <ShareModal
            open={showShareModal}
            onOpenChange={setShowShareModal}
            user={{
              name: currentUserInfo?.name || currentUser?.name || "",
              username: currentUserInfo?.username || currentUser?.username || "",
              bio: profile?.bio || currentUser?.profile?.bio,
              avatar: profile?.avatar || currentUser?.profile?.avatar,
              offerings: shareOfferings,
              seeking: shareSeeking,
              socialLinks: socialLinks,
            }}
          />
        </>
      )}

      {/* 关注按钮 - 只在公开视图且不是自己的个人资料时显示 */}
      {isPublicView && profileUserId && currentUserInfo?.id && profileUserId !== currentUserInfo.id && (
        <div className="my-4">
          <FollowButton
            userId={profileUserId}
            targetUser={{
              id: profileUserId,
              name: userData?.name || 'Unknown User',
              avatar: userData?.profileImage,
              handle: userData?.username
            }}
            showReasonModal={true}
            fullWidth={true}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        {/* Email Icon - Set fill to black */}
        {socialLinks.email && (
          <a
            href={formatLink("email", socialLinks.email)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <path
                d="M1.63636 21.0043H5.45455V11.7315L0 7.64062V19.3679C0 20.272 0.732273 21.0043 1.63636 21.0043Z"
                fill="#000000"
              />
              <path
                d="M18.5449 21.0043H22.3631C23.2672 21.0043 23.9995 20.272 23.9995 19.3679V7.64062L18.5449 11.7315V21.0043Z"
                fill="#000000"
              />
              <path
                d="M18.5449 4.64077V11.7317L23.9995 7.64077V5.45896C23.9995 3.43668 21.6908 2.28168 20.0722 3.49532L18.5449 4.64077Z"
                fill="#000000"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.45508 11.7315V4.64062L12.0005 9.54972L18.546 4.64062V11.7315L12.0005 16.6406L5.45508 11.7315Z"
                fill="#000000"
              />
              <path
                d="M0 5.45896V7.64077L5.45455 11.7317V4.64077L3.92727 3.49532C2.30864 2.28168 0 3.43668 0 5.45896Z"
                fill="#000000"
              />
            </svg>
          </a>
        )}

        {/* LinkedIn Icon - Set main fill to black, keep white elements */}
        {socialLinks.linkedin && (
          <a
            href={formatLink("linkedin", socialLinks.linkedin)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <path
                d="M0 4C0 1.79086 1.78793 0 3.99346 0H19.5065C21.7121 0 23.5 1.79086 23.5 4V20C23.5 22.2091 21.7121 24 19.5065 24H3.99346C1.78794 24 0 22.2091 0 20V4Z"
                fill="#000000"
              />
              <path
                d="M16.5432 20.6261H20.0819V13.4775C20.0819 9.94694 17.9481 8.74275 15.9736 8.74275C14.1478 8.74275 12.9075 9.95753 12.565 10.6691V9.06762H9.16185V20.6261H12.7005V14.3595C12.7005 12.6886 13.7298 11.876 14.7799 11.876C15.773 11.876 16.5432 12.4504 16.5432 14.3131V20.6261Z"
                fill="white"
              />
              <path
                d="M3.22656 5.36868C3.22656 6.57539 4.13996 7.45723 5.26667 7.45723C6.39354 7.45723 7.30693 6.57539 7.30693 5.36868C7.30693 4.16214 6.39354 3.2793 5.26667 3.2793C4.13996 3.2793 3.22656 4.16214 3.22656 5.36868Z"
                fill="white"
              />
              <path d="M3.49741 20.6172H7.03592V9.05872H3.49741V20.6172Z" fill="white" />
            </svg>
          </a>
        )}

        {/* Twitter/X Icon - Set fill to black */}
        {socialLinks.twitter && (
          <a
            href={formatLink("twitter", socialLinks.twitter)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none"
          >
            <svg viewBox="0 0 24 24" fill="#000000" className="w-full h-full">
              <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
            </svg>
          </a>
        )}

        {/* GitHub Icon - Set fill to black */}
        {socialLinks.github && (
          <a
            href={formatLink("github", socialLinks.github)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <path
                d="M0 12.3038C0 5.50847 5.3735 0 12.0001 0C18.6273 0 24 5.50847 24 12.3038C24 17.7381 20.566 22.3485 15.8006 23.9772C15.1923 24.098 14.9763 23.7144 14.9763 23.387C14.9763 23.2527 14.9778 23.0174 14.9799 22.7029C14.984 22.0683 14.9902 21.1108 14.9902 20.0105C14.9902 18.8626 14.6067 18.1138 14.1762 17.732C16.8484 17.4274 19.6557 16.3869 19.6557 11.6612C19.6557 10.3179 19.1901 9.22032 18.4206 8.35868C18.5452 8.04878 18.9562 6.79737 18.303 5.10261C18.303 5.10261 17.2967 4.77193 15.0063 6.3638C14.0473 6.09119 13.0199 5.95447 12.0001 5.94979C10.9803 5.95447 9.95372 6.09119 8.9965 6.3638C6.70331 4.77193 5.69562 5.10261 5.69562 5.10261C5.04402 6.79737 5.45477 8.04878 5.57937 8.35868C4.81172 9.22032 4.34295 10.3179 4.34295 11.6612C4.34295 16.3757 7.14486 17.4307 9.81024 17.7418C9.46706 18.049 9.15607 18.5918 9.04836 19.387C8.36359 19.7014 6.6266 20.2452 5.55632 18.3642C5.55632 18.3642 4.92181 17.1831 3.7168 17.0963C3.7168 17.0963 2.54596 17.0806 3.63473 17.8443C3.63473 17.8443 4.42125 18.2224 4.96712 19.6446C4.96712 19.6446 5.67157 21.8405 9.01001 21.0963C9.01282 21.655 9.01739 22.1964 9.02097 22.6213C9.02399 22.978 9.02631 23.2531 9.02631 23.387C9.02631 23.7119 8.80613 24.0927 8.2064 23.9789C3.43839 22.3519 0 17.74 0 12.3038Z"
                fill="#000000"
              />
            </svg>
          </a>
        )}

        {/* Google Scholar Icon - Set background to black */}
        {socialLinks.googleScholar && (
          <a
            href={formatLink("googleScholar", socialLinks.googleScholar)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none"
          >
            <div className="w-full h-full flex items-center justify-center bg-black rounded-full">
              <span className="text-white font-semibold text-sm">G</span>
            </div>
          </a>
        )}

        {/* ResearchGate Icon - Set background to black */}
        {socialLinks.researchGate && (
          <a
            href={formatLink("researchGate", socialLinks.researchGate)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none"
          >
            <svg fill="#000000" viewBox="0 0 14 14" role="img" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <title>ResearchGate icon</title>
              <path d="M 1,1 1,13 13,13 13,1 1,1 Z M 8.0232143,9.95714 C 7.8464286,10.0375 7.1339286,10.11786 6.6839286,9.57679 6.4375,9.29286 6.00625,8.68482 5.5535714,7.87321 c -0.2383928,0 -0.39375,0 -0.5732143,-0.0161 l 0,1.24286 c 0,0.62946 0.1607143,0.56786 0.6910715,0.64018 l 0,0.21696 c -0.1848215,-0.008 -0.61875,-0.0214 -0.9535715,-0.0214 -0.3508928,0 -0.6991071,0.0161 -0.9,0.0214 l 0,-0.21696 C 4.2330357,9.66245 4.4071429,9.70535 4.4071429,9.09997 l 0,-2.93036 c 0,-0.60535 -0.1714286,-0.5625 -0.5892858,-0.64018 l 0,-0.21696 c 0.6910715,0.0268 1.4223215,-0.0161 1.8991072,-0.0161 0.8491071,0 1.4973214,0.38571 1.4973214,1.22143 0,0.56518 -0.4473214,1.13035 -1.05,1.27232 C 6.5285714,8.43833 6.9678571,9.01155 7.2946429,9.3678 7.4875,9.57673 7.7553571,9.76155 8.0232143,9.76155 l 0,0.19553 z M 8.6366071,6.34107 c -0.6241071,0 -0.8625,-0.42053 -0.8625,-0.8625 l 0,-0.8625 c 0,-0.32678 0.2357143,-0.81428 0.9107143,-0.81428 0.675,0 0.8142857,0.47946 0.8142857,0.47946 L 9.2125,4.47411 c 0,0 -0.1473214,-0.33482 -0.5276786,-0.33482 -0.2116071,0 -0.5276785,0.19553 -0.5276785,0.52767 l 0,0.71786 c 0,0.35893 0.1767857,0.62411 0.4794642,0.62411 0.3776786,0 0.5758929,-0.29197 0.5758929,-0.71786 l -0.4794643,0 0,-0.28661 0.8142857,0 c 0,0.54911 0.1258929,1.33661 -0.9107143,1.33661 z M 5.5160714,7.53839 c -0.2517857,0 -0.3642857,-0.008 -0.5357143,-0.0214 l 0,-1.86696 c 0.1714286,-0.0161 0.4017858,-0.0161 0.6026786,-0.0161 0.6241072,0 0.9964286,0.32678 0.9964286,0.92411 0,0.5866 -0.4017857,0.98035 -1.0633929,0.98035 z" />
            </svg>
          </a>
        )}

        {/* ORCID Icon - Use new provided SVG with black background, white 'iD' */}
        {socialLinks.orcid && (
          <a
            href={formatLink("orcid", socialLinks.orcid)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none"
          >
            {/* Replace previous SVG with the new one */}
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path fill="#000000" d="M16 0c-8.839 0-16 7.161-16 16s7.161 16 16 16c8.839 0 16-7.161 16-16s-7.161-16-16-16z" />
              <path fill="white" d="M9.823 5.839c0.704 0 1.265 0.573 1.265 1.26 0 0.688-0.561 1.265-1.265 1.265-0.692-0.004-1.26-0.567-1.26-1.265 0-0.697 0.563-1.26 1.26-1.26z" />
              <path fill="white" d="M8.864 9.885h1.923v13.391h-1.923z" />
              <path fill="white" d="M13.615 9.885h5.197c4.948 0 7.125 3.541 7.125 6.703 0 3.439-2.687 6.699-7.099 6.699h-5.224zM15.536 11.625v9.927h3.063c4.365 0 5.365-3.312 5.365-4.964 0-2.687-1.713-4.963-5.464-4.963z" />
            </svg>
          </a>
        )}

        {/* Bluesky Icon - Use SVG with black fill */}
        {socialLinks.bluesky && (
          <a
            href={formatLink("bluesky", socialLinks.bluesky)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none"
          >
            {/* Replace placeholder with inline SVG */}
            <svg width="24px" height="24px" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg" fill="#000000" className="w-full h-full">
              <title>Bluesky icon</title>
              <path d="M16.89183333333333 13.580879166666666c-0.13474999999999998 -0.01633333333333333 -0.2735833333333333 -0.03266666666666666 -0.4083333333333333 -0.05308333333333333 0.1388333333333333 0.01633333333333333 0.2735833333333333 0.03675 0.4083333333333333 0.05308333333333333ZM12 10.820545833333334c-1.06575 -2.0702499999999997 -3.9649166666666664 -5.928999999999999 -6.659916666666666 -7.831833333333333 -2.5847499999999997 -1.8252499999999998 -3.568833333333333 -1.5108333333333333 -4.2180833333333325 -1.2168333333333332C0.37474999999999997 2.1107958333333334 0.24 3.2582125 0.24 3.9319624999999996s0.37158333333333327 5.537 0.6124999999999999 6.3495833333333325c0.7962499999999999 2.6827499999999995 3.6382499999999998 3.58925 6.2556666666666665 3.29525 0.13474999999999998 -0.020416666666666666 0.26949999999999996 -0.03675 0.4083333333333333 -0.05716666666666667 -0.13474999999999998 0.020416666666666666 -0.26949999999999996 0.04083333333333333 -0.4083333333333333 0.05716666666666667 -3.83425 0.5716666666666667 -7.239749999999999 1.9681666666666664 -2.7725833333333334 6.937583333333333 4.91225 5.087833333333333 6.729333333333333 -1.09025 7.664416666666666 -4.222166666666666 0.9350833333333333 3.1319166666666662 2.009 9.085416666666667 7.578666666666667 4.222166666666666 4.181333333333333 -4.222166666666666 1.1474166666666665 -6.369999999999999 -2.686833333333333 -6.937583333333333 -0.13474999999999998 -0.01633333333333333 -0.2735833333333333 -0.03266666666666666 -0.4083333333333333 -0.05308333333333333 0.1388333333333333 0.01633333333333333 0.2735833333333333 0.03675 0.4083333333333333 0.05308333333333333 2.6174166666666663 0.28991666666666666 5.455333333333333 -0.6165833333333333 6.2556666666666665 -3.29525 0.24091666666666667 -0.8125833333333332 0.6124999999999999 -5.67175 0.6124999999999999 -6.3495833333333325s-0.13474999999999998 -1.8252499999999998 -0.8819999999999999 -2.160083333333333c-0.6451666666666667 -0.28991666666666666 -1.6333333333333333 -0.6084166666666666 -4.2139999999999995 1.2168333333333332 -2.6990833333333333 1.9028333333333332 -5.59825 5.761583333333332 -6.664 7.831833333333333Z" fill="#000000" strokeWidth="0.0417"></path>
            </svg>
          </a>
        )}

        {/* Medium Icon - Already black, keep as is */}
        {socialLinks.medium && (
          <a
            href={formatLink("medium", socialLinks.medium)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
                fill="#000000"
              />
              <path
                d="M5.89729 8.15197C5.91717 7.95096 5.84227 7.75228 5.69561 7.61699L4.20168 5.77513V5.5H8.84034L12.4258 13.5476L15.578 5.5H20V5.77513L18.7227 7.02851C18.6126 7.11442 18.5579 7.25561 18.5808 7.39536V16.6046C18.5579 16.7444 18.6126 16.8856 18.7227 16.9715L19.9701 18.2249V18.5H13.6956V18.2249L14.9879 16.9409C15.1148 16.811 15.1148 16.7728 15.1148 16.5741V9.13022L11.5219 18.4694H11.0364L6.85341 9.13022V15.3895C6.81853 15.6526 6.90393 15.9176 7.08497 16.1079L8.76564 18.1943V18.4694H4V18.1943L5.68067 16.1079C5.86039 15.9173 5.94081 15.6506 5.89729 15.3895V8.15197Z"
                fill="white"
              />
            </svg>
          </a>
        )}

        {/* YouTube Icon - Set fill to black */}
        {socialLinks.youtube && (
          <a
            href={formatLink("youtube", socialLinks.youtube)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none"
          >
            <svg viewBox="0 0 24 24" fill="#000000" className="w-full h-full">
              <path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM9.5 15.5v-7l6 3.5-6 3.5z" />
            </svg>
          </a>
        )}

        {/* Spotify Icon - Already black, keep as is */}
        {socialLinks.spotify && (
          <a
            href={formatLink("spotify", socialLinks.spotify)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <path
                d="M11.9633 0C5.35629 0 0 5.35614 0 11.9631C0 18.5704 5.35629 23.9261 11.9633 23.9261C18.571 23.9261 23.9267 18.5704 23.9267 11.9631C23.9267 5.35657 18.571 0.000571425 11.9631 0.000571425L11.9633 0ZM17.4496 17.2543C17.2353 17.6057 16.7753 17.7171 16.4239 17.5014C13.615 15.7857 10.079 15.3971 5.91471 16.3486C5.51343 16.44 5.11343 16.1886 5.022 15.7871C4.93014 15.3857 5.18057 14.9857 5.58286 14.8943C10.14 13.8527 14.049 14.3014 17.2024 16.2286C17.5539 16.4443 17.6653 16.9029 17.4496 17.2543ZM18.9139 13.9964C18.6439 14.4357 18.0696 14.5743 17.631 14.3043C14.4153 12.3273 9.51343 11.7549 5.70986 12.9094C5.21657 13.0584 4.69557 12.7804 4.54586 12.288C4.39743 11.7947 4.67543 11.2747 5.16786 11.1247C9.51257 9.80643 14.9139 10.445 18.6067 12.7143C19.0453 12.9843 19.1839 13.5584 18.9139 13.9964ZM19.0396 10.6044C15.1839 8.31429 8.82243 8.10371 5.14114 9.221C4.55 9.40029 3.92486 9.06657 3.74571 8.47543C3.56657 7.884 3.9 7.25929 4.49157 7.07957C8.71743 5.79671 15.7424 6.04457 20.1816 8.67986C20.7144 8.99543 20.8887 9.68214 20.573 10.2131C20.2587 10.7449 19.5701 10.9201 19.0401 10.6044H19.0396Z"
                fill="#000000"
              />
            </svg>
          </a>
        )}

        {/* Discord Icon - Set fill to black */}
        {socialLinks.discord && (
          <a
            href={formatLink("discord", socialLinks.discord)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-6 h-6 flex items-center justify-center transition-transform duration-200 hover:scale-125 focus:outline-none"
          >
            <svg viewBox="0 0 24 24" fill="#000000" className="w-full h-full">
              <title>Discord icon</title>
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>
        )}

        {/* 添加按钮 - 这个是用来打开编辑对话框的，现在需要根据 isEditable 控制显示 */}
        {(!isPublicView && isEditable) && (
          <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="w-6 h-6 rounded-full border-zinc-400 text-zinc-400 hover:text-zinc-600 hover:border-zinc-600 transition-transform duration-200 hover:scale-125"
                >
                  <Plus className="w-4 h-4" />
                  <VisuallyHidden>Add Social Link</VisuallyHidden>
                </Button>
              </DialogTrigger>
              <DialogContent className={cn("max-w-[90vw] md:max-w-[700px] lg:max-w-[800px] p-0 bg-white rounded-[8px]", getZIndexClass('SOCIAL_LINKS_DIALOG'))}>
                <DialogTitle className="sr-only">Manage Social Links</DialogTitle>
                <SocialLinksManager
                  onClose={() => setIsDialogOpen(false)}
                  onSave={async (newLinks) => {
                    const normalizedLinks = normalizeSocialLinks(newLinks)
                    setSocialLinks(normalizedLinks)
                    socialLinksRef.current = normalizedLinks // 立即更新 ref
                    setIsDialogOpen(false)
                    markPendingChanges()
                    // 直接调用 saveProfileDraft(true) 跳过防抖立即保存
                    // 使用 ref 确保使用最新的值
                    setTimeout(() => {
                      saveProfileDraft(true)
                    }, 0)
                    toast.success('Social links updated')
                  }}
                  initialLinks={socialLinks}
                />
              </DialogContent>
            </Dialog>
            {!hasSocialLinks && (
              <span className="text-xs text-zinc-500 ml-1">Add your social links</span>
            )}
          </div>
        )}
      </div>

      {/* <div className="flex gap-3">
        <Button className="flex-1 bg-[#0F172A] hover:bg-[#0F172A]/90 text-[#F8FAFC] rounded-full">
          <Plus className="mr-2 h-4 w-4" />
          Follow
        </Button>
        <Button variant="outline" className="w-[120px] rounded-full border-[#00000029] text-[#0F172A]">
          <Rss className="mr-2 h-4 w-4" />
          Message
        </Button>
      </div> */}

      {/* Bio */}
      <div className="w-full">
        {editingField === "bio" ? (
            <textarea
              ref={bioTextareaRef}
              value={bio}
              onChange={(e) => handleBioChange(e, setBio)}
              onBlur={handleBioBlur}
              onKeyDown={handleInputKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              className="text-[rgba(0,0,0,0.9)] w-full resize-none focus:outline-none focus:ring-0 bg-transparent max-h-[240px] overflow-hidden"
            placeholder="Your bio"
          />
        ) : (
          <p
            className={cn(
              "text-[rgba(0,0,0,0.9)] max-h-[240px] overflow-hidden break-words",
              (!isPublicView && isEditable) && "cursor-pointer hover:bg-zinc-50 rounded p-1 -m-1",
              isLoading && "opacity-60 transition-opacity duration-200"
            )}
            onMouseDown={(e) => {
              // 使用 onMouseDown 而不是 onClick，确保在 onBlur 之前设置新的 editingField
              e.preventDefault()
              handleEditField("bio")
            }}
          >
            {bio || currentUser?.profile?.bio ? (
              bio || currentUser?.profile?.bio
            ) : (isLoading && !hasLoadedProfile) ? (
              <span className="text-muted-foreground animate-pulse">Loading bio...</span>
            ) : (
              <span className="text-muted-foreground">
                {isPublicView ? 'No bio available' : 'Your bio'}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Tags section */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag: string, index: number) => (
          <div key={`tag-container-${index}`} className="relative group">
            {editingTagIndex === index ? (
              <div className="relative z-[3]">
                <input
                  ref={tagEditInputRef}
                  type="text"
                  value={editingTagValue}
                  onChange={(e) => setEditingTagValue(e.target.value)}
                  onBlur={handleTagEdit}
                  onKeyDown={handleTagEditKeyDown}
                  className="rounded-full text-[#64748B] border border-[#0000000F] px-3 py-2 text-xs font-normal min-w-[120px] focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full text-zinc-500 border-zinc-200 px-3 py-2 text-xs font-normal",
                  (!isPublicView && isEditable) && "cursor-pointer group-hover:pr-7"
                )}
                onClick={() => handleTagClick(index)}
              >
                {tag}
                {(!isPublicView && isEditable) && (
                  <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-[3]"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTag(index)
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#64748B]"
                    >
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </button>
                )}
              </Badge>
            )}
          </div>
        ))}

        {(!isPublicView && isEditable && tags.length < MAX_TAGS) && (
          <div className="flex items-center gap-2">
            {isAddingTag ? (
              <div className="relative z-[3]">
                <input
                  ref={tagInputRef}
                  type="text"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  onBlur={handleAddTag}
                  onKeyDown={handleTagKeyDown}
                  className="rounded-full text-zinc-500 border border-zinc-200 px-3 py-2 text-xs font-normal min-w-[120px] focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Add tag..."
                />
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 rounded-full border-zinc-200 z-[2]"
                  onClick={() => setIsAddingTag(true)}
                >
                  <Plus className="w-4 h-4 text-zinc-500" />
                </Button>
                {tags.length === 0 && !isAddingTag && (
                  <span className="text-xs text-zinc-500">Add research interests</span>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* <div
          className={cn(
            "flex items-center gap-2 text-zinc-500 p-1 rounded relative",
            (!isPublicView && isEditable) && "cursor-pointer hover:bg-zinc-50"
          )}
          onClick={() => handleEditField("website")}
        >
          <Globe className="w-4 h-4 flex-shrink-0" />
          {editingField === "website" ? (
            <input
              ref={fieldInputRef}
              type="text"
              value={website}
              onChange={(e) => handleFieldChange(e, setWebsite)}
              onKeyDown={handleInputKeyDown}
              onBlur={handleFieldBlur("website")}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Your personal website..."
            />
          ) : (
            <div
              className="flex items-center gap-2 text-sm"
              onClick={() => !isPublicView && isEditable && handleEditField("website")}
            >
              {website ? (
                <ClickableUrl url={website} isEditing={isEditable} />
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  {isPublicView ? "" : "Your personal website..."}
                </span>
              )}
            </div>
          )}
        </div> */}

        <div
          className={cn(
            "flex items-center gap-2 text-zinc-500 p-1 rounded relative",
            (!isPublicView && isEditable) && "cursor-pointer hover:bg-zinc-50"
          )}
          onMouseDown={(e) => {
            // 使用 onMouseDown 而不是 onClick，确保在 onBlur 之前设置新的 editingField
            e.preventDefault()
            handleEditField("affiliation")
          }}
        >
          <Building2 className="w-4 h-4 flex-shrink-0" />
          {editingField === "affiliation" ? (
            <input
              ref={fieldInputRef}
              type="text"
              value={affiliation}
              onChange={(e) => handleFieldChange(e, setAffiliation)}
              onBlur={handleFieldBlur("affiliation")}
              onKeyDown={handleInputKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              className="text-sm w-full focus:outline-none focus:ring-0 bg-transparent z-[2]"
              placeholder="Your affiliation..."
            />
          ) : (
            <span className="text-sm">
              {affiliation ? (
                affiliation
              ) : (isLoading && !hasLoadedProfile) ? (
                <span className="text-muted-foreground animate-pulse">Loading affiliation...</span>
              ) : (
                <span className="text-zinc-400">
                  {isPublicView ? 'No affiliation provided' : 'Add your affiliation'}
                </span>
              )}
            </span>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 text-zinc-500 p-1 rounded relative",
            (!isPublicView && isEditable) && "cursor-pointer hover:bg-zinc-50"
          )}
          onMouseDown={(e) => {
            // 使用 onMouseDown 而不是 onClick，确保在 onBlur 之前设置新的 editingField
            e.preventDefault()
            handleEditField("location")
          }}
        >
          <MapPin className="w-4 h-4 flex-shrink-0" />
          {editingField === "location" ? (
            <input
              ref={fieldInputRef}
              type="text"
              value={location}
              onChange={(e) => handleFieldChange(e, setLocation)}
              onBlur={handleFieldBlur("location")}
              onKeyDown={handleInputKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              className="text-sm w-full focus:outline-none focus:ring-0 bg-transparent z-[2]"
              placeholder="Your location..."
            />
          ) : (
            <span className="text-sm">
              {location ? (
                location
              ) : (isLoading && !hasLoadedProfile) ? (
                <span className="text-muted-foreground animate-pulse">Loading location...</span>
              ) : (
                <span className="text-zinc-400">
                  {isPublicView ? 'No location provided' : 'Add your location'}
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ShareIcon component - 白色图标用于主按钮
function ShareIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M5.72673 9.00667L10.2801 11.66M10.2734 4.34001L5.72673 6.99334M14 3.33333C14 4.4379 13.1046 5.33333 12 5.33333C10.8954 5.33333 10 4.4379 10 3.33333C10 2.22876 10.8954 1.33333 12 1.33333C13.1046 1.33333 14 2.22876 14 3.33333ZM6 8C6 9.10457 5.10457 10 4 10C2.89543 10 2 9.10457 2 8C2 6.89543 2.89543 6 4 6C5.10457 6 6 6.89543 6 8ZM14 12.6667C14 13.7712 13.1046 14.6667 12 14.6667C10.8954 14.6667 10 13.7712 10 12.6667C10 11.5621 10.8954 10.6667 12 10.6667C13.1046 10.6667 14 11.5621 14 12.6667Z"
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
