import { config } from 'dotenv'
config({ path: '.env.local' })

import { getAllFieldNotes } from '../lib/contentful'
import { extractChunks, upsertChunks } from '../lib/embed'

async function main() {
  console.log('Fetching field notes from Contentful...')
  const fieldNotes = await getAllFieldNotes()
  console.log(`Found ${fieldNotes.length} field notes`)

  for (const note of fieldNotes) {
    const chunks = extractChunks(note)
    console.log(`  #${note.entryNumber}: ${chunks.length} chunks`)
    const inserted = await upsertChunks(note.slug, chunks)
    console.log(`    → inserted ${inserted} chunks`)
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
