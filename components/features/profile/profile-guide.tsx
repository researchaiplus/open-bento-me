"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, ArrowDown } from 'lucide-react'
import { getZIndexClass } from '@/lib/utils/z-index'
import { Portal } from '@/components/ui/portal'

interface ProfileGuideProps {
  isVisible: boolean
  onComplete: () => void
  onSkip: () => void
}

export function ProfileGuide({ isVisible, onComplete, onSkip }: ProfileGuideProps) {
  const [step, setStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isVisible) {
      // 禁止页面滚动
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isVisible])

  if (!mounted || !isVisible) {
    return null
  }

  const handleNext = () => {
    if (step === 0) {
      onComplete()
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  // 获取工具栏元素的位置（底部中央）
  const getToolbarHighlightStyle = () => {
    return {
      position: 'fixed' as const,
      bottom: '1.53rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'min(290px, calc(100vw - 2rem))',
      height: '75px',
      borderRadius: '2rem',
    }
  }

  return (
    <Portal>
    <div className={`fixed inset-0 ${getZIndexClass('PROFILE_GUIDE_OVERLAY')} animate-in fade-in duration-300`}>
      {/* 蒙版背景 - 使用 box-shadow 在高亮区域挖洞 */}
      <div 
        className="absolute"
        style={{
          ...getToolbarHighlightStyle(),
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
        }}
      />
      
      {/* 高亮区域边框 - 工具栏 */}
      <div
        className="absolute border-4 border-white shadow-2xl animate-in zoom-in-95 duration-500 delay-150"
        style={getToolbarHighlightStyle()}
      />

      {/* 引导内容 */}
      {step === 0 && (
        <div className={`fixed bottom-32 left-1/2 transform -translate-x-1/2 max-w-md mx-4 w-full px-4 sm:px-0 sm:w-auto ${getZIndexClass('PROFILE_GUIDE_CONTENT')}`}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200 animate-in slide-in-from-bottom-4 duration-500 delay-300">
            {/* 关闭按钮 */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>

            {/* 箭头指向工具栏 */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 hidden sm:block pointer-events-none">
              <ArrowDown size={24} className="text-white drop-shadow-lg" />
            </div>

            <div className="pr-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Welcome to your personal profile page!
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Use the bottom toolbar to edit your Bento grid. You can add links, text, images, code repos, etc. to personalize your page.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                {/* <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-600 hover:text-gray-900 order-2 sm:order-1"
                >
                  Skip
                </Button> */}
                <Button
                  onClick={handleNext}
                  className="bg-black text-white hover:bg-gray-900 order-1 sm:order-2"
                >
                  Got it
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </Portal>
  )
}
