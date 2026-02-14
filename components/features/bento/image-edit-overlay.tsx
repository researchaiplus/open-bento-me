"use client"

import { useState, useRef } from 'react'
import ReactCrop, { type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Minus, Plus, Check, X } from 'lucide-react'

interface ImageEditOverlayProps {
  imageUrl: string
  onSave: (editedImage: string) => void
  onCancel: () => void
  mode: 'zoom' | 'crop'
}

export function ImageEditOverlay({
  imageUrl,
  onSave,
  onCancel,
  mode
}: ImageEditOverlayProps) {
  const [crop, setCrop] = useState<Crop>()
  const [zoom, setZoom] = useState(1)
  const imageRef = useRef<HTMLImageElement>(null)

  // 处理缩放
  const handleZoom = (delta: number) => {
    const newZoom = Math.max(0.1, Math.min(3, zoom + delta))
    setZoom(newZoom)
  }

  // 处理裁剪完成
  const handleCropComplete = async () => {
    if (!crop || !imageRef.current) return

    const canvas = document.createElement('canvas')
    const image = imageRef.current
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    
    canvas.width = crop.width
    canvas.height = crop.height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    )

    const croppedImageUrl = canvas.toDataURL('image/jpeg')
    onSave(croppedImageUrl)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 顶部工具栏 */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <button
            onClick={onCancel}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30"
          >
            <X size={20} />
          </button>
          <button
            onClick={() => mode === 'crop' ? handleCropComplete() : onSave(imageUrl)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30"
          >
            <Check size={20} />
          </button>
        </div>

        {/* 图片编辑区域 */}
        <div className="relative">
          {mode === 'crop' ? (
            <ReactCrop
              crop={crop}
              onChange={c => setCrop(c)}
              aspect={undefined}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Edit image"
                style={{ maxHeight: '70vh' }}
              />
            </ReactCrop>
          ) : (
            <div className="relative">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Edit image"
                style={{
                  maxHeight: '70vh',
                  transform: `scale(${zoom})`,
                  transition: 'transform 0.2s'
                }}
              />
              {/* 缩放控制 */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-white/90 rounded-full p-2">
                <button
                  onClick={() => handleZoom(-0.1)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <Minus size={20} />
                </button>
                <span className="min-w-[3ch] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => handleZoom(0.1)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 