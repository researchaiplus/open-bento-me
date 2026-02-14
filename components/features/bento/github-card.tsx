"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Trash, Circle } from "lucide-react"
import type { GithubCardProps } from "./types"
import { cn } from "@/lib/utils"

/**
 * @deprecated 此组件已被废弃，请使用 RepositoryCard 替代
 * 
 * 迁移指南：
 * 1. 将 GithubCard 替换为 RepositoryCard
 * 2. 更新 props：
 *    - owner -> owner (保持不变)
 *    - repo -> repository
 *    - 添加 platform: 'github'
 *    - 其他 props 保持不变
 * 
 * 示例：
 * 旧用法：<GithubCard owner="user" repo="repo" ... />
 * 新用法：<RepositoryCard platform="github" owner="user" repository="repo" ... />
 */

// 格式化数字为 k/m 格式
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
};

export function GithubCard({
  owner,
  repo,
  description,
  language,
  languageColor,
  stars,
  topics,
  isEditable = false,
  onDelete,
}: GithubCardProps) {
  // 废弃警告
  console.warn(
    'GithubCard 组件已被废弃，将在未来版本中移除。请使用 RepositoryCard 组件替代。' +
    '查看组件文件中的迁移指南获取详细信息。'
  );

  const [isHovered, setIsHovered] = useState(false)

  const handleCardClick = (e: React.MouseEvent) => {
    // 阻止事件冒泡
    e.preventDefault();
    e.stopPropagation();
    
    // 如果在编辑模式，不执行跳转
    if (isEditable) {
      return;
    }
    
    // 如果点击的是删除按钮或者其子元素，不执行跳转
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // 打开新标签页
    window.open(`https://github.com/${owner}/${repo}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="group relative flex p-5 flex-col items-start gap-2 rounded-[24px] border border-black/[0.06] bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow duration-200 w-full h-full cursor-pointer"
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={e => {
        if (!isEditable) {
          e.stopPropagation();
        }
      }}
      onTouchStart={e => {
        if (!isEditable) {
          e.stopPropagation();
        }
      }}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!isEditable && (e.key === 'Enter' || e.key === ' ')) {
          handleCardClick(e as any);
        }
      }}
    >
      {/* 废弃警告横幅 */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-40 bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
        ⚠️ 已废弃 - 请使用 RepositoryCard
      </div>

      {/* Delete button */}
      {isHovered && isEditable && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onMouseDown={e => e.stopPropagation()}
          className={`absolute -top-3 -left-3 z-50 flex items-center gap-2 p-2 rounded-[60px] border border-[rgba(0,0,0,0.06)] bg-white shadow-[0px_4px_10px_0px_rgba(0,0,0,0.10)] transition-opacity duration-200`}
          aria-label="Delete repository"
        >
          <Trash size={16} className="text-zinc-900" />
        </button>
      )}

      {/* 卡片内容 */}
      <div className="flex flex-col gap-3 w-full pointer-events-none">
        {/* 仓库名称 */}
        <div className="flex items-center gap-2 min-w-0">
          <img
            src="https://github.com/favicon.ico"
            alt="GitHub"
            className="w-4 h-4 flex-shrink-0"
          />
          <span className="text-ml text-zinc-900 truncate">
            <span className="font-regular">{owner}</span>
            <span className="font-semibold">/{repo}</span>
          </span>
        </div>

        {/* 仓库描述 */}
        <p className="text-xs text-zinc-500 line-clamp-2 min-h-[32px]">
          {description || 'No description provided.'}
        </p>

        {/* 主题标签 */}
        {topics && topics.length > 0 && (
          <div className="flex flex-wrap gap-2 overflow-hidden">
            {topics.slice(0, 3).map((topic) => (
              <Badge
                key={topic}
                variant="secondary"
                className="bg-zinc-100 font-medium text-zinc-700 px-3 py-1 text-xs rounded-full max-w-[160px] truncate"
              >
                {topic}
              </Badge>
            ))}
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
          {/* 编程语言 */}
          {language && (
            <div className="flex items-center gap-1">
              <Circle size={14} fill={languageColor} stroke="none" />
              <span>{language}</span>
            </div>
          )}
          
          {/* 星标数 */}
          <div className="flex items-center gap-1">
            <Star size={16} className="text-zinc-500" />
            <span>{formatNumber(stars)}</span>
          </div>
        </div>
      </div>
    </div>
  )
} 