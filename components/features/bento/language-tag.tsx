interface LanguageTagProps {
    language: string;
    color?: string;
  }
  
  export function LanguageTag({ language, color = "#0284C7" }: LanguageTagProps) {
    return (
      <div className="box-border content-stretch flex flex-row gap-1 h-full items-center justify-start p-0 relative rounded-lg shrink-0">
        <div className="relative shrink-0 size-5">
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 20 20"
          >
            <circle
              cx="10"
              cy="10"
              fill={color}
              r="8"
            />
          </svg>
        </div>
        <div className="box-border content-stretch flex flex-row gap-2.5 items-center justify-start overflow-clip p-0 relative shrink-0">
          <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[rgba(0,0,0,0.8)] text-left text-nowrap">
            <p className="block leading-[16px] whitespace-pre">{language}</p>
          </div>
        </div>
      </div>
    );
  }