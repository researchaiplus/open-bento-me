"use client"

import type React from "react"

import { useState, useRef } from "react"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ImageCropperProps {
  imageUrl: string
  onCropComplete: (croppedImageUrl: string) => void
  onCancel: () => void
  open: boolean
}

// 这个函数用于创建一个居中的裁剪区域
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export function ImageCropper({ imageUrl, onCropComplete, onCancel, open }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop>()
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 当图片加载时，初始化裁剪区域
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    // 使用1:1的宽高比
    const crop = centerAspectCrop(width, height, 1)
    setCrop(crop)
    setCompletedCrop(crop)
  }

  // 生成裁剪后的图像
  function generateCroppedImage() {
    if (!imgRef.current || !completedCrop || !canvasRef.current) return

    const image = imgRef.current
    const canvas = canvasRef.current
    const crop = completedCrop

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("No 2d context")
    }

    const pixelRatio = window.devicePixelRatio || 1

    // 设置画布尺寸为裁剪区域的尺寸
    const cropWidth = crop.width * scaleX
    const cropHeight = crop.height * scaleY

    // 确保画布是正方形的，取较大的尺寸
    const size = Math.max(cropWidth, cropHeight)

    // 限制最大尺寸为300px，以减小生成的数据URL大小
    const maxSize = 300
    const scaleFactor = size > maxSize ? maxSize / size : 1

    // 设置画布尺寸，考虑设备像素比和缩放因子
    const canvasSize = size * scaleFactor
    canvas.width = canvasSize * pixelRatio
    canvas.height = canvasSize * pixelRatio

    // 设置画布的显示尺寸
    canvas.style.width = `${canvasSize}px`
    canvas.style.height = `${canvasSize}px`

    // 缩放以适应设备像素比
    ctx.scale(pixelRatio, pixelRatio)
    ctx.imageSmoothingQuality = "high"

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制裁剪后的图像
    const cropX = crop.x * scaleX
    const cropY = crop.y * scaleY

    // 在画布中居中绘制裁剪区域
    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvasSize, canvasSize)

    // 将画布转换为数据URL，使用较低的质量来减小大小
    const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.8)
    onCropComplete(croppedImageUrl)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crop Avatar</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="max-h-[400px] overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
              keepSelection
            >
              <img
                ref={imgRef}
                src={imageUrl || "/placeholder.svg"}
                alt="Crop me"
                onLoad={onImageLoad}
                className="max-w-full"
              />
            </ReactCrop>
          </div>
          <div className="text-sm text-zinc-500">Drag or resize the circular area to select your avatar area</div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={generateCroppedImage}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

