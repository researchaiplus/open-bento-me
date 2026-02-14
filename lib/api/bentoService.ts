import type { BentoItemProps } from "@/types/bento";
import type { BentoItemProps as BentoItemPropsFromUI } from "@/components/features/bento/types";
import {
  BentoItem,
  BoxCreateInput,
  BoxUpdateInput,
} from "@/types/bento";

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#ffac45",
  Go: "#00ADD8",
  Rust: "#dea584",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Vue: "#41b883",
  React: "#61dafb",
  "C#": "#178600",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Other: "#ededed",
};

type GithubRepoMetadata = {
  id: string;
  name: string;
  description: string;
  language: string;
  languageColor: string;
  stars: number;
  lastUpdated?: string;
  topics: string[];
};

const normalizeGithubRepo = (
  data: any,
  owner: string,
  repo: string,
): GithubRepoMetadata => {
  const language = data?.language || '';
  return {
    id: data?.id ? String(data.id) : `${owner}/${repo}`,
    name: data?.name || repo,
    description: data?.description || '',
    language,
    languageColor: LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Other,
    stars: typeof data?.stargazers_count === 'number' ? data.stargazers_count : 0,
    lastUpdated: data?.updated_at,
    topics: Array.isArray(data?.topics) ? data.topics : [],
  };
};

// Helper to convert BentoItemProps to BoxCreateInput
const prepareMetadataByType = (boxData: BentoItemPropsFromUI) => {
  switch (boxData.type) {
    case "link":
      return { savedTitle: boxData.savedTitle || null };
    case "text":
      return { text: boxData.text || "" };
    case "image":
      return { imageUrl: boxData.imageUrl || "" };
    case "github":
      return {
        owner: boxData.owner || "",
        repo: boxData.repo || "",
        platform: boxData.platform || 'github',
        savedDescription: boxData.savedDescription || "",
        language: boxData.language || "",
        languageColor: boxData.languageColor || "#ededed",
        stars: boxData.stars || 0,
        topics: boxData.topics || [],
        category: boxData.category,
        downloads: boxData.downloads,
        likes: boxData.likes,
      };
    case "people":
      if (!boxData.userId) {
        throw new Error("userId is required for people type");
      }
      return { 
        userId: boxData.userId,
        username: boxData.username || null
      };
    case "section_title":
      return { text: boxData.text || "" };
    case "need":
      return { 
        title: boxData.title || "Need Board",
        content: boxData.content || "",
        showPin: boxData.showPin !== undefined ? boxData.showPin : true,
        isVertical: boxData.isVertical !== undefined ? boxData.isVertical : false,
        size: boxData.size || "small"
      };
    default:
      return {};
  }
};

const toApiData = (boxData: BentoItemPropsFromUI & { layout?: any }): BoxCreateInput => {
  const apiData: BoxCreateInput = {
    type: boxData.type.toUpperCase(),
    width: boxData.w || 1,
    height: boxData.h || 1,
    position: {
      x: boxData.x || 0,
      y: boxData.y || 0,
      i: boxData.id,
    },
    metadata: prepareMetadataByType(boxData),
    url: boxData.url || null,
    className: boxData.className || null,
  };
  
  // 如果有layout数据，将其转换为position.responsive结构
  if (boxData.layout) {
    apiData.position = {
      ...apiData.position,
      responsive: boxData.layout
    };
  }
  
  return apiData;
};

// API Service Functions
export const fetchUserBoxes = async (): Promise<BentoItem[]> => {
  const response = await fetch("/api/boxes");
  if (!response.ok) {
    if (response.status === 401) {
      void 0;
      return [];
    }
    throw new Error(`Failed to fetch boxes: ${response.status}`);
  }
  return await response.json();
};

// 新增：获取特定用户的 boxes
export const fetchUserBoxesByUserId = async (userId: string): Promise<BentoItem[]> => {
  const response = await fetch(`/api/boxes/user/${userId}`);
  if (!response.ok) {
    if (response.status === 401) {
      void 0;
      return [];
    }
    if (response.status === 404) {
      void 0;
      return [];
    }
    throw new Error(`Failed to fetch boxes for user ${userId}: ${response.status}`);
  }
  return await response.json();
};

export const fetchBox = async (id: string): Promise<BentoItem | null> => {
  const response = await fetch(`/api/boxes/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch box: ${response.status}`);
  }
  return await response.json();
};

export const saveBox = async (
  boxData: BentoItemPropsFromUI,
): Promise<BentoItem> => {
  // 移除 isNew 标记和其他临时 UI 状态
  const { isNew, isDraggable, isResizable, ...cleanBoxData } = boxData;
  
  void 0;
  
  const apiData = toApiData(cleanBoxData as BentoItemPropsFromUI);
  void 0;
  
  const response = await fetch("/api/boxes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(apiData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error("🔍 saveBox: API错误:", response.status, errorData);
    throw new Error(`API error (${response.status}): ${JSON.stringify(errorData)}`);
  }
  return await response.json();
};

export const updateBox = async (
  id: string,
  updateData: Partial<BoxUpdateInput>,
): Promise<BentoItem> => {
  console.debug(`bentoService.updateBox - send update data ${id}:`, JSON.stringify(updateData));
  
  const response = await fetch(`/api/boxes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });
  if (!response.ok) {
     const errorData = await response.json();
    throw new Error(`Failed to update box ${id} (${response.status}): ${JSON.stringify(errorData)}`);
  }
  const result = await response.json();
  console.debug(`bentoService.updateBox - receive response ${id}:`, JSON.stringify(result));
  return result;
};

export const deleteBox = async (id: string): Promise<boolean> => {
  const response = await fetch(`/api/boxes/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Failed to delete box (${response.status}):`, errorData);
    return false;
  }
  return true;
};

export const uploadImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload-image", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }
  return await response.json();
};

export const fetchGithubRepo = async (
  owner: string,
  repo: string,
): Promise<GithubRepoMetadata> => {
  const trimmedOwner = owner.trim();
  const trimmedRepo = repo.trim();
  const queryOwner = encodeURIComponent(trimmedOwner);
  const queryRepo = encodeURIComponent(trimmedRepo);
  const apiUrl = `/api/github/repos?username=${queryOwner}&repo=${queryRepo}`;

  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      // 确保返回的数据符合 GithubRepoMetadata 类型
      return {
        id: data.id || `${trimmedOwner}/${trimmedRepo}`,
        name: data.name || trimmedRepo,
        description: data.description || '',
        language: data.language || '',
        languageColor: data.languageColor || '#ededed',
        stars: typeof data.stars === 'number' ? data.stars : 0,
        lastUpdated: data.lastUpdated,
        topics: Array.isArray(data.topics) ? data.topics : [],
      };
    }
    console.warn(
      "fetchGithubRepo: internal API returned",
      response.status,
      response.statusText,
    );
  } catch (error) {
    console.warn("fetchGithubRepo: failed to reach internal API, falling back", error);
  }

  // Fallback to direct GitHub API
  const fallbackUrl = `https://api.github.com/repos/${queryOwner}/${queryRepo}`;
  const fallbackResponse = await fetch(fallbackUrl, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ResearchAI-App",
    },
  });

  if (!fallbackResponse.ok) {
    const errorText = await fallbackResponse.text();
    console.error("fetchGithubRepo: GitHub API error:", fallbackResponse.status, errorText);
    throw new Error(`Failed to fetch repository info: ${fallbackResponse.status}`);
  }

  const fallbackData = await fallbackResponse.json();
  return normalizeGithubRepo(fallbackData, trimmedOwner, trimmedRepo);
};

/**
 * Fetch HuggingFace model info via server-side proxy (HF API doesn't allow CORS).
 */
export const fetchHfModel = async (modelId: string) => {
  try {
    const response = await fetch(`/api/hf/models/${encodeURIComponent(modelId)}`);
    if (!response.ok) {
      console.warn(`fetchHfModel: API returned ${response.status} for ${modelId}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`fetchHfModel: failed to fetch ${modelId}`, error);
    return null;
  }
}

/**
 * Fetch HuggingFace dataset info via server-side proxy (HF API doesn't allow CORS).
 */
export const fetchHfDataset = async (datasetId: string) => {
  try {
    const response = await fetch(`/api/hf/datasets/${encodeURIComponent(datasetId)}`);
    if (!response.ok) {
      console.warn(`fetchHfDataset: API returned ${response.status} for ${datasetId}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`fetchHfDataset: failed to fetch ${datasetId}`, error);
    return null;
  }
}
