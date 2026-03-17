# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Branch

We are actively working on the `redesign/full` branch — a full redesign of fieldnotes-ai.com. The `main` branch is the live production site and must not be modified. Screenshots of the current production site (before state) are saved in `screenshots/before/`. HTML mockup files (`1_Home__4_.html`, `2_Article__1_.html`, `3_Tools.html`) are the visual source of truth for the redesign.

## Project Overview

FieldNotes AI is a personal journal/blog website built with Next.js 16 (App Router), React 19, and Contentful as a headless CMS. It was originally scaffolded with v0.app. The site catalogs field notes (journal entries) and tools used in AI development. Deployed on Vercel.

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

All pages are **async server components** using ISR with 60-second revalidation. Data is fetched from Contentful REST API (via `contentful` JS SDK — no GraphQL) through `lib/contentful.ts`, which exports: `getAllFieldNotes()`, `getFeaturedFieldNote()`, `getFieldNoteBySlug()`, `getAllFieldNoteSlugs()`, `getAllTools()`, `getActiveTools()`, and `getGlobalSettings()`. Parallel fetching with `Promise.all()` is used on pages that need multiple data sources.

### Contentful Content Types (Space: 7nlepvg580vx, Environment: master)

- **globalSettings** — site name, domain, logo (Asset), primaryNavigation, socialLinks, copyright, defaultSeoMetadata
- **fieldNote** — journal entries with entryNumber, slug, entryType (Learning/Building/Testing/Observing), body (RichText), publishedDate, readingTimeMinutes, relatedTools, seo, featured
- **tool** — technology catalog with name, slug, description, category (AI Model/CMS/Dev Tool/UI Builder/AI Framework/Recording/Infrastructure/Other), vendor, url, status (Active/Testing/Retired), sortOrder, notes
- **navigationItem** — label, url, openInNewTab, isExternal
- **socialLink** — platform (X/LinkedIn/GitHub/YouTube), url, handle
- **seo** — ogTitle, ogDescription, ogImage, ogType (Article/Website/Profile), robots flags, sitemap boolean

### Key Files

- `lib/contentful.ts` — Contentful client, all data-fetching functions, fallback defaults
- `lib/types.ts` — TypeScript interfaces for Contentful and parsed types
- `components/RichText.tsx` — Contentful rich text document renderer
- `app/globals.css` — Design system with CSS custom properties and animations
- `styles/globals.css` — shadcn/ui base styles (Tailwind + tw-animate-css)
- `planning-context.md` — Full redesign implementation plan with execution order, component map, and Playwright checkpoints

### Routes

- `/` — Home page (featured notes, tools preview, about section)
- `/notes` — All notes listing
- `/notes/[slug]` — Individual note detail (uses `generateStaticParams`)
- `/tools` — Tools directory
- `app/sitemap.ts` — Dynamic XML sitemap
- `app/robots.ts` — Robots.txt generation

### Styling

Tailwind CSS 4 + CSS custom properties for theming. Two CSS entry points: `app/globals.css` (design system with `--ink`, `--paper`, `--accent`, `--muted` tokens) and `styles/globals.css` (shadcn/ui base). Fonts loaded via CSS variables: `--font-playfair` (Playfair Display), `--font-lora` (Lora), `--font-ibm-plex-mono` (IBM Plex Mono). shadcn/ui components live in `components/ui/` configured via `components.json` (new-york style, neutral base color). Regular CSS classes — **no styled-jsx** (was removed to fix Vercel build issues). Vercel Analytics in root layout.

### Path Alias

`@/*` maps to the project root (configured in tsconfig.json).

### Build Notes

- `next.config.mjs` currently has `typescript.ignoreBuildErrors: true` — redesign plan calls for removing this
- Optimized images with `remotePatterns` for `images.ctfassets.net` (Contentful)
- The `Header` component is a client component (uses `usePathname`); everything else is server-rendered

## Redesign Conventions

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
