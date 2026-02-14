"use client"

import { useRef, useState, useEffect, FormEvent } from "react"
import { Button } from "@/components/ui/button"

interface InputOverlayProps {
  placeholder: string
  onClose: () => void
  onSubmit: (value: string) => void | Promise<void>
  showImport?: boolean
  showSave?: boolean
  type?: "link" | "github"
  onImportClick?: () => void
}

export function InputOverlay({
  placeholder,
  onClose,
  onSubmit,
  showImport = false,
  showSave = true,
  type,
  onImportClick,
}: InputOverlayProps) {
  const [value, setValue] = useState("")
  const [isError, setIsError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    inputRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  const handleSubmit = (urlToSubmit: string) => {
    void 0;
    onSubmit(urlToSubmit)
    void 0;
    onClose()
  }

  const validateAndSubmit = (text: string) => {
    if (!text.trim()) return;
    
    let isValid = false;
    try {
      new URL(text);
      isValid = true;
      void 0;
    } catch (err) {
      void 0;
    }
    
    if (isValid) {
      setIsError(false)
      handleSubmit(text);
    } else {
      setValue("")
      setIsError(true)
    }
  };

  const handleDirectPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    void 0;
    if (pastedText.trim()) {
      try {
        new URL(pastedText);
        void 0;
        setIsError(false)
        handleSubmit(pastedText);
      } catch (err) {
        {
          void 0;
          setValue("")
          setIsError(true)
        }
      }
    } else {
      void 0;
    }
  };

  const handleSaveClick = () => {
    validateAndSubmit(value);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    validateAndSubmit(value);
  };

  const handleImportClick = () => {
    void 0
    if (type === "github" && onImportClick) {
      onImportClick()
      onClose()
    } else {
      handleSubmit(value)
    }
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      ref={containerRef}
      className="flex w-[360px] h-[44px] items-center rounded-lg border border-black/20 bg-white shadow-sm"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          if (isError) setIsError(false)
        }}
        onPaste={handleDirectPaste}
        placeholder={isError ? "Please enter a valid link" : placeholder}
        className={`flex-1 bg-transparent px-4 py-2 text-sm outline-none ${
          isError ? "placeholder-red-500" : "placeholder-gray-500"
        }`}
      />
      <div className="flex items-center gap-2 pr-2">
        {type === "github" && showImport && (
          <Button
            onClick={handleImportClick}
            variant="ghost"
            className="h-8 px-3 text-sm font-medium text-[#0f172a] hover:bg-gray-100 cursor-pointer"
            type="button"
          >
            Import
          </Button>
        )}
        {showSave && (
          <Button
            onClick={handleSaveClick}
            variant="outline"
            className="h-8 px-3 text-sm font-medium border-[#0f172a]/20 text-[#0f172a] hover:bg-gray-100"
            type="submit"
          >
            Save
          </Button>
        )}
      </div>
    </form>
  )
}

