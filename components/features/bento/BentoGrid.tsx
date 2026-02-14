"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { BentoItem } from './BentoItem';
import type { Layout } from './types';
import type { BentoItemProps } from '@/types/bento';
import { BENTO_GRID_ROW_HEIGHT, BENTO_GRID_VERTICAL_MARGIN, getNeedBoardGridSize, resolveNeedBoardSize } from '@/lib/constants/grid';

interface ExtendedBentoGridProps {
  items: BentoItemProps[];
  onLayoutChange?: (layout: Layout[], layoutMode?: 'lg' | 'sm') => void;
  onLayoutModeChange?: (layoutMode: 'lg' | 'sm') => void;
  onDragStop?: (layout: Layout[], layoutMode?: 'lg' | 'sm') => void; // 新增：只在拖动结束时触发
  isEditable?: boolean;
  draggableCancel?: string;
  renderItem?: (item: BentoItemProps) => React.ReactNode;
  clearNewItemFlag?: (itemId: string) => void;
  onItemUpdate?: (id: string, updates: Partial<BentoItemProps>) => void;
  onItemDelete?: (id: string) => void;
  compactType?: 'vertical' | 'horizontal' | null;
}

// 辅助函数：检查元素是否在视口内
const isElementInViewport = (el: HTMLElement) => {
  const rect = el.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

  void 0;

  const isInViewport = (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= viewportHeight &&
    rect.right <= viewportWidth
  );

  void 0;
  return isInViewport;
};

export const BentoGrid: React.FC<ExtendedBentoGridProps> = ({
  items,
  onLayoutChange,
  onLayoutModeChange,
  onDragStop, // 新增
  isEditable = false,
  onItemUpdate,
  onItemDelete,
  draggableCancel,
  renderItem,
  clearNewItemFlag,
  compactType = 'vertical'
}) => {
  const [gridWidth, setGridWidth] = useState(820);
  const [cols, setCols] = useState(4);
  const [currentLayoutMode, setCurrentLayoutMode] = useState<'lg' | 'sm'>('lg');
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const previousLayoutRef = useRef<Layout[]>([]);
  const isDraggingRef = useRef<Set<string>>(new Set());

  // 确保初始加载时所有卡片的 isNew 标记都是 false
  // 并强制修正 NeedBoard 的网格尺寸
  const sanitizedItems = useMemo(() => {
    return items.map(item => {
      // 如果是 NeedBoard，根据 size 设置正确的网格尺寸
      if (item.type === 'need') {
        const normalizedSize = resolveNeedBoardSize(item.size);
        const { w, h } = getNeedBoardGridSize(normalizedSize);
        return {
          ...item,
          isNew: item.isNew || false,
          size: normalizedSize,
          w,
          h,
        };
      }
      return {
        ...item,
        isNew: item.isNew || false
      };
    });
  }, [items]);

  // 根据列数重新计算布局
  const recalculateLayout = useCallback((itemsList: typeof items, columnCount: number): Layout[] => {
    return itemsList.map((item, index) => ({
      i: item.id,
      x: item.x || (index % columnCount),
      y: item.y || Math.floor(index / columnCount),
      w: item.w || 1,
      h: item.h || 1,
    }));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newCols = width < 1100 ? 2 : 4;
      // 计算小屏幕下的宽度，考虑padding和边距
      const smallScreenWidth = Math.min(width - 24, 366); // 24px = 左右padding 12px * 2, 366px 是安全的最大宽度
      const newWidth = width < 1100 ? smallScreenWidth : 820;
      const newLayoutMode: 'lg' | 'sm' = width < 1100 ? 'sm' : 'lg';

      console.debug('BentoGrid handleResize:', {
        width,
        newCols,
        currentCols: cols,
        newLayoutMode,
        currentLayoutMode,
        shouldUpdate: newCols !== cols || newWidth !== gridWidth
      });

      // 更新布局模式
      if (newLayoutMode !== currentLayoutMode) {
        console.debug('Layout mode switch:', currentLayoutMode, '->', newLayoutMode);
        setCurrentLayoutMode(newLayoutMode);
        onLayoutModeChange?.(newLayoutMode);
      }

      // 更新网格参数
      if (newCols !== cols || newWidth !== gridWidth) {
        console.debug('Grid size changed:', { cols: newCols, width: newWidth });
        setCols(newCols);
        setGridWidth(newWidth);
      }
    };

    handleResize(); // 初始化
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cols, gridWidth, currentLayoutMode, onLayoutModeChange]);

  // 添加调试用的 useEffect 来追踪 items 变化
  useEffect(() => {
    void 0;
  }, [items]);

  useEffect(() => {
    const newItem = items.find(item => item.isNew);
    if (newItem) {
      void 0;

      // 使用 setTimeout 确保 DOM 已经完全渲染
      const findAndScrollToElement = (retries = 5) => {
        if (retries <= 0) {
          void 0;
          // 备用方案：即使找不到元素，也要确保 isNew 标记被清除
          if (clearNewItemFlag && newItem) {
            setTimeout(() => {
              void 0;
              clearNewItemFlag(newItem.id);
            }, 500); // 延迟稍长一些，作为最后的保障
          }
          return;
        }

        const element = itemRefs.current[newItem.id] || document.querySelector(`[data-grid*='"i":"${newItem.id}"']`);

        void 0;

        if (element instanceof HTMLElement) {
          void 0;
          if (isElementInViewport(element)) {
            void 0;
            if (clearNewItemFlag) {
              setTimeout(() => {
                void 0;
                clearNewItemFlag(newItem.id);
              }, 500);
            }
          } else {
            void 0;
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            if (clearNewItemFlag) {
              setTimeout(() => {
                void 0;
                clearNewItemFlag(newItem.id);
              }, 500);
            }
          }
        } else {
          // 如果没找到，100ms后重试
          setTimeout(() => findAndScrollToElement(retries - 1), 100);
        }
      };

      // 启动寻找元素的进程
      setTimeout(findAndScrollToElement, 100);
    }
  }, [items, clearNewItemFlag]);

  // 从 items 直接派生 layout，确保每个项目都有有效的 x, y, w, h 值
  const currentLayout = items.map(item => ({
    i: item.id,
    x: item.x || 0,
    y: item.y || 0,
    w: item.w || 1,
    h: item.h || 1,
  }));

  // 初始化 previousLayoutRef，确保首次对比正确
  useEffect(() => {
    if (previousLayoutRef.current.length === 0) {
      previousLayoutRef.current = currentLayout;
    }
  }, [currentLayout]);

  // 计算占位的实际像素尺寸
  const calculatePlaceholderSize = useCallback((w: number, h: number) => {
    // 计算每列的宽度：(容器宽度 - (列数-1) * 水平间距) / 列数
    const columnWidth = (gridWidth - (cols - 1) * BENTO_GRID_VERTICAL_MARGIN) / cols;
    
    // 计算占位宽度：列数 * 每列宽度 + (列数-1) * 水平间距
    const placeholderWidth = w * columnWidth + (w - 1) * BENTO_GRID_VERTICAL_MARGIN;
    
    // 计算占位高度：行数 * 行高 + (行数-1) * 垂直间距
    const placeholderHeight = h * BENTO_GRID_ROW_HEIGHT + (h - 1) * BENTO_GRID_VERTICAL_MARGIN;
    
    return {
      width: Math.round(placeholderWidth),
      height: Math.round(placeholderHeight),
      columnWidth: Math.round(columnWidth),
    };
  }, [gridWidth, cols]);

  // 处理布局变化事件，记录 NeedBoard 拖拽占位信息
  const handleLayoutChange = useCallback((layout: Layout[]) => {
    // 找出所有 NeedBoard 类型的项目
    const needBoardItems = items.filter(item => item.type === 'need');
    
    // 找出正在被拖拽的 NeedBoard（位置发生变化）
    const draggedNeedBoards = needBoardItems.filter(item => {
      const currentLayoutItem = layout.find(l => l.i === item.id);
      const previousLayoutItem = previousLayoutRef.current.find(l => l.i === item.id);
      
      if (!currentLayoutItem) return false;
      
      // 检查位置是否发生变化
      const positionChanged = !previousLayoutItem || 
        previousLayoutItem.x !== currentLayoutItem.x || 
        previousLayoutItem.y !== currentLayoutItem.y;
      
      if (positionChanged) {
        isDraggingRef.current.add(item.id);
        return true;
      }
      
      return false;
    });

    // 记录被拖拽的 NeedBoard 占位信息
    draggedNeedBoards.forEach(item => {
      const layoutItem = layout.find(l => l.i === item.id);
      if (layoutItem) {
        const size = item.size || 'horizontal';
        const isSquare = size === 'square';
        const actualW = layoutItem.w;
        const actualH = layoutItem.h;
        const placeholderSize = calculatePlaceholderSize(actualW, actualH);
        
        void 0;
      }
    });

    // 更新前一个布局的快照
    previousLayoutRef.current = layout;

    // 调用原始的 onLayoutChange
    if (onLayoutChange) {
      onLayoutChange(layout, currentLayoutMode);
    }
  }, [items, cols, gridWidth, currentLayoutMode, calculatePlaceholderSize, onLayoutChange]);

  // 处理拖动停止事件（只在用户真正拖动后才保存）
  const handleDragStop = useCallback((layout: Layout[]) => {
    // 记录拖拽结束时的最终占位信息
    const needBoardItems = items.filter(item => item.type === 'need');
    const draggedNeedBoards = needBoardItems.filter(item => isDraggingRef.current.has(item.id));
    
    draggedNeedBoards.forEach(item => {
      const layoutItem = layout.find(l => l.i === item.id);
      if (layoutItem) {
        const size = item.size || 'horizontal';
        const isSquare = size === 'square';
        const actualW = layoutItem.w;
        const actualH = layoutItem.h;
        const placeholderSize = calculatePlaceholderSize(actualW, actualH);
        
        void 0;
      }
    });

    // 清除拖拽状态
    isDraggingRef.current.clear();

    void 0;
    if (onDragStop) {
      onDragStop(layout, currentLayoutMode);
    }
  }, [items, cols, gridWidth, currentLayoutMode, calculatePlaceholderSize, onDragStop]);

  return (
    <div className="w-full pb-24 flex justify-center [@media(min-width:1280px)]:justify-start">
      <GridLayout
        className="w-full mx-auto [@media(min-width:1280px)]:mx-0"
        layout={currentLayout}
        cols={cols}
        rowHeight={BENTO_GRID_ROW_HEIGHT}
        width={gridWidth}
        margin={[BENTO_GRID_VERTICAL_MARGIN, BENTO_GRID_VERTICAL_MARGIN]}
        containerPadding={[0, 0]}
        onLayoutChange={handleLayoutChange}
        onDragStop={handleDragStop} // 新增：只在拖动结束时保存
        isDraggable={isEditable}
        isResizable={false}
        compactType={compactType as any}
        draggableCancel={draggableCancel}
        preventCollision={false}
        useCSSTransforms={true}
      >
        {sanitizedItems.map(item => (
          <div
            key={item.id}
            ref={el => { itemRefs.current[item.id] = el }}
            className="w-full h-full"
            data-grid={{
              x: item.x || 0,
              y: item.y || 0,
              w: item.w || 1,
              h: item.h || 1,
              isDraggable: item.isDraggable,
              isResizable: false
            }}
          >
            <div
              className={`
                w-full h-full rounded-[24px]
                ${item.isNew ? 'ring-2 ring-black' : ''}
                transition-all duration-100 ease-in-out
              `}
            >
              {renderItem ? (
                renderItem({ 
                  ...item, 
                  isDraggable: isEditable,
                  isResizable: false,
                  onDelete: onItemDelete ? () => onItemDelete(item.id) : undefined,
                  onTextChange: onItemUpdate ? (newText: string) => onItemUpdate(item.id, { text: newText }) : undefined,
                  onContentChange: onItemUpdate ? (newContent: string) => onItemUpdate(item.id, { content: newContent }) : undefined,
                  onTitleChange: onItemUpdate ? (newTitle: string) => onItemUpdate(item.id, { title: newTitle }) : undefined,
                  onDescriptionChange: onItemUpdate ? (newDescription: string) => {
                    // 根据卡片类型使用正确的字段名
                    if (item.type === 'github') {
                      onItemUpdate(item.id, { savedDescription: newDescription });
                    }
                  } : undefined,
                  onImageChange: onItemUpdate ? (newImage: string | null | undefined) => {
                    // 根据卡片类型使用正确的字段名
                    if (item.type === 'link') {
                      void 0;
                      onItemUpdate(item.id, { savedImage: newImage || undefined });
                    } else if (item.type === 'image') {
                      void 0;
                      onItemUpdate(item.id, { imageUrl: newImage || undefined });
                    } else {
                      void 0;
                      onItemUpdate(item.id, { imageUrl: newImage || undefined });
                    }
                  } : undefined,
                  onSizeChange: onItemUpdate ? (newSize: 'small' | 'horizontal' | 'vertical' | 'large' | 'square') => onItemUpdate(item.id, { cardSize: newSize }) : undefined
                })
              ) : (
                <BentoItem 
                  {...item} 
                  isDraggable={isEditable} 
                  isResizable={false}
                  onDelete={onItemDelete ? () => onItemDelete(item.id) : undefined}
                  onTextChange={onItemUpdate ? (newText: string) => onItemUpdate(item.id, { text: newText }) : undefined}
                  onContentChange={onItemUpdate ? (newContent: string) => onItemUpdate(item.id, { content: newContent }) : undefined}
                  onTitleChange={onItemUpdate ? (newTitle: string) => onItemUpdate(item.id, { title: newTitle }) : undefined}
                  onDescriptionChange={onItemUpdate ? (newDescription: string) => {
                    // 根据卡片类型使用正确的字段名
                    if (item.type === 'github') {
                      onItemUpdate(item.id, { savedDescription: newDescription });
                    }
                  } : undefined}
                  onImageChange={onItemUpdate ? (newImage: string | null | undefined) => {
                    // 根据卡片类型使用正确的字段名
                    if (item.type === 'link') {
                      void 0;
                      onItemUpdate(item.id, { savedImage: newImage || undefined });
                    } else if (item.type === 'image') {
                      void 0;
                      onItemUpdate(item.id, { imageUrl: newImage || undefined });
                    } else {
                      void 0;
                      onItemUpdate(item.id, { imageUrl: newImage || undefined });
                    }
                  } : undefined}
                  onSizeChange={onItemUpdate ? (newSize: 'small' | 'horizontal' | 'vertical' | 'large' | 'square') => onItemUpdate(item.id, { cardSize: newSize }) : undefined}
                />
              )}
            </div>
          </div>
        ))}
      </GridLayout>
    </div>
  );
}; 
