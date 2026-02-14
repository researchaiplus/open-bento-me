"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export type Option = {
  value: string;
  label: string;
  avatar?: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  allowCustomValues?: boolean;
  showAvatars?: boolean;
  badgeClassName?: string;
}

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = "Select options...",
  emptyMessage = "No options found.",
  className,
  allowCustomValues = false,
  showAvatars = false,
  badgeClassName,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dropdownWidth, setDropdownWidth] = React.useState(0);

  // 确保数据安全性
  const safeOptions = React.useMemo(() => {
    return Array.isArray(options) ? options : [];
  }, [options]);

  const safeSelected = React.useMemo(() => {
    return Array.isArray(selected) ? selected : [];
  }, [selected]);

  // 获取已选择的选项
  const selectedItems = React.useMemo(() => {
    return safeSelected.map(value => {
      return safeOptions.find(opt => opt.value === value) || { value, label: value };
    });
  }, [safeOptions, safeSelected]);

  // 过滤选项
  const filteredOptions = React.useMemo(() => {
    return safeOptions.filter(option => {
      const matchesSearch = option.label.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [safeOptions, search]);

  const toggleOption = React.useCallback((value: string) => {
    const isSelected = safeSelected.includes(value);
    const newSelected = isSelected
      ? safeSelected.filter(item => item !== value)
      : [...safeSelected, value];
    onChange(newSelected);
  }, [safeSelected, onChange]);

  const removeOption = React.useCallback((value: string) => {
    onChange(safeSelected.filter(item => item !== value));
  }, [safeSelected, onChange]);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (allowCustomValues && e.key === "Enter" && search && !safeOptions.some(option => option.value === search)) {
      e.preventDefault();
      onChange([...safeSelected, search]);
      setSearch("");
    }
  }, [allowCustomValues, search, safeOptions, safeSelected, onChange]);

  // 点击外部关闭下拉菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 更新下拉框宽度
  React.useEffect(() => {
    if (containerRef.current) {
      setDropdownWidth(containerRef.current.getBoundingClientRect().width);
    }
  }, [isOpen]);

  return (
    <div className="w-full relative" ref={containerRef}>
      {/* 搜索输入框 */}
      <div
        className={cn(
          "flex min-h-[40px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2 text-[14px] text-[#0F172A] ring-offset-white placeholder:text-[#94A3B8] focus-within:border-[#0F172A] focus-within:outline-none focus-within:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent outline-none placeholder:text-[#94A3B8] text-[14px]"
            placeholder={placeholder}
          />
        </div>
        <div className="ml-2 flex items-center self-center">
          <ChevronsUpDown className="h-4 w-4 text-[#94A3B8]" />
        </div>
      </div>

      {/* 下拉菜单 */}
      {isOpen && (
        <div 
          className="absolute z-50 mt-1 rounded-md border border-[#E2E8F0] bg-white shadow-lg"
          style={{ width: `${dropdownWidth}px` }}
        >
          <div className="flex items-center border-b border-[#E2E8F0] px-3 py-2">
            <Search className="h-4 w-4 text-[#94A3B8] mr-2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Search ${placeholder.toLowerCase()}`}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-8 p-0 text-[14px] placeholder:text-[#94A3B8]"
            />
          </div>
          <div className="max-h-[300px] overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="text-[14px] py-2 px-2 text-[#94A3B8]">
                {allowCustomValues ? (
                  <>
                    <span>No match found. Press Enter to create "</span>
                    <span className="font-medium">{search}</span>
                    <span>"</span>
                  </>
                ) : (
                  emptyMessage
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => {
                  const isSelected = safeSelected.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleOption(option.value)}
                      className={cn(
                        "flex items-center w-full text-left px-2 py-1.5 text-[14px] rounded-[6px] text-[#0F172A] hover:bg-[#F8FAFC]",
                        isSelected && "bg-[#F8FAFC]"
                      )}
                      type="button"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {showAvatars && option.avatar && (
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-[#F8FAFC]">
                            <Image
                              src={option.avatar}
                              alt={option.label}
                              width={24}
                              height={24}
                              className="object-cover"
                            />
                          </div>
                        )}
                        {showAvatars && !option.avatar && (
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-[#F8FAFC]" />
                        )}
                        {option.label}
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-[#0F172A]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 已选择的项目 */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedItems.map((item) => (
            <Badge
              key={item.value}
              variant="secondary"
              className={cn(
                "flex items-center gap-2 rounded-[6px] pl-2 pr-1 py-1 text-[14px] bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-normal hover:bg-[#F8FAFC]",
                badgeClassName
              )}
            >
              {showAvatars && item.avatar && (
                <div className="w-5 h-5 rounded-full overflow-hidden bg-[#F8FAFC]">
                  <Image
                    src={item.avatar}
                    alt={item.label}
                    width={20}
                    height={20}
                    className="object-cover"
                  />
                </div>
              )}
              {showAvatars && !item.avatar && (
                <div className="w-5 h-5 rounded-full overflow-hidden bg-[#F8FAFC]" />
              )}
              {item.label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(item.value);
                }}
                className="ml-1 p-0.5 rounded-full hover:bg-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#E2E8F0]"
              >
                <X className="h-3.5 w-3.5 text-[#64748B]" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}