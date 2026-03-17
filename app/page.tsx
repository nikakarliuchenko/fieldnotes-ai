import type { Metadata } from 'next'
import { getGlobalSettings, getFeaturedFieldNote, getAllFieldNotes, getActiveTools } from '@/lib/contentful'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FeaturedNote from '@/components/FeaturedNote'
import NoteListItem from '@/components/NoteListItem'
import ToolCard from '@/components/ToolCard'

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

  const otherNotes = allNotes.filter(
    (note) => note.slug !== featuredNote?.slug
  )

  return (
    <main id="main-content" className="container">
      <Header navigation={settings?.primaryNavigation || []} socialLinks={settings?.socialLinks || []} />

      {featuredNote && (
        <section aria-label="Featured note">
          <FeaturedNote note={featuredNote} />
        </section>
      )}

      {otherNotes.length > 0 && (
        <section className="notes-section" aria-label="Recent notes">
          <h2 className="section-label">Recent Field Notes</h2>
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
          <h2 className="section-label">My Tools</h2>
          <div className="tools-grid">
            {tools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      )}

      <Footer copyright={settings?.copyright} socialLinks={settings?.socialLinks || []} />
    </main>
  )
}
