/**
 * Adapter Provider - Profile-Only Version
 *
 * Selects the appropriate data adapter based on the current mode:
 * - **Edit mode** (local development / editing): LocalStorageAdapter
 * - **Published mode** (GitHub Pages with pre-baked data): StaticConfigAdapter (read-only)
 *
 * Published mode is detected via:
 *   1. Build-time env var: NEXT_PUBLIC_PUBLISHED === 'true' (set in deploy.yml)
 *   2. URL parameter: ?mode=preview
 *
 * Data Flow:
 *   - Edit mode: user edits → LocalStorageAdapter → localStorage
 *   - Published mode: visitor opens link → StaticConfigAdapter → profile-config.json
 */

import { useEffect, useState } from 'react'
import { ProfileDataAdapter } from './index'
import { LocalStorageAdapter } from './localstorage-adapter'
import { StaticConfigAdapter } from './static-config-adapter'

export interface AdapterProviderOptions {
  forceAdapter?: 'database' | 'localstorage' | 'static'
  userId?: string
}

/**
 * Detect if the current environment is in "published" (read-only) mode.
 * Published mode means data should come from profile-config.json, not localStorage.
 *
 * Priority:
 *   1. ?mode=edit → always returns false (user wants to edit, override published)
 *   2. NEXT_PUBLIC_PUBLISHED=true → returns true (GitHub Pages build)
 *   3. ?mode=preview → returns true (manual preview)
 *   4. Default → false (local dev)
 */
export function isPublishedMode(): boolean {
  // Priority 1: Explicit edit mode override — always allow editing
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.get('mode') === 'edit') return false
    } catch {
      // Ignore URL parsing errors
    }
  }

  // Priority 2: Build-time environment variable (set by GitHub Actions deploy.yml)
  if (process.env.NEXT_PUBLIC_PUBLISHED === 'true') {
    return true
  }

  // Priority 3: URL parameter for manual preview mode
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.get('mode') === 'preview') {
        return true
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  return false
}

/**
 * Detect if the user is in edit mode on a published site.
 * This is the case when NEXT_PUBLIC_PUBLISHED=true AND ?mode=edit is present.
 *
 * In this scenario, the user wants to edit their profile on the deployed GitHub Pages site.
 * Data should be seeded from profile-config.json into localStorage (if localStorage is empty),
 * then editing proceeds via LocalStorageAdapter as usual.
 */
export function isEditModeOnPublishedSite(): boolean {
  if (process.env.NEXT_PUBLIC_PUBLISHED !== 'true') return false

  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href)
      return url.searchParams.get('mode') === 'edit'
    } catch {
      return false
    }
  }

  return false
}

/**
 * Hook to get the appropriate adapter based on current mode.
 * - Published mode → StaticConfigAdapter (read-only, loads from profile-config.json)
 * - Edit mode on published site → LocalStorageAdapter, seeded from profile-config.json if empty
 * - Edit mode (local dev) → LocalStorageAdapter (read-write, uses localStorage)
 */
export function useAdapter(options: AdapterProviderOptions = {}): ProfileDataAdapter | null {
  const [adapter, setAdapter] = useState<ProfileDataAdapter | null>(null)

  useEffect(() => {
    const initAdapter = async () => {
      // Allow explicit override via options
      if (options.forceAdapter === 'static') {
        const staticAdapter = new StaticConfigAdapter()
        await staticAdapter.loadConfig()
        setAdapter(staticAdapter)
        return
      }

      if (options.forceAdapter === 'localstorage') {
        setAdapter(new LocalStorageAdapter())
        return
      }

      // Auto-detect mode
      if (isPublishedMode()) {
        // Pure published mode (read-only)
        const staticAdapter = new StaticConfigAdapter()
        await staticAdapter.loadConfig()
        setAdapter(staticAdapter)
      } else if (isEditModeOnPublishedSite()) {
        // Edit mode on published site: seed localStorage from profile-config.json if empty
        const lsAdapter = new LocalStorageAdapter()
        await seedLocalStorageFromStaticConfig(lsAdapter)
        setAdapter(lsAdapter)
      } else {
        // Normal edit mode (local dev)
        setAdapter(new LocalStorageAdapter())
      }
    }

    initAdapter()
  }, [options.forceAdapter])

  return adapter
}

/**
 * Seed localStorage with data from profile-config.json.
 *
 * Handles three scenarios:
 * 1. localStorage is empty → seed from profile-config.json (first-time edit)
 * 2. localStorage has data AND profile-config.json is newer → re-seed (post-publish refresh)
 * 3. localStorage has data AND is up-to-date → skip (user's local edits preserved)
 *
 * Version comparison uses metadata.lastModified timestamps to detect stale data.
 */
export async function seedLocalStorageFromStaticConfig(
  lsAdapter: LocalStorageAdapter
): Promise<void> {
  try {
    // Load data from profile-config.json
    const staticAdapter = new StaticConfigAdapter()
    await staticAdapter.loadConfig()

    const staticConfig = staticAdapter.exportConfig()
    if (!staticConfig || (!staticConfig.profile && !staticConfig.bentoGrid?.items?.length)) {
      console.debug('[seedLocalStorage] No data in profile-config.json, skipping seed')
      return
    }

    // Check if localStorage already has bento items (user has edited before)
    const existingItems = await lsAdapter.getBentoItems()

    if (existingItems.length > 0) {
      // localStorage has data — compare timestamps to detect stale data
      const localMetadata = await lsAdapter.getMetadata()
      const staticLastModified = staticConfig.metadata?.lastModified

      if (localMetadata?.lastModified && staticLastModified) {
        const localTime = new Date(localMetadata.lastModified).getTime()
        const staticTime = new Date(staticLastModified).getTime()

        if (staticTime > localTime) {
          // Static config is newer (published after last local edit) → re-seed
          console.debug(
            '[seedLocalStorage] Static config is newer than localStorage, re-seeding.',
            { staticTime: staticLastModified, localTime: localMetadata.lastModified }
          )
          await lsAdapter.importConfig(staticConfig)
          console.debug('[seedLocalStorage] Re-seed complete')
          return
        }
      }

      console.debug('[seedLocalStorage] localStorage is up-to-date, skipping seed')
      return
    }

    // localStorage is empty → first-time seed
    console.debug('[seedLocalStorage] Seeding localStorage from profile-config.json')
    await lsAdapter.importConfig(staticConfig)
    console.debug('[seedLocalStorage] Seed complete')
  } catch (error) {
    console.error('[seedLocalStorage] Failed to seed localStorage:', error)
    // Non-fatal: user can still edit with empty localStorage
  }
}

/**
 * Get adapter for server-side operations
 */
export async function getServerAdapter(
  _userId: string,
  _options: AdapterProviderOptions = {}
): Promise<ProfileDataAdapter> {
  // Server-side always uses LocalStorageAdapter (no published mode detection on server)
  return new LocalStorageAdapter()
}

