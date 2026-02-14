/**
 * GitHub API Client
 *
 * Encapsulates GitHub API interactions for repository operations,
 * file management, and deployment status monitoring.
 */

export interface GitHubOptions {
  owner: string
  repo: string
  token: string
  branch?: string
}

export interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  content?: string
  encoding?: string
}

export interface GitHubCommit {
  sha: string
  message: string
  author: {
    name: string
    email: string
    date: string
  }
}

export class GitHubAPI {
  private options: GitHubOptions
  private baseUrl = 'https://api.github.com'

  constructor(options: GitHubOptions) {
    this.options = {
      branch: 'main',
      ...options,
    }
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `token ${this.options.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`GitHub API error: ${error.message}`)
    }

    return response.json()
  }

  /**
   * Get repository information
   */
  async getRepository(): Promise<any> {
    return this.request(`/repos/${this.options.owner}/${this.options.repo}`)
  }

  /**
   * Get file contents from repository
   */
  async getFile(path: string): Promise<GitHubFile> {
    return this.request(
      `/repos/${this.options.owner}/${this.options.repo}/contents/${path}?ref=${this.options.branch}`
    )
  }

  /**
   * Check if file exists in repository
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      await this.getFile(path)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Create or update file in repository
   */
  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    sha?: string
  ): Promise<any> {
    // Encode content to base64
    const encodedContent = Buffer.from(content, 'utf-8').toString('base64')

    const body = {
      message,
      content: encodedContent,
      branch: this.options.branch,
      ...(sha && { sha }),
    }

    const endpoint = `/repos/${this.options.owner}/${this.options.repo}/contents/${path}`

    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  /**
   * Create file if it doesn't exist, or update if it does
   */
  async upsertFile(
    path: string,
    content: string,
    message: string
  ): Promise<any> {
    try {
      // Try to get existing file first
      const existingFile = await this.getFile(path)
      // File exists, update it
      return this.createOrUpdateFile(path, content, message, existingFile.sha)
    } catch (error: any) {
      // File doesn't exist (404), create it
      if (error.message.includes('Not Found')) {
        return this.createOrUpdateFile(path, content, message)
      }
      throw error
    }
  }

  /**
   * Delete file from repository
   */
  async deleteFile(path: string, message: string, sha: string): Promise<any> {
    const body = {
      message,
      sha,
      branch: this.options.branch,
    }

    const endpoint = `/repos/${this.options.owner}/${this.options.repo}/contents/${path}`

    return this.request(endpoint, {
      method: 'DELETE',
      body: JSON.stringify(body),
    })
  }

  /**
   * Get latest commit on branch
   */
  async getLatestCommit(): Promise<GitHubCommit> {
    const response = await this.request(
      `/repos/${this.options.owner}/${this.options.repo}/commits/${this.options.branch}`
    )

    return {
      sha: response.sha,
      message: response.commit.message,
      author: response.commit.author,
    }
  }

  /**
   * List commits on repository
   */
  async listCommits(path?: string, limit: number = 10): Promise<GitHubCommit[]> {
    let endpoint = `/repos/${this.options.owner}/${this.options.repo}/commits?per_page=${limit}`

    if (path) {
      endpoint += `&path=${encodeURIComponent(path)}`
    }

    const response = await this.request(endpoint)

    return response.map((commit: any) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author,
    }))
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(): Promise<any> {
    const deployments = await this.request(
      `/repos/${this.options.owner}/${this.options.repo}/deployments?environment=github-pages`
    )

    if (deployments.length === 0) {
      return { status: 'no-deployments' }
    }

    const latest = deployments[0]

    const statuses = await this.request(
      `/repos/${this.options.owner}/${this.options.repo}/deployments/${latest.id}/statuses`
    )

    return statuses[0] || { status: 'unknown' }
  }

  /**
   * Wait for deployment to complete.
   *
   * When commitSha is provided, waits for a deployment matching that specific commit
   * (prevents returning early due to a previous deployment's 'success' status).
   *
   * @param timeout - Max wait time in ms (default: 5 minutes)
   * @param commitSha - If provided, only considers deployments matching this SHA
   * @param onProgress - Optional callback for progress updates (receives elapsed ms)
   */
  async waitForDeployment(
    timeout: number = 300000,
    commitSha?: string,
    onProgress?: (elapsedMs: number) => void
  ): Promise<void> {
    const startTime = Date.now()
    const checkInterval = 5000 // Check every 5 seconds

    // Brief initial delay to let GitHub Actions create the deployment
    if (commitSha) {
      await new Promise(resolve => setTimeout(resolve, 10000))
    }

    while (Date.now() - startTime < timeout) {
      const elapsed = Date.now() - startTime
      onProgress?.(elapsed)

      try {
        const deployments = await this.request(
          `/repos/${this.options.owner}/${this.options.repo}/deployments?environment=github-pages&per_page=5`
        )

        if (deployments.length === 0) {
          await new Promise(resolve => setTimeout(resolve, checkInterval))
          continue
        }

        // If commitSha provided, find the deployment matching that commit
        let targetDeployment = deployments[0]
        if (commitSha) {
          const matching = deployments.find((d: any) => d.sha === commitSha)
          if (!matching) {
            // New deployment not created yet by GitHub Actions, keep waiting
            await new Promise(resolve => setTimeout(resolve, checkInterval))
            continue
          }
          targetDeployment = matching
        }

        // Check the deployment's status
        const statuses = await this.request(
          `/repos/${this.options.owner}/${this.options.repo}/deployments/${targetDeployment.id}/statuses`
        )

        const latestStatus = statuses[0]
        if (!latestStatus) {
          await new Promise(resolve => setTimeout(resolve, checkInterval))
          continue
        }

        if (latestStatus.state === 'success') {
          return
        } else if (latestStatus.state === 'error' || latestStatus.state === 'failure') {
          throw new Error(`Deployment failed: ${latestStatus.description || 'Unknown error'}`)
        }

        // Status is 'pending' or 'in_progress', keep waiting
      } catch (error) {
        // Re-throw our own deployment failure errors
        if (error instanceof Error && error.message.startsWith('Deployment failed:')) {
          throw error
        }
        // API errors (rate limit, network) — log and retry
        console.warn('[waitForDeployment] Error checking status, retrying:', error)
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval))
    }

    throw new Error('Deployment timeout — GitHub Actions may still be running. Check your repository Actions tab.')
  }

  /**
   * Check rate limit status
   */
  async getRateLimit(): Promise<any> {
    return this.request('/rate_limit')
  }

  /**
   * Validate token and permissions
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.getRepository()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get the token used for authentication.
   * Useful when other services need the token (e.g., preFetchRepositoryMetadata).
   */
  getToken(): string {
    return this.options.token
  }

  /**
   * Get the repository's default branch name from GitHub API.
   * Returns the branch name (e.g., 'main', 'master', 'feat-opensource-v2').
   */
  async getDefaultBranch(): Promise<string> {
    try {
      const repoInfo = await this.getRepository()
      return repoInfo.default_branch || 'main'
    } catch {
      return 'main'
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<any> {
    return this.request('/user')
  }
}

/**
 * Create GitHub API client from GitHub URL
 */
export function createGitHubAPIFromUrl(
  githubUrl: string,
  token: string
): GitHubAPI {
  // Extract owner and repo from URL
  // Supports:
  // - https://github.com/owner/repo
  // - https://username.github.io (username inferred from hostname)
  // - owner/repo

  let owner: string | null = null
  let repo: string | null = null

  try {
    const url = new URL(githubUrl)

    if (url.hostname.endsWith('.github.io')) {
      // Handle username.github.io format
      owner = url.hostname.replace('.github.io', '')
      repo = `${owner}.github.io`
    } else if (url.hostname === 'github.com') {
      // Handle github.com/owner/repo format
      const pathParts = url.pathname.split('/').filter(Boolean)
      if (pathParts.length >= 2) {
        owner = pathParts[0]
        repo = pathParts[1]
      }
    }
  } catch (error) {
    // URL parsing failed, try as owner/repo string
    const parts = githubUrl.split('/')
    if (parts.length === 2) {
      owner = parts[0]
      repo = parts[1]
    }
  }

  if (!owner || !repo) {
    throw new Error('Invalid GitHub URL format. Use: https://github.com/owner/repo or owner/repo')
  }

  return new GitHubAPI({ owner, repo, token })
}

/**
 * Get GitHub Pages URL for repository
 */
export function getGitHubPagesUrl(owner: string, repo: string): string {
  // Handle user/organization pages
  if (repo === `${owner}.github.io`) {
    return `https://${owner}.github.io/`
  }

  // Handle project pages
  return `https://${owner}.github.io/${repo}/`
}
