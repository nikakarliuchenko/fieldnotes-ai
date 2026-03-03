import { Metadata } from 'next'
import { getGlobalSettings, getAllTools } from '@/lib/contentful'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ToolCard from '@/components/ToolCard'
import SectionLabel from '@/components/SectionLabel'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getGlobalSettings()
  return {
    title: `My Tools | ${settings?.siteName || 'FieldNotes AI'}`,
    description: 'Tools and technologies used in exploring the intersection of content infrastructure and AI.',
  }
}

export default async function ToolsPage() {
  const [settings, tools] = await Promise.all([
    getGlobalSettings(),
    getAllTools(),
  ])

  // Sort tools by sortOrder
  const sortedTools = [...tools].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <main className="container">
      <Header navigation={settings?.primaryNavigation || []} socialLinks={settings?.socialLinks || []} />

      <section className="tools-page animate-fade-in-up">
        <SectionLabel>All Tools</SectionLabel>
        
        {sortedTools.length > 0 ? (
          <div className="tools-grid">
            {sortedTools.map((tool) => (
              <div key={tool.slug} className="tool-cell">
                <ToolCard tool={tool} showStatus />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No tools documented yet — check back soon.</p>
          </div>
        )}
      </section>

      <Footer copyright={settings?.copyright} socialLinks={settings?.socialLinks || []} />

    </main>
  )
}
