/**
 * Publish Button Component
 *
 * UI component for publishing profile data to GitHub Pages.
 * Renders a trigger element (customizable via `children` prop) that opens a dialog
 * for entering GitHub token and repository information. Supports auto-loading
 * previously saved credentials from localStorage.
 *
 * Key Features:
 * - Accepts custom trigger element via `children` prop (falls back to default button)
 * - Auto-loads cached GitHub token and repo URL from localStorage
 * - Shows real-time progress during publish via PublishService callbacks
 * - Persists credentials on successful publish for next time
 *
 * Usage:
 *   <PublishButton adapter={adapter}>
 *     <button>Publish</button>
 *   </PublishButton>
 */

'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, XCircle, Upload, Loader2, ExternalLink } from 'lucide-react'
import { PublishService, PublishStatus } from '@/lib/github/publish-service'
import { ProfileDataAdapter } from '@/lib/adapters'
import { LocalStorageAdapter } from '@/lib/adapters/localstorage-adapter'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { prefixStorageKey } from '@/lib/utils/get-site-prefix'

interface PublishButtonProps {
  adapter: ProfileDataAdapter | null
  className?: string
  /** Custom trigger element; if not provided, renders a default "Publish to GitHub" button */
  children?: ReactNode
}

export function PublishButton({ adapter, className, children }: PublishButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [status, setStatus] = useState<PublishStatus | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string; deploymentUrl?: string } | null>(null)
  const [githubToken, setGithubToken] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('main') // Default branch for Template repos
  const { toast } = useToast()

  // Auto-load cached GitHub token, repo URL, and branch from localStorage on mount
  useEffect(() => {
    try {
      const cachedToken = localStorage.getItem(prefixStorageKey('github:token:b64'))
      const cachedRepo = localStorage.getItem(prefixStorageKey('github:repo'))
      const cachedBranch = localStorage.getItem(prefixStorageKey('github:branch'))
      if (cachedToken) {
        setGithubToken(atob(cachedToken))
      }
      if (cachedRepo) {
        setRepoUrl(cachedRepo)
      }
      if (cachedBranch) {
        setBranch(cachedBranch)
      }
    } catch {
      // Ignore errors from localStorage access or base64 decoding
    }
  }, [])

  const handlePublish = async () => {
    if (!adapter || !(adapter instanceof LocalStorageAdapter)) {
      toast({
        title: 'Error',
        description: 'LocalStorage adapter required for publishing',
        variant: 'destructive',
      })
      return
    }

    if (!githubToken || !repoUrl) {
      toast({
        title: 'Missing Information',
        description: 'Please provide GitHub token and repository URL',
        variant: 'destructive',
      })
      return
    }

    setIsPublishing(true)
    setResult(null)
    setStatus({
      step: 'exporting',
      progress: 0,
      message: 'Starting publish...',
    })

    try {
      // Parse owner and repo from URL
      let owner = ''
      let repo = ''

      try {
        const url = new URL(repoUrl)
        const pathParts = url.pathname.split('/').filter(Boolean)
        if (pathParts.length >= 2) {
          owner = pathParts[0]
          repo = pathParts[1]
        }
      } catch {
        // Try parsing as owner/repo string
        const parts = repoUrl.split('/')
        if (parts.length === 2) {
          owner = parts[0]
          repo = parts[1]
        }
      }

      if (!owner || !repo) {
        throw new Error('Invalid repository URL. Use format: owner/repo or https://github.com/owner/repo')
      }

      const publishService = new PublishService(adapter, {
        owner,
        repo,
        token: githubToken,
        branch: branch || undefined, // Use the user-specified branch
      })

      // Validate configuration first (also returns default branch info)
      const validation = await publishService.validate()
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid GitHub configuration')
      }

      // Publish
      const publishResult = await publishService.publish((publishStatus) => {
        setStatus(publishStatus)
      })

      if (publishResult.success) {
        setResult({
          success: true,
          message: publishResult.message || 'Published successfully!',
          deploymentUrl: publishResult.deploymentUrl,
        })

        toast({
          title: 'Published Successfully',
          description: `Your profile is live at ${publishResult.deploymentUrl}`,
        })

        // Store token, repo, and branch for future use (prefixed per-site)
        localStorage.setItem(prefixStorageKey('github:token:b64'), btoa(githubToken))
        localStorage.setItem(prefixStorageKey('github:repo'), `${owner}/${repo}`)
        localStorage.setItem(prefixStorageKey('github:branch'), branch)

        // Update localStorage metadata to match the published config timestamp.
        // This prevents stale-data re-seeding on next edit mode entry,
        // since seedLocalStorageFromStaticConfig compares these timestamps.
        try {
          const lsAdapter = adapter as LocalStorageAdapter
          await lsAdapter.updateMetadata({
            version: '1.0.1',
            lastModified: new Date().toISOString(),
          })
        } catch {
          // Non-critical: metadata update failure won't affect publishing
        }

        setIsPublishing(false)
        // Dialog stays open so user can see the result and click "View your profile"
      } else {
        throw publishResult.error || new Error(publishResult.message)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      setResult({
        success: false,
        message: errorMessage,
      })

      toast({
        title: 'Publish Failed',
        description: errorMessage,
        variant: 'destructive',
      })

      setIsPublishing(false)
    }
  }

  const getStatusIcon = () => {
    if (!status) return null

    if (status.step === 'complete' && result?.success) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    } else if (status.step === 'complete' && !result?.success) {
      return <XCircle className="h-5 w-5 text-red-500" />
    }

    return <Loader2 className="h-5 w-5 animate-spin" />
  }

  const getProgressValue = () => {
    return status?.progress || 0
  }

  // Reset status and result when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setStatus(null)
      setResult(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className={className} variant="default">
            <Upload className="mr-2 h-4 w-4" />
            Publish to GitHub
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish Profile to GitHub Pages</DialogTitle>
          <DialogDescription>
            Export your profile data and publish it to GitHub Pages
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="github-token">
              GitHub Personal Access Token
              <Badge variant="outline" className="ml-2 text-xs">
                Required
              </Badge>
            </Label>
            <Input
              id="github-token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              disabled={isPublishing}
            />
            <p className="text-sm text-muted-foreground">
              Create a token at {' '}
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                github.com/settings/tokens
              </a>
              {' '} with 'repo' scope
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="repo-url">
              Repository
              <Badge variant="outline" className="ml-2 text-xs">
                Required
              </Badge>
            </Label>
            <Input
              id="repo-url"
              placeholder="username/username.github.io"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={isPublishing}
            />
            <p className="text-sm text-muted-foreground">
              Format: https://github.com/owner/repo
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="branch">
              Branch
            </Label>
            <Input
              id="branch"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={isPublishing}
            />
            <p className="text-sm text-muted-foreground">
              The branch to commit profile-config.json to (must match deploy.yml trigger)
            </p>
          </div>

          {status && (
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-sm">{status.message}</span>
              </div>
              <Progress value={getProgressValue()} className="h-2" />
              {status.details && (
                <p className="text-xs text-muted-foreground">{status.details}</p>
              )}
            </div>
          )}

          {result && (
            <div className="grid gap-2">
              {result.success ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {result.message}
                    </span>
                  </div>
                  {result.deploymentUrl && (
                    <a
                      href={result.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 text-sm text-green-700 underline hover:text-green-900"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View your profile
                    </a>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">{result.message}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {result?.success ? (
            // After successful publish: show Close button (no auto-close)
            <Button type="button" onClick={() => setOpen(false)}>
              Close
            </Button>
          ) : (
            // Before or during publish: show Cancel + Publish buttons
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing || !githubToken || !repoUrl}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Publish
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
