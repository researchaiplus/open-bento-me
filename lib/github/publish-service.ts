/**
 * Publish Service
 *
 * Handles publishing profile data from LocalStorageAdapter to GitHub repository.
 * Manages the complete workflow from export to GitHub commit.
 */

import { GitHubAPI } from './api'
import { LocalStorageAdapter } from '../adapters/localstorage-adapter'
import { ProfileDataAdapter, AdapterBentoItem } from '../adapters'

// Language color mapping (same as in the API route)
const LANGUAGE_COLORS: { [key: string]: string } = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#ffac45',
  Go: '#00ADD8',
  Rust: '#dea584',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  React: '#61dafb',
  'C#': '#178600',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Other: '#ededed',
}

export interface PublishOptions {
  githubToken: string
  owner: string
  repo: string
  branch?: string
  commitMessage?: string
  waitForDeployment?: boolean
}

export interface PublishResult {
  success: boolean
  commitSha?: string
  message: string
  deploymentUrl?: string
  error?: unknown
}

export interface PublishStatus {
  step: 'exporting' | 'uploading' | 'committing' | 'deploying' | 'complete'
  progress: number
  message: string
  details?: string
}

export type PublishStatusCallback = (status: PublishStatus) => void

/**
 * Pre-fetch repository metadata for GitHub and HuggingFace items.
 * Uses the GitHub token for authenticated requests (higher rate limits).
 */
async function preFetchRepositoryMetadata(
  items: AdapterBentoItem[],
  githubToken: string,
  onStatusUpdate?: PublishStatusCallback
): Promise<AdapterBentoItem[]> {
  const githubItems = items.filter(item => item.type === 'github' && item.content?.owner && item.content?.repo);

  if (githubItems.length === 0) {
    return items;
  }

  onStatusUpdate?.({
    step: 'exporting',
    progress: 5,
    message: `Pre-fetching metadata for ${githubItems.length} repositories...`,
  });

  const enrichedItems = [...items];

  for (let i = 0; i < githubItems.length; i++) {
    const item = githubItems[i];
    const owner = item.content.owner;
    const repo = item.content.repo;
    const platform = item.content.platform || 'github';
    const idx = enrichedItems.findIndex(it => it.id === item.id);

    onStatusUpdate?.({
      step: 'exporting',
      progress: 5 + (15 * (i + 1) / githubItems.length),
      message: `Fetching ${owner}/${repo}...`,
    });

    try {
      if (platform === 'huggingface') {
        // Fetch HuggingFace data
        const category = item.content.category || 'model';
        const hfId = `${owner}/${repo}`;
        const hfUrl = category === 'dataset'
          ? `https://huggingface.co/api/datasets/${encodeURIComponent(hfId)}`
          : `https://huggingface.co/api/models/${encodeURIComponent(hfId)}`;

        const hfResponse = await fetch(hfUrl);
        if (hfResponse.ok) {
          const hfData = await hfResponse.json();
          enrichedItems[idx] = {
            ...item,
            content: {
              ...item.content,
              savedDescription: hfData.description || item.content.savedDescription || '',
              downloads: hfData.downloads ?? item.content.downloads,
              likes: hfData.likes ?? item.content.likes,
            }
          };
        }
      } else {
        // Fetch GitHub data using authenticated API
        const githubUrl = `https://api.github.com/repos/${owner}/${repo}`;
        const githubResponse = await fetch(githubUrl, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `token ${githubToken}`,
            'User-Agent': 'ResearchAI-App',
          },
        });

        if (githubResponse.ok) {
          const githubData = await githubResponse.json();
          const language = githubData.language || '';
          enrichedItems[idx] = {
            ...item,
            content: {
              ...item.content,
              savedDescription: githubData.description || item.content.savedDescription || '',
              language: language,
              languageColor: LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Other,
              stars: githubData.stargazers_count ?? item.content.stars,
              topics: githubData.topics || item.content.topics || [],
            }
          };
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch metadata for ${owner}/${repo}:`, error);
      // Keep existing data if fetch fails
    }
  }

  return enrichedItems;
}

export class PublishService {
  private github: GitHubAPI
  private adapter: ProfileDataAdapter

  constructor(adapter: ProfileDataAdapter, githubOptions: {
    owner: string
    repo: string
    token: string
    branch?: string
  }) {
    if (!(adapter instanceof LocalStorageAdapter)) {
      throw new Error('PublishService requires LocalStorageAdapter')
    }

    this.adapter = adapter
    this.github = new GitHubAPI(githubOptions)
  }

  /**
   * Publish profile data to GitHub
   */
  async publish(
    onStatusUpdate?: PublishStatusCallback
  ): Promise<PublishResult> {
    try {
      // Step 1: Export data from adapter
      onStatusUpdate?.({
        step: 'exporting',
        progress: 0,
        message: 'Exporting profile data...',
      })

      // Use exportConfig() as the single source of truth — it reads from correct
      // localStorage keys and returns data in the proper { content, layout } format
      const baseConfig = this.adapter.exportConfig();

      // Step 1.5: Pre-fetch repository metadata using GitHub token
      // This bakes the data into the config so no API calls are needed on the static site
      let enrichedItems = baseConfig.bentoGrid.items;
      if (this.adapter instanceof LocalStorageAdapter) {
        try {
          if (enrichedItems.length > 0) {
            // Get the github token via the public getter
            const githubToken = this.github.getToken();
            // preFetchRepositoryMetadata works with { content: { owner, repo } } format
            // which is exactly what exportConfig() provides
            enrichedItems = await preFetchRepositoryMetadata(
              enrichedItems as unknown as AdapterBentoItem[],
              githubToken,
              onStatusUpdate
            ) as unknown as typeof enrichedItems;
          }
        } catch (error) {
          console.warn('Failed to pre-fetch repository metadata:', error);
          // Keep the un-enriched items from exportConfig
        }
      }

      // Create export config with enriched items
      const enrichedConfig = {
        profile: baseConfig.profile,
        bentoGrid: {
          items: enrichedItems,
        },
        metadata: {
          version: '1.0.1',
          lastModified: new Date().toISOString(),
          enrichedFrom: 'github-api',
        },
      };

      onStatusUpdate?.({
        step: 'exporting',
        progress: 25,
        message: 'Repository metadata pre-fetched',
        details: `${enrichedConfig.bentoGrid.items.length} items ready`,
      })

      // Step 2: Upload to GitHub
      onStatusUpdate?.({
        step: 'uploading',
        progress: 30,
        message: 'Uploading to GitHub...',
      })

      const jsonContent = JSON.stringify(enrichedConfig, null, 2)

      onStatusUpdate?.({
        step: 'uploading',
        progress: 50,
        message: 'Uploading profile-config.json...',
      })

      const fileResult = await this.github.upsertFile(
        'profile-config.json',
        jsonContent,
        'chore: update profile data'
      )

      onStatusUpdate?.({
        step: 'committing',
        progress: 70,
        message: 'Commit created',
        details: `SHA: ${fileResult.commit.sha.substring(0, 7)}`,
      })

      // Step 3: Wait for the NEW deployment triggered by this commit
      const commitSha = fileResult.commit.sha

      onStatusUpdate?.({
        step: 'deploying',
        progress: 75,
        message: 'Waiting for GitHub Pages deployment...',
        details: 'GitHub Actions is building your site (this may take 1-3 minutes)',
      })

      await this.github.waitForDeployment(300000, commitSha, (elapsedMs) => {
        const seconds = Math.floor(elapsedMs / 1000)
        // Scale progress from 75% to 95% over the deployment wait period
        const deployProgress = Math.min(95, 75 + (seconds / 180) * 20)
        onStatusUpdate?.({
          step: 'deploying',
          progress: deployProgress,
          message: 'Waiting for GitHub Pages deployment...',
          details: `Building and deploying... (${seconds}s elapsed)`,
        })
      })

      const deploymentUrl = `https://${this.github['options'].owner}.github.io/${this.github['options'].repo}/`

      onStatusUpdate?.({
        step: 'complete',
        progress: 100,
        message: 'Published successfully!',
        details: `View at ${deploymentUrl}`,
      })

      return {
        success: true,
        commitSha,
        message: 'Profile published successfully',
        deploymentUrl,
      }
    } catch (error) {
      const publishError = error instanceof Error ? error : new Error(String(error))

      onStatusUpdate?.({
        step: 'complete',
        progress: 100,
        message: 'Publish failed',
        details: publishError.message,
      })

      return {
        success: false,
        message: 'Failed to publish profile',
        error: publishError,
      }
    }
  }

  /**
   * Validate GitHub configuration and return repo info including default branch.
   * Returns { valid, error?, defaultBranch? } so callers can auto-detect the branch.
   */
  async validate(): Promise<{ valid: boolean; error?: string; defaultBranch?: string }> {
    try {
      // Validate token and get repo info in one call
      const repoInfo = await this.github.getRepository()

      return {
        valid: true,
        defaultBranch: repoInfo.default_branch || 'main',
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid GitHub token or insufficient permissions',
      }
    }
  }

  /**
   * Get publish history
   */
  async getPublishHistory(limit: number = 10): Promise<Array<{
    sha: string
    message: string
    date: string
    author: string
  }>> {
    try {
      const commits = await this.github.listCommits('profile-config.json', limit)

      return commits.map(commit => ({
        sha: commit.sha.substring(0, 7),
        message: commit.message,
        date: commit.author.date,
        author: commit.author.name,
      }))
    } catch (error) {
      console.error('Error fetching publish history:', error)
      return []
    }
  }
}

/**
 * Create publish service from GitHub URL
 */
export function createPublishService(
  adapter: ProfileDataAdapter,
  githubUrl: string,
  token: string
): PublishService {
  const githubAPI = require('./api')
  const { createGitHubAPIFromUrl } = githubAPI

  const github = createGitHubAPIFromUrl(githubUrl, token)

  return new PublishService(adapter, {
    owner: github['options'].owner,
    repo: github['options'].repo,
    token: token,
  })
}

/**
 * Quick publish function (convenience)
 */
export async function quickPublish(
  adapter: ProfileDataAdapter,
  options: PublishOptions
): Promise<PublishResult> {
  const githubOptions: { owner: string; repo: string; token: string; branch?: string } = {
    owner: options.owner,
    repo: options.repo,
    token: options.githubToken,
    branch: options.branch,
  }
  const service = new PublishService(adapter, githubOptions)
  return service.publish()
}
