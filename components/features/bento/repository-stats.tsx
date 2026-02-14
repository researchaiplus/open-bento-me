import { LanguageTag } from "./language-tag";
import { CategoryTag } from "./category-tag";
import { StatItem } from "./stat-item";

interface RepositoryStatsProps {
  language?: string;
  languageColor?: string;
  category?: string;
  stars?: number;
  downloads?: number;
  likes?: number;
}

export function RepositoryStats({ 
  language, 
  languageColor,
  category, 
  stars, 
  downloads, 
  likes 
}: RepositoryStatsProps) {
  return (
    <div className="box-border content-stretch flex flex-row gap-3 items-center justify-start p-0 relative shrink-0">
      {language && (
        <div className="flex flex-row items-center self-stretch">
          <LanguageTag language={language} color={languageColor} />
        </div>
      )}
      {category && <CategoryTag category={category} />}
      {stars !== undefined && stars !== null && (
        <StatItem icon="star" count={stars} />
      )}      
      {downloads !== undefined && downloads !== null && downloads > 0 && <StatItem icon="download" count={downloads} />}
      {likes !== undefined && likes !== null && likes > 0 && <StatItem icon="heart" count={likes} />}
    </div>
  );
}