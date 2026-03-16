import { createClient, type Entry, type EntrySkeletonType } from 'contentful'
import { BLOCKS } from '@contentful/rich-text-types'
import type {
  IGlobalSettingsSkeleton,
  IFieldNoteSkeleton,
  IToolSkeleton,
  INavigationItemSkeleton,
  ISocialLinkSkeleton,
  ISeoSkeleton,
  ParsedGlobalSettings,
  ParsedFieldNote,
  ParsedTool,
  ParsedNavigationItem,
  ParsedSocialLink,
  ParsedSeo,
} from './types'

// Resolved entry type — fields without locale wrapper
type ResolvedEntry<T extends EntrySkeletonType> = Entry<T, undefined, string>

// Helper to check if Contentful is configured
function isContentfulConfigured(): boolean {
  return !!(process.env.CONTENTFUL_SPACE_ID && process.env.CONTENTFUL_ACCESS_TOKEN)
}

// Lazy Contentful client — only created when env vars are present
function getClient() {
  return createClient({
    space: process.env.CONTENTFUL_SPACE_ID!,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
    environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
  })
}

// Parse navigation item
function parseNavigationItem(item: ResolvedEntry<INavigationItemSkeleton>): ParsedNavigationItem {
  return {
    label: item.fields.label || '',
    url: item.fields.url || '/',
    openInNewTab: item.fields.openInNewTab || false,
    isExternal: item.fields.isExternal || false,
  }
}

// Parse social link
function parseSocialLink(link: ResolvedEntry<ISocialLinkSkeleton>): ParsedSocialLink {
  return {
    platform: link.fields.platform || '',
    url: link.fields.url || '',
    handle: link.fields.handle,
  }
}

// Parse SEO
function parseSeo(seo: ResolvedEntry<ISeoSkeleton> | undefined): ParsedSeo | undefined {
  if (!seo?.fields) return undefined
  const ogImage = seo.fields.ogImage
  const imageUrl = ogImage && 'fields' in ogImage ? ogImage.fields?.file?.url : undefined
  return {
    ogTitle: seo.fields.ogTitle,
    ogDescription: seo.fields.ogDescription,
    ogImageUrl: imageUrl ? `https:${imageUrl}` : undefined,
    ogImageAltText: seo.fields.ogImageAltText,
    ogType: seo.fields.ogType,
    ogMetaKeywords: seo.fields.ogMetaKeywords,
    robotsNoIndex: seo.fields.robotsNoIndex,
    robotsNoFollow: seo.fields.robotsNoFollow,
    robotsNoArchive: seo.fields.robotsNoArchive,
    robotsUnavailableAfter: seo.fields.robotsUnavailableAfter,
    sitemap: seo.fields.sitemap,
  }
}

// Parse tool
function parseTool(tool: ResolvedEntry<IToolSkeleton>): ParsedTool {
  return {
    name: tool.fields.name || '',
    slug: tool.fields.slug || '',
    description: tool.fields.description,
    category: tool.fields.category,
    vendor: tool.fields.vendor,
    url: tool.fields.url,
    status: tool.fields.status || 'Active',
    sortOrder: tool.fields.sortOrder || 0,
    simpleIconSlug: tool.fields.simpleIconSlug,
    notes: tool.fields.notes,
  }
}

// Parse field note
function parseFieldNote(note: ResolvedEntry<IFieldNoteSkeleton>): ParsedFieldNote {
  return {
    entryNumber: note.fields.entryNumber || 0,
    title: note.fields.title || '',
    slug: note.fields.slug || '',
    dek: note.fields.dek,
    entryType: note.fields.entryType || 'Observing',
    body: note.fields.body,
    publishedDate: note.fields.publishedDate || new Date().toISOString(),
    readingTimeMinutes: note.fields.readingTimeMinutes,
    relatedTools: (note.fields.relatedTools || [])
      .filter((t): t is ResolvedEntry<IToolSkeleton> => 'fields' in t && !!t.fields)
      .map(parseTool),
    seo: note.fields.seo ? parseSeo(note.fields.seo as unknown as ResolvedEntry<ISeoSkeleton>) : undefined,
    featured: note.fields.featured || false,
    sessionCost: note.fields.sessionCost,
    totalTokens: note.fields.totalTokens,
    modelUsed: note.fields.modelUsed,
    updatedAt: note.sys.updatedAt,
  }
}

// Fetch global settings
export async function getGlobalSettings(): Promise<ParsedGlobalSettings | null> {
  if (!isContentfulConfigured()) {
    return getDefaultGlobalSettings()
  }

  try {
    const response = await getClient().getEntries<IGlobalSettingsSkeleton>({
      content_type: 'globalSettings',
      limit: 1,
      include: 2,
    })

    if (response.items.length === 0) {
      return getDefaultGlobalSettings()
    }

    const settings = response.items[0]
    const logoAsset = settings.fields.logo
    const logoUrl = logoAsset && 'fields' in logoAsset ? logoAsset.fields?.file?.url : undefined
    return {
      siteName: settings.fields.siteName || 'FieldNotes AI',
      domain: settings.fields.domain,
      logoUrl: logoUrl ? `https:${logoUrl}` : undefined,
      primaryNavigation: (settings.fields.primaryNavigation || [])
        .filter((n): n is ResolvedEntry<INavigationItemSkeleton> => 'fields' in n && !!n.fields)
        .map(parseNavigationItem),
      socialLinks: (settings.fields.socialLinks || [])
        .filter((s): s is ResolvedEntry<ISocialLinkSkeleton> => 'fields' in s && !!s.fields)
        .map(parseSocialLink),
      copyright: settings.fields.copyright,
      defaultSeo: settings.fields.defaultSeoMetadata
        ? parseSeo(settings.fields.defaultSeoMetadata as unknown as ResolvedEntry<ISeoSkeleton>)
        : undefined,
    }
  } catch (error) {
    console.error('Error fetching global settings:', error)
    return getDefaultGlobalSettings()
  }
}

// Default global settings when Contentful is not configured
function getDefaultGlobalSettings(): ParsedGlobalSettings {
  return {
    siteName: 'FieldNotes AI',
    primaryNavigation: [
      { label: 'Field Notes', url: '/notes', openInNewTab: false, isExternal: false },
      { label: 'My Tools', url: '/tools', openInNewTab: false, isExternal: false },
    ],
    socialLinks: [
      { platform: 'X', url: 'https://x.com/fieldnotes-ai', handle: '@fieldnotes_ai' },
      { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/nikakarl' },
      { platform: 'GitHub', url: 'https://github.com/fieldnotes-ai' },
    ],
    copyright: '2026 Nika Karliuchenko',
  }
}

// Fetch all field notes
export async function getAllFieldNotes(): Promise<ParsedFieldNote[]> {
  if (!isContentfulConfigured()) {
    return getDefaultFieldNotes()
  }

  try {
    const response = await getClient().getEntries<IFieldNoteSkeleton>({
      content_type: 'fieldNote',
      order: ['-fields.publishedDate'],
      include: 2,
    })

    return response.items.map(parseFieldNote)
  } catch (error) {
    console.error('Error fetching field notes:', error)
    return getDefaultFieldNotes()
  }
}

// Fetch featured field note (most recent by publishedDate)
export async function getFeaturedFieldNote(): Promise<ParsedFieldNote | null> {
  if (!isContentfulConfigured()) {
    const notes = getDefaultFieldNotes()
    return notes[0] || null
  }

  try {
    const response = await getClient().getEntries<IFieldNoteSkeleton>({
      content_type: 'fieldNote',
      order: ['-fields.publishedDate'],
      limit: 1,
      include: 2,
    })

    return response.items.length > 0 ? parseFieldNote(response.items[0]) : null
  } catch (error) {
    console.error('Error fetching featured note:', error)
    return null
  }
}

// Fetch field note by slug
export async function getFieldNoteBySlug(slug: string): Promise<ParsedFieldNote | null> {
  if (!isContentfulConfigured()) {
    const notes = getDefaultFieldNotes()
    return notes.find((n) => n.slug === slug) || null
  }

  try {
    const response = await getClient().getEntries<IFieldNoteSkeleton>({
      content_type: 'fieldNote',
      'fields.slug': slug,
      limit: 1,
      include: 2,
    })

    return response.items.length > 0 ? parseFieldNote(response.items[0]) : null
  } catch (error) {
    console.error('Error fetching field note by slug:', error)
    return null
  }
}

// Fetch all tools
export async function getAllTools(): Promise<ParsedTool[]> {
  if (!isContentfulConfigured()) {
    return getDefaultTools()
  }

  try {
    const response = await getClient().getEntries<IToolSkeleton>({
      content_type: 'tool',
      order: ['fields.sortOrder'],
    })

    return response.items.map(parseTool)
  } catch (error) {
    console.error('Error fetching tools:', error)
    return getDefaultTools()
  }
}

// Fetch active tools
export async function getActiveTools(): Promise<ParsedTool[]> {
  if (!isContentfulConfigured()) {
    return getDefaultTools().filter((t) => t.status === 'Active')
  }

  try {
    const response = await getClient().getEntries<IToolSkeleton>({
      content_type: 'tool',
      'fields.status': 'Active',
      order: ['fields.sortOrder'],
    })

    return response.items.map(parseTool)
  } catch (error) {
    console.error('Error fetching active tools:', error)
    return []
  }
}

// Default field notes for demo
function getDefaultFieldNotes(): ParsedFieldNote[] {
  return [
    {
      entryNumber: 1,
      title: 'Why I Started This Journal',
      slug: 'why-i-started-this-journal',
      dek: 'A reflection on the intersection of content infrastructure and artificial intelligence, and why documenting the journey matters.',
      entryType: 'Observing',
      publishedDate: '2026-03-01T12:00:00.000Z',
      readingTimeMinutes: 5,
      relatedTools: [],
      featured: true,
      body: {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: 'text' as const,
                value: 'The landscape of content management is shifting beneath our feet. What was once a straightforward process of creating, organizing, and publishing content has become something far more complex and interesting.',
                marks: [],
                data: {},
              },
            ],
          },
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: 'text' as const,
                value: 'This journal is my attempt to document that shift as it happens, from the perspective of someone deeply embedded in the infrastructure that makes content possible.',
                marks: [],
                data: {},
              },
            ],
          },
        ],
      },
    },
    {
      entryNumber: 2,
      title: 'Testing Claude with Structured Content',
      slug: 'testing-claude-structured-content',
      dek: 'Early experiments with feeding CMS-structured content to large language models reveal surprising patterns.',
      entryType: 'Testing',
      publishedDate: '2026-02-15T12:00:00.000Z',
      readingTimeMinutes: 8,
      relatedTools: [],
      featured: false,
    },
    {
      entryNumber: 3,
      title: 'Building a Content Graph',
      slug: 'building-content-graph',
      dek: 'How connecting content nodes through relationships creates emergent intelligence.',
      entryType: 'Building',
      publishedDate: '2026-02-01T12:00:00.000Z',
      readingTimeMinutes: 12,
      relatedTools: [],
      featured: false,
    },
    {
      entryNumber: 4,
      title: 'What Makes Content AI-Ready',
      slug: 'what-makes-content-ai-ready',
      dek: 'The structural decisions that determine whether your content can participate in the AI revolution.',
      entryType: 'Learning',
      publishedDate: '2026-01-20T12:00:00.000Z',
      readingTimeMinutes: 6,
      relatedTools: [],
      featured: false,
    },
  ]
}

// Default tools for demo
function getDefaultTools(): ParsedTool[] {
  return [
    {
      name: 'Contentful',
      slug: 'contentful',
      description: 'Headless CMS for structured content. Content modeling is where I spend most of my time professionally.',
      category: 'CMS',
      vendor: 'Contentful',
      url: 'https://contentful.com',
      status: 'Active',
      sortOrder: 1,
      simpleIconSlug: 'contentful',
    },
    {
      name: 'Claude API',
      slug: 'claude',
      description: 'Primary AI model for everything on this site. Sonnet for most tasks, Opus for complex reasoning.',
      category: 'AI Model',
      vendor: 'Anthropic',
      url: 'https://anthropic.com',
      status: 'Active',
      sortOrder: 2,
      simpleIconSlug: 'anthropic',
      notes: 'Currently testing claude-sonnet-4-6 for structured output generation in Next.js API routes.',
    },
    {
      name: 'Vercel',
      slug: 'vercel',
      description: 'Deployment and hosting. Auto-deploys on push. Zero configuration needed for Next.js.',
      category: 'Infrastructure',
      vendor: 'Vercel',
      url: 'https://vercel.com',
      status: 'Active',
      sortOrder: 3,
      simpleIconSlug: 'vercel',
    },
    {
      name: 'Next.js',
      slug: 'nextjs',
      description: 'App Router + React Server Components. The foundation this site is built on.',
      category: 'Dev Tool',
      vendor: 'Vercel',
      url: 'https://nextjs.org',
      status: 'Testing',
      sortOrder: 4,
      simpleIconSlug: 'nextdotjs',
    },
  ]
}

// For generating static params
export async function getAllFieldNoteSlugs(): Promise<string[]> {
  if (!isContentfulConfigured()) {
    return getDefaultFieldNotes().map((n) => n.slug)
  }

  try {
    const response = await getClient().getEntries<IFieldNoteSkeleton>({
      content_type: 'fieldNote',
      select: ['fields.slug'],
    })

    return response.items.map((item) => item.fields.slug)
  } catch (error) {
    console.error('Error fetching field note slugs:', error)
    return []
  }
}
