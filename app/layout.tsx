/**
 * 根布局组件 - 全局应用配置
 *
 * 功能说明:
 * - 配置应用的全局元数据(metadata)
 *   - 页面标题(title): "Research Nexus"
 *   - 页面描述(description): 协作研究平台
 *   - manifest: PWA配置文件路径
 *   - 苹果Web应用配置(appleWebApp): 支持添加到主屏幕
 *   - 应用图标(icons): 多种尺寸的图标配置
 *
 * - 配置视口(viewport)
 *   - 响应式布局(device-width)
 *   - 初始缩放比例(initialScale: 1)
 *   - 支持刘海屏(viewportFit: cover)
 *   - 主题颜色(themeColor: #000000)
 *
 * - 应用全局字体
 *   - Inter字体(本地woff2文件，避免依赖Google Fonts网络)
 *   - Latin + Latin-ext子集，支持可变字重(100-900)
 *   - CSS变量集成(--font-inter)
 *
 * - 全局样式
 *   - 导入Tailwind CSS(globals.css)
 *   - 应用字体样式到body元素
 *
 * - 全局Provider
 *   - 包装AppProviders组件,提供全局状态管理
 *   - 用户上下文(UserProvider)
 *   - Toast通知系统(Toaster)
 */

import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import localFont from "next/font/local"
import "@/app/globals.css"
import { AppProviders } from "./providers"

// Use local Inter font files to avoid dependency on Google Fonts network
// Variable font supports weight 100-900 with latin + latin-ext subsets
const inter = localFont({
  src: [
    {
      path: '../public/fonts/InterVariable-latin.woff2',
      style: 'normal',
    },
    {
      path: '../public/fonts/InterVariable-latin-ext.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
})

const appIcons = {
  appleTouch: "/icons/default-avatar.png",
  icon192: "/icons/icon-192.png",
  icon512: "/icons/icon-512.png"
}

export const metadata: Metadata = {
  title: {
    default: "Research Nexus",
    template: "%s | Research Nexus"
  },
  description: "Collaborative research workspace with AI-assisted insights.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Research Nexus",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: [
      { url: appIcons.icon192, type: "image/png", sizes: "192x192" },
      { url: appIcons.icon512, type: "image/png", sizes: "512x512" }
    ],
    apple: [{ url: appIcons.appleTouch }]
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000"
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className}`} suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
