@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FieldNotes AI is a personal journal/blog website built with Next.js 16 (App Router), React 19, and Contentful as a headless CMS. It was originally scaffolded with v0.app. The site catalogs field notes (journal entries) and tools used in AI development. Deployed on Vercel. All work happens directly on `main`.

## Commands

```bash
npm install      # Install dependencies (npm preferred)
npm run dev      # Start dev server
npm run build    # Production build — run after every checkpoint
npm start        # Start production server
npm run lint     # ESLint
```

There are no tests configured in this project.

## Environment Variables

- `CONTENTFUL_SPACE_ID` — Contentful workspace ID
- `CONTENTFUL_ACCESS_TOKEN` — Contentful delivery API token
- `CONTENTFUL_ENVIRONMENT` — Contentful environment (defaults to 'master')
- `NEXT_PUBLIC_SITE_URL` — Site URL for sitemap generation (defaults to https://www.fieldnotes-ai.com)

When Contentful env vars are missing, the app serves hardcoded default/demo content defined in `lib/contentful.ts`.

## Architecture

### Data Flow

All pages are **async server components** using ISR with 60-second revalidation. Data is fetched from Contentful REST API (via `contentful` JS SDK — no GraphQL) through `lib/contentful.ts`, which exports: `getAllFieldNotes(options?)`, `getTotalFieldNotesCount()`, `getFeaturedFieldNote()`, `getFieldNoteBySlug()`, `getAllFieldNoteSlugs()`, `getAllTools()`, `getActiveTools()`, and `getGlobalSettings()`. `getAllFieldNotes` accepts `{ limit, skip }` for server-side pagination (10 per page on `/notes`). Parallel fetching with `Promise.all()` is used on pages that need multiple data sources. Include depth is 2 for linked entries.

### Contentful Content Types (Space: 7nlepvg580vx, Environment: master)

- **globalSettings** — site name, domain, logo (Asset), primaryNavigation, socialLinks, copyright, defaultSeoMetadata
- **fieldNote** — journal entries with entryNumber, slug, entryType (Learning/Building/Testing/Observing), body (RichText), publishedDate, readingTimeMinutes, relatedTools, seo, featured, sessionCost, totalTokens, modelUsed
- **tool** — technology catalog with name, slug, description, category (AI Model/CMS/Dev Tool/UI Builder/AI Framework/Recording/Infrastructure/Other), vendor, url, status (Active/Testing/Retired), sortOrder, simpleIconSlug, notes
- **navigationItem** — label, url, openInNewTab, isExternal
- **socialLink** — platform (X/LinkedIn/GitHub/YouTube), url, handle
- **seo** — ogTitle, ogDescription, ogImage, ogType (Article/Website/Profile), robots flags, sitemap boolean

### Type System

`lib/types.ts` defines two layers: **Skeleton types** (`I*Skeleton`) for the Contentful SDK and **Parsed types** (`Parsed*`) used by components. All Contentful responses go through parse functions in `lib/contentful.ts` that convert SDK entries to the simpler Parsed interfaces. Always use `Parsed*` types in components.

### Key Files

- `lib/contentful.ts` — Contentful client, all data-fetching functions, parse functions, fallback defaults
- `lib/types.ts` — TypeScript interfaces for Contentful skeleton and parsed types
- `lib/format.ts` — `formatDate()`, `formatEntryNumber()`, `estimateWordCount()`, `getTagClass()`
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `components/RichText.tsx` — Contentful rich text document renderer
- `app/globals.css` — Design system with CSS custom properties and animations
- `styles/globals.css` — shadcn/ui base styles (Tailwind + tw-animate-css)
- `hooks/use-mobile.ts` — Responsive breakpoint hook
- `hooks/use-toast.ts` — Toast notification hook

### Routes

- `/` — Home page (featured notes, tools preview, about section)
- `/notes` — All notes listing with server-side pagination (`?page=N`)
- `/notes/[slug]` — Individual note detail (uses `generateStaticParams`, includes JSON-LD schema)
- `/tools` — Tools directory (currently redirects to `/`)
- `/og` — Dynamic OG image generation (Edge Runtime, `ImageResponse` at 1200×630). Query params: `title`, `dek`, `entryNumber`, `entryType`, `date`. Fonts loaded from jsdelivr CDN.
- `app/sitemap.ts` — Dynamic XML sitemap
- `app/robots.ts` — Robots.txt generation

### Styling

Tailwind CSS 4 + CSS custom properties for theming. Two CSS entry points: `app/globals.css` (design system with `--bg`, `--ink`, `--accent`, `--border` tokens) and `styles/globals.css` (shadcn/ui base). Fonts loaded via CSS variables: `--font-playfair` (Playfair Display), `--font-ibm-plex-sans` (IBM Plex Sans), `--font-ibm-plex-mono` (IBM Plex Mono). shadcn/ui components live in `components/ui/` configured via `components.json` (new-york style, neutral base color). Regular CSS classes — **no styled-jsx** (was removed to fix Vercel build issues). Vercel Analytics in root layout.

**Dark mode**: Implemented manually via `.dark` class on `<html>`. A blocking `<script>` in `app/layout.tsx` reads `localStorage('theme')` or `prefers-color-scheme` on load — no theme library. `ThemeToggle` component manages toggling. All dark tokens are in the `.dark {}` block in `app/globals.css`.

**CSS naming**: Two style generations coexist in `globals.css`. Older styles use `.header-*`, `.tag-*`, `.note-*` prefixes. Newer styles (from mockup redesign) use short prefixes: `.nav`, `.art-*`, `.lbl`, `.col`, `.sec-*`, `.tc-*`. When modifying styles, match the naming convention of the section you're editing.

### Path Alias

`@/*` maps to the project root (configured in tsconfig.json).

### Client vs Server Components

Only a few components use `"use client"`: `Header` (active nav via `usePathname`), `FilterBar` (category toggle state), `CodeBlock` (copy button), `ThemeToggle`, `ToolsContent` (filter state). Everything else is server-rendered.

### Build Notes

- Optimized images with `remotePatterns` for `images.ctfassets.net` (Contentful), AVIF/WebP formats enabled
- Tool icons use Simple Icons CDN (`cdn.simpleicons.org`) via the `simpleIconSlug` field — these use raw `<img>` tags (exception to the next/image rule) since they're external SVGs

## Conventions

- Never use `any` type — use `unknown` and narrow
- Never use `// @ts-ignore` — fix the underlying issue
- All data fetching in server components — no `useEffect` for data
- Client components only for: active nav state, filter toggles, copy button on code blocks
- `<Image>` from next/image for all images — no raw `<img>` except Simple Icons (external CDN)
- Tailwind utility classes for layout/spacing — CSS custom properties for design tokens (colors, fonts)
- All canonical URLs must use `https://www.fieldnotes-ai.com` (with www)

## Security Rules

### MCP Config Files

- `.claude/` is in `.gitignore` and must stay there. Never remove it.
- MCP config files (`.claude/mcp.json`) contain API tokens and must never be committed.
- Store MCP configs at `~/.claude/` (home directory level) not inside the project folder.

### Before Making Repo Public

Always run this to check for exposed secrets in full git history:

```bash
git log --all -p | grep -E "CFPAT|CTFL|sk-|ghp_|token|secret|password|api_key" -i
```

Empty output means clean. If anything shows up, do not make the repo public.

### Security Audit Rules

When auditing this repo for secrets, scan:

- All git history, not just current file tree
- Tool-specific config directories (.claude/, .cursor/, etc.)
- Any file that was committed and later deleted
