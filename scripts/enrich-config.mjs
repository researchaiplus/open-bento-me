/**
 * enrich-config.mjs
 *
 * Purpose:
 *   Enrich profile-config.json with live metadata from external sources.
 *   This script runs during the GitHub Actions build step so the static site ships
 *   with up-to-date data that cannot be fetched at runtime (no API routes on
 *   GitHub Pages).
 *
 * Key Features:
 *   - Fetches GitHub repo metadata (description, stars, language, topics) using
 *     the GITHUB_TOKEN available in Actions (5 000 req/hr).
 *   - Fetches HuggingFace model/dataset metadata (description, downloads, likes)
 *     via the public HF API (no CORS issues on the server side).
 *   - Fetches Link Card metadata (OG image, page title) by scraping HTML with
 *     Cheerio – mirrors the logic in /api/fetch-page-image and /api/fetch-page-title.
 *   - Gracefully skips items whose fetch fails (keeps existing data).
 *   - Language → colour mapping mirrors the frontend palette.
 *
 * Usage:
 *   node scripts/enrich-config.mjs [--config <path>]
 *
 *   Defaults to public/profile-config.json when --config is omitted.
 *
 * Environment Variables:
 *   GITHUB_TOKEN  – (optional) GitHub personal access token or the built-in
 *                   Actions token. Without it, GitHub API is limited to 60 req/hr.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { createRequire } from 'module';

// Use createRequire so we can import the CJS cheerio package from an ESM script
const require = createRequire(import.meta.url);
const cheerio = require('cheerio');

// ---------------------------------------------------------------------------
// Language colour mapping (same as in the frontend)
// ---------------------------------------------------------------------------
const LANGUAGE_COLORS = {
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
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch JSON with optional auth headers. Returns null on failure.
 */
async function fetchJSON(url, headers = {}) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`  ⚠ ${url} → ${res.status} ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`  ⚠ ${url} → ${err.message}`);
    return null;
  }
}

/**
 * Fetch metadata for a GitHub repository.
 */
async function enrichGitHub(owner, repo, token) {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'OpenBento-Enrich',
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const data = await fetchJSON(url, headers);
  if (!data) return null;

  const language = data.language || '';
  return {
    savedDescription: data.description || '',
    language,
    languageColor: LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Other,
    stars: typeof data.stargazers_count === 'number' ? data.stargazers_count : 0,
    topics: Array.isArray(data.topics) ? data.topics : [],
  };
}

/**
 * Fetch metadata for a HuggingFace model or dataset.
 */
async function enrichHuggingFace(owner, repo, category) {
  const id = `${owner}/${repo}`;
  const type = category === 'dataset' ? 'datasets' : 'models';
  // HuggingFace API expects the literal owner/repo path (no URL-encoding of '/')
  const url = `https://huggingface.co/api/${type}/${id}`;

  const data = await fetchJSON(url, { Accept: 'application/json' });
  if (!data) return null;

  return {
    savedDescription: data.description || data.cardData?.modelId || '',
    downloads: typeof data.downloads === 'number' ? data.downloads : undefined,
    likes: typeof data.likes === 'number' ? data.likes : undefined,
  };
}

/**
 * Fetch OG image and title for a link card by scraping the page HTML.
 * Mirrors the logic in /api/fetch-page-image and /api/fetch-page-title.
 */
async function enrichLinkCard(url) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10s timeout
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) {
      console.warn(`  ⚠ ${url} → ${res.status} ${res.statusText}`);
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // --- Extract title (same priority as /api/fetch-page-title) ---
    const title =
      $('title').text().trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      '';

    // --- Extract image (same priority as /api/fetch-page-image) ---
    let image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      null;

    // Fallback: first large <img>
    if (!image) {
      $('img').each((_, el) => {
        const w = parseInt($(el).attr('width') || '0', 10);
        const h = parseInt($(el).attr('height') || '0', 10);
        if (w > 300 && h > 200) {
          image = $(el).attr('src');
          return false; // break
        }
      });
    }

    // Make relative image URLs absolute
    if (image) {
      try {
        image = new URL(image, url).href;
      } catch {
        image = null;
      }
    }

    return { savedTitle: title || null, savedImage: image || null };
  } catch (err) {
    console.warn(`  ⚠ ${url} → ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // Determine config path from CLI args or default
  const args = process.argv.slice(2);
  const configArgIdx = args.indexOf('--config');
  const configPath = configArgIdx !== -1 && args[configArgIdx + 1]
    ? resolve(args[configArgIdx + 1])
    : resolve('public/profile-config.json');

  console.log(`📄 Reading config from: ${configPath}`);

  let config;
  try {
    const raw = readFileSync(configPath, 'utf-8');
    config = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Failed to read/parse config: ${err.message}`);
    process.exit(1);
  }

  const items = config?.bentoGrid?.items;
  if (!Array.isArray(items) || items.length === 0) {
    console.log('ℹ No bento items found – nothing to enrich.');
    process.exit(0);
  }

  const githubToken = process.env.GITHUB_TOKEN || '';
  if (githubToken) {
    console.log('🔑 Using GITHUB_TOKEN for authenticated GitHub API requests.');
  } else {
    console.log('⚠ No GITHUB_TOKEN found – GitHub API limited to 60 req/hr.');
  }

  let enrichedCount = 0;

  for (const item of items) {
    const content = item.content;

    // -----------------------------------------------------------------
    // GitHub / HuggingFace repo cards
    // -----------------------------------------------------------------
    if (item.type === 'github') {
      if (!content?.owner || !content?.repo) continue;

      const { owner, repo, platform, category } = content;
      const label = `${owner}/${repo}`;

      if (platform === 'huggingface') {
        console.log(`🤗 Enriching HuggingFace ${category || 'model'}: ${label}`);
        const meta = await enrichHuggingFace(owner, repo, category);
        if (meta) {
          item.content = {
            ...content,
            savedDescription: meta.savedDescription || content.savedDescription || '',
            ...(meta.downloads !== undefined ? { downloads: meta.downloads } : {}),
            ...(meta.likes !== undefined ? { likes: meta.likes } : {}),
          };
          enrichedCount++;
          console.log(`  ✅ downloads=${meta.downloads}, likes=${meta.likes}`);
        }
      } else {
        console.log(`🐙 Enriching GitHub repo: ${label}`);
        const meta = await enrichGitHub(owner, repo, githubToken);
        if (meta) {
          item.content = {
            ...content,
            savedDescription: meta.savedDescription || content.savedDescription || '',
            language: meta.language || content.language || '',
            languageColor: meta.languageColor || content.languageColor || '#ededed',
            stars: meta.stars ?? content.stars ?? 0,
            topics: meta.topics.length > 0 ? meta.topics : (content.topics || []),
          };
          enrichedCount++;
          console.log(`  ✅ stars=${meta.stars}, lang=${meta.language}`);
        }
      }
      continue;
    }

    // -----------------------------------------------------------------
    // Link cards – fetch OG image and title if missing
    // -----------------------------------------------------------------
    if (item.type === 'link') {
      const url = content?.url;
      if (!url) continue;

      const needsTitle = !content.savedTitle;
      const needsImage = !content.savedImage;

      if (!needsTitle && !needsImage) {
        // Already has both title and image – skip
        continue;
      }

      console.log(`🔗 Enriching link card: ${url}`);
      const meta = await enrichLinkCard(url);
      if (meta) {
        const updates = {};
        if (needsTitle && meta.savedTitle) {
          updates.savedTitle = meta.savedTitle;
        }
        if (needsImage && meta.savedImage) {
          updates.savedImage = meta.savedImage;
        }

        if (Object.keys(updates).length > 0) {
          item.content = { ...content, ...updates };
          enrichedCount++;
          console.log(
            `  ✅ title=${updates.savedTitle ? 'yes' : 'skip'}, image=${updates.savedImage ? 'yes' : 'skip'}`,
          );
        } else {
          console.log(`  ⚠ No new metadata extracted`);
        }
      }
      continue;
    }
  }

  // Update metadata
  config.metadata = {
    ...config.metadata,
    version: '1.0.1',
    lastModified: new Date().toISOString(),
    enrichedFrom: 'github-actions',
  };

  // Write back
  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`\n✨ Done! Enriched ${enrichedCount} item(s). Config written to ${configPath}`);
}

main().catch((err) => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});
