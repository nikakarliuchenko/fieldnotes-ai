# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FieldNotes AI is a personal journal/blog website built with Next.js (App Router) and Contentful as a headless CMS. It was originally scaffolded with v0.app. The site catalogs field notes (journal entries) and tools used in AI development.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint
```

There are no tests configured in this project.

## Environment Variables

- `CONTENTFUL_SPACE_ID` — Contentful workspace ID
- `CONTENTFUL_ACCESS_TOKEN` — Contentful delivery API token
- `CONTENTFUL_ENVIRONMENT` — Contentful environment (defaults to 'master')
- `NEXT_PUBLIC_SITE_URL` — Site URL for sitemap generation (defaults to https://fieldnotes.ai)

When Contentful env vars are missing, the app serves hardcoded default/demo content defined in `lib/contentful.ts`.

## Architecture

### Data Flow

All pages are **async server components** using ISR with 60-second revalidation. Data is fetched from Contentful via `lib/contentful.ts`, which exports functions like `getFieldNotes()`, `getFieldNoteBySlug()`, `getTools()`, and `getGlobalSettings()`. Parallel fetching with `Promise.all()` is used on pages that need multiple data sources.

### Contentful Content Types

- **GlobalSettings** — site name, domain, navigation items, social links, copyright, default SEO
- **FieldNote** — journal entries with entry number, slug, type (Learning/Building/Testing/Observing), rich text body, featured flag
- **Tool** — technology catalog with status (Active/Testing/Retired), category, vendor
- **NavigationItem**, **SocialLink**, **SEO** — supporting types

### Key Files

- `lib/contentful.ts` — Contentful client, all data-fetching functions, fallback defaults
- `lib/types.ts` — TypeScript interfaces for Contentful and parsed types
- `components/RichText.tsx` — Contentful rich text document renderer
- `app/globals.css` — Design system with CSS custom properties and animations

### Routes

- `/` — Home page (featured notes, tools preview, about section)
- `/notes` — All notes listing
- `/notes/[slug]` — Individual note detail (uses `generateStaticParams`)
- `/tools` — Tools directory
- `app/sitemap.ts` — Dynamic XML sitemap

### Styling

Uses Tailwind CSS 4 + CSS custom properties for theming. The design system colors are defined in `app/globals.css` (e.g., `--ink`, `--paper`, `--accent`, `--muted`). shadcn/ui components live in `components/ui/` and are configured via `components.json` (new-york style, neutral base color). Regular CSS classes are used — **no styled-jsx** (was removed to fix Vercel build issues).

### Path Alias

`@/*` maps to the project root (configured in tsconfig.json).

### Build Notes

- `next.config.mjs` has `typescript.ignoreBuildErrors: true` and `images.unoptimized: true`
- The `Header` component is a client component (uses `usePathname`); everything else is server-rendered
