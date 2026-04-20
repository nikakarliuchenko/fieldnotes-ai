import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { supabase } from '../lib/supabase.js'
import { embedQuery } from '../lib/embed.js'

const SEARCH_MATCH_THRESHOLD = parseFloat(process.env.SEARCH_MATCH_THRESHOLD ?? '0.78')

export function registerSearchTool(server: McpServer): void {
  server.tool(
    'search_fieldnotes',
    'Semantic search over existing Field Notes chunks in Supabase. Use this before researching any topic to understand what has already been covered and how deeply. Returns ranked chunks with similarity scores.',
    {
      query: z.string().describe('The search query to find relevant Field Notes content'),
      matchCount: z.number().optional().default(10).describe('Maximum number of results to return (default 10)'),
    },
    async ({ query, matchCount }) => {
      try {
        const queryEmbedding = await embedQuery(query)

        const { data, error } = await supabase.rpc('match_fieldnotes_chunks', {
          query_embedding: queryEmbedding,
          match_threshold: SEARCH_MATCH_THRESHOLD,
          match_count: matchCount,
        })

        if (error) {
          return {
            content: [{ type: 'text' as const, text: `Supabase search error: ${error.message}` }],
            isError: true,
          }
        }

        const results = (data as Array<{
          field_note_slug: string
          field_note_title: string
          section_title: string
          content: string
          similarity: number
        }>).map(row => ({
          slug: row.field_note_slug,
          title: row.field_note_title,
          sectionTitle: row.section_title,
          content: row.content,
          similarity: Math.round(row.similarity * 1000) / 1000,
        }))

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return {
          content: [{ type: 'text' as const, text: `search_fieldnotes error: ${message}` }],
          isError: true,
        }
      }
    },
  )
}
