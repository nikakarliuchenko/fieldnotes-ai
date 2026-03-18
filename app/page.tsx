import type { Metadata } from 'next'
import Image from 'next/image'
import { getGlobalSettings, getFeaturedFieldNote, getAllFieldNotes, getActiveTools } from '@/lib/contentful'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FeaturedNote from '@/components/FeaturedNote'
import NoteListItem from '@/components/NoteListItem'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getGlobalSettings()
  const seo = settings?.defaultSeo

  const title = seo?.ogTitle || 'FieldNotes AI — Content infrastructure meets AI'
  const description = seo?.ogDescription || 'A practitioner journal documenting real-time AI development. Field notes on building with LLMs, Contentful, and modern web infrastructure.'
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fieldnotes-ai.com'

  return {
    title,
    description,
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title,
      description,
      url: baseUrl,
      type: 'website',
      ...(seo?.ogImageUrl && {
        images: [
          {
            url: seo.ogImageUrl,
            width: 1200,
            height: 630,
            alt: seo?.ogImageAltText || 'FieldNotes AI',
          },
        ],
      }),
    },
  }
}

export default async function HomePage() {
  const [settings, featuredNote, allNotes, tools] = await Promise.all([
    getGlobalSettings(),
    getFeaturedFieldNote(),
    getAllFieldNotes(),
    getActiveTools(),
  ])

  const otherNotes = allNotes
    .filter((note) => note.slug !== featuredNote?.slug)
    .slice(0, 5)

  return (
    <>
      <Header navigation={settings?.primaryNavigation || []} socialLinks={settings?.socialLinks || []} />

      <header className="site-header">
        <div className="sh-eyebrow">VOL. I &nbsp;&middot;&nbsp; BOSTON, MA &nbsp;&middot;&nbsp; 2026</div>
        <div className="sh-top">
          <h1 className="sh-wordmark">FieldNotes<span>AI</span></h1>
          <div className="sh-photo" aria-label="Nika Karliuchenko">
            <Image
              src="/nika.jpg"
              alt="Nika Karliuchenko"
              width={76}
              height={76}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              priority
            />
          </div>
        </div>
        <p className="sh-sub">What happens when content infrastructure meets AI</p>
        <address className="sh-byline">
          By <a href="https://www.linkedin.com/in/nikakarl" target="_blank" rel="author noopener noreferrer">Nika Karliuchenko</a>
        </address>
      </header>

      <main id="main-content" className="col">
        {featuredNote && (
          <section aria-label="Featured note">
            <FeaturedNote note={featuredNote} />
          </section>
        )}

        {otherNotes.length > 0 && (
          <section className="notes-section" aria-label="Recent notes">
            <div className="sec-hd">
              <span>Recent Field Notes</span>
              <a href="/notes" className="sec-view-all">View all →</a>
            </div>
            <div className="notes-list">
              {otherNotes.map((note) => (
                <NoteListItem key={note.slug} note={note} />
              ))}
            </div>
          </section>
        )}

        {!featuredNote && otherNotes.length === 0 && (
          <section className="empty-state">
            <p>No notes yet — check back soon.</p>
          </section>
        )}

        {tools.length > 0 && (
          <section className="tools-section" aria-label="Tools">
            <div className="sec-hd">
              <span>My Tools</span>
            </div>
            <div className="tools-strip">
              {tools.map((tool) => (
                <a
                  key={tool.slug}
                  href={tool.url || '#'}
                  target={tool.url ? '_blank' : undefined}
                  rel={tool.url ? 'noopener noreferrer' : undefined}
                  className={`tool-home${tool.status === 'Active' ? ' now' : ''}`}
                >
                  <div className="tool-home-name">{tool.name}</div>
                  {tool.description && <div className="tool-home-desc">{tool.description}</div>}
                  {tool.category && <span className="tool-home-tag">{tool.category}</span>}
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="bio">
          <strong>Nika Karliuchenko</strong> is a content infrastructure specialist exploring the
          intersection of structured content and artificial intelligence. Based in Boston, she
          documents her experiments and observations in this field journal.
        </div>
      </main>

      <Footer copyright={settings?.copyright} socialLinks={settings?.socialLinks || []} />
    </>
  )
}
