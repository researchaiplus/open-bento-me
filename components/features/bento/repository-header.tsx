import { PlatformIcon } from "./platform-icon";

interface RepositoryHeaderProps {
  platform: 'github' | 'huggingface';
  owner: string;
  repository: string;
}

export function RepositoryHeader({ platform, owner, repository }: RepositoryHeaderProps) {
  return (
    <div className="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0 w-full">
      <div className="box-border content-stretch flex flex-row gap-2.5 items-center justify-start p-0 relative shrink-0 size-5">
        <PlatformIcon platform={platform} />
      </div>
      <div className="basis-0 font-['Inter:Medium',_sans-serif] font-medium grow leading-[0] max-h-5 min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#000000] text-[14px] text-left">
        <p className="leading-[18px]">
          <span className="font-['Inter:Regular',_sans-serif] font-normal">
            {owner}
          </span>
          <span className="font-['Inter:Regular',_sans-serif] font-normal">
            /
          </span>
          <span className="font-['Inter:Semi_Bold',_sans-serif] font-semibold">
            {repository}
          </span>
        </p>
      </div>
    </div>
  );
}