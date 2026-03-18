import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getGlobalSettings, getFieldNoteBySlug, getAllFieldNoteSlugs, getAllFieldNotes } from '@/lib/contentful'
import { formatDate, formatEntryNumber, getTagClass, estimateWordCount } from '@/lib/format'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RichText from '@/components/RichText'
import Breadcrumb from '@/components/Breadcrumb'
import StatsStrip from '@/components/StatsStrip'
import ArticleNav from '@/components/ArticleNav'
import ToolCard from '@/components/ToolCard'

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
      images: [
        {
          url: seo?.ogImageUrl || `${baseUrl}/og?title=${encodeURIComponent(note.title)}&dek=${encodeURIComponent(note.dek || '')}&entryNumber=${note.entryNumber}&entryType=${note.entryType}&date=${note.publishedDate}`,
          width: 1200,
          height: 630,
          alt: seo?.ogImageAltText || note.title,
        },
      ],
    },
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

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fieldnotes-ai.com'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: note.title,
    description: note.dek || '',
    datePublished: note.publishedDate,
    dateModified: note.updatedAt || note.publishedDate,
    author: {
      '@type': 'Person',
      name: 'Nika Karliuchenko',
      url: 'https://www.fieldnotes-ai.com',
    },
    publisher: {
      '@type': 'Person',
      name: 'Nika Karliuchenko',
    },
    url: `${baseUrl}/notes/${slug}`,
    mainEntityOfPage: `${baseUrl}/notes/${slug}`,
    ...(note.body ? { wordCount: estimateWordCount(note.body) } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header navigation={settings?.primaryNavigation || []} socialLinks={settings?.socialLinks || []} />

      <main className="col">
        <Breadcrumb items={[
          { label: 'Field Notes', href: '/' },
          { label: formatEntryNumber(note.entryNumber) },
        ]} />

        <article>
          <header className="art-header">
            <div className="art-meta">
              <span className="art-num">{formatEntryNumber(note.entryNumber)}</span>
              <span className={`lbl ${getTagClass(note.entryType)}`}>{note.entryType}</span>
              {note.sessionCost && (
                <span className="art-cost">Session cost: {note.sessionCost}</span>
              )}
              <time className="art-date" dateTime={note.publishedDate}>
                {formatDate(note.publishedDate)}
              </time>
            </div>

            <h1 className="art-title">{note.title}</h1>

            {note.dek && <p className="art-lede">{note.dek}</p>}

            <div className="art-byline">
              <span>By <a href="/">Nika Karliuchenko</a></span>
              <span className="art-byline-sep">&middot;</span>
              {note.readingTimeMinutes && (
                <>
                  <span>{note.readingTimeMinutes} min read</span>
                  <span className="art-byline-sep">&middot;</span>
                </>
              )}
              <time dateTime={note.publishedDate}>{formatDate(note.publishedDate)}</time>
            </div>
          </header>

          <StatsStrip
            sessionCost={note.sessionCost}
            totalTokens={note.totalTokens}
            modelUsed={note.modelUsed}
          />

          {note.body && <RichText content={note.body} showDropCap />}

          <ArticleNav prevNote={prevNote} nextNote={nextNote} />
        </article>

        {note.relatedTools && note.relatedTools.length > 0 && (
          <aside>
            <h2 className="art-body" style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
              Tools Mentioned
            </h2>
            <div className="tools-grid">
              {note.relatedTools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </aside>
        )}
      </main>

      <Footer copyright={settings?.copyright} socialLinks={settings?.socialLinks || []} />
    </>
  )
}
