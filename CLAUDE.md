@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FieldNotes AI is a personal journal/blog website built with Next.js 16 (App Router), React 19, and Contentful as a headless CMS. It was originally scaffolded with v0.app. The site catalogs field notes (journal entries) and tools used in AI development. Deployed on Vercel. Feature work happens on branches. Merge to `main` only when the phase is complete and tested. Current active branch: `feature/research-agent`. The Research Agent has been pivoted from a Field Note writer to a personal AI research digest agent that monitors Anthropic, OpenAI, Google DeepMind, xAI, Perplexity, and Andrej Karpathy, and sends a structured email digest 3x per week.

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
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (used by Ask search feature)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (used by embed and reindex)
- `VOYAGE_API_KEY` — Voyage AI API key (used by Ask search and embed)
- `REINDEX_SECRET` — Secret token for /api/reindex webhook endpoint
- `ANTHROPIC_API_KEY` — Anthropic API key (used by Ask search and research digest agent)

When Contentful env vars are missing, the app serves hardcoded default/demo content defined in `lib/contentful.ts`.

## Architecture

### Data Flow

All pages are **async server components** using ISR with 60-second revalidation. Data is fetched from Contentful REST API (via `contentful` JS SDK — no GraphQL) through `lib/contentful.ts`, which exports: `getAllFieldNotes(options?)`, `getTotalFieldNotesCount()`, `getFeaturedFieldNote()`, `getFieldNoteBySlug()`, `getAllFieldNoteSlugs()`, `getAllTools()`, `getActiveTools()`, and `getGlobalSettings()`. `getAllFieldNotes` accepts `{ limit, skip }` for server-side pagination (10 per page on `/notes`). Parallel fetching with `Promise.all()` is used on pages that need multiple data sources. Include depth is 2 for linked entries.

### Contentful Content Types (Space: 7nlepvg580vx, Environment: master)

- **globalSettings** (display: Global Settings) — internalName, siteName, domain, logo (Asset), primaryNavigation (max 3 navigationItem refs), socialLinks (max 5 socialLink refs), copyright, defaultSeoMetadata (seo ref)
- **fieldNote** (display: Field Note) — internalName, entryNumber (unique Integer), title (max 120), slug (unique Symbol, regex `^[a-z0-9-]+$`), dek (Symbol, max 200), entryType (Learning/Building/Testing/Observing), body (RichText), publishedDate, readingTimeMinutes, relatedTools (max 6 tool refs), seo (ref), featured (Boolean, default false), sessionCost, totalTokens, modelUsed (15 fields total — agentSessionId and researchSources removed 2026-05-09 after research-agent pivot)
- **tool** (display: Tool) — internalName, name, slug (unique Symbol, regex `^[a-z0-9-]+$`), description (max 120), category (AI Model/CMS/Dev Tool/UI Builder/AI Framework/Recording/Other/Infrastructure), vendor, url, status (Active/Testing/Retired, default Active), sortOrder (Integer), notes (Text), simpleIconSlug
- **navigationItem** (display: Navigation Item) — internalName, label, url, openInNewTab (Boolean, default false), isExternal (Boolean, default false)
- **socialLink** (display: Social Link) — internalName, platform (X/LinkedIn/GitHub/YouTube), url, handle
- **seo** (display: SEO) — internalName, sitemap (Boolean, default false), ogTitle (max 90), ogDescription (Text, max 200), ogImage (Asset), ogImageAltText, ogMetaKeywords (array of Symbols), ogType (Text, Article/Website/Profile, default Website), robotsNoIndex (Boolean, default false), robotsNoFollow (Boolean, default false), robotsNoArchive (Boolean, default false), robotsUnavailableAfter (Date)

### Type System

`lib/types.ts` defines two layers: **Skeleton types** (`I*Skeleton`) for the Contentful SDK and **Parsed types** (`Parsed*`) used by components. All Contentful responses go through parse functions in `lib/contentful.ts` that convert SDK entries to the simpler Parsed interfaces. Always use `Parsed*` types in components.

### Key Files

- `lib/contentful.ts` — Contentful client, all data-fetching functions, parse functions, fallback defaults
- `lib/types.ts` — TypeScript interfaces for Contentful skeleton and parsed types
- `lib/format.ts` — `formatDate()`, `formatEntryNumber()`, `estimateWordCount()`, `getTagClass()`
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `lib/embed.ts` — chunking, Voyage AI embeddings, Supabase pgvector upsert (powers Ask feature and reindex webhook)
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
- `/api/search` — RAG semantic search endpoint (Ask feature, uses Voyage AI + Supabase pgvector + Anthropic)
- `/api/reindex` — Webhook endpoint triggered by Contentful on publish to re-embed new entries
- `/llms.txt` — LLMs.txt file for AI crawler guidance
- `app/sitemap.ts` — Dynamic XML sitemap
- `app/robots.ts` — Robots.txt generation

### Styling

Tailwind CSS 4 + CSS custom properties for theming. Two CSS entry points: `app/globals.css` (design system with `--bg`, `--ink`, `--accent`, `--border` tokens) and `styles/globals.css` (shadcn/ui base). Fonts loaded via CSS variables: `--font-playfair` (Playfair Display), `--font-ibm-plex-sans` (IBM Plex Sans), `--font-ibm-plex-mono` (IBM Plex Mono). shadcn/ui components live in `components/ui/` configured via `components.json` (new-york style, neutral base color). Regular CSS classes — **no styled-jsx** (was removed to fix Vercel build issues). Vercel Analytics in root layout.

**Dark mode**: Implemented manually via `.dark` class on `<html>`. A blocking `<script>` in `app/layout.tsx` reads `localStorage('theme')` or `prefers-color-scheme` on load — no theme library. `ThemeToggle` component manages toggling. All dark tokens are in the `.dark {}` block in `app/globals.css`.

**CSS naming**: Two style generations coexist in `globals.css`. Older styles use `.header-*`, `.tag-*`, `.note-*` prefixes. Newer styles (from mockup redesign) use short prefixes: `.nav`, `.art-*`, `.lbl`, `.col`, `.sec-*`, `.tc-*`. When modifying styles, match the naming convention of the section you're editing.

### Path Alias

`@/*` maps to the project root (configured in tsconfig.json).

### Client vs Server Components

Only a few components use `"use client"`: `Header` (active nav via `usePathname`), `FilterBar` (category toggle state), `CodeBlock` (copy button), `ThemeToggle`, `ToolsContent` (filter state), `AskButton`, `SearchModal`, `SearchProvider`, `NavLink`. Everything else is server-rendered.

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

## Research Digest Agent — Project Context

### What we are building

A personal AI research digest agent that:
1. Monitors 6 sources: Anthropic, OpenAI, Google DeepMind, xAI/Grok, Perplexity, Andrej Karpathy
2. Researches using built-in web_search and web_fetch — no custom MCP server needed
3. Produces a structured digest with three sections: What Shipped, What to Try, Field Note Candidates
4. Sends to nika.miami@gmail.com via Resend from digest@fieldnotes-ai.com
5. Runs 3x per week via GitHub Actions cron (Monday, Wednesday, Friday)

### Why no MCP server

The previous architecture had a custom MCP server on Railway with three tools
(search_fieldnotes, check_topic_coverage, push_contentful_draft). That was the right
architecture for writing Field Notes autonomously. For a research digest, the agent only
needs web_search, web_fetch (both built-in), and one email send via Resend API called
directly from run-session.py after the session completes. Railway and the MCP server
have been shut down.

### Architecture

- Managed Agent: claude-sonnet-4-6, agent_toolset_20260401
- Tools: web_search, web_fetch, bash (all built-in — no MCP server)
- Email delivery: run-session.py reads final agent output and sends via Resend API
- Trigger: GitHub Actions cron — Monday, Wednesday, Friday at 8 AM ET
- No Railway, no custom MCP server, no Contentful writes (note: Supabase pgvector is still used by the website's Ask search feature — this refers to the agent only)

### Scripts

- scripts/run-session.py — session runner, reads agent output, sends email via Resend
- scripts/.env.agents — gitignored, holds AGENT_ID and ENVIRONMENT_ID

### Email format — three sections

**What Shipped** — 3-5 factual items, one sentence each, source link, no opinion
**What to Try** — 2-3 items relevant to Nika's stack, what it is + why it matters
**Field Note Candidates** — 1-2 topic suggestions, topic + angle

### Agent standing context (in system prompt)

Stack: Claude Managed Agents, MCP servers, Contentful, Next.js, Supabase pgvector, Voyage AI, Railway, Vercel, Resend
Audience: AI practitioners building with Claude, Contentful developers, people building in public
Goals: Ship fieldnotes-ai.com content regularly, build in public, learn agentic AI patterns

### Phase status

Phase 0 — Infrastructure cleanup: COMPLETE
[x] Delete mcp-server/ directory
[x] Delete agent scaffolding scripts (setup-agent.py, update-agent-permissions.py, agent-system-prompt.md)
[x] Shut down Railway project
[x] Delete agents and vault from Anthropic Console

Phase 1 — Build research digest agent: COMPLETE
[x] Rewrite system prompt for research digest use case
[x] Recreate agent via setup-agent.py (no MCP server, no vault needed)
[x] Update run-session.py to read agent output and send email via Resend
[x] Test run — verified email arrived at nika.miami@gmail.com (Cloudflare 1010 fix: added User-Agent header)

Phase 2 — Automate: IN PROGRESS
[x] GitHub Actions cron — Monday, Wednesday, Friday 8 AM ET
[ ] Add ANTHROPIC_API_KEY, RESEND_API_KEY, AGENT_ID, ENVIRONMENT_ID to GitHub Secrets
[ ] Test automated trigger via workflow_dispatch

### Known gotchas carried forward

- agents.update() requires version: int parameter — retrieve first, pass current version
- Session title has 500 char maximum — truncate topic string
- Python 3.9 on this machine — no match statements, use if/elif
- always_allow on agent toolset removes per-call confirmation — keep this setting
- Beta header managed-agents-2026-04-01 required on every API call
