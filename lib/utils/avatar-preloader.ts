/**
 * 头像预加载工具
 * 在应用启动时预加载用户头像，减少闪烁
 */

class AvatarPreloader {
  private static instance: AvatarPreloader
  private preloadedImages = new Set<string>()

  private constructor() {}

  static getInstance(): AvatarPreloader {
    if (!AvatarPreloader.instance) {
      AvatarPreloader.instance = new AvatarPreloader()
    }
    return AvatarPreloader.instance
  }

  /**
   * 预加载头像图片
   */
  preloadAvatar(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!src || this.preloadedImages.has(src)) {
        resolve()
        return
      }

      const img = new Image()
      img.onload = () => {
        this.preloadedImages.add(src)
        void 0
        resolve()
      }
      img.onerror = () => {
        console.warn('[AvatarPreloader] Failed to preload avatar:', src)
        reject(new Error(`Failed to preload ${src}`))
      }
      img.src = src
    })
  }

  /**
   * 检查头像是否已预加载
   */
  isPreloaded(src: string): boolean {
    return this.preloadedImages.has(src)
  }

  /**
   * 清除预加载缓存
   */
  clearCache(): void {
    this.preloadedImages.clear()
  }
}

export const avatarPreloader = AvatarPreloader.getInstance()