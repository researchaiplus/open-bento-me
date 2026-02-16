/**
 * Site Prefix Utility
 *
 * When multiple repos are deployed under the same GitHub Pages domain
 * (e.g., lizabethli.github.io/liz-test and lizabethli.github.io/liz),
 * they share the same localStorage origin. This utility returns a unique
 * prefix based on the repo name (derived from NEXT_PUBLIC_BASE_PATH) so
 * each site's localStorage data stays isolated.
 *
 * Examples:
 *   NEXT_PUBLIC_BASE_PATH="/liz-test" → getSitePrefix() → "liz-test"
 *   NEXT_PUBLIC_BASE_PATH="/liz"      → getSitePrefix() → "liz"
 *   NEXT_PUBLIC_BASE_PATH=""          → getSitePrefix() → ""
 *   (local dev, no env var)           → getSitePrefix() → ""
 */

let _cachedPrefix: string | undefined

/**
 * Get the site prefix for localStorage key namespacing.
 *
 * Uses NEXT_PUBLIC_BASE_PATH (set at build time for GitHub Pages deploys)
 * to derive a unique prefix per repo. Falls back to extracting the first
 * path segment from the URL on *.github.io domains.
 *
 * Returns a string like "liz-test" or "" (empty for root deployments / local dev).
 */
export function getSitePrefix(): string {
  if (_cachedPrefix !== undefined) return _cachedPrefix

  // Priority 1: Build-time env var (most reliable — baked into JS by Next.js)
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH
  if (basePath) {
    _cachedPrefix = basePath.replace(/^\/|\/$/g, '')
    return _cachedPrefix
  }

  // Priority 2: Runtime fallback for *.github.io domains
  if (typeof window !== 'undefined') {
    try {
      const hostname = window.location.hostname
      if (hostname.endsWith('.github.io')) {
        const firstSegment = window.location.pathname.split('/').filter(Boolean)[0]
        if (firstSegment) {
          _cachedPrefix = firstSegment
          return _cachedPrefix
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  _cachedPrefix = ''
  return _cachedPrefix
}

/**
 * Prefix a localStorage key with the site prefix.
 *
 * Examples:
 *   prefixStorageKey('github:token:b64') → 'liz-test:github:token:b64'  (on liz-test site)
 *   prefixStorageKey('github:token:b64') → 'github:token:b64'           (local dev, no prefix)
 */
export function prefixStorageKey(key: string): string {
  const prefix = getSitePrefix()
  return prefix ? `${prefix}:${key}` : key
}
