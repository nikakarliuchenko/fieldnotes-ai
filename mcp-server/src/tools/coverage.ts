import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../lib/supabase.js'
import { embedQuery } from '../lib/embed.js'

const COVERAGE_MATCH_THRESHOLD = parseFloat(process.env.COVERAGE_MATCH_THRESHOLD ?? '0.85')

export function registerCoverageTool(server: McpServer): void {
  server.tool(
    'check_topic_coverage',
    'Checks if a proposed topic is too similar to already-published Field Notes. Use this before committing to researching a topic to avoid duplicating existing content. Returns isDuplicate flag and similar notes with similarity scores.',
    {
      topic: z.string().describe('The proposed topic to check for existing coverage'),
    },
    async ({ topic }) => {
      try {
        const queryEmbedding = await embedQuery(topic)

        const { data, error } = await supabase.rpc('match_fieldnotes_chunks', {
          query_embedding: queryEmbedding,
          match_threshold: COVERAGE_MATCH_THRESHOLD,
          match_count: 5,
        })

        if (error) {
          return {
            content: [{ type: 'text' as const, text: `Supabase coverage check error: ${error.message}` }],
            isError: true,
          }
        }

        const rows = data as Array<{
          field_note_slug: string
          field_note_title: string
          similarity: number
        }>

        const similarNotes = rows.map(row => ({
          slug: row.field_note_slug,
          title: row.field_note_title,
          similarity: Math.round(row.similarity * 1000) / 1000,
        }))

        const highestSimilarity = similarNotes.length > 0
          ? Math.max(...similarNotes.map(n => n.similarity))
          : 0

        const result = {
          isDuplicate: highestSimilarity >= COVERAGE_MATCH_THRESHOLD,
          similarNotes,
          highestSimilarity,
        }

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          content: [{ type: 'text' as const, text: `check_topic_coverage error: ${message}` }],
          isError: true,
        }
      }
    },
  )
}
