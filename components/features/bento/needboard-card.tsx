"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NeedBoardSizeToolbar, type CardSize } from "./needboard-size-toolbar";
import { resolveNeedBoardSize } from '@/lib/constants/grid';
import { Trash } from "lucide-react";
import { Portal } from "@/components/ui/portal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SEEKING_OPTIONS, OFFERING_OPTIONS } from "@/types/collaboration-options";

// Pin Icon 组件
function PinIcon() {
  return (
    <div className="box-border content-stretch flex flex-row gap-2.5 items-center justify-start p-0 relative">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[32px] text-left text-nowrap">
        <p className="block leading-[24px] whitespace-pre">📌</p>
      </div>
    </div>
  );
}

// SVG Paths
const svgPaths = {
  p39be50: "M13.3333 4L6 11.3333L2.66667 8",
};

// 转换选项格式
interface Tag {
  id: string;
  name: string;
}

const SEEKING_TAGS: Tag[] = SEEKING_OPTIONS.map(option => ({
  id: option.key,
  name: option.text,
}));

const OFFERING_TAGS: Tag[] = OFFERING_OPTIONS.map(option => ({
  id: option.key,
  name: option.text,
}));

const areArraysShallowEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
};

const filterValidTags = (tagIds: string[], options: Tag[]): string[] => {
  const optionIds = new Set(options.map(option => option.id));
  return tagIds.filter(tagId => optionIds.has(tagId));
};

// TagsDisplayMobile 组件 - 垂直换行布局（用于 square 尺寸）
interface TagsDisplayMobileProps {
  tagIds: string[];
  options: Tag[];
}

function TagsDisplayMobile({ tagIds, options }: TagsDisplayMobileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(tagIds.length);

  useEffect(() => {
    const calculateVisibleTags = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      
      // Create a temporary container to measure tag widths
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = 'position: absolute; visibility: hidden; display: flex; flex-wrap: wrap; gap: 8px;';
      tempContainer.style.width = `${containerWidth}px`;
      document.body.appendChild(tempContainer);

      let visibleTagsCount = 0;
      const counterElement = document.createElement('div');
      counterElement.style.cssText = 'padding: 8px 10px; border-radius: 20px; font-family: Inter; font-size: 14px; white-space: nowrap;';
      
      for (let i = 0; i < tagIds.length; i++) {
        const tag = options.find((t) => t.id === tagIds[i]);
        if (!tag) continue;

        const tempTag = document.createElement('div');
        tempTag.style.cssText = 'padding: 8px 10px; border-radius: 20px; white-space: nowrap; font-family: Inter; font-size: 14px;';
        tempTag.textContent = tag.name;
        tempContainer.appendChild(tempTag);

        // Check if adding a counter would cause overflow
        const remainingTags = tagIds.length - (i + 1);
        if (remainingTags > 0) {
          counterElement.textContent = `+${remainingTags}`;
          tempContainer.appendChild(counterElement);
        }

        // Check if content overflows (3 rows)
        const containerHeight = tempContainer.scrollHeight;
        const estimatedSingleLineHeight = 40; // approximate height of one row of tags
        
        if (containerHeight > estimatedSingleLineHeight * 3.5) {
          // Remove the last tag and counter
          tempContainer.removeChild(tempTag);
          if (remainingTags > 0) {
            tempContainer.removeChild(counterElement);
          }
          break;
        }

        if (remainingTags > 0) {
          tempContainer.removeChild(counterElement);
        }
        visibleTagsCount = i + 1;
      }

      document.body.removeChild(tempContainer);
      setVisibleCount(Math.max(1, visibleTagsCount));
    };

    calculateVisibleTags();
    
    window.addEventListener('resize', calculateVisibleTags);
    return () => window.removeEventListener('resize', calculateVisibleTags);
  }, [tagIds, options]);

  if (tagIds.length === 0) return null;

  const visibleTags = tagIds.slice(0, visibleCount);
  const hiddenTags = tagIds.slice(visibleCount);
  const hiddenCount = hiddenTags.length;

  return (
    <div ref={containerRef} className="content-stretch flex items-start justify-start relative shrink-0 w-full">
      <div className="flex flex-wrap gap-[8px] items-center w-full max-h-[140px] overflow-hidden">
        {visibleTags.map((tagId) => {
          const tag = options.find((t) => t.id === tagId);
          if (!tag) return null;
          return (
            <div
              key={tag.id}
              className="bg-white box-border content-stretch flex gap-[8px] items-center px-[10px] py-[8px] relative rounded-[20px] shrink-0"
            >
              <div
                aria-hidden="true"
                className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[20px]"
              />
              <div className="content-stretch flex gap-[10px] items-center overflow-clip relative shrink-0">
                <div className="flex flex-col font-['Inter'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-neutral-900 text-nowrap">
                  <p className="leading-[16px] whitespace-pre">{tag.name}</p>
                </div>
              </div>
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-neutral-100 box-border content-stretch flex gap-[8px] items-center px-[10px] py-[8px] relative rounded-[20px] shrink-0 cursor-pointer hover:bg-neutral-200 transition-colors">
                  <div
                    aria-hidden="true"
                    className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[20px]"
                  />
                  <div className="content-stretch flex gap-[10px] items-center overflow-clip relative shrink-0">
                    <div className="flex flex-col font-['Inter'] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-neutral-700 text-nowrap">
                      <p className="leading-[16px] whitespace-pre">
                        +{hiddenCount}
                      </p>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="bg-white p-2 rounded-lg shadow-lg border border-neutral-200"
              >
                <div className="flex flex-col gap-2 max-w-[200px]">
                  {hiddenTags.map((tagId) => {
                    const tag = options.find((t) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <div
                        key={tag.id}
                        className="bg-white box-border content-stretch flex gap-[8px] items-center px-[10px] py-[6px] relative rounded-[16px] shrink-0"
                      >
                        <div
                          aria-hidden="true"
                          className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[16px]"
                        />
                        <div className="content-stretch flex gap-[10px] items-center overflow-clip relative shrink-0">
                          <div className="flex flex-col font-['Inter'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-neutral-900 text-nowrap">
                            <p className="leading-[16px] whitespace-pre">
                              {tag.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

// TagsDisplay 组件 - 智能标签显示（用于 horizontal 尺寸）
interface TagsDisplayProps {
  tagIds: string[];
  options: Tag[];
}

function TagsDisplay({ tagIds, options }: TagsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(tagIds.length);

  useEffect(() => {
    const calculateVisibleTags = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      
      // Create a temporary container to measure tag widths
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = 'position: absolute; visibility: hidden; display: flex; gap: 8px;';
      document.body.appendChild(tempContainer);

      let totalWidth = 0;
      const gap = 8;
      const counterWidth = 60;
      let count = 0;

      for (let i = 0; i < tagIds.length; i++) {
        const tag = options.find((t) => t.id === tagIds[i]);
        if (!tag) continue;

        // Create temporary tag element to measure
        const tempTag = document.createElement('div');
        tempTag.style.cssText = 'padding: 8px 10px; border-radius: 20px; white-space: nowrap; font-family: Inter; font-size: 14px;';
        tempTag.textContent = tag.name;
        tempContainer.appendChild(tempTag);

        const tagWidth = tempTag.offsetWidth;
        
        // Check if we need to show counter
        if (i < tagIds.length - 1) {
          // Not the last tag - check if adding this tag + counter would exceed width
          if (totalWidth + tagWidth + gap + counterWidth > containerWidth) {
            break;
          }
        } else {
          // Last tag - check if adding just this tag would exceed width
          if (totalWidth + tagWidth > containerWidth) {
            break;
          }
        }

        totalWidth += tagWidth + gap;
        count++;
      }

      document.body.removeChild(tempContainer);
      setVisibleCount(Math.max(1, count));
    };

    calculateVisibleTags();
    
    window.addEventListener('resize', calculateVisibleTags);
    return () => window.removeEventListener('resize', calculateVisibleTags);
  }, [tagIds, options]);

  if (tagIds.length === 0) return null;

  const visibleTags = tagIds.slice(0, visibleCount);
  const hiddenTags = tagIds.slice(visibleCount);
  const hiddenCount = hiddenTags.length;

  return (
    <div ref={containerRef} className="content-stretch flex items-center justify-start relative shrink-0 w-full">
      <div className="flex gap-[8px] items-center flex-wrap">
        {visibleTags.map((tagId) => {
          const tag = options.find((t) => t.id === tagId);
          if (!tag) return null;
          return (
            <div
              key={tag.id}
              className="bg-white box-border content-stretch flex gap-[8px] items-center px-[10px] py-[8px] relative rounded-[20px] shrink-0"
            >
              <div
                aria-hidden="true"
                className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[20px]"
              />
              <div className="content-stretch flex gap-[10px] items-center overflow-clip relative shrink-0">
                <div className="flex flex-col font-['Inter'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-neutral-900 text-nowrap">
                  <p className="leading-[16px] whitespace-pre">{tag.name}</p>
                </div>
              </div>
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-neutral-100 box-border content-stretch flex gap-[8px] items-center px-[10px] py-[8px] relative rounded-[20px] shrink-0 cursor-pointer hover:bg-neutral-200 transition-colors">
                  <div
                    aria-hidden="true"
                    className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[20px]"
                  />
                  <div className="content-stretch flex gap-[10px] items-center overflow-clip relative shrink-0">
                    <div className="flex flex-col font-['Inter'] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-neutral-700 text-nowrap">
                      <p className="leading-[16px] whitespace-pre">
                        +{hiddenCount}
                      </p>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="bg-white p-2 rounded-lg shadow-lg border border-neutral-200"
              >
                <div className="flex flex-col gap-2 max-w-[200px]">
                  {hiddenTags.map((tagId) => {
                    const tag = options.find((t) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <div
                        key={tag.id}
                        className="bg-white box-border content-stretch flex gap-[8px] items-center px-[10px] py-[6px] relative rounded-[16px] shrink-0"
                      >
                        <div
                          aria-hidden="true"
                          className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[16px]"
                        />
                        <div className="content-stretch flex gap-[10px] items-center overflow-clip relative shrink-0">
                          <div className="flex flex-col font-['Inter'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-neutral-900 text-nowrap">
                            <p className="leading-[16px] whitespace-pre">
                              {tag.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

interface NeedBoardCardProps {
  title?: string;
  content?: string;
  className?: string;
  showPin?: boolean;
  isVertical?: boolean;
  isEditable?: boolean;
  isResizable?: boolean;
  size?: CardSize | string;
  onSizeChange?: (newSize: CardSize) => void;
  onDelete?: () => void;
  onTitleChange?: (newTitle: string) => void;
  onContentChange?: (newContent: string) => void;
}

// 解析内容数据
function parseContent(content: string): { seeking: string[]; offering: string[] } {
  if (!content || content.trim() === "") {
    return { seeking: [], offering: [] };
  }

  try {
    const parsed = JSON.parse(content);
    if (parsed.seeking && parsed.offering) {
      return {
        seeking: Array.isArray(parsed.seeking) ? filterValidTags(parsed.seeking, SEEKING_TAGS) : [],
        offering: Array.isArray(parsed.offering) ? filterValidTags(parsed.offering, OFFERING_TAGS) : [],
      };
    }
  } catch {
    // 如果不是 JSON，返回空数组（向后兼容旧格式）
  }

  return { seeking: [], offering: [] };
}

// 序列化内容数据
function serializeContent(seeking: string[], offering: string[]): string {
  return JSON.stringify({ seeking, offering });
}

export function NeedBoardCard({ 
  title = "Need Board", 
  content = "",
  className = "",
  showPin = false,
  isVertical = false,
  isEditable = false,
  isResizable = true,
  size = "horizontal",
  onSizeChange,
  onDelete,
  onTitleChange,
  onContentChange
}: NeedBoardCardProps) {
  const parsedContent = parseContent(content);
  const [seekingTags, setSeekingTags] = useState<string[]>(parsedContent.seeking);
  const [offeringTags, setOfferingTags] = useState<string[]>(parsedContent.offering);
  const [seekingOpen, setSeekingOpen] = useState(false);
  const [offeringOpen, setOfferingOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // 规范化 size：将 small 视为 horizontal
  const normalizedSize = resolveNeedBoardSize(size as string | undefined);
  const isSquare = normalizedSize === "square";

  const seekingDropdownRef = useRef<HTMLDivElement>(null);
  const offeringDropdownRef = useRef<HTMLDivElement>(null);
  const seekingButtonRef = useRef<HTMLButtonElement>(null);
  const offeringButtonRef = useRef<HTMLButtonElement>(null);
  const [seekingDropdownPosition, setSeekingDropdownPosition] = useState({ top: 0, left: 0 });
  const [offeringDropdownPosition, setOfferingDropdownPosition] = useState({ top: 0, left: 0 });
  const profileFetchControllerRef = useRef<AbortController | null>(null);
  const saveControllerRef = useRef<AbortController | null>(null);
  const onContentChangeRef = useRef<typeof onContentChange>();
  const lastSerializedContentRef = useRef<string>(serializeContent(parsedContent.seeking, parsedContent.offering));

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  // 同步外部 content 变化
  useEffect(() => {
    const parsed = parseContent(content);
    setSeekingTags(prev => (areArraysShallowEqual(prev, parsed.seeking) ? prev : parsed.seeking));
    setOfferingTags(prev => (areArraysShallowEqual(prev, parsed.offering) ? prev : parsed.offering));
    lastSerializedContentRef.current = serializeContent(parsed.seeking, parsed.offering);
  }, [content]);

  useEffect(() => {
    return () => {
      profileFetchControllerRef.current?.abort();
      saveControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isEditable) {
      return;
    }

    const controller = new AbortController();
    profileFetchControllerRef.current?.abort();
    profileFetchControllerRef.current = controller;

    const fetchCollaborationPreferences = async () => {
      try {
        const response = await fetch('/api/profile', { signal: controller.signal });
        if (!response.ok) {
          // 404 is expected in open-source version (localStorage mode)
          return;
        }

        const data = await response.json();
        const fetchedSeeking = Array.isArray(data?.seeking_items) ? filterValidTags(data.seeking_items, SEEKING_TAGS) : [];
        const fetchedOffering = Array.isArray(data?.offering_items) ? filterValidTags(data.offering_items, OFFERING_TAGS) : [];

        setSeekingTags(prev => (areArraysShallowEqual(prev, fetchedSeeking) ? prev : fetchedSeeking));
        setOfferingTags(prev => (areArraysShallowEqual(prev, fetchedOffering) ? prev : fetchedOffering));

        lastSerializedContentRef.current = serializeContent(fetchedSeeking, fetchedOffering);
      } catch (error) {
        if ((error as DOMException).name === 'AbortError') {
          return;
        }
        console.error('Unexpected error loading collaboration preferences:', error);
      }
    };

    fetchCollaborationPreferences();

    return () => {
      controller.abort();
    };
  }, [isEditable]);

  const persistCollaborationPreferences = useCallback(async (updatedSeeking: string[], updatedOffering: string[]) => {
    if (!isEditable) {
      return;
    }

    const payload = {
      seeking_items: filterValidTags(updatedSeeking, SEEKING_TAGS),
      offering_items: filterValidTags(updatedOffering, OFFERING_TAGS),
    };

    try {
      saveControllerRef.current?.abort();
      const controller = new AbortController();
      saveControllerRef.current = controller;

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        // 404 is expected in open-source version (localStorage mode)
      }
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') {
        return;
      }
      console.error('Unexpected error while saving collaboration preferences:', error);
    }
  }, [isEditable]);

  // 计算下拉框位置
  const updateSeekingDropdownPosition = () => {
    if (seekingButtonRef.current) {
      const rect = seekingButtonRef.current.getBoundingClientRect();
      setSeekingDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  };

  const updateOfferingDropdownPosition = () => {
    if (offeringButtonRef.current) {
      const rect = offeringButtonRef.current.getBoundingClientRect();
      setOfferingDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  };

  useEffect(() => {
    if (seekingOpen) {
      updateSeekingDropdownPosition();
      window.addEventListener('scroll', updateSeekingDropdownPosition, true);
      window.addEventListener('resize', updateSeekingDropdownPosition);
      return () => {
        window.removeEventListener('scroll', updateSeekingDropdownPosition, true);
        window.removeEventListener('resize', updateSeekingDropdownPosition);
      };
    }
  }, [seekingOpen]);

  useEffect(() => {
    if (offeringOpen) {
      updateOfferingDropdownPosition();
      window.addEventListener('scroll', updateOfferingDropdownPosition, true);
      window.addEventListener('resize', updateOfferingDropdownPosition);
      return () => {
        window.removeEventListener('scroll', updateOfferingDropdownPosition, true);
        window.removeEventListener('resize', updateOfferingDropdownPosition);
      };
    }
  }, [offeringOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        seekingDropdownRef.current &&
        !seekingDropdownRef.current.contains(event.target as Node) &&
        seekingButtonRef.current &&
        !seekingButtonRef.current.contains(event.target as Node)
      ) {
        setSeekingOpen(false);
      }
      if (
        offeringDropdownRef.current &&
        !offeringDropdownRef.current.contains(event.target as Node) &&
        offeringButtonRef.current &&
        !offeringButtonRef.current.contains(event.target as Node)
      ) {
        setOfferingOpen(false);
      }
    };

    if (seekingOpen || offeringOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [seekingOpen, offeringOpen]);

  const toggleSeekingTag = (tagId: string) => {
    const newTags = seekingTags.includes(tagId)
      ? seekingTags.filter((id) => id !== tagId)
      : [...seekingTags, tagId];

    setSeekingTags(newTags);
    persistCollaborationPreferences(newTags, offeringTags);
  };

  const toggleOfferingTag = (tagId: string) => {
    const newTags = offeringTags.includes(tagId)
      ? offeringTags.filter((id) => id !== tagId)
      : [...offeringTags, tagId];

    setOfferingTags(newTags);
    persistCollaborationPreferences(seekingTags, newTags);
  };

  useEffect(() => {
    const serialized = serializeContent(seekingTags, offeringTags);
    if (serialized === lastSerializedContentRef.current) {
      return;
    }

    lastSerializedContentRef.current = serialized;

    const updateContent = onContentChangeRef.current;
    if (updateContent) {
      updateContent(serialized);
    }
  }, [seekingTags, offeringTags]);

  const hasAnyTags = seekingTags.length > 0 || offeringTags.length > 0;

  // 下拉菜单组件
  const renderDropdown = (
    isOpen: boolean,
    position: { top: number; left: number },
    dropdownRef: React.RefObject<HTMLDivElement>,
    options: Tag[],
    selectedIds: string[],
    onToggle: (id: string) => void
  ) => {
    if (!isOpen) return null;

    return (
      <Portal>
        <div
          ref={dropdownRef}
          className="fixed z-[1000] bg-white content-stretch flex flex-col items-start rounded-[16px] shrink-0 w-[300px]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            aria-hidden="true"
            className="absolute border border-neutral-200 border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
          />

          <div className="relative shrink-0 w-full max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent hover:scrollbar-thumb-neutral-400">
            <div className="size-full">
              <div className="box-border content-stretch flex flex-col items-start p-[4px] relative w-full">
                {options.map((option) => {
                  const isSelected = selectedIds.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(option.id);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="relative rounded-[2px] shrink-0 w-full cursor-pointer hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex flex-row items-center size-full">
                        <div className="box-border content-stretch flex items-center py-[6px] pl-[8px] pr-[8px] relative w-full">
                          <div className="w-[24px] flex items-center justify-center shrink-0">
                            {isSelected && (
                              <div className="relative shrink-0 size-[16px]">
                                <svg
                                  className="block size-full"
                                  fill="none"
                                  preserveAspectRatio="none"
                                  viewBox="0 0 16 16"
                                >
                                  <g>
                                    <path
                                      d={svgPaths.p39be50}
                                      stroke="var(--stroke-0, #0A0A0A)"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </g>
                                </svg>
                              </div>
                            )}
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="bg-white box-border content-stretch flex gap-[8px] items-center px-[10px] py-[8px] relative rounded-[20px] max-w-[240px] min-w-0">
                                  <div
                                    aria-hidden="true"
                                    className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[20px]"
                                  />
                                  <div className="content-stretch flex gap-[10px] items-center relative min-w-0 flex-1">
                                    <div className="flex flex-col font-['Inter'] font-normal justify-center leading-[0] not-italic relative text-[14px] text-neutral-900 min-w-0 flex-1">
                                      <p className="leading-[16px] whitespace-nowrap overflow-hidden text-ellipsis">
                                        {option.name}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="bg-neutral-900 text-white px-3 py-2 rounded-md border-0"
                              >
                                <p className="text-[14px]">{option.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Portal>
    );
  };

  // 根据尺寸设置卡片大小
  const cardClassName = isSquare 
    ? "w-[390px] h-[390px]" 
    : "w-[820px] h-[175px]";
  
  return (
    <div 
      className={`group relative ${cardClassName} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
      }}
    >
      {showPin && (
        <div className="absolute flex items-center justify-center left-0 top-[-18px] z-10">
          <div className="flex-none rotate-[180deg] scale-y-[-100%]">
            <PinIcon />
          </div>
        </div>
      )}
      
      <div
        className={`${hasAnyTags ? "bg-[#fcfcfc]" : "bg-neutral-50"} ${isSquare ? "rounded-[28px]" : "rounded-[12px]"} w-full h-full relative`}
      >
        {isSquare ? (
          <div className="box-border content-stretch flex flex-col gap-[12px] items-start p-[32px] relative rounded-[inherit] w-full h-full">
            <div className="basis-0 content-stretch flex flex-col grow items-start gap-[24px] min-h-0 w-full">
              {/* Seeking Section */}
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                {/* Seeking Button */}
                <div className="relative">
                  {isEditable ? (
                    <button
                      ref={seekingButtonRef}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSeekingOpen(!seekingOpen);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="content-stretch flex items-center justify-center relative shrink-0 cursor-pointer hover:bg-neutral-100 rounded-[24px] transition-colors px-[4px] py-[2px]"
                    >
                      <div className="box-border content-stretch flex flex-col gap-[10px] h-[24px] items-center justify-center p-[8px] relative rounded-[24px] shrink-0">
                        <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
                          <p className="font-['Inter'] font-semibold leading-[20px] not-italic relative shrink-0 text-[#838383] text-[14px] text-nowrap whitespace-pre">
                            <span className="text-[12px]">🔍</span> Seeking
                          </p>
                        </div>
                      </div>
                      <div className="overflow-clip relative shrink-0 size-[16px]">
                        <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]">
                          <div className="absolute inset-[-12.5%_-6.25%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 5">
                              <path d="M0.5 0.5L4.5 4.5L8.5 0.5" stroke="#838383" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="content-stretch flex items-center justify-center relative shrink-0 rounded-[24px] px-[8px] py-[4px]">
                      <p className="font-['Inter'] font-semibold leading-[20px] not-italic text-[#838383] text-[14px] text-nowrap whitespace-pre">
                        <span className="text-[12px]">🔍</span> Seeking
                      </p>
                    </div>
                  )}

                  {isEditable && renderDropdown(
                    seekingOpen,
                    seekingDropdownPosition,
                    seekingDropdownRef,
                    SEEKING_TAGS,
                    seekingTags,
                    toggleSeekingTag
                  )}
                </div>

                {/* Seeking Tags Display */}
                {seekingTags.length > 0 ? (
                  <TagsDisplayMobile tagIds={seekingTags} options={SEEKING_TAGS} />
                ) : (
                  isEditable && (
                    <div className="content-stretch flex items-center relative w-full min-h-[32px]">
                      <div className="flex flex-col font-['Inter'] font-normal justify-center not-italic relative text-[#838383] text-[14px]">
                        <p className="leading-[20px]">
                          Click on &quot;Seeking&quot; to choose what you are looking for now.
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Offering Section */}
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                {/* Offering Button */}
                <div className="relative">
                  {isEditable ? (
                    <button
                      ref={offeringButtonRef}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOfferingOpen(!offeringOpen);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="content-stretch flex items-center justify-center relative shrink-0 cursor-pointer hover:bg-neutral-100 rounded-[24px] transition-colors px-[4px] py-[2px]"
                    >
                      <div className="box-border content-stretch flex flex-col gap-[10px] h-[24px] items-center justify-center p-[8px] relative rounded-[24px] shrink-0">
                        <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
                          <p className="font-['Inter'] font-semibold leading-[20px] not-italic relative shrink-0 text-[#838383] text-[14px] text-nowrap whitespace-pre">
                            🤝 Offering
                          </p>
                        </div>
                      </div>
                      <div className="overflow-clip relative shrink-0 size-[16px]">
                        <div className="absolute bottom-[37.5%] left-1/4 right-1/4 top-[37.5%]">
                          <div className="absolute inset-[-12.5%_-6.25%]">
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 5">
                              <path d="M0.5 0.5L4.5 4.5L8.5 0.5" stroke="#838383" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="content-stretch flex items-center justify-center relative shrink-0 rounded-[24px] px-[8px] py-[4px]">
                      <p className="font-['Inter'] font-semibold leading-[20px] not-italic text-[#838383] text-[14px] text-nowrap whitespace-pre">
                        🤝 Offering
                      </p>
                    </div>
                  )}

                  {isEditable && renderDropdown(
                    offeringOpen,
                    offeringDropdownPosition,
                    offeringDropdownRef,
                    OFFERING_TAGS,
                    offeringTags,
                    toggleOfferingTag
                  )}
                </div>

                {/* Offering Tags Display */}
                {offeringTags.length > 0 ? (
                  <TagsDisplayMobile tagIds={offeringTags} options={OFFERING_TAGS} />
                ) : (
                  isEditable && (
                    <div className="content-stretch flex items-center relative w-full min-h-[32px]">
                      <div className="flex flex-col font-['Inter'] font-normal justify-center not-italic relative text-[#838383] text-[14px]">
                        <p className="leading-[20px]">
                          Click on &quot;Offering&quot; to choose what you are willing to offer now.
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={`box-border content-stretch flex flex-col gap-[20px] items-start justify-center px-[16px] py-[20px] relative rounded-[inherit] w-full h-[175px]`}>

          {/* Seeking Section */}
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            {/* Seeking Button */}
            <div className="relative">
              {isEditable ? (
                <button
                  ref={seekingButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSeekingOpen(!seekingOpen);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="content-stretch flex items-center justify-center relative shrink-0 cursor-pointer hover:bg-neutral-100 rounded-[24px] transition-colors px-[4px] py-[2px]"
                >
                  <div className="box-border content-stretch flex flex-col gap-[10px] h-[24px] items-center justify-center p-[8px] relative shrink-0">
                    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
                      <p className="font-['Inter'] font-semibold leading-[20px] not-italic relative shrink-0 text-[#838383] text-[14px] text-nowrap whitespace-pre">
                        <span className="text-[12px]">🔍</span> Seeking
                      </p>
                    </div>
                  </div>
                  <div className="relative shrink-0 size-[16px]">
                    <svg
                      className="block size-full"
                      fill="none"
                      preserveAspectRatio="none"
                      viewBox="0 0 16 16"
                    >
                      <g>
                        <path
                          d="M4 6L8 10L12 6"
                          stroke="var(--stroke-0, #838383)"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    </svg>
                  </div>
                </button>
              ) : (
                <div className="content-stretch flex items-center justify-center relative shrink-0 rounded-[24px] px-[8px] py-[4px]">
                  <p className="font-['Inter'] font-semibold leading-[20px] not-italic text-[#838383] text-[14px] text-nowrap whitespace-pre">
                    <span className="text-[12px]">🔍</span> Seeking
                  </p>
                </div>
              )}

              {isEditable && renderDropdown(
                seekingOpen,
                seekingDropdownPosition,
                seekingDropdownRef,
                SEEKING_TAGS,
                seekingTags,
                toggleSeekingTag
              )}
            </div>

            {/* Seeking Tags Display */}
            {seekingTags.length > 0 ? (
              <TagsDisplay tagIds={seekingTags} options={SEEKING_TAGS} />
            ) : (
              isEditable && (
                <div className="content-stretch flex h-[32px] items-center relative shrink-0 w-full">
                  <div className="flex flex-col font-['Inter'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#838383] text-[14px] text-nowrap">
                    <p className="leading-[16px] whitespace-pre">
                      Click on &quot;Seeking&quot; to choose what you are looking
                      for now.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Offering Section */}
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            {/* Offering Button */}
            <div className="relative">
              {isEditable ? (
                <button
                  ref={offeringButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOfferingOpen(!offeringOpen);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="content-stretch flex items-center justify-center relative shrink-0 cursor-pointer hover:bg-neutral-100 rounded-[24px] transition-colors px-[4px] py-[2px]"
                >
                  <div className="box-border content-stretch flex flex-col gap-[10px] h-[24px] items-center justify-center p-[8px] relative shrink-0">
                    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
                      <p className="font-['Inter'] font-semibold leading-[20px] not-italic relative shrink-0 text-[#838383] text-[14px] text-nowrap whitespace-pre">
                        🤝 Offering
                      </p>
                    </div>
                  </div>
                  <div className="relative shrink-0 size-[16px]">
                    <svg
                      className="block size-full"
                      fill="none"
                      preserveAspectRatio="none"
                      viewBox="0 0 16 16"
                    >
                      <g>
                        <path
                          d="M4 6L8 10L12 6"
                          stroke="var(--stroke-0, #838383)"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    </svg>
                  </div>
                </button>
              ) : (
                <div className="content-stretch flex items-center justify-center relative shrink-0 rounded-[24px] px-[8px] py-[4px]">
                  <p className="font-['Inter'] font-semibold leading-[20px] not-italic text-[#838383] text-[14px] text-nowrap whitespace-pre">
                    🤝 Offering
                  </p>
                </div>
              )}

              {isEditable && renderDropdown(
                offeringOpen,
                offeringDropdownPosition,
                offeringDropdownRef,
                OFFERING_TAGS,
                offeringTags,
                toggleOfferingTag
              )}
            </div>

            {/* Offering Tags Display */}
            {offeringTags.length > 0 ? (
              <TagsDisplay tagIds={offeringTags} options={OFFERING_TAGS} />
            ) : (
              isEditable && (
                <div className="content-stretch flex h-[32px] items-center relative shrink-0 w-full">
                  <div className="flex flex-col font-['Inter'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#838383] text-[14px] text-nowrap">
                    <p className="leading-[16px] whitespace-pre">
                      Click on &quot;Offering&quot; to choose what you are willing
                      to offer now.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
          </div>
        )}

        {/* Border */}
        {isSquare ? (
          <div
            aria-hidden="true"
            className="absolute border border-[rgba(0,0,0,0.06)] border-solid inset-0 pointer-events-none rounded-[28px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.04)]"
          />
        ) : (
          <div
            aria-hidden="true"
            className={`absolute pointer-events-none rounded-[12px] ${
              hasAnyTags 
                ? "border-neutral-200 border-solid border inset-0" 
                : "border-[rgba(0,0,0,0.2)] border-dashed border inset-[-0.5px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.04)]"
            }`}
          />
        )}

        {/* 删除按钮 - 只在编辑模式下显示 */}
        {isHovered && isEditable && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            onMouseDown={e => e.stopPropagation()}
            className="absolute -top-3 -left-3 z-50 flex items-center gap-2 p-2 rounded-[60px] border border-[rgba(0,0,0,0.06)] bg-white shadow-[0px_4px_10px_0px_rgba(0,0,0,0.10)] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="删除卡片"
          >
            <Trash size={16} className="text-zinc-900" />
          </button>
        )}

        {/* Size toolbar */}
        {isHovered && isEditable && isResizable && onSizeChange && (
          <div 
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-50 opacity-0 group-hover:opacity-100"
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
          >
            <NeedBoardSizeToolbar 
              currentSize={normalizedSize as CardSize} 
              onSizeChange={(newSize) => {
                onSizeChange(newSize)
              }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
