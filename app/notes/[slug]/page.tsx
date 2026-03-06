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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fieldnotes-ai.com'

  if (!note) {
    return { title: 'Note Not Found' }
  }

  const seo = note.seo
  const title = seo?.ogTitle || note.title
  const description = seo?.ogDescription || note.dek || ''

  return {
    title: seo?.ogTitle || `${note.title} | ${settings?.siteName || 'FieldNotes AI'}`,
    description,
    alternates: {
      canonical: `${baseUrl}/notes/${slug}`,
    },
    ...(seo?.robotsNoIndex !== undefined || seo?.robotsNoFollow !== undefined
      ? {
          robots: {
            index: !seo?.robotsNoIndex,
            follow: !seo?.robotsNoFollow,
          },
        }
      : {}),
    openGraph: {
      title,
      description,
      url: `${baseUrl}/notes/${slug}`,
      type: 'article',
      publishedTime: note.publishedDate,
      ...(seo?.ogImageUrl && {
        images: [
          {
            url: seo.ogImageUrl,
            width: 1200,
            height: 630,
            alt: seo?.ogImageAltText || note.title,
          },
        ],
      }),
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
    <main className="container container-wide">
      <Header navigation={settings?.primaryNavigation || []} socialLinks={settings?.socialLinks || []} />

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

      <Footer copyright={settings?.copyright} socialLinks={settings?.socialLinks || []} />

    </main>
  )
}
