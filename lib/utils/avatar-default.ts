export function getDefaultAvatarUrl(): string {
  // 优先使用环境变量，便于不同环境配置不同默认图
  const envUrl = process.env.NEXT_PUBLIC_DEFAULT_AVATAR_URL
  if (envUrl && envUrl.trim().length > 0) return envUrl

  // 回退到本地默认图
  return "/icons/default-avatar.png"
}


