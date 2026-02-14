/**
 * PWA 应用清单(Web App Manifest) - 渐进式Web应用配置文件
 *
 * 功能说明:
 * - 定义应用在移动设备上的安装和显示方式
 * - 使Web应用能够像原生应用一样添加到主屏幕
 *
 * 配置项说明:
 * - name: 应用全名 - "Research Nexus"
 * - short_name: 应用简称 - "ResearchNexus" (主屏幕显示)
 * - description: 应用描述
 * - start_url: 启动路径 - 应用从根路径启动
 * - scope: 应用作用域 - 仅限根路径下的页面
 * - display: 显示模式 - standalone (独立窗口,无浏览器UI)
 * - background_color: 启动背景色 - 黑色 (#000000)
 * - theme_color: 主题颜色 - 黑色 (#000000)
 * - orientation: 屏幕方向 - any (支持任何方向)
 * - icons: 应用图标配置
 *   * 192x192: 普通图标
 *   * 512x512: 带maskable(自适应图标,可填充形状)
 *
 * 关键特性:
 * - 提供类原生应用体验
 * - 支持离线访问(配合Service Worker)
 * - 可添加到主屏幕
 * - 独立窗口运行(无浏览器地址栏)
 * - 图标适配不同设备
 */

import type { MetadataRoute } from "next"

// Required for static export (output: 'export') compatibility
export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Research Nexus",
    short_name: "ResearchNexus",
    description: "Collaborative research workspace with AI-assisted insights.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    orientation: "any",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  }
}
