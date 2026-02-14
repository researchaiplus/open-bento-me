import svgPaths from "./repository-svgs";

interface StatItemProps {
  icon: 'star' | 'download' | 'heart';
  count: number;
}

export function StatItem({ icon, count }: StatItemProps) {
  const getIconPath = () => {
    switch (icon) {
      case 'star':
        return svgPaths.pfe57700;
      case 'download':
        return svgPaths.p1301bc0;
      case 'heart':
        return svgPaths.p13f2e300;
      default:
        return svgPaths.pfe57700;
    }
  };

  return (
    <div className="box-border content-stretch flex flex-row gap-1 h-6 items-center justify-start pl-0 pr-2 py-0 relative shrink-0">
      <div className="relative shrink-0 size-4">
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 16 16"
        >
          <path
            d={getIconPath()}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.8"
          />
        </svg>
      </div>
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(0,0,0,0.8)] text-left text-nowrap">
        <p className="block leading-[20px] whitespace-pre">{count}</p>
      </div>
    </div>
  );
}