import type { SampleUser } from '@/data/sample-users'
import type { ReactNode } from 'react';
import type { BentoItemProps as UnifiedBentoItemProps } from '@/types/bento';
import type { User } from '@/hooks/use-user';

/**
 * @deprecated 此接口已被废弃，请使用 RepositoryCard 组件的 props 替代
 * 
 * 迁移指南：
 * - 将 GithubCardProps 替换为 RepositoryCard 的 props
 * - 主要变化：repo -> repository，添加 platform: 'github'
 */
export interface GithubCardProps {
  owner: string;
  repo: string;
  description: string;
  language: string;
  languageColor: string;
  stars: number;
  topics: string[];
  isEditable?: boolean;
  isResizable?: boolean;
  onDelete?: () => void;
}

export type BentoItemProps = UnifiedBentoItemProps;

export interface BentoGridProps {
  items: BentoItemProps[];
  isEditable?: boolean;
  onLayoutChange?: (layout: Layout[]) => void;
  renderItem?: (item: BentoItemProps) => ReactNode;
  onItemUpdate?: (id: string, updates: Partial<BentoItemProps>) => void;
  onItemDelete?: (id: string) => void;
}

export interface Layout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  static?: boolean;
}

export interface TextCardProps {
  text?: string;
  size?: 'small' | 'horizontal' | 'vertical' | 'large';
  isEditable?: boolean;
  isResizable?: boolean;
  onDelete?: () => void;
  onTextChange?: (newText: string) => void;
  onSizeChange?: (newSize: 'small' | 'horizontal' | 'vertical' | 'large') => void;
}

export interface ImageCardProps {
  itemId: string;
  imageUrl: string;
  size?: 'small' | 'horizontal' | 'vertical' | 'large';
  isEditable?: boolean;
  isResizable?: boolean;
  onDelete?: () => void;
  onImageChange?: (newImage: string | null) => void;
  onSizeChange?: (newSize: 'small' | 'horizontal' | 'vertical' | 'large') => void;
  onEditStart?: (id: string) => void;
  onEditEnd?: () => void;
  cropShape?: "square" | "round";
  initialScale?: number;
  initialPosition?: { x: number; y: number };
  onTransformChange?: (transform: {
    scale: number;
    position: { x: number; y: number };
  }) => void;
}

export interface PeopleCardProps {
  user: User;
  isEditable?: boolean;
  isResizable?: boolean;
  onDelete?: () => void;
} 