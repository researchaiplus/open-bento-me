"use client";

import React from 'react';
import { Box, BoxType } from '@/types/box';
import { TUpdateBoxInput } from '@/types/box-metadata';
import { useUser } from '@/hooks/use-user';

// 导入所有卡片组件
import { RepositoryCard } from './repository-card';
import { ImageCard } from './image-card';
import { PeopleCardDemo } from './people-card';
import { TextCard } from './text-card';
import { LinkCard } from './link-card';
import { SectionTitleCard } from './sectiontitle-card';
import { NeedBoardCard } from './needboard-card';
import { resolveNeedBoardSize } from '@/lib/constants/grid';


// 定义 BoxRenderer 的 props
interface BoxRendererProps {
  box: Box;
  isEditable?: boolean;
  onDelete?: () => void;
  onUpdate?: (updatedBox: TUpdateBoxInput) => void;
}

// Box 数据到卡片 props 的转换辅助函数 (针对每种类型)
/**
 * @deprecated 此函数已被废弃，请使用 mapBoxToRepositoryCardProps 替代
 * 
 * 迁移指南：
 * - 将 mapBoxToGithubCardProps 替换为 mapBoxToRepositoryCardProps
 * - 新函数支持 GitHub 和 HuggingFace 平台
 * - 返回的 props 结构略有不同，但功能更强大
 */
const mapBoxToGithubCardProps = (box: Box, isEditable: boolean, onDelete?: () => void) => {
  // 废弃警告
  console.warn(
    'mapBoxToGithubCardProps 函数已被废弃，请使用 mapBoxToRepositoryCardProps 替代。' +
    '新函数提供更好的平台支持和功能。'
  );
  
  const metadata = box.metadata as any || {};
  return {
    owner: metadata.owner || '',
    repo: metadata.repo || '',
    description: metadata.description || '',
    language: metadata.language || null,
    languageColor: metadata.languageColor || '#ccc',
    stars: metadata.stars || 0,
    topics: metadata.topics || [],
    isEditable,
    onDelete,
  };
};

const mapBoxToRepositoryCardProps = (box: Box, isEditable: boolean, onDelete?: () => void, onUpdate?: (updatedBox: TUpdateBoxInput) => void) => {
  const metadata = box.metadata as any || {};
  const inferredPlatform: 'github' | 'huggingface' = metadata.platform || ((metadata.downloads !== undefined || metadata.likes !== undefined || metadata.category !== undefined) ? 'huggingface' : 'github');
  
  // 从 box.width 和 box.height 计算 cardSize
  const getCardSizeFromDimensions = (w: number, h: number): 'small' | 'horizontal' | 'vertical' | 'large' => {
    if (w === 1 && h === 2) return 'small';
    if (w === 2 && h === 2) return 'horizontal';
    if (w === 1 && h === 4) return 'vertical';
    if (w === 2 && h === 4) return 'large';
    return 'horizontal'; // 默认值
  };
  
  const cardSize = getCardSizeFromDimensions(box.width || 2, box.height || 2);
  
  // 将 cardSize 转换为 width/height 的辅助函数
  const cardSizeToDimensions = (size: 'small' | 'horizontal' | 'vertical' | 'large'): { width: number; height: number } => {
    switch (size) {
      case 'small':
        return { width: 1, height: 2 };
      case 'horizontal':
        return { width: 2, height: 2 };
      case 'vertical':
        return { width: 1, height: 4 };
      case 'large':
        return { width: 2, height: 4 };
      default:
        return { width: 2, height: 2 };
    }
  };
  
  return {
    platform: inferredPlatform,
    owner: metadata.owner || '',
    repository: metadata.repo || '',
    description: metadata.savedDescription || metadata.description || '',
    language: metadata.language || null,
    languageColor: metadata.languageColor || '#ccc',
    category: inferredPlatform === 'huggingface' ? metadata.category : undefined,
    stars: inferredPlatform === 'github' ? (metadata.stars || 0) : undefined,
    downloads: inferredPlatform === 'huggingface' ? metadata.downloads : undefined,
    likes: inferredPlatform === 'huggingface' ? metadata.likes : undefined,
    // DEBUG
    _debug: { downloads: metadata.downloads, likes: metadata.likes, raw: metadata },
    isEditable,
    isResizable: true, // 启用尺寸调整功能
    size: cardSize,
    onDelete,
    onDescriptionChange: (newDescription: string) => {
      if (onUpdate) {
        onUpdate({
          metadata: {
            ...metadata,
            savedDescription: newDescription
          }
        } as TUpdateBoxInput);
      }
    },
    onSizeChange: (newSize: 'small' | 'horizontal' | 'vertical' | 'large') => {
      if (onUpdate) {
        const dimensions = cardSizeToDimensions(newSize);
        onUpdate({
          width: dimensions.width,
          height: dimensions.height
        } as TUpdateBoxInput);
      }
    },
  };
};

const mapBoxToImageCardProps = (box: Box, isEditable: boolean, onDelete?: () => void, onUpdate?: (updatedBox: TUpdateBoxInput) => void) => {
  const metadata = box.metadata as any || {};
  // 将 'small' 明确类型化为 'small' | 'horizontal' | 'vertical' | 'large'
  const size: 'small' | 'horizontal' | 'vertical' | 'large' = 'small';
  
  return {
    itemId: box.id,
    imageUrl: metadata.imageUrl || '',
    cropShape: metadata.cropShape || 'square',
    isEditable,
    onDelete,
    size, // 现在符合类型定义
    onImageChange: (newImage: string | null) => {
      if (onUpdate) {
        onUpdate({
          metadata: {
            ...metadata,
            imageUrl: newImage
          }
        } as TUpdateBoxInput);
      }
    },
    onTransformChange: async (transform: { scale: number; position: { x: number; y: number } }) => {
      try {
        void 0

        // 检查是否是临时卡片（短 ID），如果是则不调用 API
        if (!box.id || box.id.length <= 10) {
          void 0
          return;
        }

        const response = await fetch(`/api/boxes/${box.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_scale: transform.scale,
            image_position_x: transform.position.x,
            image_position_y: transform.position.y,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update image transform')
        }

        const updatedBox = await response.json()
        void 0
      } catch (error) {
        console.error('BoxRenderer: ImageCard 更新图片变换时发生错误:', error)
      }
    },
    initialScale: (box as any).image_scale || 1,
    initialPosition: {
      x: (box as any).image_position_x || 0,
      y: (box as any).image_position_y || 0,
    }
  };
};

// 创建一个组件来获取并显示真实用户数据
// Note: In the open-source static version, user fetching is simplified
const PeopleCardWithUser = ({ userId, isEditable, onDelete }: { userId: string, isEditable: boolean, onDelete?: () => void }) => {
  const { user, loading, error } = useUser(userId);

  if (loading) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="w-24 h-4 bg-gray-300 rounded mb-2"></div>
            <div className="w-16 h-3 bg-gray-300 rounded"></div>
          </div>
        </div>
        <div className="mt-3 w-full h-3 bg-gray-300 rounded"></div>
        <div className="mt-2 w-3/4 h-3 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600 text-sm">无法加载用户信息</p>
        <p className="text-red-500 text-xs">{error || '用户不存在'}</p>
        {isEditable && onDelete && (
          <button
            onClick={onDelete}
            className="mt-2 text-xs text-red-600 underline"
          >
            删除此卡片
          </button>
        )}
      </div>
    );
  }

  return (
    <PeopleCardDemo
      user={user}
      isEditable={isEditable}
      onDelete={onDelete}
    />
  );
};

// 为people card创建一个包装组件，用于获取真实用户数据
const PeopleCardWrapper = ({ box, isEditable, onDelete }: { box: Box, isEditable: boolean, onDelete?: () => void }) => {
  const metadata = box.metadata as any || {};
  const userId = metadata.userId;
  
  // 如果没有userId，显示错误状态
  if (!userId) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <p className="text-red-600 text-sm">The user ID is invalid</p>
        <p className="text-red-500 text-xs">Please delete this card and add it again</p>
      </div>
    );
  }

  return <PeopleCardWithUser userId={userId} isEditable={isEditable} onDelete={onDelete} />;
};

// 这个组件不再导出，只用于内部
const mapBoxToPeopleCardProps = (box: Box, isEditable: boolean, onDelete?: () => void) => {
  return <PeopleCardWrapper box={box} isEditable={isEditable} onDelete={onDelete} />;
};

const mapBoxToTextCardProps = (box: Box, isEditable: boolean, onDelete?: () => void, onUpdate?: (updatedBox: TUpdateBoxInput) => void) => {
  const metadata = box.metadata as any || {};
  // 将 'small' 明确类型化为 'small' | 'horizontal' | 'vertical' | 'large'
  const size: 'small' | 'horizontal' | 'vertical' | 'large' = 'small';
  
  return {
    text: metadata.text || '',
    isEditable,
    onDelete,
    size, // 现在符合类型定义
    onTextChange: (newText: string) => {
      if (onUpdate) {
        onUpdate({
          metadata: {
            ...metadata,
            text: newText
          }
        } as TUpdateBoxInput);
      }
    }
  };
};

const mapBoxToLinkCardProps = (box: Box, isEditable: boolean, onDelete?: () => void, onUpdate?: (updatedBox: TUpdateBoxInput) => void) => {
  const metadata = box.metadata as any || {};
  
  // 调试日志：检查从数据库获取的 metadata
  void 0;
  
  // 从 box.width 和 box.height 计算 cardSize
  // 使用与 getCardSize 相同的逻辑
  const getCardSizeFromDimensions = (w: number, h: number): 'small' | 'horizontal' | 'vertical' | 'large' => {
    if (w === 1 && h === 2) return 'small';
    if (w === 2 && h === 2) return 'horizontal';
    if (w === 1 && h === 4) return 'vertical';
    if (w === 2 && h === 4) return 'large';
    return 'small'; // 默认值
  };
  
  const cardSize = getCardSizeFromDimensions(box.width || 1, box.height || 2);
  
  // 将 cardSize 转换为 width/height 的辅助函数
  const cardSizeToDimensions = (size: 'small' | 'horizontal' | 'vertical' | 'large'): { width: number; height: number } => {
    switch (size) {
      case 'small':
        return { width: 1, height: 2 };
      case 'horizontal':
        return { width: 2, height: 2 };
      case 'vertical':
        return { width: 1, height: 4 };
      case 'large':
        return { width: 2, height: 4 };
      default:
        return { width: 1, height: 2 };
    }
  };
  
  return {
    url: box.url || '',
    isEditable,
    onDelete,
    isResizable: true, // 启用尺寸调整功能
    size: cardSize, // 传递计算出的 cardSize
    // 只有当 savedTitle 真正存在且不为空时才使用，否则返回 undefined 让组件去获取
    savedTitle: metadata.savedTitle && metadata.savedTitle.trim() !== '' ? metadata.savedTitle : undefined,
    onTitleChange: (newTitle: string) => {
      if (onUpdate) {
        onUpdate({
          metadata: {
            ...metadata,
            savedTitle: newTitle
          }
        } as TUpdateBoxInput);
      }
    },
    // 只有当 savedImage 真正存在且不为空时才使用，否则返回 undefined 让组件去获取
    savedImage: metadata.savedImage && metadata.savedImage.trim() !== '' ? metadata.savedImage : undefined,
    onImageChange: (newImage: string | null) => {
      if (onUpdate) {
        onUpdate({
          metadata: {
            ...metadata,
            savedImage: newImage
          }
        } as TUpdateBoxInput);
      }
    },
    onSizeChange: (newSize: 'small' | 'horizontal' | 'vertical' | 'large') => {
      if (onUpdate) {
        const dimensions = cardSizeToDimensions(newSize);
        onUpdate({
          width: dimensions.width,
          height: dimensions.height
        } as TUpdateBoxInput);
      }
    },
    onTransformChange: async (transform: { scale: number; position: { x: number; y: number } }) => {
      try {
        void 0

        // 检查是否是临时卡片（短 ID），如果是则不调用 API
        if (!box.id || box.id.length <= 10) {
          void 0
          return;
        }

        const response = await fetch(`/api/boxes/${box.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_scale: transform.scale,
            image_position_x: transform.position.x,
            image_position_y: transform.position.y,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update image transform')
        }

        const updatedBox = await response.json()
        void 0
      } catch (error) {
        console.error('BoxRenderer: LinkCard 更新图片变换时发生错误:', error)
      }
    },
    initialScale: (box as any).image_scale || 1,
    initialPosition: {
      x: (box as any).image_position_x || 0,
      y: (box as any).image_position_y || 0,
    }
  };
};

const mapBoxToSectionTitleCardProps = (box: Box, isEditable: boolean, onDelete?: () => void, onUpdate?: (updatedBox: TUpdateBoxInput) => void) => {
  const metadata = box.metadata as any || {};
  return {
    text: metadata.text || '',
    isEditable,
    onDelete,
    onTextChange: (newText: string) => {
      if (onUpdate) {
        onUpdate({
          metadata: {
            ...metadata,
            text: newText
          }
        } as TUpdateBoxInput);
      }
    }
  };
};

const mapBoxToNeedCardProps = (box: Box, isEditable: boolean, onDelete?: () => void, onUpdate?: (updatedBox: TUpdateBoxInput) => void) => {
  const metadata = box.metadata as any || {};
  
  // 调试信息
  void 0;
  
  return {
    title: metadata.title || 'Need Board',
    content: metadata.content || '',
    showPin: metadata.showPin !== undefined ? metadata.showPin : false,
    isVertical: metadata.isVertical !== undefined ? metadata.isVertical : false,
    size: resolveNeedBoardSize(metadata.size),
    isEditable,
    onDelete,
    onSizeChange: (newSize: any) => {
      if (onUpdate) {
        onUpdate({
          metadata: {
            ...metadata,
            size: newSize
          }
        } as TUpdateBoxInput);
      }
    },
    onTitleChange: (newTitle: string) => {
      if (onUpdate) {
        onUpdate({
          metadata: {
            ...metadata,
            title: newTitle
          }
        } as TUpdateBoxInput);
      }
    },
    onContentChange: (newContent: string) => {
      void 0;
      if (onUpdate) {
        void 0;
        onUpdate({
          metadata: {
            ...metadata,
            content: newContent
          }
        } as TUpdateBoxInput);
      } else {
        void 0;
      }
    }
  };
};

// 渲染器组件
export default function BoxRenderer({ box, isEditable = false, onDelete, onUpdate }: BoxRendererProps) {
  // 根据 Box 的 type 渲染相应的卡片组件
  switch (box.type) {
    // case 'GITHUB':
    //   return <GithubCard {...mapBoxToGithubCardProps(box, isEditable, onDelete)} />;

    case 'GITHUB':
      return <RepositoryCard {...mapBoxToRepositoryCardProps(box, isEditable, onDelete, onUpdate) as any} />;
    
    case 'IMAGE':
      return <ImageCard {...mapBoxToImageCardProps(box, isEditable, onDelete, onUpdate) as any} />;
    
    case 'PEOPLE':
      return mapBoxToPeopleCardProps(box, isEditable, onDelete);
    
    case 'TEXT':
      return <TextCard {...mapBoxToTextCardProps(box, isEditable, onDelete, onUpdate) as any} />;
    
    case 'LINK':
      return <LinkCard {...mapBoxToLinkCardProps(box, isEditable, onDelete, onUpdate) as any} />;
    
    case 'SECTION_TITLE':
      return <SectionTitleCard {...mapBoxToSectionTitleCardProps(box, isEditable, onDelete, onUpdate) as any} />;
    
    case 'NEED':
      return <NeedBoardCard {...mapBoxToNeedCardProps(box, isEditable, onDelete, onUpdate) as any} />;
    
    default:
      // 未知卡片类型的回退渲染
      return (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <h3 className="font-medium text-red-600">未知卡片类型: {box.type}</h3>
          <pre className="mt-2 text-xs bg-white p-2 rounded">
            {JSON.stringify(box, null, 2)}
          </pre>
        </div>
      );
  }
}
