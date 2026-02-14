"use client"

import { useState, useEffect, useRef } from "react"
import { Trash, Square, RectangleHorizontal } from "lucide-react"
import { type CardSize } from "./size-toolbar"
import { EditableImage } from "../../common/editable-image"
// Link metadata fetching - uses API routes in local dev, fails gracefully in static deployment
async function fetchPageTitle(url: string): Promise<string> {
  try {
    const res = await fetch(`/api/fetch-page-title?url=${encodeURIComponent(url)}`);
    if (!res.ok) return '';
    const data = await res.json();
    return data.title || '';
  } catch {
    return '';
  }
}

async function fetchPageImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/fetch-page-image?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.image || null;
  } catch {
    return null;
  }
}

interface LinkCardProps {
  url: string;
  onDelete?: () => void;
  isEditable?: boolean;
  isResizable?: boolean;
  onTitleChange?: (newTitle: string) => void;
  // onDescriptionChange?: (newDescription: string) => void;
  savedTitle?: string;
  // savedDescription?: string;
  size?: CardSize; // 新增尺寸属性
  onSizeChange?: (newSize: CardSize) => void; // 新增尺寸变化回调
  savedImage?: string;
  onImageChange?: (newImage: string | null) => void;
  faviconUrl?: string; // 新增 favicon URL
  // 新增：图片变换相关属性
  initialScale?: number;
  initialPosition?: { x: number; y: number };
  onTransformChange?: (transform: {
    scale: number;
    position: { x: number; y: number };
  }) => void;
}

export function LinkCard({ 
  url, 
  onDelete,
  isEditable = false,
  isResizable = true,
  onTitleChange,
  // onDescriptionChange,
  savedTitle,
  // savedDescription,
  size = "small", // 默认为小尺寸 175x175
  onSizeChange,
  savedImage,
  onImageChange,
  faviconUrl,
  // 新增：图片变换相关属性
  initialScale,
  initialPosition,
  onTransformChange
}: LinkCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [pageTitle, setPageTitle] = useState(savedTitle || 'Loading title...')
  // const [description, setDescription] = useState(savedDescription || "")
  const [coverImage, setCoverImage] = useState<string | null>(savedImage || null)
  const [isImageLoading, setIsImageLoading] = useState(!savedImage)
  const [isTitleLoading, setIsTitleLoading] = useState(!savedTitle)
  const [isToolbarClicked, setIsToolbarClicked] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  // 用于跟踪拖动状态，区分单击和拖动
  const mouseDownRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const hasDraggedRef = useRef(false)

  // 使用 useRef 保存 onImageChange，避免因函数引用变化导致 useEffect 重新执行
  const onImageChangeRef = useRef(onImageChange)
  onImageChangeRef.current = onImageChange

  useEffect(() => {
    const fetchTitle = async () => {
      // 检查 savedTitle 是否存在且不为空字符串
      if (savedTitle && savedTitle.trim() !== '') {
        setPageTitle(savedTitle);
        setIsTitleLoading(false);
        return;
      }
      setIsTitleLoading(true);
      try {
        // 使用 Server Action 获取页面标题
        const title = await fetchPageTitle(url);
        if (title && title.trim() !== '') {
          setPageTitle(title);
          if (onTitleChange) onTitleChange(title);
        } else {
          // 如果返回空标题，使用域名作为回退
          const fallbackTitle = new URL(url).hostname;
          setPageTitle(fallbackTitle);
          if (onTitleChange) onTitleChange(fallbackTitle);
        }
      } catch (error) {
        console.error('[LinkCard] Error fetching title:', error);
        // 出错时使用域名作为回退
        const fallbackTitle = new URL(url).hostname;
        setPageTitle(fallbackTitle);
        if (onTitleChange) onTitleChange(fallbackTitle);
      } finally {
        setIsTitleLoading(false);
      }
    };

    fetchTitle();
  }, [url, savedTitle, onTitleChange]);

  useEffect(() => {
    // 如果已有保存的图片，直接使用，不进行网络请求
    if (savedImage && savedImage.trim() !== '') {
      setCoverImage(savedImage);
      setIsImageLoading(false);
      setImageError(null);
      return;
    }
    const fetchImage = async () => {
      setIsImageLoading(true);
      setImageError(null);
      try {
        // 1. 优先使用 Server Action 获取页面图片
        const image = await fetchPageImage(url);
        if (image && image.trim() !== '') {
          setCoverImage(image);
          if (onImageChangeRef.current) onImageChangeRef.current(image);
          return;
        }

        // 2. Screenshot fallback removed (puppeteer not available in static version)
        // If no image found, show upload option
        setCoverImage(null);
      } catch (error) {
        console.error('[LinkCard] Error fetching image:', error);
        // 出错时设置为 null，显示上传选项
        setCoverImage(null);
      } finally {
        setIsImageLoading(false);
      }
    };

    fetchImage();
  }, [url, savedImage]); // 移除 onImageChange，使用 ref 替代

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value
    setPageTitle(newTitle)
    if (onTitleChange) {
      onTitleChange(newTitle)
    }
  }

  const handleImageChange = (newImage: string | null) => {
    setCoverImage(newImage)
    if (onImageChange) {
      onImageChange(newImage)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // 如果在编辑模式，不执行跳转
    if (isEditable) {
      return;
    }

    // 如果发生了拖拽，不执行跳转
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    // 如果点击了工具栏，不执行跳转
    if (isToolbarClicked) {
      setIsToolbarClicked(false);
      return;
    }

    // 打开链接
    window.open(url, "_blank")
  }

  // 处理鼠标按下事件（用于检测拖拽）
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
    hasDraggedRef.current = false;
  }

  // 处理鼠标移动事件（用于检测拖拽）
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseDownRef.current) return;

    const deltaX = Math.abs(e.clientX - mouseDownRef.current.x);
    const deltaY = Math.abs(e.clientY - mouseDownRef.current.y);

    // 如果移动距离超过 5 像素，认为是拖拽
    if (deltaX > 5 || deltaY > 5) {
      hasDraggedRef.current = true;
    }
  }

  // 处理鼠标释放事件
  const handleMouseUp = () => {
    mouseDownRef.current = null;
  }

  // 注意：现在卡片的尺寸由父组件通过 GridLayout 控制
  // 此函数仅用于预览或者调试目的
  const getSizeClassName = () => {
    return "w-full h-full"; // 让卡片填充网格单元格
  }

  // 统一的文本样式
  const textStyles = {
    fontSize: '0.875rem',
    lineHeight: '1.5',
    fontWeight: 500,
    width: '100%',
    height: '100%',
  } as const

  // 本地尺寸工具栏（移除 large 选项）
  const LocalSizeToolbar = ({ currentSize, onLocalSizeChange }: { currentSize: CardSize; onLocalSizeChange: (s: Exclude<CardSize, 'large'>) => void }) => {
    const handleButtonClick = (e: React.MouseEvent, newSize: Exclude<CardSize, 'large'>) => {
      e.preventDefault();
      e.stopPropagation();
      onLocalSizeChange(newSize);
    };

    return (
      <div 
        className="w-[120px] h-[40px] flex items-center justify-center gap-2 p-3 rounded-lg bg-zinc-950 transition-opacity duration-200 translate-y-10"
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
        onMouseMove={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onTouchEnd={e => e.stopPropagation()}
        onTouchMove={e => e.stopPropagation()}
      >
        <button
          onClick={(e) => handleButtonClick(e, "small")}
          onMouseDown={e => e.stopPropagation()}
          className={`p-2 rounded transition-colors ${currentSize === "small" ? "bg-white/20" : "hover:bg-white/10"}`}
          title="175 × 175"
        >
          <Square size={14} strokeWidth={2.5} className="text-white pointer-events-none scale-75" />
        </button>
        <button
          onClick={(e) => handleButtonClick(e, "vertical")}
          onMouseDown={e => e.stopPropagation()}
          className={`p-2 rounded transition-colors ${currentSize === "vertical" ? "bg-white/20" : "hover:bg-white/10"}`}
          title="175 × 390"
        >
          <RectangleHorizontal size={14} className="text-white rotate-90 pointer-events-none" />
        </button>
        <button
          onClick={(e) => handleButtonClick(e, "horizontal")}
          onMouseDown={e => e.stopPropagation()}
          className={`p-2 rounded transition-colors ${currentSize === "horizontal" ? "bg-white/20" : "hover:bg-white/10"}`}
          title="390 × 175"
        >
          <RectangleHorizontal size={14} className="text-white pointer-events-none" />
        </button>
      </div>
    );
  };

  return (
    <div
      className={`group relative flex p-5 flex-col items-start gap-2 rounded-[24px] border border-black/[0.06] bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow duration-200 ${!isEditable && 'hover:cursor-pointer'} ${getSizeClassName()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsToolbarClicked(false)
      }}
      onClick={handleCardClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Delete button */}
      {isHovered && isEditable && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          onMouseDown={e => e.stopPropagation()}
          className="absolute -top-3 -left-3 z-50 flex items-center gap-2 p-2 rounded-[60px] border border-[rgba(0,0,0,0.06)] bg-white shadow-[0px_4px_10px_0px_rgba(0,0,0,0.10)] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Delete link"
        >
          <Trash size={16} className="text-zinc-900" />
        </button>
      )}

      {/* Size toolbar (LinkCard only, no large option) */}
      {isHovered && isEditable && isResizable && onSizeChange && (
        <div 
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-50 opacity-0 group-hover:opacity-100"
          onMouseDown={(e) => {
            e.stopPropagation()
            setIsToolbarClicked(true)
          }}
        >
          <LocalSizeToolbar 
            currentSize={size}
            onLocalSizeChange={(newSize) => {
              setIsToolbarClicked(true);
              // 仅允许 small/vertical/horizontal，拦截 large
              if (newSize === 'small' || newSize === 'vertical' || newSize === 'horizontal') {
                onSizeChange(newSize);
              }
            }}
          />
        </div>
      )}

      {/* Link preview content */}
      <div className={`flex gap-3 w-full h-full ${size === 'horizontal' ? 'flex-row' : 'flex-col'}`}>
        {/* Text content container */}
        <div className={`flex flex-col gap-3 ${
          size === 'horizontal' ? 'w-1/2 pr-3' : 
          size === 'large' ? 'w-full min-h-[120px]' :  // 确保large卡片文本容器有最小高度
          'w-full h-full'
        }`}>
          {/* Favicon and domain */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <img
              src={faviconUrl || `https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`}
              alt="favicon"
              className="w-4 h-4"
              onError={(e) => {
                // 如果加载失败，使用备用图标
                (e.target as HTMLImageElement).src = `https://icons.duckduckgo.com/ip3/default.ico`;
              }}
            />
            <span className="text-xs text-zinc-400">
              {new URL(url).hostname.replace("www.", "")}
            </span>
          </div>

          {/* Title */}
          <div className={`relative overflow-hidden ${size === 'large' ? 'flex-1 max-h-[84px]' : 'flex-1'}`}>
            <div
              className={`${size === 'large' ? '' : 'absolute inset-0'} transition-opacity duration-200 ${isEditable && isHovered ? 'opacity-0' : 'opacity-100'} ${isEditable ? 'overflow-y-auto' : 'overflow-hidden'} pr-1`}
              style={textStyles}
            >
              <div className={`${isTitleLoading ? "animate-pulse" : ""} ${size === 'large' ? 'line-clamp-4' : ''}`}>
                {pageTitle}
              </div>
            </div>

            {isEditable && (
              <div 
                className={`absolute inset-0 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                onClick={e => e.stopPropagation()}
              >
                <div className="relative w-full h-full bg-gray-100/90 rounded">
                  <textarea
                    value={pageTitle}
                    onChange={handleTitleChange}
                    className="absolute inset-0 resize-none outline-none border-none p-0 bg-transparent"
                    style={textStyles}
                    placeholder="输入标题..."
                    onMouseDown={e => e.stopPropagation()}
                    onMouseMove={e => e.stopPropagation()}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cover Image */}
        {(size === "horizontal" || size === "vertical" || size === "large") && (
          <div className={`${
            size === 'horizontal' ? 'w-1/2' :
            size === 'vertical' ? 'w-full mt-auto aspect-[4/3]' :
            'w-full flex-1 overflow-hidden rounded-lg' // large card 的图片容器占据剩余空间, 添加 overflow-hidden 和 rounded-lg
          }`}>
            {isImageLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              </div>
            ) : imageError ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg text-center p-2">
                <p className="text-sm text-red-500">图片加载失败:</p>
                <p className="text-xs text-red-400 break-all">{imageError}</p>
              </div>
            ) : (
              <EditableImage
                imageUrl={coverImage}
                isEditable={isEditable}
                onImageChange={handleImageChange}
                onTransformChange={onTransformChange}
                initialScale={initialScale}
                initialPosition={initialPosition}
                altText="Page preview"
                className="w-full h-full"
                cropShape="square"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
} 
