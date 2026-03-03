import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGlobalSettings, getFieldNoteBySlug, getAllFieldNoteSlugs, getAllFieldNotes } from '@/lib/contentful'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RichText from '@/components/RichText'
import ToolCard from '@/components/ToolCard'
import SectionLabel from '@/components/SectionLabel'

export const revalidate = 60

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllFieldNoteSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const note = await getFieldNoteBySlug(slug)
  const settings = await getGlobalSettings()

  if (!note) {
    return { title: 'Note Not Found' }
  }

  return {
    title: note.seo?.ogTitle || `${note.title} | ${settings?.siteName || 'FieldNotes AI'}`,
    description: note.seo?.ogDescription || note.dek || '',
    openGraph: {
      title: note.seo?.ogTitle || note.title,
      description: note.seo?.ogDescription || note.dek || '',
      type: (note.seo?.ogType as 'article') || 'article',
      images: note.seo?.ogImageUrl ? [note.seo.ogImageUrl] : undefined,
    },
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatEntryNumber(num: number): string {
  return `#${String(num).padStart(3, '0')}`
}

function getTagClass(entryType: string): string {
  switch (entryType) {
    case 'Learning':
      return 'tag-learning'
    case 'Building':
      return 'tag-building'
    case 'Testing':
      return 'tag-testing'
    case 'Observing':
    default:
      return 'tag-observing'
  }
}

export default async function NotePage({ params }: PageProps) {
  const { slug } = await params
  const [settings, note, allNotes] = await Promise.all([
    getGlobalSettings(),
    getFieldNoteBySlug(slug),
    getAllFieldNotes(),
  ])

  if (!note) {
    notFound()
  }

  // Find previous and next notes
  const currentIndex = allNotes.findIndex((n) => n.slug === slug)
  const prevNote = currentIndex < allNotes.length - 1 ? allNotes[currentIndex + 1] : null
  const nextNote = currentIndex > 0 ? allNotes[currentIndex - 1] : null

  return (
    <main className="container">
      <Header navigation={settings?.primaryNavigation || []} />

      <article className="note-article animate-fade-in-up">
        {/* Entry Header */}
        <div className="note-header">
          <span className="entry-number">{formatEntryNumber(note.entryNumber)}</span>
          <span className={`tag ${getTagClass(note.entryType)}`}>{note.entryType}</span>
          <span className="entry-date">{formatDate(note.publishedDate)}</span>
          {note.readingTimeMinutes && (
            <span className="reading-time">{note.readingTimeMinutes} min read</span>
          )}
        </div>

        {/* Title */}
        <h1 className="note-title">{note.title}</h1>

        {/* Dek */}
        {note.dek && (
          <p className="note-dek">{note.dek}</p>
        )}

        {/* Body */}
        {note.body && (
          <div className="note-body">
            <RichText content={note.body} showDropCap />
          </div>
        )}

        {/* Related Tools */}
        {note.relatedTools && note.relatedTools.length > 0 && (
          <section className="related-tools animate-fade-in-up animation-delay-100">
            <SectionLabel>Tools Mentioned</SectionLabel>
            <div className="tools-grid">
              {note.relatedTools.map((tool) => (
                <div key={tool.slug} className="tool-cell">
                  <ToolCard tool={tool} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Navigation */}
        <nav className="note-nav animate-fade-in-up animation-delay-200">
          <div className="nav-prev">
            {prevNote && (
              <Link href={`/notes/${prevNote.slug}`} className="nav-link">
                <span className="nav-label">&larr; Previous</span>
                <span className="nav-title">{prevNote.title}</span>
              </Link>
            )}
          </div>
          <div className="nav-next">
            {nextNote && (
              <Link href={`/notes/${nextNote.slug}`} className="nav-link">
                <span className="nav-label">Next &rarr;</span>
                <span className="nav-title">{nextNote.title}</span>
              </Link>
            )}
          </div>
        </nav>
      </article>

      <Footer copyright={settings?.copyright} />

      <style jsx>{`
        .note-article {
          margin-top: 16px;
        }

        .note-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .entry-number {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--accent);
          font-weight: 500;
        }

        .entry-date {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          color: var(--muted);
        }

        .reading-time {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          color: var(--muted);
          margin-left: auto;
        }

        .note-title {
          font-family: var(--font-heading);
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.1;
          margin: 0 0 24px;
          color: var(--ink);
        }

        .note-dek {
          font-family: var(--font-body);
          font-style: italic;
          color: var(--muted);
          font-size: 1.1rem;
          line-height: 1.6;
          margin: 0 0 32px;
          padding-left: 16px;
          border-left: 2px solid var(--accent);
        }

        .note-body {
          margin-bottom: 48px;
        }

        .related-tools {
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid var(--rule);
        }

        .tools-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          border: 1px solid var(--rule);
          gap: 1px;
          background-color: var(--rule);
        }

        .tool-cell {
          background-color: var(--paper);
        }

        .note-nav {
          display: flex;
          justify-content: space-between;
          gap: 32px;
          margin-top: 48px;
          padding-top: 32px;
          border-top: 1px solid var(--rule);
        }

        .nav-prev {
          flex: 1;
        }

        .nav-next {
          flex: 1;
          text-align: right;
        }

        .nav-link {
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .nav-link:hover {
          opacity: 0.7;
        }

        .nav-label {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
        }

        .nav-title {
          font-family: var(--font-heading);
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--ink);
        }

        @media (max-width: 640px) {
          .note-title {
            font-size: 1.8rem;
          }

          .tools-grid {
            grid-template-columns: 1fr;
          }

          .note-nav {
            flex-direction: column;
            gap: 24px;
          }

          .nav-next {
            text-align: left;
          }
        }
      `}</style>
    </main>
  )
}
