"use client"

import { Link, Image, LayoutPanelTop, Type, Code, AtSign, Clipboard } from "lucide-react"
import { CustomToggle } from "./custom-toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useRef } from "react"
import { InputOverlay } from "./input-overlay"
import { PeopleSearchOverlay } from "./people-search-overlay"
import type { User } from "@/hooks/use-user"
import { PeopleCardDemo } from "../bento/people-card"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import * as bentoService from "@/lib/api/bentoService"

// 使用字面量类型联合
const INPUT_TYPES = {
  LINK: 'link',
  GITHUB: 'github'
} as const;

type InputType = typeof INPUT_TYPES[keyof typeof INPUT_TYPES];

interface EditToolbarProps {
  onToggleEdit: (enabled: boolean) => void
  editEnabled: boolean
  onAddLink: (url: string) => void
  onAddText: () => void
  onAddImage?: (imageUrl: string) => Promise<string> // 返回卡片ID
  onUpdateImageUrl?: (cardId: string, serverUrl: string) => void
  onAddGithubRepo?: (
    owner: string,
    repo: string,
    options?: {
      platform?: 'github' | 'huggingface'
      category?: 'model' | 'dataset'
      downloads?: number
      likes?: number
      description?: string
    }
  ) => void
  onAddPeople?: (person: User) => void
  onAddSectionTitle?: () => void
  onAddNeed?: () => void
  isVertical?: boolean
  hasNeedBoard?: boolean
}

export function EditToolbar({
  onToggleEdit,
  editEnabled,
  onAddLink,
  onAddText,
  onAddImage,
  onUpdateImageUrl,
  onAddGithubRepo,
  onAddPeople,
  onAddSectionTitle,
  onAddNeed,
  isVertical = false,
  hasNeedBoard = false
}: EditToolbarProps) {
  const [activeInput, setActiveInput] = useState<InputType | null>(null)
  const [showPeopleSearch, setShowPeopleSearch] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const canAddNeed = !hasNeedBoard

  const handleButtonClick = (inputType: InputType) => {
    void 0
    setActiveInput(activeInput === inputType ? null : inputType)
  }

  // Removed: handleGithubImportComplete function - Import feature disabled

  const handleInputSubmit = async (value: string) => {
    const trimmedValue = value.trim();
    void 0
    
    if (activeInput === INPUT_TYPES.LINK) {
      try {
        new URL(trimmedValue);
        void 0;
        onAddLink(trimmedValue);
      } catch (e) {
        console.error("Invalid URL submitted to EditToolbar:", e);
        alert("提交的链接无效，请检查后重试。");
      }
    } else if (activeInput === INPUT_TYPES.GITHUB) {
      try {
        // 处理 GitHub 或 Hugging Face 仓库/资源链接
        let owner: string | null = null;
        let repo: string | null = null;
        let isHuggingFace = false;
        let hfCategory: 'model' | 'dataset' | null = null;

        // 移除可能的前后空格
        const cleanValue = trimmedValue.trim();

        // Hugging Face 解析
        if (cleanValue.includes('huggingface.co')) {
          try {
            const urlStr = cleanValue.startsWith('http') ? cleanValue : `https://${cleanValue}`;
            const url = new URL(urlStr);
            const parts = url.pathname.split('/').filter(Boolean);
            // 支持两种形式：/owner/repo (model) 或 /datasets/owner/repo
            if (parts.length >= 2) {
              if (parts[0] === 'datasets' && parts.length >= 3) {
                hfCategory = 'dataset';
                [owner, repo] = [parts[1], parts[2]];
              } else {
                hfCategory = 'model';
                [owner, repo] = [parts[0], parts[1]];
              }
              isHuggingFace = true;
            }
          } catch (e) {
            console.error("Failed to parse Hugging Face URL:", e);
          }
        }
        // GitHub 解析
        else if (cleanValue.includes('github.com')) {
          try {
            // 完整 URL 格式：https://github.com/owner/repo
            // 或者 github.com/owner/repo
            const urlStr = cleanValue.startsWith('http') ? cleanValue : `https://${cleanValue}`;
            const url = new URL(urlStr);
            const parts = url.pathname.split('/').filter(Boolean);
            if (parts.length >= 2) {
              [owner, repo] = parts;
            }
          } catch (e) {
            console.error("Failed to parse GitHub URL:", e);
          }
        } else if (cleanValue.includes('/')) {
          // owner/repo 格式
          const parts = cleanValue.split('/').filter(Boolean);
          if (parts.length === 2) {
            [owner, repo] = parts;
          }
        }

        // 验证解析结果
        if (!owner || !repo) {
          throw new Error("无效的仓库链接格式");
        }

        // 验证 owner 和 repo 的格式（对 GitHub 和 Hugging Face 都适用）
        const nameRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]|-(?=[a-zA-Z0-9])){0,62}$/;
        if (!nameRegex.test(owner) || !nameRegex.test(repo)) {
          throw new Error("用户名或仓库名格式无效");
        }

        // 调用回调函数
        if (onAddGithubRepo) {
          if (isHuggingFace) {
            void 0;
            // 尝试获取更多 HF 元数据（可选）
            let options: any = { platform: 'huggingface', category: hfCategory || 'model' };
            try {
              const id = `${owner.trim()}/${repo.trim()}`;
              const data = hfCategory === 'dataset' 
                ? await bentoService.fetchHfDataset(id)
                : await bentoService.fetchHfModel(id);
              if (data) {
                options.description = data.description || data.cardData?.modelId || '';
                if (typeof data.downloads === 'number') options.downloads = data.downloads;
                if (typeof data.likes === 'number') options.likes = data.likes;
              }
            } catch (e) {
              console.warn('Failed to fetch HF metadata, will proceed with basic info.', e);
            }
            onAddGithubRepo(owner.trim(), repo.trim(), options);
          } else {
            void 0;
            onAddGithubRepo(owner.trim(), repo.trim());
          }
        } else {
          console.error("onAddGithubRepo callback not provided");
          throw new Error("系统暂时无法处理仓库");
        }
      } catch (e) {
        console.error("Invalid repository URL submitted:", e);
        alert("提交的仓库链接无效，请使用正确的格式（例如：owner/repo，https://github.com/owner/repo，或 https://huggingface.co/{owner}/{repo} 或 https://huggingface.co/datasets/{owner}/{repo}）");
      }
    } else {
      void 0;
    }
    
    setActiveInput(null);
  }

  // 将图片转换为 base64 数据 URL（用于 profile-only 版本）
  const imageToDataUrl = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    
    // 早期检查 - 如果没有文件，直接返回
    if (!files || files.length === 0) {
      return
    }
    
    // 如果没有回调函数，重置文件输入并返回
    if (!onAddImage) {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    try {
      for (const file of Array.from(files)) {
        try {
          // 验证文件类型
          if (!file.type.startsWith('image/')) {
            throw new Error(`文件 ${file.name} 不是有效的图片格式`)
          }

          // 验证文件大小（5MB）
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`文件 ${file.name} 超过5MB大小限制`)
          }

          // Convert to persistent base64 data URL FIRST, then create the card.
          // This avoids the fragile blob: URL that becomes invalid on refresh or revocation.
          const dataUrl = await imageToDataUrl(file)

          // Create card directly with the persistent data URL
          await onAddImage(dataUrl)

        } catch (error) {
          console.error('处理图片失败:', error)
          alert(error instanceof Error ? error.message : '处理图片失败')
        }
      }
    } catch (error) {
      console.error('处理图片上传时发生意外错误:', error)
      alert('图片处理过程中发生错误，请重试')
    } finally {
      // 清理文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 修改 People 按钮的点击处理
  const handleAddPeople = () => {
    setShowPeopleSearch(true)
  }

  const handlePeopleSelect = (selectedUsers: User[]) => {
    if (onAddPeople) {
      selectedUsers.forEach(user => {
        onAddPeople(user)
      })
    }
  }

  if (isVertical) {
    // 纵向布局
    return (
      <TooltipProvider delayDuration={300}>
        <div className="relative flex flex-col items-center">
          {showPeopleSearch && (
            <PeopleSearchOverlay
              onClose={() => setShowPeopleSearch(false)}
              onSelect={handlePeopleSelect}
            />
          )}
          {activeInput && (
            <div className="absolute bottom-full mb-2">
              <InputOverlay
                placeholder={
                  activeInput === INPUT_TYPES.LINK
                    ? "Enter your link here..."
                    : activeInput === INPUT_TYPES.GITHUB
                      ? "Enter GitHub/HuggingFace repo URL..."
                      : "Search researchers..."
                }
                onClose={() => setActiveInput(null)}
                onSubmit={handleInputSubmit}
                type={activeInput}
              />
            </div>
          )}
          <div className="flex flex-col gap-3 w-full">
            {/* 第一行 - Link 和 Image */}
            <div className="flex items-center justify-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`flex h-10 w-10 items-center justify-center text-[#0f172a] hover:bg-zinc-100 rounded-md ${activeInput === INPUT_TYPES.LINK ? "bg-gray-100" : ""}`}
                    onClick={() => handleButtonClick(INPUT_TYPES.LINK)}
                  >
                    <Link size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="bg-[#0f172a] text-white border-[#0f172a]">
                  <p>Link</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <label className="flex h-10 w-10 items-center justify-center text-[#0f172a] hover:bg-zinc-100 rounded-md cursor-pointer">
                    <Image size={24} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                    />
                  </label>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="bg-[#0f172a] text-white border-[#0f172a]">
                  <p>Image</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="flex h-10 w-10 items-center justify-center text-[#0f172a] hover:bg-zinc-100 rounded-md"
                    onClick={onAddText}
                  >
                    <Type size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="bg-[#0f172a] text-white border-[#0f172a]">
                  <p>Text</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* 分隔线 */}
            <div className="w-full h-px bg-[#e4e4e7]" aria-hidden="true" />

            {/* 第二行 - 功能按钮 */}
            <div className="flex items-center justify-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className="flex h-10 w-10 items-center justify-center text-[#0f172a] hover:bg-zinc-100 rounded-md"
                    onClick={onAddSectionTitle}
                  >
                    <LayoutPanelTop size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="bg-[#0f172a] text-white border-[#0f172a]">
                  <p>Add a title...</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={`flex h-10 w-10 items-center justify-center text-[#0f172a] hover:bg-zinc-100 rounded-md ${activeInput === INPUT_TYPES.GITHUB ? "bg-zinc-100" : ""}`}
                    onClick={() => handleButtonClick(INPUT_TYPES.GITHUB)}
                  >
                    <Code size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="bg-[#0f172a] text-white border-[#0f172a]">
                  <p>Code</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    className={`flex h-10 w-10 items-center justify-center text-[#0f172a] hover:bg-zinc-100 rounded-md ${showPeopleSearch ? "bg-zinc-100" : ""}`}
                    onClick={handleAddPeople}
                  >
                    <AtSign size={24} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="bg-[#0f172a] text-white border-[#0f172a]">
                  <p>Ref</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* 分隔线 */}
            <div className="w-full h-px bg-[#e4e4e7]" aria-hidden="true" />

            {/* 第三行 - Finish Edit */}
            <div className="flex items-center justify-center gap-4">
              {/* Finish Edit 按钮 */}
              <CustomToggle checked={editEnabled} onCheckedChange={onToggleEdit} label="Finish" />
            </div>
          </div>
        </div>
      </TooltipProvider>
    )
  }

  // 横向布局（原有布局）
  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative flex flex-col items-center">
        {/* {showPeopleSearch && (
          <PeopleSearchOverlay
            onClose={() => setShowPeopleSearch(false)}
            onSelect={handlePeopleSelect}
          />
        )} */}
        {activeInput && (
          <div className="absolute bottom-full mb-2 z-10">
            <InputOverlay
              placeholder={
                activeInput === INPUT_TYPES.LINK
                  ? "Enter your link here..."
                  : activeInput === INPUT_TYPES.GITHUB
                    ? "Enter GitHub/HuggingFace repo URL..."
                    : "Search researchers..."
              }
              onClose={() => setActiveInput(null)}
              onSubmit={handleInputSubmit}
              type={activeInput}
            />
          </div>
        )}
        <div className="flex items-center gap-5 rounded-2xl border border-black/20 bg-white p-3 h-[60px] shadow-[0px_25px_61.5px_0px_rgba(0,0,0,0.10)] w-full">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`flex h-10 w-10 items-center justify-center text-[#0f172a] hover:bg-zinc-100 rounded-md ${activeInput === INPUT_TYPES.LINK ? "bg-gray-100" : ""}`}
                  onClick={() => handleButtonClick(INPUT_TYPES.LINK)}
                >
                  <Link size={24} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8} className="bg-[#0f172a] text-white border-[#0f172a]">
                <p>Link</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <label className="flex h-10 w-10 items-center justify-center text-[#0f172a] hover:bg-zinc-100 rounded-md cursor-pointer">
                  <Image size={24} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8} className="bg-[#0f172a] text-white border-[#0f172a]">
                <p>Image</p>
              </TooltipContent>
            </Tooltip>
          </div>

        

          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="flex h-10 w-10 items-center justify-center text-[#0f172a] hover:bg-zinc-100 rounded-md"
                  onClick={onAddText}
                >
                  <Type size={24} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8} className="bg-[#0f172a] text-white border-[#0f172a]">
                <p>Text</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="h-6 w-px bg-[#e4e4e7]" aria-hidden="true" />

          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="flex h-10 w-10 items-center justify-center text-[#0f172a] hover:bg-zinc-100 rounded-md"
                  onClick={onAddSectionTitle}
                >
                  <LayoutPanelTop size={24} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8} className="bg-[#0f172a] text-white border-[#0f172a]">
                <p>Section Title</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={`flex h-10 w-10 items-center justify-center text-[#0f172a] hover:bg-zinc-100 rounded-md ${activeInput === INPUT_TYPES.GITHUB ? "bg-zinc-100" : ""}`}
                  onClick={() => handleButtonClick(INPUT_TYPES.GITHUB)}
                >
                  <Code size={24} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8} className="bg-[#0f172a] text-white border-[#0f172a]">
                <p>Code</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors ${canAddNeed ? 'text-[#0f172a] hover:bg-zinc-100' : 'text-zinc-400 bg-zinc-100 cursor-not-allowed'}`}
                  onClick={() => {
                    if (canAddNeed && onAddNeed) {
                      onAddNeed()
                    }
                  }}
                  aria-disabled={!canAddNeed}
                >
                  <Clipboard size={24} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8} className="bg-[#0f172a] text-white border-[#0f172a]">
                <p>{canAddNeed ? 'Need Board' : 'Need Board already added'}</p>
              </TooltipContent>
            </Tooltip>

            {/* <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className={`flex h-10 w-10 items-center justify-center text-[#0f172a] hover:bg-zinc-100 rounded-md ${showPeopleSearch ? "bg-zinc-100" : ""}`}
                  onClick={handleAddPeople}
                >
                  <AtSign size={24} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8} className="bg-[#0f172a] text-white border-[#0f172a]">
                <p>Ref</p>
              </TooltipContent>
            </Tooltip> */}

          </div>

          <div className="h-6 w-px bg-[#e4e4e7]" aria-hidden="true" />

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => onToggleEdit(false)}
              className="whitespace-nowrap rounded-lg bg-[rgb(22,163,74)] hover:bg-[rgb(20,143,65)] px-4 py-2 text-sm font-medium text-white transition-colors h-9"
            >
              Preview
            </button>
            {/* <CustomToggle checked={editEnabled} onCheckedChange={onToggleEdit} label="Finish Edit" /> */}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
