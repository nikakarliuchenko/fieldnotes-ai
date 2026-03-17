# FieldNotes AI — Redesign Implementation Plan
# Generated: 2026-03-15
# For: Claude Code execution

---

## 0. BEFORE YOU START

1. Read this entire document before touching any file
2. Run `/init` if CLAUDE.md does not exist
3. Confirm Playwright MCP is active: `claude mcp list`
4. Branch: `git checkout -b redesign/full`
5. Turn off ignoreBuildErrors in next.config.mjs immediately (first commit)
6. Run `npm run build` to see current TypeScript errors — fix as you go

---

## 1. PROJECT CONTEXT

**Stack:** Next.js 16, React 19, App Router, Contentful REST API, Tailwind CSS 4, Vercel  
**Fonts:** Playfair Display (serif display), IBM Plex Sans (body), IBM Plex Mono (mono)  
**Primary accent:** `#BE2A2A` (light) / `#D44040` (dark)  
**Background:** `#FAF9F6` (light) / `#1C1917` (dark)  
**All Contentful calls:** REST only via contentful JS SDK — no GraphQL anywhere  
**Rendering:** All pages are async server components with ISR (60s revalidation)  
**Exception:** Header.tsx is currently a client component — refactor target (see below)

---

## 2. DESIGN TOKENS

Extract these into `app/globals.css` as CSS custom properties. Already partially present — consolidate and ensure completeness.

```css
:root {
  /* Backgrounds */
  --bg:          #FAF9F6;
  --bg-subtle:   #F3F1EC;
  --bg-card:     #FFFFFF;

  /* Borders */
  --border:      #E2DDD6;
  --border-f:    #EDE9E2;

  /* Ink */
  --ink:         #1C1917;
  --ink-2:       #57534E;
  --ink-3:       #A8A29E;

  /* Accent */
  --accent:      #BE2A2A;
  --acc-pale:    #FDF2F2;
  --acc-mid:     #F0CACA;

  /* Fonts */
  --serif: 'Playfair Display', Georgia, serif;
  --sans:  'IBM Plex Sans', system-ui, sans-serif;
  --mono:  'IBM Plex Mono', monospace;

  /* Layout */
  --col:   680px;   /* max content column width */
  --art:   600px;   /* article prose width (65-70 chars) */
  --r:     3px;     /* base border radius */
}

.dark {
  --bg:          #1C1917;
  --bg-subtle:   #242120;
  --bg-card:     #242120;
  --border:      #3D3836;
  --border-f:    #3D3836;
  --ink:         #FAFAF9;
  --ink-2:       #A8A29E;
  --ink-3:       #78716C;
  --accent:      #D44040;
  --acc-pale:    #2A1A1A;
  --acc-mid:     #5C2020;
}
```

---

## 3. NEXT.CONFIG.MJS — FIRST CHANGE

```js
// next.config.mjs
const nextConfig = {
  // REMOVE: typescript: { ignoreBuildErrors: true }
  // REMOVE: eslint: { ignoreDuringBuilds: true }
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.ctfassets.net' },
    ],
  },
}
```

---

## 4. COMPONENT MAP

### Components to DEPRECATE (delete after refactor)
- `components/AboutStrip.tsx` → replaced by inline bio section in Home page
- `components/SectionLabel.tsx` → replaced by inline section header pattern
- `components/theme-provider.tsx` → dark mode handled via CSS class on `<html>`

### Components to REFACTOR (keep file, rewrite contents)
- `components/Header.tsx` — convert from client component to server component. Move active path detection to a child `NavLink` client component only (keeps client JS minimal)
- `components/Footer.tsx` — rebuild to match mockup design
- `components/FieldNoteCard.tsx` — rebuild to match new list item design
- `components/ToolCard.tsx` — rebuild to match new tool card design
- `components/RichText.tsx` — extend with new renderers (see section 7)

### Components to CREATE (new files)
- `components/NoteListItem.tsx` — compact note row for home page list
- `components/FeaturedNote.tsx` — hero/featured note section
- `components/StatsStrip.tsx` — session stats bar on article page (cost, tokens, model)
- `components/NavLink.tsx` — client component, active state only, used by Header
- `components/Breadcrumb.tsx` — breadcrumb nav for article + tools pages
- `components/FilterBar.tsx` — category filter for tools page (client component)
- `components/PullQuote.tsx` — styled pull quote for rich text
- `components/Callout.tsx` — callout box for rich text
- `components/CodeBlock.tsx` — code block with language label + copy button
- `components/ArticleNav.tsx` — prev/next navigation at bottom of article

---

## 5. PAGE ROUTES — WHAT CHANGES

### `app/layout.tsx`
- Add `lang="en"` to `<html>`
- Add dark mode class logic
- Ensure fonts loaded: Playfair Display, IBM Plex Sans, IBM Plex Mono
- Add skip-to-content link: `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>`
- Keep Vercel Analytics

### `app/page.tsx` (Home)
**Semantic structure:**
```html
<header role="banner">        <!-- site header / wordmark -->
<nav aria-label="Main">       <!-- primary navigation -->
<main id="main-content">
  <header>                    <!-- page-level header with H1, byline -->
  <section aria-label="Featured Field Note">
    <article>                 <!-- featured note -->
  <section aria-label="Recent Field Notes">
    <ol>                      <!-- ordered list of notes — order matters -->
      <li><article>           <!-- each note as article -->
  <section aria-label="My Tools">
    <ul>                      <!-- tools preview list -->
  <aside>                     <!-- bio strip -->
<footer>
```

**Data fetching — parallel, no waterfalls:**
```ts
const [featuredNote, allNotes, activeTools, settings] = await Promise.all([
  getFeaturedFieldNote(),
  getAllFieldNotes(),
  getActiveTools(),
  getGlobalSettings(),
])
```

**Featured note logic — UPDATE `getFeaturedFieldNote()`:**
Remove `fields.featured: true` filter. Always return most recent by publishedDate.
The `featured` boolean field on fieldNote content type stays but is ignored in code.

### `app/notes/[slug]/page.tsx` (Article)
**Semantic structure:**
```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Field Notes</a>
    <li><span aria-current="page">#006 — Title</span>
<main id="main-content">
  <article>
    <header>
      <div class="meta">   <!-- entry number, entryType label, date -->
      <h1>                 <!-- title -->
      <p class="dek">      <!-- dek/subtitle -->
      <address>            <!-- byline with rel="author" -->
    <div class="stats-strip">   <!-- session cost, tokens, model -->
    <div class="article-body">  <!-- rich text content -->
    <nav aria-label="Article navigation">  <!-- prev/next -->
<aside>                    <!-- related tools if present -->
```

**generateMetadata() — fix SEO cascade:**
```ts
export async function generateMetadata({ params }) {
  const note = await getFieldNoteBySlug(params.slug)
  // Primary: use title + dek
  // Override: check note.seo reference fields if present
  return {
    title: note.seo?.ogTitle ?? `${note.title} — FieldNotes AI`,
    description: note.seo?.ogDescription ?? note.dek,
    // ... rest of OG, twitter, canonical, JSON-LD
  }
}
```

**Date fix — use `<time>` element:**
```tsx
<time dateTime={note.publishedDate}>
  {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(note.publishedDate))}
</time>
```

**StatsStrip — new optional fields on fieldNote:**
The stats strip (cost, tokens, model) requires 3 new fields on the `fieldNote` content type:
- `sessionCost` — Short Text, optional (e.g. "$3.14")
- `totalTokens` — Short Text, optional (e.g. "488K")  
- `modelUsed` — Short Text, optional (e.g. "claude-sonnet-4-6")

StatsStrip component renders only if at least one of these fields is populated.

### `app/tools/page.tsx` (Tools)
**Semantic structure:**
```html
<nav aria-label="Breadcrumb">
<main id="main-content">
  <header>
    <h1>My Tools</h1>
    <p>             <!-- description -->
  <div role="group" aria-label="Filter tools by category">
    <!-- FilterBar client component — buttons with aria-pressed -->
  <section aria-label="Active stack">
    <ul>
      <li>           <!-- each tool as list item wrapping article -->
        <article>
          <h2>       <!-- tool name -->
  <section aria-label="Also using">
    <ul>
      <li><article>
```

**FilterBar — client component:**
Filter state lives in client component only. No URL params needed for now.
Each filter button needs `aria-pressed={isActive}`.

---

## 6. CONTENTFUL — CONTENT MODEL CHANGES

### ⚠️ LIVE SCHEMA vs TYPESCRIPT TYPES — DISCREPANCIES TO FIX

The live Contentful space (verified via MCP 2026-03-15) differs from what lib/types.ts assumes:

**globalSettings:**
- HAS `logo` (Asset) field — NOT in TypeScript types → add to IGlobalSettingsFields + ParsedGlobalSettings
- DOES NOT HAVE `primaryColorDefault`, `backgroundColorDefault`, `inkColorDefault` — these are phantom fields in types.ts → DELETE them

**tool:**
- HAS `internalName` (Short Text) field — not in types, ignore it (internal Contentful label)

**fieldNote:**
- HAS `internalName` (Short Text) field — not in types, ignore it (internal Contentful label)

**seo:**
- HAS additional fields not in TypeScript types: `ogMetaKeywords`, `robotsNoArchive`, `robotsUnavailableAfter` → add to ISeoFields + ParsedSeo

**navigationItem + socialLink:**
- Both have `internalName` — not in types, ignore it

### First task in this section: fix lib/types.ts to match live schema before any other changes


### Changes to make in Contentful (via MCP or UI):

**fieldNote — add 3 new fields:**
| Field ID | Type | Required | Notes |
|---|---|---|---|
| sessionCost | Short Text | No | e.g. "$3.14" |
| totalTokens | Short Text | No | e.g. "488K" |
| modelUsed | Short Text | No | e.g. "claude-sonnet-4-6" |

**tool — add 1 new field:**
| Field ID | Type | Required | Notes |
|---|---|---|---|
| simpleIconSlug | Short Text | No | e.g. "contentful", "anthropic" |

**fieldNote — hide featured field in UI:**
Set `featured` field appearance to collapsed/hidden in Contentful UI.
Do NOT delete — migration risk. Just stop populating it.

### TypeScript types to update (lib/types.ts):

```ts
interface IFieldNoteFields {
  // existing fields...
  sessionCost?: string      // ADD
  totalTokens?: string      // ADD
  modelUsed?: string        // ADD
}

interface ParsedFieldNote {
  // existing fields...
  sessionCost?: string      // ADD
  totalTokens?: string      // ADD
  modelUsed?: string        // ADD
}

interface IToolFields {
  // existing fields...
  simpleIconSlug?: string   // ADD
}

interface ParsedTool {
  // existing fields...
  simpleIconSlug?: string   // ADD
}
```

---

## 7. RICHTTEXT.TSX — EXTENDED RENDERERS

Update `components/RichText.tsx` to handle all existing node types plus new ones:

```ts
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'

const renderOptions = {
  renderMark: {
    [MARKS.CODE]: (text) => <code className="inline-code">{text}</code>,
    [MARKS.BOLD]: (text) => <strong>{text}</strong>,
    [MARKS.ITALIC]: (text) => <em>{text}</em>,
  },
  renderNode: {
    // Block elements
    [BLOCKS.PARAGRAPH]: (node, children) => <p>{children}</p>,
    [BLOCKS.HEADING_2]: (node, children) => <h2>{children}</h2>,
    [BLOCKS.HEADING_3]: (node, children) => <h3>{children}</h3>,
    [BLOCKS.UL_LIST]: (node, children) => <ul className="article-list">{children}</ul>,
    [BLOCKS.OL_LIST]: (node, children) => <ol className="article-list">{children}</ol>,
    [BLOCKS.LIST_ITEM]: (node, children) => <li>{children}</li>,
    [BLOCKS.QUOTE]: (node, children) => <blockquote>{children}</blockquote>,
    [BLOCKS.HR]: () => <hr className="art-divider" />,
    
    // Embedded assets (images hosted in Contentful)
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const { file, title, description } = node.data.target.fields
      if (file.contentType.startsWith('image/')) {
        return (
          <figure className="art-img">
            <Image src={`https:${file.url}`} alt={description ?? title ?? ''} 
                   width={file.details.image.width} height={file.details.image.height} />
            {description && <figcaption>{description}</figcaption>}
          </figure>
        )
      }
    },

    // Embedded entries — switch on content type ID
    [BLOCKS.EMBEDDED_ENTRY]: (node) => {
      const entry = node.data.target
      const contentType = entry.sys.contentType.sys.id

      switch (contentType) {
        case 'codeSnippet':
          return <CodeBlock 
            code={entry.fields.code}
            language={entry.fields.language}
            filename={entry.fields.filename}
            caption={entry.fields.caption}
          />
        case 'videoEmbed':
          return <VideoEmbed
            videoType={entry.fields.videoType}
            hostedVideo={entry.fields.hostedVideo}
            externalUrl={entry.fields.externalUrl}
            platform={entry.fields.platform}
            caption={entry.fields.caption}
          />
        case 'embeddedImage':
          return <EmbeddedImage
            asset={entry.fields.asset}
            altText={entry.fields.altText}
            caption={entry.fields.caption}
            fullWidth={entry.fields.fullWidth}
          />
        default:
          return null
      }
    },

    // Inline links
    [INLINES.HYPERLINK]: (node, children) => (
      <a href={node.data.uri} 
         target={node.data.uri.startsWith('http') ? '_blank' : undefined}
         rel={node.data.uri.startsWith('http') ? 'noopener noreferrer' : undefined}>
        {children}
      </a>
    ),
  }
}
```

---

## 8. SEO — FIXES TO IMPLEMENT

### Fix 1: Canonical URL consistency
All canonical URLs and JSON-LD @id values must use `https://www.fieldnotes-ai.com` (with www).
Check: `app/layout.tsx`, `app/page.tsx`, `app/notes/[slug]/page.tsx`, `app/tools/page.tsx`

### Fix 2: `<time>` element for all dates
Replace any date spans with `<time dateTime="YYYY-MM-DD">` throughout.

### Fix 3: JSON-LD — add dateModified to BlogPosting
```ts
"dateModified": note.sys.updatedAt, // Contentful Entry sys field
```
Update `getFieldNoteBySlug()` to include `sys.updatedAt` in the parsed type.

### Fix 4: wordCount — calculate dynamically
```ts
function estimateWordCount(document: Document): number {
  // Walk rich text document nodes, count text node words
}
```

### Fix 5: Home page H1
The wordmark "FieldNotes AI" is the H1. Add a visually hidden subtitle or ensure
the H1 text is descriptive enough. Option: make the dsh-sub paragraph an H2.

---

## 9. ACCESSIBILITY FIXES

1. **Skip to content** — in `app/layout.tsx`:
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black">
  Skip to content
</a>
```

2. **FilterBar aria-pressed** — each filter button:
```tsx
<button aria-pressed={activeCategory === category} onClick={...}>
  {category}
</button>
```

3. **Tool card headings** — tool name must be `<h2>` (active stack) or `<h3>` (also using), not a div.

4. **Nav active state** — `aria-current="page"` on active nav link.

5. **Social icon links** — ensure `aria-label` on all icon-only links.

---

## 10. SIMPLE ICONS — TOOL CARDS

Tool card icons use Simple Icons CDN. Pattern:
```tsx
// Light mode
<img 
  src={`https://cdn.simpleicons.org/${tool.simpleIconSlug}/${encodeURIComponent('57534E')}`}
  alt={tool.name}
  width={20}
  height={20}
/>
// Dark mode — use CSS filter
// img.dark-icon { filter: invert(1); opacity: 0.7; }
```

If `simpleIconSlug` is null, render a fallback: first letter of tool name in a styled div.

---

## 11. PLAYWRIGHT VERIFICATION CHECKPOINTS

After each major section, run Playwright to verify against mockup.

**Checkpoint 1 — Layout shell (Header + Footer):**
```
Open http://localhost:3000
Verify: nav links present, logo visible, dark mode toggle works, footer social links
Compare to: screenshots/before/home.png for current state reference
```

**Checkpoint 2 — Home page:**
```
Open http://localhost:3000
Verify: featured note hero present, note list below, tools preview, bio strip
Check: H1 present, <main id="main-content"> present, <time> elements on dates
```

**Checkpoint 3 — Article page:**
```
Open http://localhost:3000/notes/claude-code-mcp-config-exposed-contentful-management-token
Verify: breadcrumb, H1 title, dek, stats strip (if fields populated), rich text body
Check: <article> wraps content, <time dateTime> on published date, prev/next nav
Check: ol/ul lists render with correct indentation and bullet/number styles
```

**Checkpoint 4 — Tools page:**
```
Open http://localhost:3000/tools
Verify: filter buttons render, aria-pressed toggles on click, tool cards show icons
Check: h2/h3 headings on tool names (not divs), breadcrumb present
```

**Checkpoint 5 — SEO audit:**
```
For each page, verify in page source (not rendered DOM):
- <title> tag present and correct
- <meta name="description"> present
- <link rel="canonical"> points to www version
- JSON-LD script tag present and valid
- <html lang="en"> present
```

---

## 12. LIB/CONTENTFUL.TS — UPDATES

### Update getFeaturedFieldNote():
```ts
export async function getFeaturedFieldNote(): Promise<ParsedFieldNote | null> {
  // Remove: 'fields.featured': true filter
  // Always return most recent by publishedDate
  const entries = await client.getEntries<IFieldNoteFields>({
    content_type: 'fieldNote',
    order: ['-fields.publishedDate'],
    limit: 1,
    include: 2,
  })
  return entries.items[0] ? parseFieldNote(entries.items[0]) : null
}
```

### Update parseFieldNote() to include new fields:
```ts
function parseFieldNote(entry: Entry<IFieldNoteFields>): ParsedFieldNote {
  return {
    // existing fields...
    sessionCost: entry.fields.sessionCost,
    totalTokens: entry.fields.totalTokens,
    modelUsed: entry.fields.modelUsed,
    updatedAt: entry.sys.updatedAt,  // for dateModified in JSON-LD
  }
}
```

### Update parseTool() to include simpleIconSlug:
```ts
function parseTool(entry: Entry<IToolFields>): ParsedTool {
  return {
    // existing fields...
    simpleIconSlug: entry.fields.simpleIconSlug,
  }
}
```

---

## 13. EXECUTION ORDER

Work in this order to ensure the site is never broken mid-refactor:

1. `next.config.mjs` — remove ignoreBuildErrors (commit alone)
2. `app/globals.css` — consolidate design tokens
3. `lib/types.ts` — add new field types
4. `lib/contentful.ts` — update parse functions + getFeaturedFieldNote
5. `app/layout.tsx` — skip-to-content, html lang, dark mode class
6. `components/NavLink.tsx` — new client component for active state
7. `components/Header.tsx` — refactor to server component using NavLink
8. `components/Footer.tsx` — rebuild
9. → **Playwright Checkpoint 1**
10. `components/FeaturedNote.tsx` — new
11. `components/NoteListItem.tsx` — new
12. `app/page.tsx` — rebuild home page
13. → **Playwright Checkpoint 2**
14. `components/StatsStrip.tsx` — new
15. `components/PullQuote.tsx` — new
16. `components/Callout.tsx` — new
17. `components/CodeBlock.tsx` — new
18. `components/ArticleNav.tsx` — new
19. `components/Breadcrumb.tsx` — new
20. `components/RichText.tsx` — extend with all renderers
21. `app/notes/[slug]/page.tsx` — rebuild article page
22. → **Playwright Checkpoint 3**
23. `components/FilterBar.tsx` — new client component
24. `components/ToolCard.tsx` — rebuild
25. `app/tools/page.tsx` — rebuild tools page
26. → **Playwright Checkpoint 4**
27. SEO pass — canonical URLs, JSON-LD, generateMetadata on all pages
28. → **Playwright Checkpoint 5**
29. Delete deprecated components: AboutStrip, SectionLabel, theme-provider
30. `npm run build` — must pass with zero TypeScript errors
31. Commit, push, open PR

---

## 14. PHASE 2 — DO NOT IMPLEMENT NOW

These are planned but out of scope for this branch:

- Rich Text embedded entry content types (codeSnippet, videoEmbed, embeddedImage) — content model + migration
- MCP publishing workflow (publish-field-note slash command)
- Tool upsert automation
- Dynamic OG image generation via @vercel/og
- Cross-posting to Dev.to

---

## 15. MOCKUP REFERENCE FILES

The three HTML mockup files are the visual source of truth. Reference them throughout:
- `1_Home__4_.html` — Home page (both light + dark tabs)
- `2_Article__1_.html` — Article/Field Note page
- `3_Tools.html` — Tools page

When in doubt about a visual detail, the dark mode tab of each mockup is the primary design.

---

## 16. NOTES FOR CLAUDE CODE

- Never use `any` type — if you don't know the type, use `unknown` and narrow it
- Never use `// @ts-ignore` — fix the underlying issue
- Prefer `async/await` over `.then()` chains
- All data fetching in server components — no `useEffect` for data
- Client components only for: active nav state, filter toggles, copy button on code blocks
- `<Image>` from next/image for all images — no raw `<img>` except Simple Icons (external CDN, acceptable exception)
- Tailwind utility classes for layout/spacing — CSS custom properties for design tokens (colors, fonts)
- Run `npm run build` after every checkpoint — zero tolerance for TypeScript errors

