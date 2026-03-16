import { Metadata } from 'next'
import { getGlobalSettings, getAllTools } from '@/lib/contentful'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ToolsContent from '@/components/ToolsContent'

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getGlobalSettings()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fieldnotes-ai.com'
  const title = `My Tools | ${settings?.siteName || 'FieldNotes AI'}`
  const description = 'The AI and developer tools I actually use — updated as the stack evolves.'

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/tools`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/tools`,
      type: 'website',
    },
  }
}

export default async function ToolsPage() {
  const [settings, tools] = await Promise.all([
    getGlobalSettings(),
    getAllTools(),
  ])

  const sortedTools = [...tools].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <main className="col">
      <Header navigation={settings?.primaryNavigation || []} socialLinks={settings?.socialLinks || []} />

      <header className="page-header">
        <div className="page-eyebrow">My Stack</div>
        <h1 className="page-title">
          The tools I actually use.<span> Updated as the stack evolves.</span>
        </h1>
        <p className="page-desc">
          Every tool on this page is something I use in the field. Some are daily drivers.
          Some I&apos;m still figuring out. The pulsing dot marks what I&apos;m currently working with most.
        </p>
      </header>

      <ToolsContent tools={sortedTools} />

      <Footer copyright={settings?.copyright} socialLinks={settings?.socialLinks || []} />
    </main>
  )
}
