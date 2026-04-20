import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { richTextFromMarkdown } from '@contentful/rich-text-from-markdown'
import { contentfulClient, SPACE_ID, ENVIRONMENT_ID } from '../lib/contentful.js'

interface ValidationResult {
  valid: boolean
  failures: string[]
}

function validateDraft(input: {
  title: string
  slug: string
  dek: string
  body: string
  researchSources: string
}): ValidationResult {
  const failures: string[] = []

  // Metadata completeness
  if (!input.title.trim()) failures.push('title is required and must not be empty')
  if (!input.slug.trim()) failures.push('slug is required and must not be empty')
  if (!input.dek.trim()) failures.push('dek is required and must not be empty')
  if (!input.researchSources.trim()) failures.push('researchSources is required and must not be empty')

  // Slug format
  if (input.slug && !/^[a-z0-9-]+$/.test(input.slug)) {
    failures.push(`slug must match ^[a-z0-9-]+$ — got "${input.slug}"`)
  }

  // Word count (800–3000)
  const wordCount = input.body.trim().split(/\s+/).filter(w => w.length > 0).length
  if (wordCount < 800) failures.push(`body must be at least 800 words — got ${wordCount}`)
  if (wordCount > 3000) failures.push(`body must be at most 3000 words — got ${wordCount}`)

  // Heading structure — at least 3 H2 headings
  const h2Matches = input.body.match(/^## .+/gm)
  const h2Count = h2Matches ? h2Matches.length : 0
  if (h2Count < 3) failures.push(`body must contain at least 3 H2 headings — got ${h2Count}`)

  // Code snippet validation — all code blocks must have a language tag
  const codeBlockOpeners = input.body.match(/^```.*$/gm) ?? []
  for (let i = 0; i < codeBlockOpeners.length; i++) {
    // Openers are at even indices (0, 2, 4...), closers at odd (1, 3, 5...)
    if (i % 2 === 0) {
      const lang = codeBlockOpeners[i].replace(/^```/, '').trim()
      if (!lang) failures.push(`code block ${Math.floor(i / 2) + 1} is missing a language tag`)
    }
  }

  return { valid: failures.length === 0, failures }
}

async function ensureTagExists(tagId: string): Promise<void> {
  try {
    await contentfulClient.tag.get({ spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID, tagId })
  } catch {
    await contentfulClient.tag.createWithId(
      { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID, tagId },
      { name: tagId, sys: { visibility: 'public' } },
    )
  }
}

export function registerPushDraftTool(server: McpServer): void {
  server.tool(
    'push_contentful_draft',
    'Pushes a completed draft Field Note to Contentful as a draft entry. Never publishes. Only call this after research is complete, code is tested, and the quality gate passes. Requires title, slug, dek, body (markdown), researchSources (JSON string), agentSessionId, entryNumber, and tags.',
    {
      title: z.string().describe('Field Note title (max 120 chars)'),
      slug: z.string().describe('URL slug — lowercase alphanumeric and hyphens only'),
      dek: z.string().describe('Subtitle/deck (max 200 chars)'),
      body: z.string().describe('Full body content as a markdown string'),
      researchSources: z.string().describe('JSON string — array of {url, title, summary}'),
      agentSessionId: z.string().describe('Claude Managed Agents session ID'),
      entryNumber: z.number().describe('Unique entry number for this Field Note'),
      tags: z.array(z.string()).describe('Array of tag slugs e.g. ["rag", "mcp", "supabase"]'),
    },
    async ({ title, slug, dek, body, researchSources, agentSessionId, entryNumber, tags }) => {
      try {
        // Quality gate
        const validation = validateDraft({ title, slug, dek, body, researchSources })
        if (!validation.valid) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({
              error: 'Quality gate failed',
              failures: validation.failures,
            }, null, 2) }],
            isError: true,
          }
        }

        // Idempotency check — reject if slug already exists
        const existing = await contentfulClient.entry.getMany({
          spaceId: SPACE_ID,
          environmentId: ENVIRONMENT_ID,
          query: { content_type: 'fieldNote', 'fields.slug': slug, limit: 1 },
        })
        if (existing.items.length > 0) {
          const existingId = existing.items[0].sys.id
          return {
            content: [{ type: 'text' as const, text: `Draft with slug '${slug}' already exists in Contentful (entry ID: ${existingId}). Not creating a duplicate.` }],
            isError: true,
          }
        }

        // Convert markdown to Rich Text
        const richTextBody = await richTextFromMarkdown(body)

        // Parse researchSources JSON
        let parsedSources: unknown
        try {
          parsedSources = JSON.parse(researchSources)
        } catch {
          return {
            content: [{ type: 'text' as const, text: 'researchSources is not valid JSON' }],
            isError: true,
          }
        }

        // Ensure all tags exist as public tags
        for (const tagId of tags) {
          await ensureTagExists(tagId)
        }

        // Create the entry as draft — never publish
        const entry = await contentfulClient.entry.create(
          { spaceId: SPACE_ID, environmentId: ENVIRONMENT_ID, contentTypeId: 'fieldNote' },
          {
            metadata: {
              tags: tags.map(tagId => ({
                sys: { type: 'Link' as const, linkType: 'Tag' as const, id: tagId },
              })),
            },
            fields: {
              internalName: { 'en-US': `Field Note #${entryNumber} — ${title}` },
              title: { 'en-US': title },
              slug: { 'en-US': slug },
              dek: { 'en-US': dek },
              entryType: { 'en-US': 'Building' },
              body: { 'en-US': richTextBody },
              publishedDate: { 'en-US': new Date().toISOString().split('T')[0] },
              entryNumber: { 'en-US': entryNumber },
              featured: { 'en-US': false },
              agentSessionId: { 'en-US': agentSessionId },
              researchSources: { 'en-US': parsedSources },
            },
          },
        )

        const result = {
          entryId: entry.sys.id,
          status: 'draft',
          url: `https://app.contentful.com/spaces/${SPACE_ID}/entries/${entry.sys.id}`,
        }

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          content: [{ type: 'text' as const, text: `push_contentful_draft error: ${message}` }],
          isError: true,
        }
      }
    },
  )
}
