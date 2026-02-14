interface CategoryTagProps {
    category: string;
  }
  
  export function CategoryTag({ category }: CategoryTagProps) {
    return (
      <div className="bg-zinc-100 box-border content-stretch flex flex-row gap-0.5 h-6 items-center justify-start px-2 py-1 relative rounded-[15px] shrink-0">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-0 relative shrink-0">
          <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[rgba(0,0,0,0.8)] text-left text-nowrap">
            <p className="block leading-[16px] whitespace-pre">{category}</p>
          </div>
        </div>
      </div>
    );
  }