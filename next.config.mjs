/**
 * Next.js Configuration
 *
 * Supports two modes:
 * 1. Development mode (npm run dev): Full Next.js with API routes and server actions
 * 2. GitHub Pages mode (GITHUB_PAGES=true npm run build): Static export for GitHub Pages
 *
 * Usage:
 *   - Local dev:    npm run dev
 *   - Static build: npm run build:gh-pages  (or: GITHUB_PAGES=true npm run build)
 */

let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

// Detect GitHub Pages static export mode
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

// Detect production environment to conditionally remove console in builds
const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    // Remove console.* (except warn/error) in production builds; keep in dev
    removeConsole: isProd ? { exclude: ['error', 'warn'] } : false,
  },

  // --- GitHub Pages static export settings ---
  ...(isGitHubPages && {
    output: 'export',
    trailingSlash: true,
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  }),

  images: {
    // GitHub Pages: disable image optimization (not supported in static export)
    // Dev mode: allow image optimization with configured domains
    ...(isGitHubPages
      ? { unoptimized: true }
      : {
          domains: [
            'images.unsplash.com',
            'api.dicebear.com',
          ].filter(Boolean),
          dangerouslyAllowSVG: true,
          contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        }
    ),
  },

  // Server-side features only available in dev mode (not in static export)
  ...(!isGitHubPages && {
    experimental: {
      serverActions: {
        bodySizeLimit: '10mb'
      },
      webpackBuildWorker: true,
      parallelServerBuildTraces: true,
      parallelServerCompiles: true,
    },
  }),

  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (key === 'experimental' && typeof nextConfig[key] === 'object' && typeof userConfig[key] === 'object') {
      nextConfig[key] = { ...nextConfig[key], ...userConfig[key] };
    } else if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key]) &&
      nextConfig[key] !== null &&
      typeof userConfig[key] === 'object' &&
      !Array.isArray(userConfig[key]) &&
      userConfig[key] !== null
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      };
    } else {
      nextConfig[key] = userConfig[key];
    }
  }
}

export default nextConfig
