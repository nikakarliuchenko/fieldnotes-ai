import { getAllFieldNotes } from '@/lib/contentful'
import { formatEntryNumber } from '@/lib/format'

export const revalidate = 60

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fieldnotes-ai.com'
  const notes = await getAllFieldNotes()

  const noteLines = notes
    .map((note) => `- ${formatEntryNumber(note.entryNumber)} ${note.title} — ${baseUrl}/notes/${note.slug}`)
    .join('\n')

  const body = `# FieldNotes AI
> A practitioner journal documenting real-time AI development.

## Author
Nika Karliuchenko — content infrastructure specialist exploring the intersection of structured content and artificial intelligence.
- https://www.linkedin.com/in/nikakarl
- https://x.com/nikaukraine
- https://github.com/nikakarliuchenko

## Field Notes
${noteLines}

## Pages
- Home: ${baseUrl}
- Notes: ${baseUrl}/notes
- Tools: ${baseUrl}/tools
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
