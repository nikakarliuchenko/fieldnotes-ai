import { MetadataRoute } from 'next'
import { getAllFieldNotes } from '@/lib/contentful'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.fieldnotes-ai.com'
  
  const notes = await getAllFieldNotes()
  
  // Filter notes that should be in sitemap
  const noteUrls = notes
    .filter((note) => note.seo?.sitemap !== false)
    .map((note) => ({
      url: `${baseUrl}/notes/${note.slug}`,
      lastModified: new Date(note.publishedDate),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/notes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...noteUrls,
  ]
}
