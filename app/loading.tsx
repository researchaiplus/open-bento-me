/**
 * 全局加载状态组件 - 页面初始加载时的占位UI
 *
 * 功能说明:
 * - 在应用初始加载时显示(full page loading)
 * - 防止SSR/SSG页面在数据加载前显示空白
 * - 提供一致的用户体验
 * - 简单的旋转动画(spinner)
 *
 * 使用场景:
 * - SSR/SSG页面的初始数据加载
 * - 路由切换时的过渡状态
 * - 全局数据获取时的等待状态
 *
 * 设计特点:
 * - 全屏居中布局
 * - 简洁的旋转动画
 * - 与品牌风格一致的配色方案
 */

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  )
}

