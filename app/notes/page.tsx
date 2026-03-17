import { Metadata } from 'next'
import { getGlobalSettings, getAllFieldNotes } from '@/lib/contentful'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import NoteListItem from '@/components/NoteListItem'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getGlobalSettings()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fieldnotes-ai.com'
  const title = `Field Notes | ${settings?.siteName || 'FieldNotes AI'}`
  const description = 'All field notes documenting the intersection of content infrastructure and AI.'

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/notes`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/notes`,
      type: 'website',
    },
  }
}

export default async function NotesPage() {
  const [settings, notes] = await Promise.all([
    getGlobalSettings(),
    getAllFieldNotes(),
  ])

  return (
    <main className="container">
      <Header navigation={settings?.primaryNavigation || []} socialLinks={settings?.socialLinks || []} />

      <section className="notes-page animate-fade-in-up">
        <h2 className="section-label">All Field Notes</h2>
        
        {notes.length > 0 ? (
          <div className="notes-list">
            {notes.map((note) => (
              <NoteListItem key={note.slug} note={note} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No notes yet — check back soon.</p>
          </div>
        )}
      </section>

      <Footer copyright={settings?.copyright} socialLinks={settings?.socialLinks || []} />

    </main>
  )
}
