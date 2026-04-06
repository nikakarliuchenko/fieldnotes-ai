import { config } from 'dotenv'
config({ path: '.env.local' })

import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer'
import { createClient } from '@supabase/supabase-js'
import { getAllFieldNotes } from '../lib/contentful'
import { BLOCKS } from '@contentful/rich-text-types'
import type { ParsedFieldNote } from '../lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Chunk {
  field_note_slug: string
  field_note_number: string
  field_note_title: string
  section_title: string | null
  content: string
  published_date: string | null
}

function extractChunks(note: ParsedFieldNote): Chunk[] {
  const body = note.body
  if (!body?.content) return []

  const slug = note.slug
  const number = String(note.entryNumber)
  const title = note.title
  const publishedDate = note.publishedDate ?? null

  const chunks: Chunk[] = []
  let currentHeading: string | null = null
  let currentNodes: unknown[] = []

  function flushChunk() {
    if (currentNodes.length === 0) return
    const doc = { nodeType: 'document', content: currentNodes, data: {} }
    const text = documentToPlainTextString(doc as Parameters<typeof documentToPlainTextString>[0]).trim()
    if (!text) return

    chunks.push({
      field_note_slug: slug,
      field_note_number: number,
      field_note_title: title,
      section_title: currentHeading,
      content: currentHeading ? `${currentHeading}\n\n${text}` : text,
      published_date: publishedDate,
    })
    currentNodes = []
  }

  for (const node of body.content) {
    if (node.nodeType === BLOCKS.HEADING_2) {
      flushChunk()
      currentHeading = node.content
        .filter((n) => n.nodeType === 'text')
        .map((n) => (n as { value: string }).value)
        .join('')
    } else {
      currentNodes.push(node)
    }
  }
  flushChunk()

  // Merge short chunks (under 50 words) with the next chunk
  const merged: Chunk[] = []
  for (let i = 0; i < chunks.length; i++) {
    const wordCount = chunks[i].content.split(/\s+/).length
    if (wordCount < 50 && i < chunks.length - 1) {
      const next = chunks[i + 1]
      chunks[i + 1] = {
        ...next,
        content: `${chunks[i].content}\n\n${next.content}`,
      }
    } else {
      merged.push(chunks[i])
    }
  }

  return merged
}

async function embedTexts(texts: string[]): Promise<number[][]> {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: texts,
      model: 'voyage-3.5-lite',
      input_type: 'document',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Voyage API error: ${err}`)
  }

  const data = await response.json()
  return data.data.map((d: { embedding: number[] }) => d.embedding)
}

async function main() {
  console.log('Fetching field notes from Contentful...')
  const fieldNotes = await getAllFieldNotes()
  console.log(`Found ${fieldNotes.length} field notes`)

  const allChunks: Chunk[] = []
  for (const note of fieldNotes) {
    const chunks = extractChunks(note)
    console.log(`  #${note.entryNumber}: ${chunks.length} chunks`)
    allChunks.push(...chunks)
  }
  console.log(`\nTotal chunks: ${allChunks.length}`)

  // Embed in batches of 20
  const BATCH_SIZE = 20
  const embeddings: number[][] = []

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE)
    console.log(`Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allChunks.length / BATCH_SIZE)}...`)
    const batchEmbeddings = await embedTexts(batch.map((c) => c.content))
    embeddings.push(...batchEmbeddings)
  }

  // Clear existing chunks then insert fresh
  const slugs = [...new Set(allChunks.map((c) => c.field_note_slug))]
  console.log(`\nClearing existing chunks for ${slugs.length} slugs...`)
  const { error: deleteError } = await supabase
    .from('fieldnotes_chunks')
    .delete()
    .in('field_note_slug', slugs)
  if (deleteError) throw deleteError

  console.log('Inserting new chunks...')
  const rows = allChunks.map((chunk, i) => ({
    ...chunk,
    embedding: embeddings[i],
  }))

  const { error: insertError } = await supabase
    .from('fieldnotes_chunks')
    .insert(rows)
  if (insertError) throw insertError

  console.log(`\nDone. Inserted ${rows.length} chunks.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
