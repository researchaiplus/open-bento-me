import type { SocialLinks } from "@/types/social-links"

export type SocialPlatform = keyof SocialLinks

const isFullUrl = (value: string) => /^https?:\/\//i.test(value.trim())

const tryParseUrl = (value: string): URL | null => {
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    return new URL(trimmed)
  } catch {
    try {
      return new URL(`https://${trimmed}`)
    } catch {
      return null
    }
  }
}

const stripProtocolAndTrailingSlash = (value: string) => value.replace(/^https?:\/\//i, "").replace(/\/+$/, "")

const stripLeadingAt = (value: string) => value.replace(/^@+/, "")

const decodePathSegment = (segment?: string | null) => (segment ? decodeURIComponent(segment) : "")

const extractFromUrl = (platform: SocialPlatform, url: URL): string => {
  const host = url.hostname.toLowerCase()
  const segments = url.pathname.split("/").filter(Boolean)

  switch (platform) {
    case "googleScholar": {
      const userParam = url.searchParams.get("user")
      if (userParam) return decodePathSegment(userParam)
      break
    }
    case "researchGate": {
      if (host.includes("researchgate")) {
        const profileIndex = segments.findIndex((segment) => segment.toLowerCase() === "profile")
        if (profileIndex >= 0 && segments[profileIndex + 1]) {
          return decodePathSegment(segments[profileIndex + 1])
        }
        if (segments.length > 0) {
          return decodePathSegment(segments[segments.length - 1])
        }
      }
      break
    }
    case "orcid": {
      if (host.includes("orcid")) {
        return decodePathSegment(segments[0])
      }
      break
    }
    case "github": {
      if (host.includes("github")) {
        return decodePathSegment(segments[0])
      }
      break
    }
    case "linkedin": {
      if (host.includes("linkedin")) {
        if (segments.length >= 2 && ["in", "company", "school", "groups"].includes(segments[0].toLowerCase())) {
          return decodePathSegment(`${segments[0]}/${segments[1]}`)
        }
        if (segments.length === 1) {
          return decodePathSegment(segments[0])
        }
      }
      break
    }
    case "twitter": {
      if (host.includes("twitter") || host === "x.com") {
        return stripLeadingAt(decodePathSegment(segments[0]))
      }
      break
    }
    case "youtube": {
      if (host.includes("youtube")) {
        if (segments[0]?.startsWith("@")) {
          return stripLeadingAt(segments[0])
        }
        if (segments.length >= 2 && ["channel", "user", "c"].includes(segments[0].toLowerCase())) {
          return decodePathSegment(`${segments[0]}/${segments[1]}`)
        }
      }
      break
    }
  }

  return ""
}

export const extractSocialHandle = (platform: SocialPlatform, rawValue: string): string => {
  if (!rawValue) return ""

  const trimmed = rawValue.trim()
  if (!trimmed) return ""

  if (platform === "email") {
    return trimmed.replace(/^mailto:/i, "")
  }

  const noProtocol = stripProtocolAndTrailingSlash(trimmed)
  const strippedAt = stripLeadingAt(noProtocol)

  if (!trimmed.includes("/") && !trimmed.includes("?") && !trimmed.startsWith("http")) {
    return strippedAt
  }

  const parsedUrl = tryParseUrl(trimmed)
  if (parsedUrl) {
    const extracted = extractFromUrl(platform, parsedUrl)
    if (extracted) {
      return stripLeadingAt(extracted)
    }
  }

  return stripLeadingAt(stripProtocolAndTrailingSlash(trimmed))
}

export const normalizeSocialLinks = (links: Partial<SocialLinks>): SocialLinks => {
  const normalized: SocialLinks = {
    email: "",
    googleScholar: "",
    researchGate: "",
    orcid: "",
    github: "",
    linkedin: "",
    twitter: "",
    youtube: "",
  }

  Object.entries(links || {}).forEach(([key, value]) => {
    if (key in normalized && typeof value === "string") {
      normalized[key as SocialPlatform] = extractSocialHandle(key as SocialPlatform, value)
    }
  })

  return normalized
}

export const buildSocialUrl = (platform: SocialPlatform, handle: string): string => {
  if (!handle) return ""

  const trimmed = handle.trim()
  if (!trimmed) return ""

  if (platform !== "email" && isFullUrl(trimmed)) {
    return trimmed
  }

  switch (platform) {
    case "email":
      return trimmed.includes("@") ? `mailto:${trimmed.replace(/^mailto:/i, "")}` : ""
    case "googleScholar":
      return `https://scholar.google.com/citations?user=${encodeURIComponent(trimmed)}`
    case "researchGate":
      return `https://www.researchgate.net/profile/${encodeURIComponent(trimmed)}`
    case "orcid":
      return `https://orcid.org/${encodeURIComponent(trimmed)}`
    case "github":
      return `https://github.com/${encodeURIComponent(trimmed)}`
    case "linkedin": {
      const [prefix, slug] = trimmed.split("/")
      if (["in", "company", "school", "groups"].includes(prefix)) {
        const remainder = trimmed.slice(prefix.length + 1)
        return `https://www.linkedin.com/${prefix}/${encodeURIComponent(remainder)}`
      }
      if (trimmed.includes("/")) {
        return `https://www.linkedin.com/${trimmed.split("/").map((segment) => encodeURIComponent(segment)).join("/")}`
      }
      return `https://www.linkedin.com/in/${encodeURIComponent(trimmed)}`
    }
    case "twitter":
      return `https://x.com/${encodeURIComponent(stripLeadingAt(trimmed))}`
    case "youtube": {
      if (trimmed.startsWith("channel/") || trimmed.startsWith("user/") || trimmed.startsWith("c/")) {
        const [prefix, slug] = trimmed.split("/")
        return `https://youtube.com/${prefix}/${encodeURIComponent(slug ?? "")}`
      }
      return `https://youtube.com/@${encodeURIComponent(stripLeadingAt(trimmed))}`
    }
    default:
      return trimmed
  }
}
