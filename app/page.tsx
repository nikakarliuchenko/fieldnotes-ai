import { getGlobalSettings, getFeaturedFieldNote, getAllFieldNotes, getActiveTools } from '@/lib/contentful'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FieldNoteCard from '@/components/FieldNoteCard'
import ToolCard from '@/components/ToolCard'
import AboutStrip from '@/components/AboutStrip'
import SectionLabel from '@/components/SectionLabel'

export const revalidate = 60

export default async function HomePage() {
  const [settings, featuredNote, allNotes, tools] = await Promise.all([
    getGlobalSettings(),
    getFeaturedFieldNote(),
    getAllFieldNotes(),
    getActiveTools(),
  ])

  // Filter out the featured note from the list
  const otherNotes = allNotes.filter(
    (note) => note.slug !== featuredNote?.slug
  )

  return (
    <main className="container">
      <Header navigation={settings?.primaryNavigation || []} socialLinks={settings?.socialLinks || []} />

      {/* Featured Article */}
      {featuredNote && (
        <section className="animate-fade-in-up">
          <FieldNoteCard note={featuredNote} variant="featured" />
        </section>
      )}

      {/* Notes List */}
      {otherNotes.length > 0 && (
        <section className="notes-section animate-fade-in-up animation-delay-100">
          <SectionLabel>Recent Field Notes</SectionLabel>
          <div className="notes-list">
            {otherNotes.map((note) => (
              <FieldNoteCard key={note.slug} note={note} variant="list" />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!featuredNote && otherNotes.length === 0 && (
        <section className="empty-state animate-fade-in-up">
          <p>No notes yet — check back soon.</p>
        </section>
      )}

      {/* Tools Grid */}
      {tools.length > 0 && (
        <section className="tools-section animate-fade-in-up animation-delay-200">
          <SectionLabel>My Tools</SectionLabel>
          <div className="tools-grid">
            {tools.map((tool) => (
              <div key={tool.slug} className="tool-cell">
                <ToolCard tool={tool} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About Strip */}
      <div className="animate-fade-in-up animation-delay-300">
        <AboutStrip socialLinks={settings?.socialLinks || []} />
      </div>

      <Footer copyright={settings?.copyright} socialLinks={settings?.socialLinks || []} />

    </main>
  )
}
