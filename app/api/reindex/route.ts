import { NextResponse } from 'next/server'
import type { Document } from '@contentful/rich-text-types'
import type { ParsedFieldNote } from '@/lib/types'
import { extractChunks, upsertChunks } from '@/lib/embed'

export async function POST(request: Request) {
  // 1. Auth check
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token || token !== process.env.REINDEX_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Extract entry ID from webhook payload
  let entryId: string
  try {
    const body = await request.json()
    entryId = body?.sys?.id
    if (!entryId) {
      return NextResponse.json({ error: 'Missing sys.id in payload' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // 3. Fetch full entry from Contentful Delivery API
  const spaceId = process.env.CONTENTFUL_SPACE_ID
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN
  if (!spaceId || !accessToken) {
    return NextResponse.json({ error: 'Contentful not configured' }, { status: 500 })
  }

  const url = `https://cdn.contentful.com/spaces/${spaceId}/entries/${entryId}?access_token=${accessToken}&content_type=fieldNote&include=2`
  const ctfResponse = await fetch(url)

  if (!ctfResponse.ok) {
    const errText = await ctfResponse.text()
    console.error('Contentful fetch error:', errText)
    return NextResponse.json({ error: 'Failed to fetch entry from Contentful' }, { status: 502 })
  }

  const entry = await ctfResponse.json()

  // 4. Parse into ParsedFieldNote (lightweight mapping from REST JSON)
  const fields = entry.fields
  if (!fields?.slug) {
    return NextResponse.json({ error: 'Entry is not a valid fieldNote (missing slug)' }, { status: 422 })
  }

  const note: ParsedFieldNote = {
    entryNumber: fields.entryNumber || 0,
    title: fields.title || '',
    slug: fields.slug || '',
    dek: fields.dek,
    entryType: fields.entryType || 'Observing',
    body: fields.body as Document | undefined,
    publishedDate: fields.publishedDate || new Date().toISOString(),
    readingTimeMinutes: fields.readingTimeMinutes,
    relatedTools: [],
    featured: fields.featured || false,
    sessionCost: fields.sessionCost,
    totalTokens: fields.totalTokens,
    modelUsed: fields.modelUsed,
    updatedAt: entry.sys?.updatedAt,
  }

  // 5. Chunk + embed + upsert
  const chunks = extractChunks(note)
  const inserted = await upsertChunks(note.slug, chunks)

  // 6. Return result
  return NextResponse.json({ ok: true, slug: note.slug, chunks: inserted })
}
