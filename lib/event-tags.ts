export interface EventTagDefinition {
  id: string
  name: string
  color: {
    bg: string
    border: string
  }
}

export const AVAILABLE_EVENT_TAGS: EventTagDefinition[] = [
  {
    id: "neurips",
    name: "NeurIPS2025",
    color: { bg: "rgba(74,222,128,0.2)", border: "#4ade80" },
  },
  {
    id: "iccv",
    name: "ICCV2025",
    color: { bg: "#dbeafe", border: "#0090ff" },
  },
  {
    id: "chi",
    name: "CHI2026",
    color: { bg: "#f2e2fc", border: "#8347b9" },
  },
  {
    id: "cvpr",
    name: "CVPR2026",
    color: { bg: "#ffefd6", border: "#cc4e00" },
  },
  {
    id: "icml",
    name: "ICML2026",
    color: { bg: "#fee9f5", border: "#be185d" },
  },
]

export const EVENT_TAG_NAME_TO_ID: Record<string, string> = AVAILABLE_EVENT_TAGS.reduce(
  (acc, tag) => {
    acc[tag.name] = tag.id
    return acc
  },
  {} as Record<string, string>,
)

export const EVENT_TAG_ID_TO_NAME: Record<string, string> = AVAILABLE_EVENT_TAGS.reduce(
  (acc, tag) => {
    acc[tag.id] = tag.name
    return acc
  },
  {} as Record<string, string>,
)

function normalizeValue(value: string): string {
  return value.trim().toLowerCase()
}

export function getEventTagById(id: string): EventTagDefinition | undefined {
  const normalized = normalizeValue(id)
  return AVAILABLE_EVENT_TAGS.find((tag) => normalizeValue(tag.id) === normalized)
}

export function getEventTagByName(name: string): EventTagDefinition | undefined {
  const normalized = normalizeValue(name)
  return AVAILABLE_EVENT_TAGS.find((tag) => normalizeValue(tag.name) === normalized)
}

export function getEventTagIdFromNameOrId(value?: string | null): string | undefined {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const byName = getEventTagByName(trimmed)
  if (byName) {
    return byName.id
  }

  const byId = getEventTagById(trimmed)
  return byId?.id
}
