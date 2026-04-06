import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function embedQuery(query: string): Promise<number[]> {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: [query],
      model: 'voyage-3.5-lite',
      input_type: 'query',
    }),
  })

  if (!response.ok) {
    throw new Error(`Voyage API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

export async function POST(request: Request) {
  const { query } = await request.json()

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return new Response('Missing query', { status: 400 })
  }

  const embedding = await embedQuery(query.trim())

  const { data: chunks, error } = await supabase.rpc('match_fieldnotes_chunks', {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 5,
  })

  if (error) {
    console.error('Supabase RPC error:', error)
    return new Response('Search failed', { status: 500 })
  }

  if (!chunks || chunks.length === 0) {
    return new Response(
      JSON.stringify({ answer: "I don't have a Field Note about that yet." }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  const context = chunks
    .map(
      (c: { field_note_number: string; field_note_title: string; section_title: string | null; content: string }) =>
        `[#${c.field_note_number}: ${c.field_note_title}${c.section_title ? ` — ${c.section_title}` : ''}]\n${c.content}`
    )
    .join('\n\n---\n\n')

  const userMessage = `Field Notes:\n\n${context}\n\nQuestion: ${query}`

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: `You are a search assistant for fieldnotes-ai.com, a practitioner journal documenting AI-assisted development workflows. Answer the user's question based ONLY on the Field Notes provided as context. Cite specific notes inline using the exact 3-digit format like "#003" or "#011" — always zero-padded to 3 digits. Keep answers to 2-4 sentences. If the provided notes don't contain a relevant answer, respond with exactly: "I don't have a Field Note about that yet."`,
    messages: [{ role: 'user', content: userMessage }],
  })

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
