"use client"

import { useState, useEffect, useRef, CSSProperties } from "react"
import { Upload, Crop, ZoomIn, ZoomOut } from "lucide-react"

interface EditableImageProps {
  imageUrl?: string | null
  isEditable?: boolean
  onImageChange?: (newImage: string | null) => void
  altText?: string
  className?: string
  aspectRatio?: string // 可选的宽高比，例如 "16/9"
  cropShape?: "square" | "round" // 添加裁剪形状属性
  // 新增属性：用于支持数据库持久化
  initialScale?: number
  initialPosition?: { x: number; y: number }
  onTransformChange?: (transform: {
    scale: number
    position: { x: number; y: number }
  }) => void
}

export function EditableImage({
  imageUrl,
  isEditable = false,
  onImageChange,
  altText = "Uploaded image",
  className = "",
  aspectRatio,
  cropShape = "square",
  initialScale,
  initialPosition,
  onTransformChange
}: EditableImageProps) {
  // 调试日志
  //   initialScale,
  //   initialPosition,
  //   hasOnTransformChange: !!onTransformChange
  // });
  
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false)
  const [showImageActions, setShowImageActions] = useState(false)
  
  // 持久化的状态
  const [savedScale, setSavedScale] = useState(initialScale || 1)
  const [savedPosition, setSavedPosition] = useState(initialPosition || { x: 0, y: 0 })
  
  // 编辑时的临时状态
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const containerRef = useRef<HTMLDivElement>(null)

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 当初始值变化时，更新保存的状态
  useEffect(() => {
    //   initialScale,
    //   initialPosition
    // });
    setSavedScale(initialScale || 1);
    setSavedPosition(initialPosition || { x: 0, y: 0 });
  }, [initialScale, initialPosition]);

  // 当图片 URL 变化时，只有在没有提供初始变换值的情况下才重置
  useEffect(() => {
    // 只有在没有初始变换值的情况下才重置
    if (!initialScale && !initialPosition) {
      void 0;
      setSavedScale(1);
      setSavedPosition({ x: 0, y: 0 });
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [imageUrl, initialScale, initialPosition]);

  // 进入编辑模式时，使用保存的状态
  useEffect(() => {
    if (isEditing) {
      setScale(savedScale)
      setPosition(savedPosition)
    }
  }, [isEditing, savedScale, savedPosition])

  // 处理点击外部关闭编辑模式
  useEffect(() => {
    if (!isEditing) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // 保存当前的编辑状态
        const newScale = scale
        const newPosition = position
        
        void 0
        
        setSavedScale(newScale)
        setSavedPosition(newPosition)
        setIsEditing(false)

        // 触发回调，通知父组件保存这些值到数据库
        if (onTransformChange) {
          void 0
          onTransformChange({
            scale: newScale,
            position: newPosition
          })
        } else {
          console.warn("EditableImage: onTransformChange 回调未定义")
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing, scale, position, onTransformChange])

  // 处理图片拖动
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) return
    e.preventDefault()
    e.stopPropagation()
    if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
      e.nativeEvent.stopImmediatePropagation()
    }
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isEditing) return
    e.preventDefault()
    e.stopPropagation()
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDragging(false)
  }

  // 处理缩放
  const handleZoom = (delta: number) => {
    const newScale = Math.max(1, Math.min(3, scale + delta))
    setScale(newScale)
  }

  // 将文件转换为 base64 data URL（可持久化存储）
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    // 重置状态
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // 使用 base64 data URL（可持久化存储）
      const imageUrl = await fileToDataUrl(file);

      setUploadProgress(50);

      // 调用回调
      if (onImageChange) {
        await onImageChange(imageUrl);
      }

      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 300);

    } catch (error) {
      console.error('[EditableImage] Upload failed:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  // 构建容器样式
  const containerStyle: CSSProperties = {
    ...(aspectRatio ? { aspectRatio } : {}),
    ...(!imageUrl ? { backgroundColor: '#f3f4f6' } : {}),
    ...(cropShape === "round" ? { borderRadius: '50%' } : {})
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${cropShape === "round" ? "rounded-full" : "rounded-lg"} ${className} ${isEditing ? 'bento-item-internal-drag-area' : ''}`}
      style={containerStyle}
      onMouseEnter={() => isEditable && setShowImageActions(true)}
      onMouseLeave={() => setShowImageActions(false)}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={e => e.stopPropagation()}
      onMouseDown={handleMouseDown}
    >
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt={altText}
            className="w-full h-full object-contain"
            style={{
              transform: isEditing
                ? `scale(${scale}) translate(${position.x}px, ${position.y}px)`
                : `scale(${savedScale}) translate(${savedPosition.x}px, ${savedPosition.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s',
              cursor: isEditing ? 'move' : 'default'
            }}
            draggable={false}
            onError={(e) => {
              console.error('[EditableImage] Image load error - src:', imageUrl?.substring(0, 80));
              // 图片加载失败，重置上传状态
              setIsUploading(false);
              setUploadProgress(0);
            }}
          />
          
          {/* 图片操作按钮 */}
          {isEditable && !isEditing && showImageActions && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-4 transition-opacity duration-200">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      // 创建一个临时的隐藏文件输入框并手动触发点击事件
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      fileInput.style.display = 'none';
                      
                      fileInput.onchange = (event) => {
                        // 将事件转发给我们的处理函数
                        handleImageUpload(event as unknown as React.ChangeEvent<HTMLInputElement>);
                        // 用完后移除元素
                        document.body.removeChild(fileInput);
                      };
                      
                      document.body.appendChild(fileInput);
                      fileInput.click();
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    aria-label="Upload image"
                  >
                    <Upload size={20} className="text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditing(true)
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    aria-label="Edit image"
                  >
                    <Crop size={20} className="text-white" />
                  </button>
                </div>
                <p className="text-white text-xs font-light">Upload or crop your image</p>
              </div>
            </div>
          )}

          {/* 编辑覆盖层 */}
          {isEditing && (
            <div 
              className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-4 transition-opacity duration-200"
              onClick={e => e.stopPropagation()}
            >
              {/* 拖拽提示 */}
              <div className="text-white text-sm font-medium">
                Drag to move
              </div>

              {/* 缩放工具栏 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleZoom(0.1)
                  }}
                  onMouseDown={e => e.stopPropagation()}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <ZoomIn size={20} className="text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleZoom(-0.1)
                  }}
                  onMouseDown={e => e.stopPropagation()}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <ZoomOut size={20} className="text-white" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* 无图片时显示上传按钮 */
        isEditable && (
          <div className="w-full h-full flex items-center justify-center bg-gray-100/90">
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  
                  // 创建一个临时的隐藏文件输入框并手动触发点击事件
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = 'image/*';
                  fileInput.style.display = 'none';
                  
                  fileInput.onchange = (event) => {
                    // 将事件转发给我们的处理函数
                    handleImageUpload(event as unknown as React.ChangeEvent<HTMLInputElement>);
                    // 用完后移除元素
                    document.body.removeChild(fileInput);
                  };
                  
                  document.body.appendChild(fileInput);
                  fileInput.click();
                }}
                onMouseDown={e => e.stopPropagation()}
                className="p-2 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm"
                aria-label="Upload image"
              >
                <Upload size={20} className="text-gray-600" />
              </button>
              <p className="text-gray-600 text-sm font-medium">
                Upload your image
              </p>
            </div>
          </div>
        )
      )}

      {/* 上传进度条 */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="w-3/4 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
} 