import type { BentoItemProps } from "@/types/bento"
import {
  OFFERING_OPTIONS,
  SEEKING_OPTIONS,
} from "@/types/collaboration-options"

const seekingLookup = new Map(SEEKING_OPTIONS.map((option) => [option.key, option.text]))
const offeringLookup = new Map(OFFERING_OPTIONS.map((option) => [option.key, option.text]))

interface CollaborationTags {
  seeking: string[]
  offering: string[]
}

const parseNeedBoardContent = (content?: string | null): CollaborationTags => {
  if (!content || content.trim() === "") {
    return { seeking: [], offering: [] }
  }

  try {
    const parsed = JSON.parse(content) as {
      seeking?: unknown
      offering?: unknown
    }

    const seekingIds = Array.isArray(parsed.seeking)
      ? parsed.seeking.filter((value): value is string => typeof value === "string")
      : []

    const offeringIds = Array.isArray(parsed.offering)
      ? parsed.offering.filter((value): value is string => typeof value === "string")
      : []

    return {
      seeking: seekingIds
        .map((id) => seekingLookup.get(id))
        .filter((value): value is string => Boolean(value)),
      offering: offeringIds
        .map((id) => offeringLookup.get(id))
        .filter((value): value is string => Boolean(value)),
    }
  } catch {
    return { seeking: [], offering: [] }
  }
}

export function extractCollaborationTags(
  items: BentoItemProps[] | undefined | null,
): CollaborationTags {
  if (!items || items.length === 0) {
    return { seeking: [], offering: [] }
  }

  const needBoardItem = items.find((item) => item.type === "need")
  if (!needBoardItem) {
    return { seeking: [], offering: [] }
  }

  return parseNeedBoardContent(needBoardItem.content)
}

