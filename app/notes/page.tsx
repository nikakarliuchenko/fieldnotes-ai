import { Metadata } from 'next'
import Link from 'next/link'
import { getGlobalSettings, getAllFieldNotes, getTotalFieldNotesCount } from '@/lib/contentful'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import NoteListItem from '@/components/NoteListItem'

export const revalidate = 60

const NOTES_PER_PAGE = 10

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

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function NotesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1)
  const skip = (page - 1) * NOTES_PER_PAGE

  const [settings, notes, total] = await Promise.all([
    getGlobalSettings(),
    getAllFieldNotes({ limit: NOTES_PER_PAGE, skip }),
    getTotalFieldNotesCount(),
  ])

  const totalPages = Math.ceil(total / NOTES_PER_PAGE)
  const rangeStart = total > 0 ? skip + 1 : 0
  const rangeEnd = Math.min(skip + NOTES_PER_PAGE, total)

  return (
    <>
      <Header navigation={settings?.primaryNavigation || []} socialLinks={settings?.socialLinks || []} />

      <main className="col">
        <section className="notes-page animate-fade-in-up">
          <div className="sec-hd"><span>All Field Notes</span></div>

          {total > 0 && (
            <div className="pagination-info">
              Showing {rangeStart}&ndash;{rangeEnd} of {total} notes
            </div>
          )}

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

          {totalPages > 1 && (
            <nav className="pagination-nav" aria-label="Pagination">
              {page > 1 ? (
                <Link href={page === 2 ? '/notes' : `/notes?page=${page - 1}`} className="pagination-link">
                  &larr; Previous
                </Link>
              ) : (
                <span />
              )}
              {page < totalPages ? (
                <Link href={`/notes?page=${page + 1}`} className="pagination-link">
                  Next &rarr;
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </main>

      <Footer copyright={settings?.copyright} socialLinks={settings?.socialLinks || []} />
    </>
  )
}
