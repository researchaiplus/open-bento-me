"use client"

interface RepositoryDescriptionProps {
  description: string;
  isEditable?: boolean;
  isHovered?: boolean;
  onDescriptionChange?: (newDescription: string) => void;
}

export function RepositoryDescription({ 
  description, 
  isEditable = false,
  isHovered = false,
  onDescriptionChange 
}: RepositoryDescriptionProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onDescriptionChange) {
      onDescriptionChange(e.target.value);
    }
  };

  return (
    <div className="font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal leading-[0] max-h-[70px] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[12px] text-[rgba(0,0,0,0.48)] text-left w-full">
      {/* 显示模式 */}
      <div
        className={`block leading-[16px] whitespace-pre-wrap transition-opacity duration-200 ${isEditable && isHovered ? 'opacity-0' : 'opacity-100'}`}
      >
        <p>{description || 'No description'}</p>
      </div>

      {/* 编辑模式 */}
      {isEditable && (
        <div 
          className={`absolute inset-0 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="relative w-full h-full bg-gray-100/90 rounded">
            <textarea
              value={description}
              onChange={handleChange}
              className="absolute inset-0 resize-none outline-none border-none p-0 bg-transparent font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] text-[12px] text-[rgba(0,0,0,0.48)] leading-[16px]"
              placeholder="输入描述..."
              onMouseDown={e => e.stopPropagation()}
              onMouseMove={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}