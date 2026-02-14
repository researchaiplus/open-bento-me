# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes, layouts, and server actions.
- `components/`: Reusable UI components (PascalCase files, e.g., `UserCard.tsx`).
- `lib/`: Utilities, API clients, helpers (camelCase files).
- `hooks/`: React hooks (`useXyz.ts`).
- `context/`: React context providers.
- `types/`: Shared TypeScript types.
- `public/`: Static assets.

## Build, Test, and Development Commands
- `pnpm install`: Install dependencies.
- `pnpm dev`: Start Next.js dev server.
- `pnpm build`: Build the project (`next build`).
- `pnpm start`: Run the production server.
- `pnpm lint`: Lint using Next.js ESLint config.

Environment: copy `.env.example` to `.env`. Profile data stored in localStorage.

## Coding Style & Naming Conventions
- TypeScript, strict mode enabled. 2‑space indentation.
- Components: PascalCase (`UserMenu.tsx`). Hooks: `use*` prefix. Utilities: camelCase.
- Route folders use kebab-case (e.g., `app/user-settings`).
- Prefer functional components and server components where suitable.
- Lint before pushing: `pnpm lint`.
- TailwindCSS is used; prefer utility-first styles and `clsx`/`tailwind-merge` patterns in `lib/` when combining classes.

## Testing Guidelines
- No project-wide test framework configured yet. Validate changes by:
  - Running locally (`pnpm dev`) and checking affected routes/components.
  - Linting and type-checking (TypeScript errors fail builds).
- If adding tests, colocate under `__tests__/` and name `*.test.ts(x)`.

## Commit & Pull Request Guidelines
- Commits: present tense, concise, scoped changes (e.g., `fix sidebar overflow on mobile`).
- PRs: include a clear description, linked issues, and screenshots/GIFs for UI changes.
- Ensure `pnpm lint` and `pnpm build` pass.

## Security & Configuration Tips
- Never commit secrets; use `.env` and keep `.env.example` updated.
- Profile data stored in localStorage (no database required).
