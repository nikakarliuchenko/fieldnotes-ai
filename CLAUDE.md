@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FieldNotes AI is a personal journal/blog website built with Next.js 16 (App Router), React 19, and Contentful as a headless CMS. It was originally scaffolded with v0.app. The site catalogs field notes (journal entries) and tools used in AI development. Deployed on Vercel. Feature work happens on branches. Merge to `main` only when the phase is complete and tested. Current active branch: `feature/research-agent`.

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

- **globalSettings** (display: Global Settings) — internalName, siteName, domain, logo (Asset), primaryNavigation (max 3 navigationItem refs), socialLinks (max 5 socialLink refs), copyright, defaultSeoMetadata (seo ref)
- **fieldNote** (display: Field Note) — internalName, entryNumber (unique Integer), title (max 120), slug (unique Symbol, regex `^[a-z0-9-]+$`), dek (Symbol, max 200), entryType (Learning/Building/Testing/Observing), body (RichText), publishedDate, readingTimeMinutes, relatedTools (max 6 tool refs), seo (ref), featured (Boolean, default false), sessionCost, totalTokens, modelUsed
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

## FieldNotes Research Agent — Project Context

This section documents the Managed Agents pipeline currently under construction.
Read this before starting any session related to the mcp-server or agent wiring.

### What we are building

An autonomous research pipeline that:

1. Accepts a topic prompt
2. Researches it using web search and existing Field Notes context
3. Tests any code snippets in a sandbox
4. Pushes a draft Field Note to Contentful as a draft entry (never publishes)

The pipeline has three layers:

- A custom MCP server (Node.js/TypeScript, deployed on Railway)
- A Claude Managed Agents session (Anthropic cloud runtime)
- A trigger mechanism (GitHub Actions cron or Next.js API route)

### Why a custom MCP server and not the existing Contentful MCP

The existing Contentful MCP used in Claude Code has full account permissions and no
quality gate. The custom MCP server provides three things the existing one cannot:

- Supabase pgvector semantic search (no existing MCP handles this)
- A scoped Contentful token restricted to entries.create and entries.update only
- An automated quality gate that runs before any CMS write

### Directory structure (to be created in Phase 1)

mcp-server/ <- standalone Node.js package, deploy separately from main app
src/
index.ts <- Express server + Streamable HTTP transport
tools/
search.ts <- search_fieldnotes tool
coverage.ts <- check_topic_coverage tool
push-draft.ts <- push_contentful_draft tool
lib/
supabase.ts <- single reused Supabase client instance
contentful.ts <- contentful-management client (separate from main app client)
.env.example
package.json
README.md

scripts/
trigger-agent.ts <- manual session trigger for local testing

### MCP server — three tools

**search_fieldnotes**

- Purpose: semantic search over existing Field Notes chunks in Supabase
- When to use: before researching any topic, to understand what has already been covered
- Input: { query: string, matchCount?: number (default 10) }
- Output: array of { slug, title, sectionTitle, content, similarity }
- Implementation: supabase.rpc('match_fieldnotes_chunks', { query_embedding, match_threshold: 0.78, match_count })

**check_topic_coverage**

- Purpose: checks if a proposed topic is too similar to already-published content
- When to use: before committing to a topic, to avoid duplicating existing Field Notes
- Input: { topic: string }
- Output: { isDuplicate: boolean, similarNotes: array, highestSimilarity: number }
- Implementation: same RPC as search_fieldnotes, threshold 0.85 (configurable via env var)
- Note: no universal threshold exists — calibrate based on results. Raise to 0.88-0.90
  if distinct topics are being falsely flagged as duplicates.

**push_contentful_draft**

- Purpose: pushes a completed draft to Contentful as a draft entry — never publishes
- When to use: only after research is complete, code is tested, and quality gate passes
- Input: { title, slug, dek, body (markdown string), researchSources, agentSessionId }
- Output: { entryId, status: 'draft' }
- Uses @contentful/rich-text-from-markdown to convert markdown body to Rich Text JSON
  (do not construct Rich Text AST manually — error-prone and unnecessary)
- Quality gate runs inside this tool before any CMS write — returns failure reasons
  if it fails, routes back to agent rather than pushing bad content
- All field values must be locale-wrapped: { 'en-US': value }
- Agent token must be scoped to entries.create and entries.update only — never publish

### Quality gate — runs inside push_contentful_draft before any CMS write

Content that fails any check is returned to the agent with specific failure reasons.
Gate checks:

1. Semantic dedup score against existing content — reject if similarity > 0.85
2. Metadata completeness — title, slug, dek, researchSources must all be present
3. Word count — minimum 800 words, maximum 3000 words
4. Heading structure — at least 3 H2 headings present
5. Code snippet validation — all code blocks must have a language tag

### Supabase schema — fieldnotes_chunks (already live)

Table: fieldnotes_chunks
RPC: match_fieldnotes_chunks(query_embedding vector(1024), match_threshold float, match_count int)
Embedding model: voyage-3.5-lite — 1024 dimensions (not 512 — altered at runtime)
Index: HNSW with vector_cosine_ops
ORDER BY: must reference distance operator directly (embedding <=> query_embedding)
not an alias — otherwise HNSW index is silently ignored
Return columns: id, field_note_slug, field_note_number, field_note_title,
section_title, content, similarity

### Contentful content model — fieldNote complete field list

The Architecture section above lists the original fields. This is the authoritative
current list. Use field IDs exactly as shown — not display names.

| Field ID           | Type          | Required | Notes                                                                 |
| ------------------ | ------------- | -------- | --------------------------------------------------------------------- |
| internalName       | Symbol        | yes      | unique; Contentful UI only, not rendered on site; display field       |
| entryNumber        | Integer       | yes      | unique                                                                |
| title              | Symbol        | yes      | max 120 chars                                                         |
| slug               | Symbol        | yes      | unique; regex `^[a-z0-9-]+$`                                          |
| dek                | Symbol        | no       | subtitle shown on site; max 200 chars (note: Symbol, not Text)        |
| entryType          | Symbol        | yes      | Learning / Building / Testing / Observing                             |
| body               | RichText      | yes      |                                                                       |
| publishedDate      | Date          | yes      |                                                                       |
| readingTimeMinutes | Integer       | no       |                                                                       |
| relatedTools       | Array<Link>   | no       | links to tool content type; max 6 entries                             |
| seo                | Link          | no       | links to seo content type                                             |
| featured           | Boolean       | yes      | default false                                                         |
| sessionCost        | Symbol        | no       | e.g. "$3.14"                                                          |
| totalTokens        | Symbol        | no       | e.g. "2.9M"                                                           |
| modelUsed          | Symbol        | no       | e.g. "claude-sonnet-4-6"                                              |
| agentSessionId     | Symbol        | no       | added 2026-04-16; helpText: "Claude Managed Agents session ID that created this draft" |
| researchSources    | Object (JSON) | no       | added 2026-04-16; helpText: "Sources researched by the agent: array of {url, title, summary}" |

IMPORTANT: the field is named 'dek' not 'excerpt' and not 'tags'. Do not use wrong field IDs.
There is no tags field on the content model — topic tags use Contentful's native Tags feature.

Space ID: 7nlepvg580vx, Environment: master

### Contentful tagging strategy

Use Contentful's native Tags feature (not a content model field) for topic labels.
Tags are assigned at the entry level via the CMA — no content model change needed.
The agent should:

1. Create public tags programmatically if they don't already exist
2. Assign relevant topic tags when pushing a draft entry
3. Use short lowercase slugs: e.g. 'rag', 'managed-agents', 'mcp', 'supabase'

Tags are returned by the Delivery API under entry.metadata.tags.
Update lib/contentful.ts parse functions to surface them if needed for the site UI.
Public tags only — private tags are not returned by the Delivery API.

### MCP server — transport and auth

Transport: Streamable HTTP (not stdio, not deprecated HTTP+SSE)
Single /mcp endpoint: POST for JSON-RPC messages, GET for server-initiated notifications
Each connection gets a unique session via Mcp-Session-Id header
Auth: Bearer token middleware validates Authorization header against MCP_AUTH_TOKEN env var
Origin header must be validated on all connections — prevents DNS rebinding attacks
Health check endpoint: GET /health

### MCP server — npm dependencies

@modelcontextprotocol/sdk@^1.29.0
zod@^3.25
@supabase/supabase-js
contentful-management@^12.3.0
@contentful/rich-text-from-markdown
express

### MCP server — security notes

SUPABASE_SERVICE_ROLE_KEY bypasses all RLS — store only in Railway encrypted env vars,
never in .env files committed to git. Evaluate whether anon key + narrow SELECT policy
would suffice for the search tools — service role is only needed if writing to Supabase.

CONTENTFUL_MANAGEMENT_TOKEN must be a scoped bot account token restricted to
entries.create and entries.update on fieldNote in master environment only.
A standard Personal Access Token has full account permissions including publish — do not use it.

### Managed Agents — access and configuration

Beta header: managed-agents-2026-04-01
Model: claude-sonnet-4-6
Agent toolset: agent_toolset_20260401
Includes: bash, web_search, web_fetch, read, write, edit, glob, grep
All enabled by default — disable individual tools via configs array if needed
MCP toolset permission policy: always_allow — push_contentful_draft runs without per-call approval; quality gate is the safety check
Managed Agents API: ENABLED (confirmed April 2026 — GET /v1/agents returns {"data":[]})
Memory stores: ENABLED — graduated to public beta April 23, 2026 under managed-agents-2026-04-01 header. No separate access needed. Mount at /mnt/memory/ in agent container. Workspace-scoped — isolate workspaces per agent to avoid cross-contamination.
Session timeout: set to 30 minutes from day one — cost protection against stuck loops
Networking: unrestricted (agent needs web_search, web_fetch, and MCP server access)
Deployment target for MCP server: Railway — always-on Node.js process required
MCP server URL: https://fieldnotes-ai-production.up.railway.app
Do NOT deploy mcp-server to Vercel — Streamable HTTP session semantics need persistent process

Known gotcha: SSE streaming endpoint may return 400 with managed-agents-2026-04-01. Use the official Anthropic SDK — it handles header routing automatically. If using raw HTTP, fall back to agent-api-2026-03-01 on /v1/sessions/{id}/stream only if you get a 400.
Known gotcha: Opus 4.7 rejects temperature, top_p, and top_k — do not set these parameters. Tokenizer inflates ~30% vs 4.6 — budget max_tokens with headroom. Thinking content is hidden by default — set display: "summarized" if needed.
Known gotcha: Railway edge proxy idle timeout (~5-10 min). MCP server must emit SSE keepalive every 20-30 seconds during long tool calls to keep connection alive through the 30-minute session timeout.

### Trigger mechanism (to be built in Phase 2)

Managed Agents has no native scheduler. Sessions must be created by an external trigger.
Options in order of preference:

1. GitHub Actions cron — free, version-controlled, no extra infrastructure
2. Next.js API route with a simple admin UI — on-demand trigger from the browser
3. Vercel cron — works but adds Vercel-specific coupling

### Workflow — how Claude.ai and Claude Code interact on this project

Claude.ai (this conversation) = planning, prompt writing, output review
Claude Code = execution, file changes, Contentful MCP calls, commits

Pattern for every phase:
Claude.ai -> write Claude Code prompt for one specific task
Claude Code -> execute task, commit
Claude.ai -> review output, write next prompt

Never give Claude Code a prompt larger than one focused task.
Always commit working code before starting the next task.
Always run npm run build and verify in browser before closing a session.

### Phase status

Phase 0 — Pre-work: COMPLETE
[x] Add agentSessionId field to fieldNote via Contentful MCP (2026-04-16, published v5)
[x] Add researchSources field to fieldNote via Contentful MCP (2026-04-16, published v5)
[x] Verify match_fieldnotes_chunks SQL — function definition is now version-controlled at supabase/migrations/001_match_fieldnotes_chunks.sql. Confirmed: ORDER BY references the distance operator directly (`embedding <=> query_embedding`, not an alias), so the HNSW index is used. Return columns: id (uuid), field_note_slug, field_note_number, field_note_title, section_title, content, similarity (double precision). Dimension note: the function signature uses untyped `vector` — the 1024-dimension constraint is enforced at the `fieldnotes_chunks.embedding` column level, not in the function signature.
[x] Finalize tool contracts as TypeScript interfaces with Zod input schemas — tool contracts defined in mcp-server/src/tools/ during Phase 1 implementation

Phase 1 — Build MCP server: COMPLETE
[x] Scaffold mcp-server package with Streamable HTTP transport
[x] Add Origin header validation and Bearer token auth
[x] Implement search_fieldnotes tool (Voyage AI + Supabase pgvector)
[x] Implement check_topic_coverage tool
[x] Implement push_contentful_draft tool with quality gate and Contentful Tags
[x] Deploy to Railway — https://fieldnotes-ai-production.up.railway.app

Phase 2 — Wire Managed Agents session: NOT STARTED
Phase 3 — Memory + quality gate: READY (memory stores public beta as of April 23, 2026)
