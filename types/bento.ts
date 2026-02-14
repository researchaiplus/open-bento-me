import type { TPosition } from './box-metadata';
import type { SampleUser } from '@/data/sample-users';

// This is the main type for a bento grid item used in the frontend
export interface BentoItemProps {
  id: string;
  // Note: 'paper' and 'project' types have been removed
  type: 'link' | 'text' | 'image' | 'github' | 'people' | 'section_title' | 'repository' | 'need' | 'placeholder';
  x: number;
  y: number;
  w: number;
  h: number;
  isDraggable?: boolean;
  isResizable?: boolean;
  isNew?: boolean;
  className?: string;
  
  // Card-specific properties
  url?: string;
  title?: string;
  content?: string;
  text?: string;
  savedTitle?: string;
  cardSize?: 'small' | 'horizontal' | 'vertical' | 'large' | 'square';
  imageUrl?: string;
  savedImage?: string;
  owner?: string;
  repo?: string;
  savedDescription?: string;
  description?: string;
  language?: string;
  languageColor?: string;
  stars?: number;
  topics?: string[];
  eventTagIds?: string[];
  userId?: string;  // 真实用户ID，用于people类型的卡片
  username?: string; // 用户名，用于生成URL
  avatar?: string;
  bio?: string;
  user?: any; // 用户对象，用于 people 类型的卡片
  
  // Need Board specific properties
  showPin?: boolean;
  isVertical?: boolean;
  size?: 'small' | 'horizontal' | 'vertical' | 'large' | 'square';
  
  // Repository platform specific properties
  platform?: 'github' | 'huggingface'; // repository platform
  category?: string; // huggingface
  downloads?: number; // huggingface
  likes?: number; // huggingface
  
  // 图片变换相关字段
  image_scale?: number;
  image_position_x?: number;
  image_position_y?: number;
  
  // Callback functions
  onDelete?: () => void;
  onTextChange?: (newText: string) => void;
  onContentChange?: (newContent: string) => void;
  onTitleChange?: (newTitle: string) => void;
  onDescriptionChange?: (newDescription: string) => void;
  onImageChange?: (newImage: string | null | undefined) => void;
  onImagesChange?: (newImages: string[]) => void;
  onSizeChange?: (newSize: 'small' | 'horizontal' | 'vertical' | 'large' | 'square') => void;
  onEdit?: () => void;

  // Placeholder specific
  placeholderType?: 'github' | 'huggingface';
  progress?: any;
}

// Layout configuration for different screen sizes - only positions, sizes are stored in width/height fields
export interface ResponsiveLayout {
  lg?: { x: number; y: number }; // 4-column layout position
  sm?: { x: number; y: number }; // 2-column layout position
}

// This represents the data structure of a box as it is stored in the database
export interface BentoItem {
    id: string;
    userId: string;
    type: string; // Should correspond to BoxTypeString e.g., 'GITHUB', 'IMAGE'
    width: number;
    height: number;
    position: TPosition;
    layout?: ResponsiveLayout | null; // @deprecated: 即将被废弃，使用 position.responsive 替代
    metadata: any; // Ideally, this should be a discriminated union based on `type`
    url: string | null;
    className: string | null;
    createdAt: Date;
    updatedAt: Date;
    // 图片变换相关字段
    image_scale?: number | null;
    image_position_x?: number | null;
    image_position_y?: number | null;
    eventTagIds?: string[];
}

// Input for creating a new box via the API
export interface BoxCreateInput {
    type: string;
    width: number;
    height: number;
    position: TPosition;
    layout?: ResponsiveLayout | null;
    metadata: any;
    url?: string | null;
    className?: string | null;
}

// Input for updating an existing box via the API
export interface BoxUpdateInput {
    width?: number;
    height?: number;
    position?: Partial<TPosition>;
    layout?: ResponsiveLayout | null;
    metadata?: any;
    url?: string | null;
    className?: string | null;
} 

// 兼容性工具函数：统一获取位置信息
export const getPosition = (item: any, layoutMode: 'lg' | 'sm'): { x: number; y: number } => {
  // 新格式：从 position.responsive 获取
  if (item.position?.responsive?.[layoutMode]) {
    return item.position.responsive[layoutMode];
  }
  
  // 旧格式：从 layout 获取（兼容性）
  if (item.layout?.[layoutMode]) {
    return item.layout[layoutMode];
  }
  
  // 默认：从 position 获取
  return { x: item.position?.x || 0, y: item.position?.y || 0 };
};

// 兼容性工具函数：检查是否有响应式布局
export const hasResponsiveLayout = (item: any): boolean => {
  return !!(item.position?.responsive || item.layout);
}; 
