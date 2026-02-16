/**
 * GitHub Configuration Manager
 *
 * Manages GitHub token and repository configuration securely.
 */

import { GitHubAPI } from './api'
import { prefixStorageKey } from '@/lib/utils/get-site-prefix'

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  branch?: string
}

// Prefix all config keys with site prefix to isolate per-repo on shared origins
const CONFIG_KEYS = {
  TOKEN: prefixStorageKey('github:token:v2'),
  REPO: prefixStorageKey('github:repo:v2'),
  AUTO_SAVE: prefixStorageKey('github:auto-save'),
}

/**
 * Encrypt token using base64 (obfuscation, not real encryption)
 * In production, consider using Web Crypto API
 */
function encryptToken(token: string): string {
  return btoa(token)
}

function decryptToken(encrypted: string): string {
  return atob(encrypted)
}

/**
 * Validate GitHub configuration
 */
export async function validateGitHubConfig(
  config: GitHubConfig
): Promise<{ valid: boolean; error?: string }> {
  try {
    if (!config.token || !config.owner || !config.repo) {
      return { valid: false, error: 'Missing required configuration' }
    }

    const github = new GitHubAPI({
      token: config.token,
      owner: config.owner,
      repo: config.repo,
      branch: config.branch || 'main',
    })

    // Check repository access
    await github.getRepository()

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
    }
  }
}

/**
 * Parse repository string into owner and repo
 * Supports formats:
 * - "owner/repo"
 * - "https://github.com/owner/repo"
 */
export function parseRepository(repoString: string): { owner: string; repo: string } | null {
  try {
    // Try parsing as URL
    const url = new URL(repoString)
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (pathParts.length >= 2) {
      return {
        owner: pathParts[0],
        repo: pathParts[1],
      }
    }
  } catch {
    // Not a URL, try parsing as owner/repo
    const parts = repoString.split('/')
    if (parts.length === 2) {
      return {
        owner: parts[0],
        repo: parts[1],
      }
    }
  }

  return null
}

/**
 * Save GitHub configuration
 */
export function saveGitHubConfig(config: GitHubConfig): void {
  try {
    // Verify we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('Cannot save config on server')
    }

    // Save encrypted token
    localStorage.setItem(CONFIG_KEYS.TOKEN, encryptToken(config.token))

    // Save repository info
    localStorage.setItem(CONFIG_KEYS.REPO, `${config.owner}/${config.repo}`)

    // Add timestamp
    localStorage.setItem(`${CONFIG_KEYS.TOKEN}:timestamp`, Date.now().toString())
  } catch (error) {
    console.error('Error saving GitHub config:', error)
    throw error
  }
}

/**
 * Load GitHub configuration
 */
export function loadGitHubConfig(): GitHubConfig | null {
  try {
    // Verify we're in browser environment
    if (typeof window === 'undefined') {
      return null
    }

    const tokenEncrypted = localStorage.getItem(CONFIG_KEYS.TOKEN)
    const repoString = localStorage.getItem(CONFIG_KEYS.REPO)

    if (!tokenEncrypted || !repoString) {
      return null
    }

    const token = decryptToken(tokenEncrypted)
    const parsed = parseRepository(repoString)

    if (!parsed) {
      return null
    }

    return {
      token,
      owner: parsed.owner,
      repo: parsed.repo,
    }
  } catch (error) {
    console.error('Error loading GitHub config:', error)
    return null
  }
}

/**
 * Check if configuration exists
 */
export function hasGitHubConfig(): boolean {
  return loadGitHubConfig() !== null
}

/**
 * Clear GitHub configuration
 */
export function clearGitHubConfig(): void {
  try {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.removeItem(CONFIG_KEYS.TOKEN)
    localStorage.removeItem(CONFIG_KEYS.REPO)
    localStorage.removeItem(`${CONFIG_KEYS.TOKEN}:timestamp`)
  } catch (error) {
    console.error('Error clearing GitHub config:', error)
  }
}

/**
 * Get configuration age (in milliseconds)
 */
export function getConfigAge(): number | null {
  try {
    if (typeof window === 'undefined') {
      return null
    }

    const timestamp = localStorage.getItem(`${CONFIG_KEYS.TOKEN}:timestamp`)
    if (!timestamp) {
      return null
    }

    const configTime = parseInt(timestamp, 10)
    return Date.now() - configTime
  } catch (error) {
    console.error('Error getting config age:', error)
    return null
  }
}

/**
 * Check if config should be refreshed (older than 30 days)
 */
export function shouldRefreshConfig(): boolean {
  const age = getConfigAge()
  if (age === null) {
    return true
  }

  const thirtyDays = 30 * 24 * 60 * 60 * 1000
  return age > thirtyDays
}

/**
 * Auto-save configuration
 */
export function enableAutoSave(): void {
  try {
    if (typeof window === 'undefined') {
      return
    }
    localStorage.setItem(CONFIG_KEYS.AUTO_SAVE, 'true')
  } catch (error) {
    console.error('Error enabling auto-save:', error)
  }
}

export function disableAutoSave(): void {
  try {
    if (typeof window === 'undefined') {
      return
    }
    localStorage.removeItem(CONFIG_KEYS.AUTO_SAVE)
  } catch (error) {
    console.error('Error disabling auto-save:', error)
  }
}

export function isAutoSaveEnabled(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }
    return localStorage.getItem(CONFIG_KEYS.AUTO_SAVE) === 'true'
  } catch (error) {
    console.error('Error checking auto-save:', error)
    return false
  }
}

/**
 * Get GitHub Pages URL from config
 */
export function getGitHubPagesUrl(config: GitHubConfig): string {
  if (config.repo === `${config.owner}.github.io`) {
    return `https://${config.owner}.github.io/`
  }
  return `https://${config.owner}.github.io/${config.repo}/`
}

/**
 * Suggest repository name based on username
 */
export function suggestRepositoryName(username: string): string {
  return `${username}.github.io`
}

/**
 * Validate GitHub token format
 */
export function isValidTokenFormat(token: string): boolean {
  // GitHub tokens typically start with gh, ghp, or github_pat
  const patterns = [
    /^gh[ps]_[A-Za-z0-9]{36}$/,          // gh tokens
    /^github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}$/, // Fine-grained token
    /^[A-Fa-f0-9]{40}$/,                   // Legacy token
  ]

  return patterns.some(pattern => pattern.test(token))
}

export type { GitHubConfig }
