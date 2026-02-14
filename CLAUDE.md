# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

## Project Overview

ResearchNexus Bento Sidebar - A researcher profile showcase platform with customizable bento-grid layout. Users can display their GitHub repositories, links, images, and text in an elegant card-based interface.

## Tech Stack

- **Framework**: Next.js 15.2.8 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 18 + Tailwind CSS + Radix UI (shadcn/ui pattern - copy-and-own)
- **Data Storage**: localStorage only (open-source version)
- **Key Libraries**:
  - `react-grid-layout` - Bento grid drag & drop
  - `@tiptap/react` - Rich text editor
  - `framer-motion` - Animations
  - `lucide-react` - Icons
  - `puppeteer` - Screenshot capture

## Directory Structure

```
├── app/                          # Next.js App Router pages
│   ├── actions/                  # Server actions (link-metadata.ts)
│   ├── api/                      # API routes
│   │   ├── fetch-page-image/     # Screenshot functionality
│   │   ├── fetch-page-title/     # Page metadata
│   │   ├── github/repos/         # GitHub integration
│   │   └── hf/                   # HuggingFace integration
│   ├── profile/                  # Profile page routes
│   ├── preview/                  # Preview mode
│   └── manifest.ts               # PWA manifest
├── components/                   # React components
│   ├── ui/                       # Base UI (25+ shadcn/ui components)
│   ├── features/                 # Feature-specific components
│   │   ├── bento/                # Bento grid (BentoGrid, BentoItem, cards)
│   │   ├── import/               # Import modals (GitHub)
│   │   ├── profile/              # Profile components
│   │   └── toolbar/              # Edit toolbars
│   └── common/                   # Shared components (editable-image, etc.)
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities and services
│   ├── adapters/                 # Data persistence adapters
│   ├── api/                      # API services (bentoService, openrouter)
│   ├── github/                   # GitHub API integration
│   └── utils/                    # Utility functions (cn, etc.)
├── types/                        # TypeScript definitions
└── context/                      # React context providers
```

## Code Conventions

### File Naming
- Components: PascalCase (e.g., `UserProfile.tsx`, `ProfileCard.tsx`)
- Utilities: camelCase (e.g., `formatDate.ts`, `getAvatar.ts`)
- Types: PascalCase with `.ts` (e.g., `types/user.ts`)

### Component Structure
```
components/
├── ui/           # Base UI components (shadcn/ui pattern - copy into project)
├── features/     # Feature-specific components (bento, profile, auth)
├── common/       # Shared/common components
└── theme-provider.tsx
```

## Data Access Pattern (Adapter Pattern)

This project uses an **Adapter Pattern** to abstract data persistence:

### Adapter Interface (`lib/adapters/index.ts`)
```typescript
export interface ProfileDataAdapter {
  getProfile(): Promise<ProfileData | null>
  updateProfile(data: Partial<ProfileUpdateData>): Promise<void>
  getBentoItems(): Promise<BentoItem[]>
  addBentoItem(item: Omit<AdapterBentoItem, 'id'>): Promise<AdapterBentoItem>
  updateBentoItem(id: string, updates: Partial<AdapterBentoItem>): Promise<void>
  deleteBentoItem(id: string): Promise<void>
  exportConfig(): ProfileConfig
  importConfig(config: ProfileConfig): Promise<void>
  getAdapterName(): string
  isAvailable(): Promise<boolean>
}
```

### Adapter Implementations
| Adapter | File | Purpose |
|---------|------|---------|
| **LocalStorageAdapter** | `lib/adapters/localstorage-adapter.ts` | Client-side localStorage (open-source version) |
| **AdapterProvider** | `lib/adapters/adapter-provider.ts` | Selects adapter - always returns LocalStorageAdapter |

### Storage Keys (localStorage)
- `profile:profile` - User profile data (includes: name, bio, avatar, title, institution, location, website, social_links, research_interests, eventTagIds)
- `profile:bento-items` - Bento grid items
- `profile:metadata` - Metadata (version, lastModified)

## State Management

### Custom Hooks Overview

| Hook | File | Purpose |
|------|------|---------|
| `useCurrentUser` | `hooks/use-current-user.ts` | Global singleton user with 5-min cache, request deduplication |
| `useBentoGrid` | `hooks/useBentoGrid.ts` | Complex grid state with queue operations, collision detection |
| `useConfigurableProfile` | `hooks/use-configurable-profile.ts` | Profile data management |
| `useAutoSave` | `hooks/use-auto-save.ts` | Generic debounced auto-save |
| `useToast` | `hooks/use-toast.ts` | Toast notification system |
| `useUser` | `hooks/use-user.ts` | User fetching with in-memory cache |

### React Context Providers
| Context | File | Purpose |
|---------|------|---------|
| **UserContext** | `context/user-context.tsx` | Avatar updates, user data. Uses LocalStorageAdapter (no API calls) |

### State Patterns Used
- **Reducer pattern**: useToast, UserContext (complex transitions)
- **Singleton/Memoized hooks**: useCurrentUser (request deduplication)
- **Event-based updates**: CustomEvent broadcasting (`profile-updated`, `avatar-updated`)
- **Request deduplication**: useCurrentUser, useUser
- **Optimistic updates**: useBentoGrid (immediate UI feedback)

**Note**: No Zustand - uses React built-ins only (useState, useReducer, useContext, useRef)

## UI Components & Design System

### Base UI Components (25+ shadcn/ui style)

**Form Components**: button, input, textarea, select, switch, label, progress

**Navigation**: tabs, dropdown-menu

**Overlays**: dialog, sheet, popover, tooltip

**Display**: card, avatar, badge, skeleton, separator, scroll-area

**Feedback**: toast, sonner, toaster

### Feature Components (`components/features/`)

**Bento Grid**:
- `BentoGrid.tsx` - Main grid using `react-grid-layout` with drag-and-drop
- `BentoItem.tsx` - Item renderer delegating to type-specific cards
- Card types: `link-card`, `text-card`, `image-card`, `repository-card`, `people-card`, `needboard-card`, `section-title-card`
  - **Section Title Card**: Can be empty (shows placeholder "Add a title..."), always renders even when text is empty

**Profile**:
- `profile.tsx` - Main profile with inline editing (handles: name, bio, title, institution, location, website, social links, research interests, event tags)
- `profile-avatar.tsx` - Avatar display and upload (persists to LocalStorageAdapter)
- `event-tags-selector.tsx` - Event to Go selector (persists selections immediately)
- `social-links-manager.tsx`, `share-modal.tsx`

### Design Patterns
- **Radix UI Primitives**: All interactive components for accessibility (WCAG compliance)
- **CVA (Class Variance Authority)**: Button, Badge variants
- **cn() Utility**: `lib/utils.ts` - `clsx` + `twMerge` for class composition
- **React.forwardRef**: Most components for ref forwarding
- **Slot Pattern**: `@radix-ui/react-slot` for polymorphic components

### Animation
- **Framer Motion**: Complex animations (modal transitions, edit/preview mode)
- **tailwindcss-animate**: Built-in animations (fade, zoom, slide)
- **CSS Variables**: Light/dark mode with HSL values in `app/globals.css`

### Icons
- **Lucide React** (v0.454.0): Primary icon library
- **Custom SVGs**: Social icons (GitHub, LinkedIn, Twitter, Google Scholar, etc.)

## API Routes

| Endpoint | File | Purpose |
|----------|------|---------|
| `/api/github/repos` | `app/api/github/repos/route.ts` | GitHub API proxy |
| `/api/hf/models/[id]` | `app/api/hf/models/[id]/route.ts` | HuggingFace models (Python backend) |
| `/api/hf/datasets/[id]` | `app/api/hf/datasets/[id]/route.ts` | HuggingFace datasets |
| `/api/fetch-page-image` | `app/api/fetch-page-image/route.ts` | OG image extraction (Cheerio) |
| `/api/fetch-page-title` | `app/api/fetch-page-title/route.ts` | Page title extraction |

## Service Layer (`lib/`)

| Service | File | Purpose |
|---------|------|---------|
| **BentoService** | `lib/api/bentoService.ts` | Bento box CRUD, GitHub/HuggingFace integration |
| **OpenRouter** | `lib/api/openrouter.ts` | AI bio generation (Claude 3.5 Sonnet) |
| **GitHub API** | `lib/github/api.ts` | REST API for repos, files, commits |
| **PublishService** | `lib/github/publish-service.ts` | GitHub Pages deployment |

## Key Files

| File | Purpose |
|------|---------|
| `app/profile/page.tsx` | Main profile page |
| `components/features/bento/BentoGrid.tsx` | Bento grid layout |
| `components/features/profile/profile.tsx` | Profile display/editing |
| `hooks/useBentoGrid.ts` | Grid state management |
| `hooks/use-current-user.ts` | User state |
| `lib/adapters/adapter-provider.ts` | Adapter selection |
| `lib/adapters/localstorage-adapter.ts` | LocalStorage persistence |
| `context/user-context.tsx` | User avatar/context |

## Common Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run ESLint
```

## Important Notes

1. **Data Storage**: Profile data stored in localStorage only (no database)
2. **Adapter Provider**: Always returns `LocalStorageAdapter` for client-side operations
3. **Bento Grid**: Dual responsive layout (lg: 4-column, sm: 2-column)
4. **Export/Import**: JSON config for GitHub Pages deployment (`profile-config.json`)
5. **Custom Events**: Used for cross-component updates (`profile-updated`, `avatar-updated`)

## Data Persistence & Profile Fields

### Profile Data Fields (`ProfileData` / `ProfileUpdateData`)
All profile fields are persisted to `localStorage` via `LocalStorageAdapter`:

- **`name`** (string | null) - User display name (distinct from `title`/job title)
- **`bio`** (string | null) - User biography
- **`avatar`** (string | null) - Base64 data URL or image URL
- **`title`** (string | null) - Job title/position (e.g., "Professor", "PhD Student")
- **`institution`** (string | null) - Affiliation/institution
- **`location`** (string | null) - Geographic location
- **`website`** (string | null) - Personal website URL
- **`social_links`** (Record<string, string>) - Social media links (GitHub, Twitter, LinkedIn, etc.)
- **`research_interests`** (string[]) - Research tags/interests
- **`eventTagIds`** (string[]) - Selected "Event to Go" event IDs

### Persistence Behavior

**Immediate Save**:
- Event tags (`eventTagIds`) - Saved immediately when user selects/deselects events via `handleEventsChange`
- Avatar upload - Saved immediately to adapter profile

**Debounced Save** (via `saveProfileDraft`):
- Name, bio, title, institution, location, website, social links, research interests
- Uses state hash comparison to avoid unnecessary saves
- Auto-saves on blur/field change

**Critical Fixes Applied**:
1. **Name field**: Added `name` to `ProfileUpdateData`, now persists separately from `title`
2. **Avatar persistence**: `UserProvider` wraps app, uses `LocalStorageAdapter` (no API calls)
3. **Event tags**: `eventTagIds` now saved immediately and included in `saveProfileDraft`
4. **Section Title**: Empty text allowed (renders placeholder), always saves to adapter

## Common Bug Patterns & Fixes

### Empty State Handling
- **Section Title**: Never check `if (text)` before rendering - always render `SectionTitleCard` (shows placeholder when empty)
- **Profile fields**: Use `toNullable()` helper to convert empty strings to `null` for storage

### Data Persistence
- **Always save to adapter**: Don't rely on component state alone - use `LocalStorageAdapter.updateProfile()` or `updateBentoItem()`
- **Check adapter methods**: Ensure `updateProfile` uses `data.field ?? existing?.field ?? defaultValue` pattern (not just `existing?.field`)
- **State hash**: Include all relevant fields in `getCurrentStateHash()` to detect changes

### Context Providers
- **UserProvider**: Must wrap app in `AppProviders` - otherwise `useUser()` returns default no-op functions
- **Open-source version**: `UserContext.initializeUser` uses `LocalStorageAdapter` directly (no `/api/users/me` calls)

### Type Safety
- **ProfileUpdateData**: Must include all fields that can be updated (e.g., `name`, `eventTagIds`)
- **CurrentUser.profile**: Should mirror `ProfileData` structure for consistency
