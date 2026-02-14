"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Bold,
  Italic,
  List,
  Heading,
  Table as TableIcon,
  Code,
  Quote,
  Undo,
  Redo,
} from "lucide-react"
import { useCallback, useEffect } from 'react'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = "Type any details of the project...",
  disabled = false,
  maxLength = 5000
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),

      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 my-4',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'border-b border-gray-300',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2 bg-gray-50 font-medium',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 px-4 py-2',
        },
      }),
    ],
    content,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-3 break-words whitespace-pre-wrap',
        style: 'word-break: break-word; overflow-wrap: anywhere; hyphens: auto;',
        placeholder,
      },
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [editor, disabled])

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  // 如果编辑器还没有初始化，显示加载状态
  if (!editor) {
    return (
      <div className="border rounded-2xl p-4 bg-gray-50">
        <div className="text-sm text-gray-500">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="border rounded-2xl overflow-hidden w-full max-w-full">
      {/* Toolbar */}
      <div className="border-b py-1 px-2 flex flex-wrap gap-1 items-center justify-between bg-gray-50">
        <div className="flex flex-wrap gap-1 items-center">
          <TooltipProvider>
            {/* Undo/Redo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo() || disabled}
                >
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo() || disabled}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Headings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={editor.isActive('heading', { level: 3 }) ? "secondary" : "ghost"} 
                  size="icon" 
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  disabled={disabled}
                >
                  <Heading className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Heading 3</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Text formatting */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={editor.isActive('bold') ? "secondary" : "ghost"} 
                  size="icon" 
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  disabled={disabled}
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={editor.isActive('italic') ? "secondary" : "ghost"} 
                  size="icon" 
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  disabled={disabled}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Lists */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={editor.isActive('bulletList') ? "secondary" : "ghost"} 
                  size="icon" 
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  disabled={disabled}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bullet List</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Code and quote */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={editor.isActive('code') ? "secondary" : "ghost"} 
                  size="icon" 
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  disabled={disabled}
                >
                  <Code className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Inline Code</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={editor.isActive('blockquote') ? "secondary" : "ghost"} 
                  size="icon" 
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  disabled={disabled}
                >
                  <Quote className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Quote</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Table */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={addTable}
                  disabled={disabled}
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Table</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="text-xs text-muted-foreground px-2">
          {editor.storage.characterCount?.characters() || 0}/{maxLength}
        </div>
      </div>

      {/* Editor */}
      <EditorContent 
        editor={editor} 
        className="min-h-[200px] w-full break-words focus-within:outline-none"
      />
      
      <div className="border-t p-2 text-xs text-muted-foreground">
        Rich text editor with Markdown support. Use keyboard shortcuts like **bold**, *italic*, # headings, - lists, etc.
      </div>
    </div>
  )
} 
