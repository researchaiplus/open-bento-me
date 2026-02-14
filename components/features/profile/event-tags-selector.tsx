"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Portal } from "@/components/ui/portal";
import { AVAILABLE_EVENT_TAGS, type EventTagDefinition } from "@/lib/event-tags";

const svgPaths = {
  p36bdefc0: "M3.33333 8H12.6667M8 3.33333V12.6667",
  p39be50: "M13.3333 4L6 11.3333L2.66667 8",
};

type Event = EventTagDefinition;
const AVAILABLE_EVENTS: Event[] = AVAILABLE_EVENT_TAGS;

const MAX_SELECTIONS = 3;

interface EventTagSelectorProps {
  events?: string[];
  isEditable?: boolean;
  onEventsChange?: (events: string[]) => void;
}

export function EventTagSelector({ 
  events = [], 
  isEditable = false,
  onEventsChange 
}: EventTagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // 将外部传入的事件名称转换为内部使用的 ID
  const getEventIdFromName = (name: string): string | null => {
    const event = AVAILABLE_EVENTS.find(e => e.name === name);
    return event ? event.id : null;
  };
  
  // 将外部传入的事件名称数组转换为 ID 数组
  const initialSelectedIds = events
    .map(name => getEventIdFromName(name))
    .filter((id): id is string => id !== null);
  
  const [selectedEvents, setSelectedEvents] = useState<string[]>(initialSelectedIds);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  // 将 events 转换为稳定的字符串用于比较
  const eventsKey = useMemo(() => {
    return events
      .map(name => getEventIdFromName(name))
      .filter((id): id is string => id !== null)
      .sort()
      .join(',');
  }, [events]);
  
  // 使用 ref 跟踪上一次的 eventsKey，避免不必要的更新
  // 初始化为 initialSelectedIds 的序列化值
  const prevEventsKeyRef = useRef<string>(
    [...initialSelectedIds].sort().join(',')
  );
  
  // 当外部 events 改变时，同步内部状态
  useEffect(() => {
    // 只在 eventsKey 真正改变时才更新
    if (prevEventsKeyRef.current !== eventsKey) {
      const newSelectedIds = events
        .map(name => getEventIdFromName(name))
        .filter((id): id is string => id !== null);
      setSelectedEvents(newSelectedIds);
      prevEventsKeyRef.current = eventsKey;
    }
  }, [events, eventsKey]);

  // 计算下拉框位置
  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      
      // 监听滚动和窗口大小变化，更新位置
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) => {
      let newSelected: string[];
      if (prev.includes(eventId)) {
        newSelected = prev.filter((id) => id !== eventId);
      } else if (prev.length < MAX_SELECTIONS) {
        newSelected = [...prev, eventId];
      } else {
        return prev;
      }

      return newSelected;
    });
  };

  // 当 selectedEvents 改变时，通知外部组件
  // 使用 ref 跟踪上一次的值，避免不必要的回调
  const prevSelectedEventsRef = useRef<string>(
    [...initialSelectedIds].sort().join(',')
  );
  
  useEffect(() => {
    if (onEventsChange) {
      // 使用展开运算符避免修改原数组
      const currentSelectedStr = [...selectedEvents].sort().join(',');
      
      // 只在 selectedEvents 真正改变时才调用回调
      if (prevSelectedEventsRef.current !== currentSelectedStr) {
        const eventNames = selectedEvents
          .map(id => AVAILABLE_EVENTS.find(e => e.id === id)?.name)
          .filter((name): name is string => name !== undefined);
        onEventsChange(eventNames);
        prevSelectedEventsRef.current = currentSelectedStr;
      }
    }
  }, [selectedEvents, onEventsChange]);

  const isMaxReached = selectedEvents.length >= MAX_SELECTIONS;
  const hasError = isMaxReached;
  
  // 渲染事件标签的通用函数
  const renderEventTag = (eventId: string) => {
    const event = AVAILABLE_EVENTS.find(e => e.id === eventId);
    if (!event) return null;
    
    return (
      <div
        key={eventId}
        className="box-border content-stretch flex flex-col gap-[10px] h-[24px] items-center justify-center px-[10px] py-[2px] relative rounded-[16px] shrink-0"
        style={{ backgroundColor: event.color.bg }}
      >
        <div aria-hidden="true" className="absolute border border-solid inset-0 pointer-events-none rounded-[16px]" style={{ borderColor: event.color.border }} />
        <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
          <p className="font-['Inter'] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-neutral-950 text-nowrap whitespace-pre">{event.name}</p>
        </div>
      </div>
    );
  };
  
  // 如果不可编辑，显示已选择的事件标签
  if (!isEditable) {
    if (selectedEvents.length === 0) {
      return null;
    }
    
    return (
      <div className="flex flex-wrap gap-2 items-start justify-end flex-1">
        {selectedEvents.map(renderEventTag)}
      </div>
    );
  }

  // 可编辑模式：显示已选择的事件标签和添加按钮
  return (
    <div className="flex flex-wrap gap-2 items-start justify-end flex-1">
      {/* 显示已选择的事件标签 */}
      {selectedEvents.map(renderEventTag)}
      
      {/* 添加事件按钮 */}
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          disabled={!isEditable}
          className="bg-white box-border content-stretch flex gap-[6px] h-[24px] items-center justify-center px-[12px] py-[2px] relative rounded-[24px] shrink-0 cursor-pointer hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
        <div aria-hidden="true" className="absolute border border-dashed border-neutral-300 inset-[-0.5px] pointer-events-none rounded-[24.5px]" />
        <div className="relative shrink-0 size-[16px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
            <g>
              <path d={svgPaths.p36bdefc0} stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        </div>
        <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
          <p className="font-['Inter'] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-neutral-500 text-nowrap whitespace-pre">Event to go</p>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <Portal>
          <div
            ref={dropdownRef}
            className="fixed z-[1000] bg-white content-stretch flex flex-col items-start rounded-[16px] shrink-0 w-[224px]"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
          <div aria-hidden="true" className="absolute border border-neutral-200 border-solid inset-0 pointer-events-none rounded-[16px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]" />
          
          {/* Header */}
          <div className="relative shrink-0 w-full">
            <div className="size-full">
              <div className="box-border content-stretch flex flex-col items-start pb-0 pt-[4px] px-[4px] relative w-full">
                <div className="relative rounded-[2px] shrink-0 w-full">
                  <div className="flex flex-row items-center size-full">
                    <div className="box-border content-stretch flex items-center px-[8px] py-[6px] relative w-full">
                      <div className="basis-0 content-stretch flex gap-[10px] grow items-center min-h-px min-w-px relative shrink-0">
                        <p className={`font-['Inter'] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-nowrap whitespace-pre ${hasError ? 'text-red-600' : 'text-neutral-950'}`}>
                          Choose event ( Max 3 tags)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-[8px] relative shrink-0 w-full">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 224 8">
              <g>
                <line stroke="var(--stroke-0, #E5E5E5)" x2="224" y1="3.5" y2="3.5" />
              </g>
            </svg>
          </div>

          {/* Options */}
          <div className="relative shrink-0 w-full">
            <div className="size-full">
              <div className="box-border content-stretch flex flex-col items-start p-[4px] relative w-full">
                {AVAILABLE_EVENTS.map((event, index) => {
                  const isSelected = selectedEvents.includes(event.id);
                  const isDisabled = !isSelected && isMaxReached;
                  
                  return (
                    <button
                      key={event.id}
                      onClick={() => !isDisabled && toggleEvent(event.id)}
                      disabled={isDisabled}
                      className={`h-[32px] relative rounded-[2px] shrink-0 w-full cursor-pointer hover:bg-neutral-50 transition-colors ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex flex-row items-center size-full">
                        <div className="box-border content-stretch flex h-[32px] items-center py-[6px] pl-[8px] pr-[8px] relative w-full">
                          <div className="w-[24px] flex items-center justify-center shrink-0">
                            {isSelected && (
                              <div className="relative shrink-0 size-[16px]">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                  <g>
                                    <path d={svgPaths.p39be50} stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" />
                                  </g>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="box-border content-stretch flex flex-col gap-[10px] h-[24px] items-center justify-center px-[10px] py-[2px] relative rounded-[16px] shrink-0" style={{ backgroundColor: event.color.bg }}>
                            <div aria-hidden="true" className="absolute border border-solid inset-0 pointer-events-none rounded-[16px]" style={{ borderColor: event.color.border }} />
                            <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
                              <p className="font-['Inter'] font-medium leading-[16px] not-italic relative shrink-0 text-[12px] text-neutral-950 text-nowrap whitespace-pre">{event.name}</p>
                            </div>
                          </div>
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
      )}
      </div>
    </div>
  );
}
