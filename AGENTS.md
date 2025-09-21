# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages and `app/api/*` handlers (e.g., `app/news/page.tsx`).
- `components/`: UI and feature modules (`ui/`, `creator/`, `analysis/`, `news/`). Components use PascalCase.
- `lib/`: Shared utilities and hooks (`lib/hooks/*`).
- `convex/`: Convex backend functions and `_generated/` client code.
- `public/`: Static assets; `docs/` and `readme/`: documentation assets.
- `tools/`: Internal scripts (e.g., `content-analysis/`, `fact-checking/`).
- `checkmate-browser-extension/`, `checkmate_wrapper_flutter/`: Related clients; keep changes isolated and versioned.

## Build, Test, and Development Commands
- `npm install`: Install dependencies.
- `npm run dev`: Run Next.js dev server (Turbopack).
- `npx convex dev`: Start Convex dev server (run in parallel when editing `convex/`).
- `npm run build`: Production build.
- `npm run start`: Start production server locally.
- `npm run lint`: Lint codebase using Next/ESLint config.

## Coding Style & Naming Conventions
- **Language**: TypeScript; Node 18+ recommended.
- **Indentation**: 2 spaces; semicolons optional (follow lint rules).
- **Files**: Components `PascalCase.tsx`; utilities `camelCase.ts`; API routes lower-case in `app/api/*`.
- **Exports**: Prefer named exports; collocate component styles; avoid default exports for shared utils.
- **Styling**: Tailwind CSS v4; use utility classes and `clsx`/`cva` for variants.

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Place tests next to sources or in `__tests__/`; name `*.test.ts(x)`.
- Focus on `lib/*` utilities, critical components, and API route logic.

## Commit & Pull Request Guidelines
- **Commits**: Use Conventional Commits (e.g., `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `style:`) as in current history.
- **PRs**: Provide a clear summary, link issues, include screenshots/GIFs for UI changes, list breaking changes, and note any env/config updates. Ensure `npm run lint` and `npm run build` pass.

## Security & Configuration Tips
- Store secrets in `.env.local` (gitignored). Typical keys: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `OPENAI_API_KEY`, `CONVEX_DEPLOYMENT`/`NEXT_PUBLIC_*`.
- Never commit secrets or service tokens; prefer server-side usage in `app/api/*`.
- Verify `.vercelignore` covers non-deployable files when deploying.

