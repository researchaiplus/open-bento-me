"use client"

import { useState } from "react"
import { Trash } from "lucide-react"
import { RepositoryHeader } from "./repository-header";
import { RepositoryDescription } from "./repository-description";
import { RepositoryStats } from "./repository-stats";

interface RepositoryCardProps {
  platform: 'github' | 'huggingface';
  owner: string;
  repository: string;
  description: string;
  language?: string;
  languageColor?: string;
  category?: string;
  stars?: number;
  downloads?: number;
  likes?: number;
  isEditable?: boolean;
  isResizable?: boolean;
  onDelete?: () => void;
}

export function RepositoryCard({
  platform,
  owner,
  repository,
  description,
  language,
  languageColor,
  category,
  stars,
  downloads,
  likes,
  isEditable = false,
  isResizable = false,
  onDelete,
}: RepositoryCardProps) {
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
    
    // 根据平台打开相应的链接
    let url = '';
    if (platform === 'github') {
      url = `https://github.com/${owner}/${repository}`;
    } else if (platform === 'huggingface') {
      // For datasets, use /datasets/{owner}/{repo}; for models default to /{owner}/{repo}
      if (category === 'dataset') {
        url = `https://huggingface.co/datasets/${owner}/${repository}`;
      } else {
        url = `https://huggingface.co/${owner}/${repository}`;
      }
    }
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="bg-[#ffffff] box-border content-stretch flex flex-row gap-6 h-[175px] items-start justify-start p-0 rounded-3xl w-full relative cursor-pointer hover:shadow-md transition-shadow duration-200"
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

      <div
        aria-hidden="true"
        className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-3xl shadow-[0px_2px_4px_0px_rgba(0,0,0,0.04)]"
      />
      <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0">
        <div className="relative size-full">
          <div className="box-border content-stretch flex flex-row gap-6 items-start justify-start p-[24px] relative size-full">
            <div className="basis-0 box-border content-stretch flex flex-col grow h-full items-start justify-between min-h-px min-w-px p-0 relative shrink-0">
              <div className="box-border content-stretch flex flex-col gap-2 items-start justify-start p-0 relative shrink-0 w-full">
                <RepositoryHeader 
                  platform={platform}
                  owner={owner}
                  repository={repository}
                />
                <RepositoryDescription description={description} />
              </div>
              {platform === 'huggingface' ? (
                <RepositoryStats
                  language={category}
                  languageColor={languageColor}
                  category={undefined}
                  stars={undefined}
                  downloads={downloads}
                  likes={likes}
                />
              ) : (
                <RepositoryStats
                  language={language}
                  languageColor={languageColor}
                  category={category}
                  stars={stars}
                  downloads={undefined}
                  likes={undefined}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}