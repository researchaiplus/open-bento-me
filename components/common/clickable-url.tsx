import React from 'react';
import { cn } from '@/lib/utils';

interface ClickableUrlProps {
  url: string | null;
  className?: string;
  isEditing?: boolean;
}

export function ClickableUrl({ url, className, isEditing = false }: ClickableUrlProps) {
  if (!url) return null;

  // 确保URL有协议前缀
  const fullUrl = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `https://${url}`;

  // 显示的URL（去掉协议前缀）
  const displayUrl = url.replace(/^https?:\/\//, '');

  // 如果在编辑模式，只显示文本
  if (isEditing) {
    return <span className={cn("break-all", className)}>{displayUrl}</span>;
  }

  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300",
        "transition-colors duration-200 break-all",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {displayUrl}
    </a>
  );
} 